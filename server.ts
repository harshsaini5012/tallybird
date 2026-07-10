import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// MONGODB CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || '';

mongoose.connect(MONGO_URI)
  .then(() => console.log('[Tallybird] MongoDB connected successfully'))
  .catch(err => console.error('[Tallybird] MongoDB connection error:', err));

// ==========================================
// MONGOOSE SCHEMAS
// ==========================================
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  password: String,
  photoURL: String,
  firebaseUid: String,
  companyDetails: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
}, { strict: false, timestamps: true });

const ClientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
}, { strict: false, timestamps: true });

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

// ==========================================
// HELPERS
// ==========================================
const getUserId = (req: express.Request): string => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return 'default_user';
  const token = authHeader.replace('Bearer ', '').trim();
  return token || 'default_user';
};

const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not defined.');
  return new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
};

// ==========================================
// FIREBASE ADMIN
// ==========================================
let isFirebaseAdminInitialized = false;
function initFirebaseAdmin(): boolean {
  if (isFirebaseAdminInitialized) return true;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (!projectId || !privateKey || !clientEmail) {
      console.warn('[Firebase Admin] Missing env vars. Convenience decode will be used.');
      return false;
    }
    if (getApps().length === 0) {
      initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
    }
    isFirebaseAdminInitialized = true;
    return true;
  } catch (err) {
    console.error('[Firebase Admin] Initialization failed:', err);
    return false;
  }
}

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { email, password, companyName } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) { res.status(409).json({ error: 'An account with this email already exists.', emailExists: true }); return; }

  const newUser = new User({
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    password,
    companyDetails: { name: companyName || 'My Company', email, address: '', phone: '' },
  });
  await newUser.save();
  res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, companyDetails: newUser.companyDetails });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { res.status(401).json({ error: 'No account found with this email.', emailExists: false }); return; }
  if (user.password !== password) { res.status(401).json({ error: 'Incorrect password.' }); return; }

  res.json({ id: user.id, email: user.email, name: user.name, photoURL: user.photoURL, companyDetails: user.companyDetails });
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) { res.status(400).json({ error: 'Firebase ID token is required.' }); return; }

  let uid = '', email = '', name = '', photoURL = '';

  const hasAdmin = initFirebaseAdmin();
  if (hasAdmin) {
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      uid = decoded.uid; email = decoded.email || ''; name = decoded.name || ''; photoURL = decoded.picture || '';
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired Firebase ID token.' }); return;
    }
  } else {
    try {
      const parts = idToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || ''; email = payload.email || ''; name = payload.name || ''; photoURL = payload.picture || '';
    } catch {
      res.status(401).json({ error: 'FirebaseAdmin credentials not configured and ID token format is invalid.' }); return;
    }
  }

  if (!email) { res.status(400).json({ error: 'Google account must have a valid email address.' }); return; }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(), name, photoURL, firebaseUid: uid,
      companyDetails: { name: name ? `${name}'s Company` : 'My Company', email, address: '', phone: '' },
    });
    await user.save();
  } else {
    let updated = false;
    if (!user.name && name) { user.name = name; updated = true; }
    if (!user.photoURL && photoURL) { user.photoURL = photoURL; updated = true; }
    if (!user.firebaseUid) { user.firebaseUid = uid; updated = true; }
    if (updated) await user.save();
  }

  res.json({ id: user.id, email: user.email, name: user.name, photoURL: user.photoURL, companyDetails: user.companyDetails });
});

app.put('/api/auth/company', async (req, res) => {
  const userId = getUserId(req);
  const user = await User.findOne({ id: userId });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  user.companyDetails = { ...user.companyDetails, ...req.body };
  await user.save();
  res.json(user.companyDetails);
});

app.put('/api/auth/password', async (req, res) => {
  const userId = getUserId(req);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400).json({ error: 'Current and new password are required' }); return; }
  const user = await User.findOne({ id: userId });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  if (user.password !== currentPassword) { res.status(401).json({ error: 'Incorrect current password' }); return; }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// ==========================================
// INVOICES ROUTES
// ==========================================
app.get('/api/invoices', async (req, res) => {
  const userId = getUserId(req);
  const invoices = await Invoice.find({ userId }).lean();
  res.json(invoices);
});

app.get('/api/invoices/:id', async (req, res) => {
  const userId = getUserId(req);
  const invoice = await Invoice.findOne({ id: req.params.id, userId }).lean();
  if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
  res.json(invoice);
});

app.post('/api/invoices', async (req, res) => {
  const userId = getUserId(req);
  const newInvoice = new Invoice({ ...req.body, id: 'inv_' + Math.random().toString(36).substr(2, 9), userId });
  await newInvoice.save();
  res.status(201).json(newInvoice.toObject());
});

app.put('/api/invoices/:id', async (req, res) => {
  const userId = getUserId(req);
  const invoice = await Invoice.findOneAndUpdate(
    { id: req.params.id, userId },
    { ...req.body, id: req.params.id, userId },
    { new: true }
  ).lean();
  if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
  res.json(invoice);
});

app.delete('/api/invoices/:id', async (req, res) => {
  const userId = getUserId(req);
  const result = await Invoice.deleteOne({ id: req.params.id, userId });
  if (result.deletedCount === 0) { res.status(404).json({ error: 'Invoice not found' }); return; }
  res.json({ success: true, message: 'Invoice deleted successfully' });
});

// ==========================================
// CLIENTS ROUTES
// ==========================================
app.get('/api/clients', async (req, res) => {
  const userId = getUserId(req);
  const clients = await Client.find({ userId }).lean();
  res.json(clients);
});

app.post('/api/clients', async (req, res) => {
  const userId = getUserId(req);
  const { name, email, address, phone } = req.body;
  if (!name) { res.status(400).json({ error: 'Client name is required' }); return; }
  const newClient = new Client({ id: 'client_' + Math.random().toString(36).substr(2, 9), name, email: email || '', address: address || '', phone: phone || '', userId });
  await newClient.save();
  res.status(201).json(newClient.toObject());
});

// ==========================================
// EXPENSES ROUTES
// ==========================================
app.get('/api/expenses', async (req, res) => {
  const userId = getUserId(req);
  const expenses = await Expense.find({ userId }).lean();
  res.json(expenses);
});

app.post('/api/expenses', async (req, res) => {
  const userId = getUserId(req);
  const { category, amount, date, description, status, paymentMethod } = req.body;
  if (!category || !amount) { res.status(400).json({ error: 'Category and Amount are required' }); return; }
  const newExpense = new Expense({
    id: 'exp_' + Math.random().toString(36).substr(2, 9),
    category, amount: parseFloat(amount) || 0,
    date: date || new Date().toISOString().split('T')[0],
    description: description || '', status: status || 'cleared',
    paymentMethod: paymentMethod || 'Cash', userId,
  });
  await newExpense.save();
  res.status(201).json(newExpense.toObject());
});

app.delete('/api/expenses/:id', async (req, res) => {
  const userId = getUserId(req);
  const result = await Expense.deleteOne({ id: req.params.id, userId });
  if (result.deletedCount === 0) { res.status(404).json({ error: 'Expense not found' }); return; }
  res.json({ success: true, message: 'Expense deleted successfully' });
});

// ==========================================
// ADMIN ROUTES
// ==========================================
app.post('/api/admin/seed', async (req, res) => {
  const userId = getUserId(req);
  const datePlusDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; };

  await Client.deleteMany({ userId });
  await Invoice.deleteMany({ userId });
  await Expense.deleteMany({ userId });

  const seedClients = [
    { id: 'client_seed_1', name: 'Acme Digital Solutions Pvt Ltd', email: 'finance@acmedigital.com', address: 'Plot 45, Sector 18, Gurugram, Haryana - 122015', phone: '+91 98765 43210', gstin: '06AACCA1234F1Z1', stateCode: '06', panNo: 'AACCA1234F', userId },
    { id: 'client_seed_2', name: 'Global Tech Enterprises', email: 'billing@globaltech.io', address: '100 Pine Street, San Francisco, CA 94111, USA', phone: '+1 (415) 555-0199', userId },
    { id: 'client_seed_3', name: 'Vertex Consultancies LLC', email: 'procurement@vertex.co.in', address: 'Prestige Tech Park, Bengaluru, Karnataka - 560103', phone: '+91 80 4000 8000', gstin: '29AABCV5678D2Z2', stateCode: '29', panNo: 'AABCV5678D', userId },
  ];
  await Client.insertMany(seedClients);

  const seedInvoices = [
    { id: 'inv_seed_1', invoiceNumber: 'FIN-2026-001', status: 'paid', date: datePlusDays(-20), dueDate: datePlusDays(-5), senderDetails: { name: 'Tallybird Issuer', email: 'billing@tallybird.ai', address: '5th Floor, Cyber Hub, Gurugram', phone: '+91 124 555 1234', bankName: 'State Bank of India', accountNumber: '123456789012' }, clientDetails: seedClients[0], items: [{ name: 'Cloud Infrastructure Setup', description: 'Production Kubernetes cluster on GCP', quantity: 1, price: 150000, discount: 10, tax: 18, total: 159300, hsnSac: '998313', cgstRate: 9, cgstAmount: 12150, sgstRate: 9, sgstAmount: 12150, igstRate: 0, igstAmount: 0, taxableValue: 135000 }], subtotal: 150000, discountTotal: 15000, taxTotal: 24300, grandTotal: 159300, currency: 'INR', paymentTerms: 'Net 15', notes: 'Thank you for your business.', userId, enableIndianGST: true, cgstTotal: 12150, sgstTotal: 12150, igstTotal: 0, roundOff: 0, netAmount: 159300, amountInWords: 'One Lakh Fifty-Nine Thousand Three Hundred Rupees Only' },
    { id: 'inv_seed_2', invoiceNumber: 'FIN-2026-002', status: 'sent', date: datePlusDays(-5), dueDate: datePlusDays(10), senderDetails: { name: 'Tallybird Issuer', email: 'billing@tallybird.ai', address: '5th Floor, Cyber Hub, Gurugram', phone: '+91 124 555 1234' }, clientDetails: seedClients[1], items: [{ name: 'AI Copywriting Suite', description: 'SaaS licensing fee - Year 2026', quantity: 12, price: 250, discount: 0, tax: 0, total: 3000 }], subtotal: 3000, discountTotal: 0, taxTotal: 0, grandTotal: 3000, currency: 'USD', paymentTerms: 'Net 15', notes: 'Please clear via PayPal.', userId, enableIndianGST: false },
    { id: 'inv_seed_3', invoiceNumber: 'FIN-2026-003', status: 'overdue', date: datePlusDays(-30), dueDate: datePlusDays(-15), senderDetails: { name: 'Tallybird Issuer', email: 'billing@tallybird.ai', address: '5th Floor, Cyber Hub, Gurugram', phone: '+91 124 555 1234' }, clientDetails: seedClients[2], items: [{ name: 'Software Architecture Design', description: 'Full stack ledger system design', quantity: 80, price: 2000, discount: 5, tax: 18, total: 179360, hsnSac: '998314', igstRate: 18, igstAmount: 27360, taxableValue: 152000 }], subtotal: 160000, discountTotal: 8000, taxTotal: 27360, grandTotal: 179360, currency: 'INR', paymentTerms: 'Immediate', notes: 'URGENT: Overdue balance.', userId, enableIndianGST: true, cgstTotal: 0, sgstTotal: 0, igstTotal: 27360, roundOff: 0, netAmount: 179360, amountInWords: 'One Lakh Seventy-Nine Thousand Three Hundred Sixty Rupees Only' },
  ];
  await Invoice.insertMany(seedInvoices);

  const seedExpenses = [
    { id: 'exp_seed_1', category: 'Software', amount: 14500, date: datePlusDays(-18), description: 'AWS Hosting Billing', status: 'cleared', paymentMethod: 'Credit Card', userId },
    { id: 'exp_seed_2', category: 'Rent & Office', amount: 45000, date: datePlusDays(-1), description: 'WeWork Monthly Rent', status: 'pending', paymentMethod: 'Bank Wire', userId },
    { id: 'exp_seed_3', category: 'Marketing', amount: 8500, date: datePlusDays(-10), description: 'Google Ads Campaign', status: 'cleared', paymentMethod: 'Credit Card', userId },
    { id: 'exp_seed_4', category: 'Consulting', amount: 32000, date: datePlusDays(-15), description: 'Legal & Compliance Audit', status: 'cleared', paymentMethod: 'Stripe', userId },
  ];
  await Expense.insertMany(seedExpenses);

  res.json({ success: true, message: 'Seeded system mock data successfully!' });
});

app.post('/api/admin/clear', async (req, res) => {
  const userId = getUserId(req);
  await Client.deleteMany({ userId });
  await Invoice.deleteMany({ userId });
  await Expense.deleteMany({ userId });
  res.json({ success: true, message: 'Cleared your ledger registry successfully!' });
});

// ==========================================
// AI ROUTES
// ==========================================
app.post('/api/ai/scan', async (req, res) => {
  try {
    const { base64, mimeType, text } = req.body;
    if (!base64 && !text) { res.status(400).json({ error: 'Provide invoice base64 image or text.' }); return; }
    const ai = getGeminiClient();
    let parts: any[] = [];
    if (base64 && mimeType) parts.push({ inlineData: { data: base64, mimeType } });
    parts.push({ text: `Analyze the invoice and extract details as JSON with fields: invoiceNumber, date, dueDate, senderDetails (name,email,address,phone), clientDetails (name,email,address,phone), items (name,description,quantity,price,discount,tax), notes, currency, paymentTerms.` });
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: { parts }, config: { responseMimeType: 'application/json' } });
    res.json(JSON.parse(response.text?.trim() || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to scan invoice.' });
  }
});

app.post('/api/ai/generate-invoice', async (req, res) => {
  try {
    const { prompt, companyDetails } = req.body;
    if (!prompt) { res.status(400).json({ error: 'Prompt is required.' }); return; }
    const ai = getGeminiClient();
    const systemInstruction = `You are Tallybird, an expert financial billing system. Convert the user's natural language request into a highly structured invoice JSON. Default sender: ${JSON.stringify(companyDetails || {})}. If Indian GST mentioned set enableIndianGST true. Return JSON with: invoiceNumber, date, dueDate, currency, paymentTerms, notes, enableIndianGST, senderDetails, clientDetails, items (with name,quantity,price,discount,tax,hsnSac), terms array.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt, config: { systemInstruction, responseMimeType: 'application/json' } });
    res.json(JSON.parse(response.text?.trim() || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate invoice.' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = getUserId(req);
    if (!messages || !Array.isArray(messages)) { res.status(400).json({ error: 'Messages history is required.' }); return; }
    const userInvoices = await Invoice.find({ userId }).lean();
    const invoicesContext = userInvoices.map((inv: any) => `Invoice #${inv.invoiceNumber} | Status: ${inv.status} | Client: ${inv.clientDetails?.name} | Total: ${inv.grandTotal} ${inv.currency} | Due: ${inv.dueDate}`).join('\n');
    const systemInstruction = `You are Tallybird, a professional financial assistant. Current Date: ${new Date().toISOString().split('T')[0]}. User invoices:\n${invoicesContext || 'No invoices yet.'}`;
    const ai = getGeminiClient();
    const contents = messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents, config: { systemInstruction } });
    res.json({ content: response.text || "I couldn't compile a response." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Financial Assistant unavailable.' });
  }
});

// ==========================================
// VITE OR STATIC FILE SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }
  app.listen(PORT, '0.0.0.0', () => { console.log(`[Tallybird] Server running at http://0.0.0.0:${PORT}`); });
}

startServer();
