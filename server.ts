import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database File Path
const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface for DB Structure
interface DBStructure {
  users: any[];
  invoices: any[];
  clients: any[];
  expenses: any[];
}

// Initialize Database File if not exists
const initDb = (): DBStructure => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DBStructure = { users: [], invoices: [], clients: [], expenses: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as DBStructure;
    if (!parsed.expenses) {
      parsed.expenses = [];
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, resetting database:', err);
    const initialData: DBStructure = { users: [], invoices: [], clients: [], expenses: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
};

// Helper to write database
const writeDb = (data: DBStructure) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Helper to get authorization user ID
const getUserId = (req: express.Request): string => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return 'default_user';
  const token = authHeader.replace('Bearer ', '').trim();
  return token || 'default_user';
};

// Setup Google GenAI client
const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not defined in environments.');
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ==========================================
// API ROUTES
// ==========================================

// Auth API - Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, companyName } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = initDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'User already exists' });
    return;
  }

  const newUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    password, // Store simply for local dev environment
    companyDetails: {
      name: companyName || '',
      email: email,
      address: '',
      phone: '',
    },
  };

  db.users.push(newUser);
  writeDb(db);

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    companyDetails: newUser.companyDetails,
  });
});

// Auth API - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = initDb();
  const emailLower = email.toLowerCase();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === emailLower);

  if (!existingUser) {
    res.status(401).json({ error: 'Account does not exist with this email.', emailExists: false });
    return;
  }

  if (existingUser.password !== password) {
    res.status(401).json({ error: 'Incorrect password. Please try again.', emailExists: true });
    return;
  }

  res.json({
    id: existingUser.id,
    email: existingUser.email,
    companyDetails: existingUser.companyDetails,
  });
});

// Initialize Firebase Admin SDK lazily when needed to prevent startup crashes if keys are missing
let isFirebaseAdminInitialized = false;
function initFirebaseAdmin(): boolean {
  if (isFirebaseAdminInitialized) return true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !privateKey) {
    console.warn('[Firebase Admin] Missing FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY in env variables. Signature-less convenience decode will be used.');
    return false;
  }

  try {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    isFirebaseAdminInitialized = true;
    return true;
  } catch (err) {
    console.error('[Firebase Admin] Initialization failed:', err);
    return false;
  }
}

// Fallback decoder for local environments or development prior to service credentials being configured
function decodeTokenConvenience(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadB64 = parts[1];
      const cleanB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = Buffer.from(cleanB64, 'base64').toString('utf8');
      const decoded = JSON.parse(jsonStr);
      return {
        uid: decoded.user_id || decoded.sub || decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0],
        picture: decoded.picture || decoded.photoURL,
      };
    }
  } catch (err) {
    console.error('[Firebase Admin] Convenience decode failed:', err);
  }
  return null;
}

// Auth API - Google Sign-In Verification
app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'ID Token is required' });
    return;
  }

  let uid = '';
  let email = '';
  let name = '';
  let photoURL = '';

  const hasAdmin = initFirebaseAdmin();
  if (hasAdmin) {
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email || '';
      name = decodedToken.name || '';
      photoURL = decodedToken.picture || '';
    } catch (err: any) {
      console.error('Firebase token verification error:', err);
      res.status(401).json({ error: 'Invalid or expired Firebase ID token: ' + err.message });
      return;
    }
  } else {
    const decoded = decodeTokenConvenience(idToken);
    if (decoded) {
      uid = decoded.uid;
      email = decoded.email || '';
      name = decoded.name || '';
      photoURL = decoded.picture || '';
    } else {
      res.status(401).json({ error: 'Firebase Admin credentials not configured and ID token format is invalid.' });
      return;
    }
  }

  if (!email) {
    res.status(400).json({ error: 'Google account must have a valid email address.' });
    return;
  }

  const db = initDb();
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      name: name,
      photoURL: photoURL,
      firebaseUid: uid,
      companyDetails: {
        name: name ? `${name}'s Company` : 'My Company',
        email: email,
        address: '',
        phone: '',
      },
    };
    db.users.push(user);
    writeDb(db);
  } else {
    let updated = false;
    if (!user.name && name) {
      user.name = name;
      updated = true;
    }
    if (!user.photoURL && photoURL) {
      user.photoURL = photoURL;
      updated = true;
    }
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      updated = true;
    }
    if (updated) {
      writeDb(db);
    }
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
    companyDetails: user.companyDetails,
  });
});

// Auth API - Update Company Details
app.put('/api/auth/company', (req, res) => {
  const userId = getUserId(req);
  const companyDetails = req.body;

  const db = initDb();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.users[index].companyDetails = {
    ...db.users[index].companyDetails,
    ...companyDetails,
  };
  writeDb(db);

  res.json(db.users[index].companyDetails);
});

// Auth API - Change Password
app.put('/api/auth/password', (req, res) => {
  const userId = getUserId(req);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  const db = initDb();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const user = db.users[index];
  if (user.password !== currentPassword) {
    res.status(401).json({ error: 'Incorrect current password' });
    return;
  }

  db.users[index].password = newPassword;
  writeDb(db);

  res.json({ message: 'Password updated successfully' });
});

// INVOICES API - List
app.get('/api/invoices', (req, res) => {
  const userId = getUserId(req);
  const db = initDb();
  const userInvoices = db.invoices.filter((inv) => inv.userId === userId);
  res.json(userInvoices);
});

// INVOICES API - Get Specific
app.get('/api/invoices/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const db = initDb();
  const invoice = db.invoices.find((inv) => inv.id === id && inv.userId === userId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json(invoice);
});

// INVOICES API - Create
app.post('/api/invoices', (req, res) => {
  const userId = getUserId(req);
  const invoiceData = req.body;

  const db = initDb();
  const newInvoice = {
    ...invoiceData,
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    userId,
  };

  db.invoices.push(newInvoice);
  writeDb(db);

  res.status(201).json(newInvoice);
});

// INVOICES API - Update
app.put('/api/invoices/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const invoiceData = req.body;

  const db = initDb();
  const index = db.invoices.findIndex((inv) => inv.id === id && inv.userId === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  db.invoices[index] = {
    ...db.invoices[index],
    ...invoiceData,
    id, // Keep original ID
    userId, // Keep original Owner
  };
  writeDb(db);

  res.json(db.invoices[index]);
});

// INVOICES API - Delete
app.delete('/api/invoices/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const db = initDb();
  const initialLength = db.invoices.length;
  db.invoices = db.invoices.filter((inv) => !(inv.id === id && inv.userId === userId));

  if (db.invoices.length === initialLength) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  writeDb(db);
  res.json({ success: true, message: 'Invoice deleted successfully' });
});

// CLIENTS API - List
app.get('/api/clients', (req, res) => {
  const userId = getUserId(req);
  const db = initDb();
  const userClients = db.clients.filter((client) => client.userId === userId);
  res.json(userClients);
});

// CLIENTS API - Create
app.post('/api/clients', (req, res) => {
  const userId = getUserId(req);
  const { name, email, address, phone } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Client name is required' });
    return;
  }

  const db = initDb();
  const newClient = {
    id: 'client_' + Math.random().toString(36).substr(2, 9),
    name,
    email: email || '',
    address: address || '',
    phone: phone || '',
    userId,
  };

  db.clients.push(newClient);
  writeDb(db);

  res.status(201).json(newClient);
});

// ==========================================
// EXPENSES API ROUTES
// ==========================================

// EXPENSES - List
app.get('/api/expenses', (req, res) => {
  const userId = getUserId(req);
  const db = initDb();
  const userExpenses = (db.expenses || []).filter((exp) => exp.userId === userId);
  res.json(userExpenses);
});

// EXPENSES - Create
app.post('/api/expenses', (req, res) => {
  const userId = getUserId(req);
  const { category, amount, date, description, status, paymentMethod } = req.body;

  if (!category || !amount) {
    res.status(400).json({ error: 'Category and Amount are required fields' });
    return;
  }

  const db = initDb();
  const newExpense = {
    id: 'exp_' + Math.random().toString(36).substr(2, 9),
    category,
    amount: parseFloat(amount) || 0,
    date: date || new Date().toISOString().split('T')[0],
    description: description || '',
    status: status || 'cleared',
    paymentMethod: paymentMethod || 'Cash',
    userId,
  };

  if (!db.expenses) db.expenses = [];
  db.expenses.push(newExpense);
  writeDb(db);

  res.status(201).json(newExpense);
});

// EXPENSES - Delete
app.delete('/api/expenses/:id', (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const db = initDb();
  if (!db.expenses) db.expenses = [];
  const initialLength = db.expenses.length;
  db.expenses = db.expenses.filter((exp) => !(exp.id === id && exp.userId === userId));

  if (db.expenses.length === initialLength) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  writeDb(db);
  res.json({ success: true, message: 'Expense deleted successfully' });
});

// ==========================================
// ADMIN UTILITY API ROUTES
// ==========================================

// SEED SYSTEM MOCK DATA
app.post('/api/admin/seed', (req, res) => {
  const userId = getUserId(req);
  const db = initDb();
  
  // 1. Seed clients
  const seedClients = [
    {
      id: 'client_seed_1',
      name: 'Acme Digital Solutions Pvt Ltd',
      email: 'finance@acmedigital.com',
      address: 'Plot 45, Sector 18, Udyog Vihar, Gurugram, Haryana - 122015',
      phone: '+91 98765 43210',
      gstin: '06AACCA1234F1Z1',
      stateCode: '06',
      panNo: 'AACCA1234F',
      userId
    },
    {
      id: 'client_seed_2',
      name: 'Global Tech Enterprises',
      email: 'billing@globaltech.io',
      address: '100 Pine Street, Suite 2400, San Francisco, CA 94111, USA',
      phone: '+1 (415) 555-0199',
      userId
    },
    {
      id: 'client_seed_3',
      name: 'Vertex Consultancies LLC',
      email: 'procurement@vertex.co.in',
      address: '4th Floor, Prestige Tech Park, Marathahalli Outer Ring Road, Bengaluru, Karnataka - 560103',
      phone: '+91 80 4000 8000',
      gstin: '29AABCV5678D2Z2',
      stateCode: '29',
      panNo: 'AABCV5678D',
      userId
    }
  ];

  const datePlusDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // 2. Seed invoices
  const seedInvoices = [
    {
      id: 'inv_seed_1',
      invoiceNumber: 'FIN-2026-001',
      status: 'paid',
      date: datePlusDays(-20),
      dueDate: datePlusDays(-5),
      senderDetails: {
        name: 'Tallybird Issuer',
        email: 'billing@tallybird.ai',
        address: '5th Floor, Block C, Cyber Hub, Gurugram, Haryana - 122002',
        phone: '+91 124 555 1234',
        bankName: 'State Bank of India',
        accountNumber: '123456789012',
        taxId: 'TIN-445566-IND'
      },
      clientDetails: seedClients[0],
      items: [
        {
          name: 'Cloud Infrastructure Setup & Optimization',
          description: 'Production Kubernetes cluster orchestration on GCP & high-availability DB provisioning.',
          quantity: 1,
          price: 150000,
          discount: 10,
          tax: 18,
          total: 159300,
          hsnSac: '998313',
          cgstRate: 9,
          cgstAmount: 12150,
          sgstRate: 9,
          sgstAmount: 12150,
          igstRate: 0,
          igstAmount: 0,
          taxableValue: 135000
        }
      ],
      subtotal: 150000,
      discountTotal: 15000,
      taxTotal: 24300,
      grandTotal: 159300,
      currency: 'INR',
      paymentTerms: 'Net 15',
      notes: 'Thank you for your business. Please clear via direct bank wire.',
      userId,
      enableIndianGST: true,
      irnNo: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ackNo: '1122334455',
      vehicleNo: 'HR-26-AB-1234',
      challanNo: 'CH-88990',
      ewayBillNo: 'EW-776655443322',
      cgstTotal: 12150,
      sgstTotal: 12150,
      igstTotal: 0,
      roundOff: 0,
      netAmount: 159300,
      amountInWords: 'One Lakh Fifty-Nine Thousand Three Hundred Rupees Only'
    },
    {
      id: 'inv_seed_2',
      invoiceNumber: 'FIN-2026-002',
      status: 'sent',
      date: datePlusDays(-5),
      dueDate: datePlusDays(10),
      senderDetails: {
        name: 'Tallybird Issuer',
        email: 'billing@tallybird.ai',
        address: '5th Floor, Block C, Cyber Hub, Gurugram, Haryana - 122002',
        phone: '+91 124 555 1234'
      },
      clientDetails: seedClients[1],
      items: [
        {
          name: 'Premium AI Copywriting & Agent Orchestration Suite',
          description: 'SaaS licensing fee for enterprise LLM agent workspace - Year 2026',
          quantity: 12,
          price: 250,
          discount: 0,
          tax: 0,
          total: 3000,
        }
      ],
      subtotal: 3000,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 3000,
      currency: 'USD',
      paymentTerms: 'Net 15',
      notes: 'Please clear payments via PayPal or direct wire to beneficiary bank.',
      userId,
      enableIndianGST: false
    },
    {
      id: 'inv_seed_3',
      invoiceNumber: 'FIN-2026-003',
      status: 'overdue',
      date: datePlusDays(-30),
      dueDate: datePlusDays(-15),
      senderDetails: {
        name: 'Tallybird Issuer',
        email: 'billing@tallybird.ai',
        address: '5th Floor, Block C, Cyber Hub, Gurugram, Haryana - 122002',
        phone: '+91 124 555 1234'
      },
      clientDetails: seedClients[2],
      items: [
        {
          name: 'Professional Software Architecture Design',
          description: 'Full stack ledger system design & workflow integration.',
          quantity: 80,
          price: 2000,
          discount: 5,
          tax: 18,
          total: 179360,
          hsnSac: '998314',
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 18,
          igstAmount: 27360,
          taxableValue: 152000
        }
      ],
      subtotal: 160000,
      discountTotal: 8000,
      taxTotal: 27360,
      grandTotal: 179360,
      currency: 'INR',
      paymentTerms: 'Immediate',
      notes: 'URGENT COLLECTION NOTICE: Overdue outstanding balance. Direct bank settlement only.',
      userId,
      enableIndianGST: true,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 27360,
      roundOff: 0,
      netAmount: 179360,
      amountInWords: 'One Lakh Seventy-Nine Thousand Three Hundred Sixty Rupees Only'
    }
  ];

  // 3. Seed expenses
  const seedExpenses = [
    {
      id: 'exp_seed_1',
      category: 'Software',
      amount: 14500,
      date: datePlusDays(-18),
      description: 'AWS Production Hosting & ECS Containers Billing',
      status: 'cleared',
      paymentMethod: 'Credit Card',
      userId
    },
    {
      id: 'exp_seed_2',
      category: 'Rent & Office',
      amount: 45000,
      date: datePlusDays(-1),
      description: 'WeWork Office Space Monthly Rent - Gurugram HQ',
      status: 'pending',
      paymentMethod: 'Bank Wire',
      userId
    },
    {
      id: 'exp_seed_3',
      category: 'Marketing',
      amount: 8500,
      date: datePlusDays(-10),
      description: 'Google Cloud Ads - Enterprise Retargeting Campaign',
      status: 'cleared',
      paymentMethod: 'Credit Card',
      userId
    },
    {
      id: 'exp_seed_4',
      category: 'Consulting & Contractors',
      amount: 32000,
      date: datePlusDays(-15),
      description: 'Legal & Compliance Audit Fees - Corporate Tax Filing',
      status: 'cleared',
      paymentMethod: 'Stripe',
      userId
    }
  ];

  // Insert & Save (Filter out other rows of this user to prevent duplicated seeds)
  db.clients = db.clients.filter(c => c.userId !== userId).concat(seedClients);
  db.invoices = db.invoices.filter(i => i.userId !== userId).concat(seedInvoices);
  db.expenses = (db.expenses || []).filter(e => e.userId !== userId).concat(seedExpenses);
  writeDb(db);

  res.json({ success: true, message: 'Seeded system mock data successfully!' });
});

// WIPE CLEAN
app.post('/api/admin/clear', (req, res) => {
  const userId = getUserId(req);
  const db = initDb();
  
  db.clients = db.clients.filter(c => c.userId !== userId);
  db.invoices = db.invoices.filter(i => i.userId !== userId);
  db.expenses = (db.expenses || []).filter(e => e.userId !== userId);
  writeDb(db);

  res.json({ success: true, message: 'Cleared your ledger registry successfully!' });
});

// AI API - Scan Invoice (OCR & Parse)
app.post('/api/ai/scan', async (req, res) => {
  try {
    const { base64, mimeType, text } = req.body;

    if (!base64 && !text) {
      res.status(400).json({ error: 'Provide an invoice base64 image or text context to scan.' });
      return;
    }

    const ai = getGeminiClient();

    let parts: any[] = [];
    if (base64 && mimeType) {
      parts.push({
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      });
    }

    parts.push({
      text: `Analyze the provided invoice content (image and/or text context) and extract the invoice details.
      Provide the structured details as a JSON object adhering exactly to the specified JSON schema.
      If a field cannot be found, output an empty string "" or an empty list [] where appropriate.
      
      Requirements:
      - invoiceNumber: Extract the invoice identification number (e.g., "INV-2024-001")
      - date: Extract the invoice issuance date in YYYY-MM-DD format
      - dueDate: Extract the invoice due date in YYYY-MM-DD format
      - senderDetails: Extract company name, email, physical address, and phone of the issuer (the vendor/sender)
      - clientDetails: Extract recipient client name, email, physical address, and phone
      - items: Extract each individual line item listed on the invoice. For each item:
        - name: Short title of the item
        - description: Details or description of the item
        - quantity: Number of items (default to 1 if not mentioned)
        - price: Price per single item (before taxes/discounts)
        - discount: Any discount percentage specified for this item (0 if none)
        - tax: Any tax percentage specified for this item (0 if none)
      - notes: Any payment terms, thank you notes, or custom text on the invoice
      - currency: The currency symbol or ISO code used (e.g. "USD", "INR", "EUR")
      - paymentTerms: e.g., "Net 30", "Due on receipt" if mentioned.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            senderDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ['name'],
            },
            clientDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ['name'],
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  discount: { type: Type.NUMBER },
                  tax: { type: Type.NUMBER },
                },
                required: ['name', 'quantity', 'price'],
              },
            },
            notes: { type: Type.STRING },
            currency: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
          },
        },
      },
    });

    const parsedText = response.text?.trim() || '{}';
    res.json(JSON.parse(parsedText));
  } catch (error: any) {
    console.error('Gemini Scanning Error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan and analyze the invoice.' });
  }
});

// AI API - Natural Language Invoice Generation
app.post('/api/ai/generate-invoice', async (req, res) => {
  try {
    const { prompt, companyDetails } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are Tallybird, an expert financial billing system. Convert the user's natural language request into a highly structured tax or standard invoice.
    
    Default companyDetails for sender (merge or override as requested):
    ${JSON.stringify(companyDetails || {})}
    
    Guidelines:
    1. Extract or intelligently generate the correct billing date and due date (default to today and 14 days later respectively if not mentioned).
    2. Populate client and sender details meticulously.
    3. Determine if this should be an Indian GST tax invoice. If there are mentions of GST, GSTIN, PAN, HSN, Rupees, India, or CGST/SGST/IGST, set enableIndianGST to true, extract any PAN and GSTIN numbers, and assign valid 2-digit numeric State Codes (e.g., "04" for Chandigarh, "03" for Punjab, "27" for Maharashtra, "09" for UP, "33" for Tamil Nadu, "19" for West Bengal, "29" for Karnataka).
    4. Fill in line items. For each item, capture or assign a realistic HSN/SAC code if it's a tax invoice. Price should be the unit price (rate).
    5. Intelligently deduce terms (e.g., standard business or tax jurisdiction clauses, interest terms) and bank details if mentioned.
    6. Ensure the response conforms EXACTLY to the requested JSON structure. Keep numeric fields as numbers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            currency: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
            notes: { type: Type.STRING },
            enableIndianGST: { type: Type.BOOLEAN },
            senderDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                panNo: { type: Type.STRING },
                gstin: { type: Type.STRING },
                stateCode: { type: Type.STRING },
                branchAddress: { type: Type.STRING },
                ifscCode: { type: Type.STRING },
                bankName: { type: Type.STRING },
                accountNumber: { type: Type.STRING },
                bankBranch: { type: Type.STRING },
              },
              required: ['name'],
            },
            clientDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                gstin: { type: Type.STRING },
                stateCode: { type: Type.STRING },
                panNo: { type: Type.STRING },
              },
              required: ['name'],
            },
            consigneeDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                gstin: { type: Type.STRING },
                stateCode: { type: Type.STRING },
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  hsnSac: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  discount: { type: Type.NUMBER },
                  tax: { type: Type.NUMBER },
                },
                required: ['name', 'quantity', 'price'],
              },
            },
            irnNo: { type: Type.STRING },
            ackNo: { type: Type.STRING },
            vehicleNo: { type: Type.STRING },
            challanNo: { type: Type.STRING },
            ewayBillNo: { type: Type.STRING },
            reverseCharge: { type: Type.STRING },
            terms: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['invoiceNumber', 'date', 'senderDetails', 'clientDetails', 'items'],
        },
      },
    });

    const parsedText = response.text?.trim() || '{}';
    res.json(JSON.parse(parsedText));
  } catch (error: any) {
    console.error('Gemini Generate Invoice Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice with AI.' });
  }
});

// AI API - Financial Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = getUserId(req);

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages history is required.' });
      return;
    }

    const db = initDb();
    const userInvoices = db.invoices.filter((inv) => inv.userId === userId);

    // Format current invoices list for Gemini context
    const invoicesContext = userInvoices
      .map(
        (inv) => `
    Invoice Number: #${inv.invoiceNumber}
    Status: ${inv.status.toUpperCase()}
    Issue Date: ${inv.date}
    Due Date: ${inv.dueDate}
    Client Name: ${inv.clientDetails.name}
    Client Email: ${inv.clientDetails.email}
    Vendor: ${inv.senderDetails.name}
    Currency: ${inv.currency || '$'}
    Subtotal: ${inv.subtotal}
    Discount Total: ${inv.discountTotal}
    Tax Total: ${inv.taxTotal}
    Grand Total: ${inv.grandTotal}
    Notes: ${inv.notes || 'None'}
    Items: ${inv.items
      .map(
        (it) =>
          `"${it.name}" (Qty: ${it.quantity}, Price: ${it.price}, Tax: ${it.tax}%, Discount: ${it.discount}%)`
      )
      .join('; ')}
    `
      )
      .join('\n---\n');

    const systemInstruction = `You are Tallybird, an elegant, professional, and friendly financial assistant embedded in the Tallybird application.
    You help users manage their invoices, calculate cash flow statistics, audit clients, and automate professional emails.
    
    Current Date: ${new Date().toISOString().split('T')[0]}
    
    Here is the live real-time database of the user's invoices:
    ${invoicesContext || 'The database is currently empty. The user has not created any invoices yet.'}
    
    Guidance:
    - Base your statistics, due date alerts, overdue warnings, and cash flow analysis strictly on this database.
    - If asked for payment reminders, draft highly professional, polite, and persuasive email content using specific invoice numbers, due dates, and amounts.
    - Keep answers friendly, clearly structured, and easy to read. Use Markdown formatting (bolding, lists, tables) where helpful.
    - Do not make up mock invoices. Always refer back to the exact invoices provided in the database. If there are no invoices, encourage the user to create one or use the AI Scan tool to import an existing invoice!`;

    const ai = getGeminiClient();

    // Map client messages to Gemini role standard (user, model)
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const answer = response.text || "I'm sorry, I couldn't compile a financial response.";
    res.json({ content: answer });
  } catch (error: any) {
    console.error('Gemini Financial Assistant Chat Error:', error);
    res.status(500).json({ error: error.message || 'Financial Assistant is temporarily unavailable.' });
  }
});

// ==========================================
// VITE OR STATIC FILE SERVING
// ==========================================

async function startServer() {
  // Initialize DB immediately
  initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tallybird] Server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
