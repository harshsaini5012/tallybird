export interface CompanyDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
  logoUrl?: string;
  bankName?: string;
  accountNumber?: string;
  taxId?: string;
  panNo?: string;
  gstin?: string;
  stateCode?: string;
  branchAddress?: string;
  ifscCode?: string;
  bankBranch?: string;
}

export interface ClientDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
  gstin?: string;
  stateCode?: string;
  panNo?: string;
}

export interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  price: number;
  discount: number; // as percentage (e.g. 10 for 10%)
  tax: number; // as percentage (e.g. 18 for 18%)
  total: number;
  hsnSac?: string;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  taxableValue?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  senderDetails: CompanyDetails;
  clientDetails: ClientDetails;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  paymentTerms: string;
  notes: string;
  userId: string;
  // Professional Tax Invoice features (inspired by HIRA REFRIGERATION example)
  enableIndianGST?: boolean;
  irnNo?: string;
  ackNo?: string;
  vehicleNo?: string;
  challanNo?: string;
  ewayBillNo?: string;
  reverseCharge?: string;
  consigneeDetails?: ClientDetails;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  roundOff?: number;
  netAmount?: number;
  amountInWords?: string;
  terms?: string[];
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  userId: string;
  gstin?: string;
  stateCode?: string;
  panNo?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'cleared';
  paymentMethod: string;
  userId: string;
}
