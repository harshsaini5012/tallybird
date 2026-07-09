import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, CompanyDetails, ClientProfile } from '../types';
import { 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail 
} from 'lucide-react';

interface InvoiceFormProps {
  invoice?: Invoice | null; // null for creating new
  companyDetails: CompanyDetails;
  savedClients: ClientProfile[];
  onSave: (invoice: Omit<Invoice, 'id' | 'userId'>) => void;
  onCancel: () => void;
  scannedData?: Partial<Invoice> | null;
}

const CURRENCIES = [
  { label: 'US Dollar ($)', value: '$' },
  { label: 'Indian Rupee (₹)', value: '₹' },
  { label: 'Euro (€)', value: '€' },
  { label: 'British Pound (£)', value: '£' },
];

export function numberToWords(num: number, currency: string = '₹'): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  const isRupee = currency === '₹' || currency.toLowerCase().includes('inr') || currency.toLowerCase().includes('rupee');

  if (isRupee) {
    let n = Math.floor(num);
    let words = '';
    
    if (n >= 10000000) {
      words += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      words += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      words += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 0) {
      words += convertLessThanThousand(n) + ' ';
    }
    
    return (words.trim() ? 'Rupees ' + words.trim() + ' Only' : '').trim();
  } else {
    let n = Math.floor(num);
    let words = '';
    
    if (n >= 1000000000) {
      words += convertLessThanThousand(Math.floor(n / 1000000000)) + ' Billion ';
      n %= 1000000000;
    }
    if (n >= 1000000) {
      words += convertLessThanThousand(Math.floor(n / 1000000)) + ' Million ';
      n %= 1000000;
    }
    if (n >= 1000) {
      words += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 0) {
      words += convertLessThanThousand(n) + ' ';
    }
    
    const prefix = currency === '$' ? 'Dollars ' : currency === '€' ? 'Euros ' : currency === '£' ? 'Pounds ' : '';
    return (words.trim() ? (prefix ? prefix : '') + words.trim() + ' Only' : '').trim();
  }
}

export default function InvoiceForm({ 
  invoice, 
  companyDetails, 
  savedClients, 
  onSave, 
  onCancel,
  scannedData
}: InvoiceFormProps) {
  // Main form fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('$');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [notes, setNotes] = useState('');

  // Sender details (Company Details)
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Client details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Indian GST and Tax Invoice features
  const [enableIndianGST, setEnableIndianGST] = useState(false);
  
  const [senderPanNo, setSenderPanNo] = useState('');
  const [senderGstin, setSenderGstin] = useState('');
  const [senderStateCode, setSenderStateCode] = useState('');
  const [senderBranchAddress, setSenderBranchAddress] = useState('');
  const [senderIfscCode, setSenderIfscCode] = useState('');
  const [senderBankBranch, setSenderBankBranch] = useState('');

  const [clientGstin, setClientGstin] = useState('');
  const [clientStateCode, setClientStateCode] = useState('');
  const [clientPanNo, setClientPanNo] = useState('');

  const [showConsignee, setShowConsignee] = useState(false);
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeEmail, setConsigneeEmail] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeGstin, setConsigneeGstin] = useState('');
  const [consigneeStateCode, setConsigneeStateCode] = useState('');

  const [irnNo, setIrnNo] = useState('');
  const [ackNo, setAckNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [reverseCharge, setReverseCharge] = useState('No');
  
  const [termsText, setTermsText] = useState(
    "1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. on payments not received within 30 days.\n3. We do not own any responsibility after goods leave our premises.\n4. Subject to local Jurisdiction. E. & O. E."
  );

  // Automatically generate draft invoice number and default dates
  useEffect(() => {
    if (invoice) {
      // Editing Mode
      setInvoiceNumber(invoice.invoiceNumber || '');
      setStatus(invoice.status || 'draft');
      setDate(invoice.date || '');
      setDueDate(invoice.dueDate || '');
      setCurrency(invoice.currency || '$');
      setPaymentTerms(invoice.paymentTerms || 'Due on receipt');
      setNotes(invoice.notes || '');

      setSenderName(invoice.senderDetails?.name || '');
      setSenderEmail(invoice.senderDetails?.email || '');
      setSenderAddress(invoice.senderDetails?.address || '');
      setSenderPhone(invoice.senderDetails?.phone || '');
      setSenderPanNo(invoice.senderDetails?.panNo || '');
      setSenderGstin(invoice.senderDetails?.gstin || '');
      setSenderStateCode(invoice.senderDetails?.stateCode || '');
      setSenderBranchAddress(invoice.senderDetails?.branchAddress || '');
      setSenderIfscCode(invoice.senderDetails?.ifscCode || '');
      setSenderBankBranch(invoice.senderDetails?.bankBranch || '');

      setClientName(invoice.clientDetails?.name || '');
      setClientEmail(invoice.clientDetails?.email || '');
      setClientAddress(invoice.clientDetails?.address || '');
      setClientPhone(invoice.clientDetails?.phone || '');
      setClientGstin(invoice.clientDetails?.gstin || '');
      setClientStateCode(invoice.clientDetails?.stateCode || '');
      setClientPanNo(invoice.clientDetails?.panNo || '');

      setEnableIndianGST(!!invoice.enableIndianGST);
      
      if (invoice.consigneeDetails) {
        setShowConsignee(true);
        setConsigneeName(invoice.consigneeDetails.name || '');
        setConsigneeEmail(invoice.consigneeDetails.email || '');
        setConsigneeAddress(invoice.consigneeDetails.address || '');
        setConsigneePhone(invoice.consigneeDetails.phone || '');
        setConsigneeGstin(invoice.consigneeDetails.gstin || '');
        setConsigneeStateCode(invoice.consigneeDetails.stateCode || '');
      } else {
        setShowConsignee(false);
        setConsigneeName('');
        setConsigneeEmail('');
        setConsigneeAddress('');
        setConsigneePhone('');
        setConsigneeGstin('');
        setConsigneeStateCode('');
      }

      setIrnNo(invoice.irnNo || '');
      setAckNo(invoice.ackNo || '');
      setVehicleNo(invoice.vehicleNo || '');
      setChallanNo(invoice.challanNo || '');
      setEwayBillNo(invoice.ewayBillNo || '');
      setReverseCharge(invoice.reverseCharge || 'No');
      
      if (invoice.terms && invoice.terms.length > 0) {
        setTermsText(invoice.terms.join('\n'));
      }

      setItems(invoice.items || []);
    } else {
      // Creation Mode
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setInvoiceNumber(`INV-${year}-${randNum}`);
      setStatus('draft');
      
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      
      // Default due date to 14 days later
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 14);
      setDueDate(defaultDue.toISOString().split('T')[0]);

      setCurrency('₹');
      setPaymentTerms('Due on receipt');
      setNotes('Thank you for your business!');
      setEnableIndianGST(true); // Default to true since user provided Indian Tax example!

      // Populate default company/sender details
      setSenderName(companyDetails.name || '');
      setSenderEmail(companyDetails.email || '');
      setSenderAddress(companyDetails.address || '');
      setSenderPhone(companyDetails.phone || '');
      setSenderPanNo(companyDetails.panNo || '');
      setSenderGstin(companyDetails.gstin || '');
      setSenderStateCode(companyDetails.stateCode || '');
      setSenderBranchAddress(companyDetails.branchAddress || '');
      setSenderIfscCode(companyDetails.ifscCode || '');
      setSenderBankBranch(companyDetails.bankBranch || '');

      // Start with one empty item
      setItems([{ name: '', description: '', hsnSac: '', quantity: 1, price: 0, discount: 0, tax: 18, total: 0 }]);
    }
  }, [invoice, companyDetails]);

  // Handle scanned data injection from AI OCR Scanner
  useEffect(() => {
    if (scannedData) {
      if (scannedData.invoiceNumber) setInvoiceNumber(scannedData.invoiceNumber);
      if (scannedData.date) setDate(scannedData.date);
      if (scannedData.dueDate) setDueDate(scannedData.dueDate);
      if (scannedData.currency) setCurrency(scannedData.currency);
      if (scannedData.paymentTerms) setPaymentTerms(scannedData.paymentTerms);
      if (scannedData.notes) setNotes(scannedData.notes);
      if (scannedData.enableIndianGST !== undefined) setEnableIndianGST(!!scannedData.enableIndianGST);

      if (scannedData.senderDetails) {
        setSenderName(scannedData.senderDetails.name || senderName);
        setSenderEmail(scannedData.senderDetails.email || senderEmail);
        setSenderAddress(scannedData.senderDetails.address || senderAddress);
        setSenderPhone(scannedData.senderDetails.phone || senderPhone);
        if (scannedData.senderDetails.panNo) setSenderPanNo(scannedData.senderDetails.panNo);
        if (scannedData.senderDetails.gstin) setSenderGstin(scannedData.senderDetails.gstin);
        if (scannedData.senderDetails.stateCode) setSenderStateCode(scannedData.senderDetails.stateCode);
        if (scannedData.senderDetails.branchAddress) setSenderBranchAddress(scannedData.senderDetails.branchAddress);
        if (scannedData.senderDetails.ifscCode) setSenderIfscCode(scannedData.senderDetails.ifscCode);
        if (scannedData.senderDetails.bankBranch) setSenderBankBranch(scannedData.senderDetails.bankBranch);
      }

      if (scannedData.clientDetails) {
        setClientName(scannedData.clientDetails.name || clientName);
        setClientEmail(scannedData.clientDetails.email || clientEmail);
        setClientAddress(scannedData.clientDetails.address || clientAddress);
        setClientPhone(scannedData.clientDetails.phone || clientPhone);
        if (scannedData.clientDetails.gstin) setClientGstin(scannedData.clientDetails.gstin);
        if (scannedData.clientDetails.stateCode) setClientStateCode(scannedData.clientDetails.stateCode);
        if (scannedData.clientDetails.panNo) setClientPanNo(scannedData.clientDetails.panNo);
      }

      if (scannedData.consigneeDetails) {
        setShowConsignee(true);
        setConsigneeName(scannedData.consigneeDetails.name || '');
        setConsigneeEmail(scannedData.consigneeDetails.email || '');
        setConsigneeAddress(scannedData.consigneeDetails.address || '');
        setConsigneePhone(scannedData.consigneeDetails.phone || '');
        setConsigneeGstin(scannedData.consigneeDetails.gstin || '');
        setConsigneeStateCode(scannedData.consigneeDetails.stateCode || '');
      }

      if (scannedData.irnNo) setIrnNo(scannedData.irnNo);
      if (scannedData.ackNo) setAckNo(scannedData.ackNo);
      if (scannedData.vehicleNo) setVehicleNo(scannedData.vehicleNo);
      if (scannedData.challanNo) setChallanNo(scannedData.challanNo);
      if (scannedData.ewayBillNo) setEwayBillNo(scannedData.ewayBillNo);
      if (scannedData.reverseCharge) setReverseCharge(scannedData.reverseCharge);

      if (scannedData.items && scannedData.items.length > 0) {
        const mappedItems = scannedData.items.map(item => {
          const qty = item.quantity || 1;
          const pr = item.price || 0;
          const disc = item.discount || 0;
          const tx = item.tax || 0;
          const taxable = qty * pr * (1 - disc / 100);
          const total = taxable * (1 + tx / 100);
          return {
            name: item.name || '',
            description: item.description || '',
            hsnSac: item.hsnSac || '',
            quantity: qty,
            price: pr,
            discount: disc,
            tax: tx,
            total: Number(total.toFixed(2)),
          };
        });
        setItems(mappedItems);
      }
    }
  }, [scannedData]);

  // Client dropdown handler
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    
    const client = savedClients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
      setClientAddress(client.address);
      setClientPhone(client.phone);
      setClientGstin(client.gstin || '');
      setClientStateCode(client.stateCode || '');
      setClientPanNo(client.panNo || '');
    }
  };

  // Item management methods
  const handleAddItem = () => {
    setItems([
      ...items,
      { name: '', description: '', hsnSac: '', quantity: 1, price: 0, discount: 0, tax: 18, total: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setItems([{ name: '', description: '', hsnSac: '', quantity: 1, price: 0, discount: 0, tax: 18, total: 0 }]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };

    if (field === 'name' || field === 'description' || field === 'hsnSac') {
      item[field] = value;
    } else {
      // Numeric fields
      const numVal = parseFloat(value) || 0;
      item[field] = numVal as never; // bypass typescript strict typing helper
    }

    // Recalculate totals
    const qty = field === 'quantity' ? (parseFloat(value) || 0) : item.quantity;
    const price = field === 'price' ? (parseFloat(value) || 0) : item.price;
    const discount = field === 'discount' ? (parseFloat(value) || 0) : item.discount;
    const tax = field === 'tax' ? (parseFloat(value) || 0) : item.tax;

    const subtotal = qty * price;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (tax / 100);
    const total = taxableAmount + taxAmount;

    item.quantity = qty;
    item.price = price;
    item.discount = discount;
    item.tax = tax;
    item.total = Number(total.toFixed(2));

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  // Summary Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const isSameState = enableIndianGST && senderStateCode && clientStateCode && senderStateCode.trim().toLowerCase() === clientStateCode.trim().toLowerCase();

    // We'll map items to assign their calculated CGST, SGST, IGST values
    const processedItems = items.map(item => {
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const disc = item.discount || 0;
      const tax = item.tax || 0;

      const itemSub = qty * price;
      const itemDisc = itemSub * (disc / 100);
      const itemTaxable = itemSub - itemDisc;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (enableIndianGST) {
        if (isSameState) {
          cgstRate = tax / 2;
          sgstRate = tax / 2;
          cgstAmount = itemTaxable * (cgstRate / 100);
          sgstAmount = itemTaxable * (sgstRate / 100);
        } else {
          igstRate = tax;
          igstAmount = itemTaxable * (igstRate / 100);
        }
      }

      const itemTax = enableIndianGST ? (cgstAmount + sgstAmount + igstAmount) : (itemTaxable * (tax / 100));
      const itemTotal = itemTaxable + itemTax;

      subtotal += itemSub;
      discountTotal += itemDisc;
      taxTotal += itemTax;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;

      return {
        ...item,
        taxableValue: Number(itemTaxable.toFixed(2)),
        cgstRate,
        cgstAmount: Number(cgstAmount.toFixed(2)),
        sgstRate,
        sgstAmount: Number(sgstAmount.toFixed(2)),
        igstRate,
        igstAmount: Number(igstAmount.toFixed(2)),
        total: Number(itemTotal.toFixed(2))
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal;
    const roundedGrand = Math.round(grandTotal);
    const roundOff = Number((roundedGrand - grandTotal).toFixed(2));

    const amountInWords = numberToWords(roundedGrand, currency);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      roundOff,
      netAmount: roundedGrand,
      amountInWords,
      processedItems
    };
  }, [items, enableIndianGST, senderStateCode, clientStateCode, currency]);

  // Handle dynamic natural language AI generation call
  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const authId = localStorage.getItem('tallybird_userId') || localStorage.getItem('finvoice_userId') || 'default_user';
      const res = await fetch('/api/ai/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authId}`
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          companyDetails: {
            name: senderName,
            email: senderEmail,
            address: senderAddress,
            phone: senderPhone,
            panNo: senderPanNo,
            gstin: senderGstin,
            stateCode: senderStateCode,
            branchAddress: senderBranchAddress,
            ifscCode: senderIfscCode,
            bankName: companyDetails.bankName,
            accountNumber: companyDetails.accountNumber,
            bankBranch: senderBankBranch,
          }
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate invoice.');
      }
      const data = await res.json();
      
      if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
      if (data.date) setDate(data.date);
      if (data.dueDate) setDueDate(data.dueDate);
      if (data.currency) setCurrency(data.currency);
      if (data.paymentTerms) setPaymentTerms(data.paymentTerms);
      if (data.notes) setNotes(data.notes);
      if (data.enableIndianGST !== undefined) setEnableIndianGST(!!data.enableIndianGST);
      
      if (data.senderDetails) {
        setSenderName(data.senderDetails.name || '');
        setSenderEmail(data.senderDetails.email || '');
        setSenderAddress(data.senderDetails.address || '');
        setSenderPhone(data.senderDetails.phone || '');
        setSenderPanNo(data.senderDetails.panNo || '');
        setSenderGstin(data.senderDetails.gstin || '');
        setSenderStateCode(data.senderDetails.stateCode || '');
        setSenderBranchAddress(data.senderDetails.branchAddress || '');
        setSenderIfscCode(data.senderDetails.ifscCode || '');
        setSenderBankBranch(data.senderDetails.bankBranch || '');
      }
      
      if (data.clientDetails) {
        setClientName(data.clientDetails.name || '');
        setClientEmail(data.clientDetails.email || '');
        setClientAddress(data.clientDetails.address || '');
        setClientPhone(data.clientDetails.phone || '');
        setClientGstin(data.clientDetails.gstin || '');
        setClientStateCode(data.clientDetails.stateCode || '');
        setClientPanNo(data.clientDetails.panNo || '');
      }

      if (data.consigneeDetails) {
        setShowConsignee(true);
        setConsigneeName(data.consigneeDetails.name || '');
        setConsigneeEmail(data.consigneeDetails.email || '');
        setConsigneeAddress(data.consigneeDetails.address || '');
        setConsigneePhone(data.consigneeDetails.phone || '');
        setConsigneeGstin(data.consigneeDetails.gstin || '');
        setConsigneeStateCode(data.consigneeDetails.stateCode || '');
      } else {
        setShowConsignee(false);
      }

      if (data.irnNo) setIrnNo(data.irnNo);
      if (data.ackNo) setAckNo(data.ackNo);
      if (data.vehicleNo) setVehicleNo(data.vehicleNo);
      if (data.challanNo) setChallanNo(data.challanNo);
      if (data.ewayBillNo) setEwayBillNo(data.ewayBillNo);
      if (data.reverseCharge) setReverseCharge(data.reverseCharge);
      
      if (data.terms && data.terms.length > 0) {
        setTermsText(data.terms.join('\n'));
      }

      if (data.items && data.items.length > 0) {
        setItems(data.items.map((it: any) => ({
          name: it.name || '',
          description: it.description || '',
          hsnSac: it.hsnSac || '',
          quantity: it.quantity || 1,
          price: it.price || 0,
          discount: it.discount || 0,
          tax: it.tax || 0,
          total: 0
        })));
      }
      
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber) return alert('Invoice Number is required.');
    if (!clientName) return alert('Client Name is required.');
    if (items.some(item => !item.name)) return alert('All line items must have a name.');

    onSave({
      invoiceNumber,
      status,
      date,
      dueDate,
      enableIndianGST,
      senderDetails: {
        name: senderName,
        email: senderEmail,
        address: senderAddress,
        phone: senderPhone,
        panNo: senderPanNo,
        gstin: senderGstin,
        stateCode: senderStateCode,
        branchAddress: senderBranchAddress,
        ifscCode: senderIfscCode,
        bankBranch: senderBankBranch,
        bankName: companyDetails.bankName,
        accountNumber: companyDetails.accountNumber,
        taxId: companyDetails.taxId
      },
      clientDetails: {
        name: clientName,
        email: clientEmail,
        address: clientAddress,
        phone: clientPhone,
        gstin: clientGstin,
        stateCode: clientStateCode,
        panNo: clientPanNo,
      },
      consigneeDetails: showConsignee ? {
        name: consigneeName,
        email: consigneeEmail,
        address: consigneeAddress,
        phone: consigneePhone,
        gstin: consigneeGstin,
        stateCode: consigneeStateCode,
      } : undefined,
      items: calculations.processedItems,
      subtotal: calculations.subtotal,
      discountTotal: calculations.discountTotal,
      taxTotal: calculations.taxTotal,
      cgstTotal: calculations.cgstTotal,
      sgstTotal: calculations.sgstTotal,
      igstTotal: calculations.igstTotal,
      grandTotal: calculations.grandTotal,
      roundOff: calculations.roundOff,
      netAmount: calculations.netAmount,
      amountInWords: calculations.amountInWords,
      currency,
      paymentTerms,
      notes,
      irnNo,
      ackNo,
      vehicleNo,
      challanNo,
      ewayBillNo,
      reverseCharge,
      terms: termsText.split('\n').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16" id="invoice-form">
      {/* Form Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {invoice ? `Edit Invoice #${invoiceNumber}` : 'Create New Invoice'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {invoice ? 'Modify invoice details and line items.' : 'Fill in the ledger details, define items, and issue the billing.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-form-cancel"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="btn-form-save"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 font-semibold transition text-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Invoice
          </button>
        </div>
      </div>

      {/* AI Invoice Generator Prompt Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">✨ Let AI Auto-Generate This Invoice</h3>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase">Gemini 3.5 Flash</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Describe your invoice details in natural language. Tell Gemini who the client is, item list with prices, GST percentages, and specific bank details. The AI will instantly compute everything, populate all fields, and even draft the terms list matching the Hira Refrigeration standard!
        </p>
        <div className="space-y-3">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full p-3 border border-indigo-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium shadow-inner"
            rows={2}
            placeholder="e.g. Create a tax invoice for Hira Refrigeration to RK Ref & Air Conditioners. 1 Condenser Coil for 5085 rupees with 18% GST. Add Kotak bank details and Punjab state code 03..."
          />
          <div className="flex items-center justify-between gap-4">
            {aiError && <span className="text-xs text-rose-500 font-semibold">{aiError}</span>}
            <button
              type="button"
              disabled={isGenerating || !aiPrompt.trim()}
              onClick={handleGenerateWithAi}
              className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition cursor-pointer flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyzing & Autofilling Form...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate & Autofill Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Fields Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Metadata Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Invoice Configuration
              </h3>
              
              <label className="flex items-center gap-2.5 bg-slate-50 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableIndianGST}
                  onChange={(e) => setEnableIndianGST(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-indigo-600 select-none">Tax Invoice (Indian GST) Mode</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-slate-50/50"
                  placeholder="e.g. INV-2026-001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Issue Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Recipient (Client) Details
              </h3>
              
              {savedClients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Load profile:</span>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 font-semibold outline-none bg-white cursor-pointer"
                  >
                    <option value="">-- Choose Client --</option>
                    {savedClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Client Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. John Doe / Acme Corp"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Client Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. client@email.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Client Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. +1 (555) 019-2834"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Client Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. 123 Business Rd, Suite 100"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {enableIndianGST && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Client GSTIN
                    </label>
                    <input
                      type="text"
                      value={clientGstin}
                      onChange={(e) => setClientGstin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. 03ACBPS1069E1ZX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Client State Code
                    </label>
                    <input
                      type="text"
                      value={clientStateCode}
                      onChange={(e) => setClientStateCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. 03 (Punjab)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Client PAN No
                    </label>
                    <input
                      type="text"
                      value={clientPanNo}
                      onChange={(e) => setClientPanNo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. ACBPS1069E"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Consignee Section Toggler */}
            {enableIndianGST && (
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showConsignee}
                    onChange={(e) => setShowConsignee(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 select-none">Ship to Different Consignee (Consignee Details)</span>
                </label>

                {showConsignee && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fadeIn">
                    <div className="sm:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Consignee (Ship-to) Information
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={consigneeName}
                        onChange={(e) => setConsigneeName(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="Consignee business name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={consigneeEmail}
                        onChange={(e) => setConsigneeEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="consignee@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={consigneePhone}
                        onChange={(e) => setConsigneePhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={consigneeAddress}
                        onChange={(e) => setConsigneeAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="Shipping address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={consigneeGstin}
                        onChange={(e) => setConsigneeGstin(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="Consignee GSTIN"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">State Code</label>
                      <input
                        type="text"
                        value={consigneeStateCode}
                        onChange={(e) => setConsigneeStateCode(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-900"
                        placeholder="State Code"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sender (My Company) Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Issuer (Your Company) Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  placeholder="billing@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Company Phone
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  placeholder="Your Phone Number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Company Address (Head Office)
                </label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  placeholder="Company HQ Address"
                />
              </div>

              {enableIndianGST && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Company PAN No
                    </label>
                    <input
                      type="text"
                      value={senderPanNo}
                      onChange={(e) => setSenderPanNo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. ACBPS1069E"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Company GSTIN
                    </label>
                    <input
                      type="text"
                      value={senderGstin}
                      onChange={(e) => setSenderGstin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. 04ACBPS1069E1ZX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={senderStateCode}
                      onChange={(e) => setSenderStateCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. 04 (Chandigarh)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Branch Address (optional)
                    </label>
                    <input
                      type="text"
                      value={senderBranchAddress}
                      onChange={(e) => setSenderBranchAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. SCO 156-160, Sector 8C, Chandigarh"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Bank IFSC Code (IFSC)
                    </label>
                    <input
                      type="text"
                      value={senderIfscCode}
                      onChange={(e) => setSenderIfscCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. KKBK0004202"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Bank Branch City
                    </label>
                    <input
                      type="text"
                      value={senderBankBranch}
                      onChange={(e) => setSenderBankBranch(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                      placeholder="e.g. Sector 8C, Chandigarh"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Clearance & Dispatch Details Section */}
          {enableIndianGST && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Clearance & Dispatch Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    IRN (Invoice Reference Number)
                  </label>
                  <input
                    type="text"
                    value={irnNo}
                    onChange={(e) => setIrnNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white font-mono animate-pulse-slow"
                    placeholder="64-digit IRN code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Acknowledgement No (Ack No)
                  </label>
                  <input
                    type="text"
                    value={ackNo}
                    onChange={(e) => setAckNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white font-mono"
                    placeholder="Ack details"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. PB-65-AX-9988"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Challan No / Delivery Note
                  </label>
                  <input
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                    placeholder="e.g. CH-9081"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    E-Way Bill Number
                  </label>
                  <input
                    type="text"
                    value={ewayBillNo}
                    onChange={(e) => setEwayBillNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white font-mono"
                    placeholder="E-Way Bill code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Tax Payable on Reverse Charge
                  </label>
                  <select
                    value={reverseCharge}
                    onChange={(e) => setReverseCharge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Billing Settings & Summary */}
        <div className="space-y-8">
          
          {/* Billing Preference Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Billing Preferences
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
              >
                {CURRENCIES.map(cur => (
                  <option key={cur.value} value={cur.value}>{cur.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-white"
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          {/* Ledger Calculation Summary */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-5 relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">
              Invoiced Ledger Summary
            </h3>

            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Value (Subtotal)</span>
                <span>{currency}{calculations.subtotal}</span>
              </div>
              
              {calculations.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Total</span>
                  <span>-{currency}{calculations.discountTotal}</span>
                </div>
              )}

              {enableIndianGST ? (
                <>
                  {calculations.cgstTotal > 0 && (
                    <div className="flex justify-between text-indigo-300">
                      <span>Central Tax (CGST)</span>
                      <span>+{currency}{calculations.cgstTotal}</span>
                    </div>
                  )}
                  {calculations.sgstTotal > 0 && (
                    <div className="flex justify-between text-indigo-300">
                      <span>State Tax (SGST)</span>
                      <span>+{currency}{calculations.sgstTotal}</span>
                    </div>
                  )}
                  {calculations.igstTotal > 0 && (
                    <div className="flex justify-between text-indigo-300">
                      <span>Integrated Tax (IGST)</span>
                      <span>+{currency}{calculations.igstTotal}</span>
                    </div>
                  )}
                </>
              ) : (
                calculations.taxTotal > 0 && (
                  <div className="flex justify-between text-indigo-300">
                    <span>Tax Amount</span>
                    <span>+{currency}{calculations.taxTotal}</span>
                  </div>
                )
              )}

              {enableIndianGST && calculations.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round Off</span>
                  <span>{calculations.roundOff > 0 ? '+' : ''}{currency}{calculations.roundOff}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3.5 flex justify-between items-end">
                <span className="text-sm font-bold text-slate-200">
                  {enableIndianGST ? 'Net Amount Payable' : 'Total Invoice Due'}
                </span>
                <span className="text-2xl font-extrabold text-white">
                  {currency}{enableIndianGST ? calculations.netAmount : calculations.grandTotal}
                </span>
              </div>

              {calculations.amountInWords && (
                <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-400 italic font-mono leading-normal">
                  <span className="block font-bold text-slate-300 not-italic uppercase tracking-wide text-[9px] mb-0.5">Amount in Words:</span>
                  {calculations.amountInWords}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Invoice Line Items (Table Layout) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Invoice Line Items
          </h3>
          <button
            type="button"
            id="btn-add-item-row"
            onClick={handleAddItem}
            className="px-3 py-1.5 border border-indigo-100 text-indigo-600 bg-indigo-50/50 rounded-lg hover:bg-indigo-50 font-semibold transition text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>

        {/* Responsive Table wrapper */}
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-slate-900 text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[180px]">Item / Product Name</th>
                {enableIndianGST && (
                  <th className="py-3 px-4 w-28">HSN/SAC</th>
                )}
                <th className="py-3 px-4 min-w-[180px]">Description</th>
                <th className="py-3 px-4 w-20 text-center">Qty</th>
                <th className="py-3 px-4 w-32">Price</th>
                <th className="py-3 px-4 w-24">Disc %</th>
                <th className="py-3 px-4 w-24">{enableIndianGST ? 'GST %' : 'Tax %'}</th>
                <th className="py-3 px-4 w-28 text-right">Total</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {calculations.processedItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/20">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="e.g. Condenser Coil"
                      className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:border-indigo-500 focus:bg-white bg-slate-50 outline-none text-sm font-medium"
                    />
                  </td>
                  {enableIndianGST && (
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.hsnSac || ''}
                        onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                        placeholder="e.g. 8415"
                        className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:border-indigo-500 focus:bg-white bg-slate-50 outline-none text-sm font-mono"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Details"
                      className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:border-indigo-500 focus:bg-white bg-slate-50 outline-none text-sm text-slate-600"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-16 px-2 py-2 border border-slate-100 rounded-lg text-center bg-slate-50 outline-none text-sm font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-28 pl-6 pr-2 py-2 border border-slate-100 rounded-lg bg-slate-50 outline-none text-sm font-semibold"
                      />
                      <span className="text-slate-400 text-xs font-bold absolute left-2 top-2.5">{currency}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount === 0 ? '' : item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      className="w-16 px-2 py-2 border border-slate-100 rounded-lg text-center bg-slate-50 outline-none text-sm text-emerald-600 font-semibold"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax === 0 ? '' : item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                      className="w-16 px-2 py-2 border border-slate-100 rounded-lg text-center bg-slate-50 outline-none text-sm text-indigo-600 font-semibold"
                      placeholder="18"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-slate-800 text-sm">
                      {currency}{item.total}
                    </div>
                    {enableIndianGST && item.tax > 0 && (
                      <div className="text-[10px] text-slate-400 leading-tight font-mono mt-0.5">
                        {item.cgstAmount ? (
                          <span>C:{item.cgstRate}%/S:{item.sgstRate}%</span>
                        ) : (
                          <span>I:{item.igstRate}%</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      id={`btn-remove-row-${index}`}
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-300 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Terms and Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Invoice Notes / Payment Remarks
          </label>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-slate-50/50"
            placeholder="e.g. Please wire the payment to Bank ABC. Account: 123-456-789. Thank you!"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Terms and Conditions (One per line)</span>
            {enableIndianGST && (
              <button
                type="button"
                onClick={() => setTermsText(
                  "1. Interest @ 24% p.a. will be charged if bill is not paid on presentation.\n" +
                  "2. Our responsibility ceases as soon as goods leave our premises.\n" +
                  "3. Subject to jurisdiction of local courts.\n" +
                  "4. E. & O.E."
                )}
                className="text-[10px] text-indigo-600 hover:underline font-bold"
              >
                Insert Hira Refrigeration Terms
              </button>
            )}
          </label>
          <textarea
            rows={5}
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 text-sm outline-none bg-slate-50/50 font-mono text-xs"
            placeholder="Enter each terms statement on a new line."
          />
        </div>
      </div>
    </form>
  );
}
