import React, { useState, useEffect } from 'react';
import { Invoice, ClientProfile, InvoiceStatus, CompanyDetails, Expense } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceView from './components/InvoiceView';
import AIScanner from './components/AIScanner';
import ClientDirectory from './components/ClientDirectory';
import Expenses from './components/Expenses';
import AdminPanel from './components/AdminPanel';
import AIChatbot from './components/AIChatbot';
import { 
  Building, 
  FileText, 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  LogOut, 
  MessageSquare,
  Settings,
  Brain,
  ShieldAlert,
  Sliders,
  Check,
  ChevronRight,
  ChevronLeft,
  Coins,
  Menu,
  X,
  RefreshCw,
  Sun,
  Moon,
  Lock,
  Key,
  TrendingUp
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (localStorage.getItem('tallybird_dark_mode') || localStorage.getItem('apex_dark_mode')) === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tallybird_dark_mode', 'true');
      localStorage.setItem('apex_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tallybird_dark_mode', 'false');
      localStorage.setItem('apex_dark_mode', 'false');
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data lists
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Navigation states for deep panels
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [scannedInvoiceData, setScannedInvoiceData] = useState<Partial<Invoice> | null>(null);

  // Assistant overlay panel state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatbotPreloadQuery, setChatbotPreloadQuery] = useState<string | null>(null);

  // Settings specific
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [taxId, setTaxId] = useState('');

  // Change password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Initial user lookup
  useEffect(() => {
    const storedUser = localStorage.getItem('tallybird_user') || localStorage.getItem('finvoice_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setCompanyName(u.companyDetails?.name || '');
        setCompanyEmail(u.companyDetails?.email || '');
        setCompanyPhone(u.companyDetails?.phone || '');
        setCompanyAddress(u.companyDetails?.address || '');
        setBankName(u.companyDetails?.bankName || '');
        setAccountNumber(u.companyDetails?.accountNumber || '');
        setTaxId(u.companyDetails?.taxId || '');
      } catch (err) {
        console.error('Session parse error:', err);
      }
    }
    setIsSessionLoading(false);
  }, []);

  // Sync core data when user authenticates
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const userId = user?.id || localStorage.getItem('tallybird_userId') || localStorage.getItem('finvoice_userId') || 'default_user';
    const authHeaders = { 'Authorization': `Bearer ${userId}` };

    try {
      // Invoices list
      const invRes = await fetch('/api/invoices', { headers: authHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
      }

      // Clients list
      const cliRes = await fetch('/api/clients', { headers: authHeaders });
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(cliData);
      }

      // Expenses list
      const expRes = await fetch('/api/expenses', { headers: authHeaders });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }
    } catch (err) {
      console.error('Error synchronizing database:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tallybird_userId');
    localStorage.removeItem('tallybird_user');
    localStorage.removeItem('tallybird_chat_history');
    localStorage.removeItem('finvoice_userId');
    localStorage.removeItem('finvoice_user');
    localStorage.removeItem('finvoice_chat_history');
    setUser(null);
    setInvoices([]);
    setClients([]);
    setExpenses([]);
    setActiveTab('dashboard');
  };

  // EXPENSES HANDLERS
  const handleAddExpense = async (expensePayload: Omit<Expense, 'id' | 'userId'>) => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(expensePayload)
      });
      if (response.ok) {
        const savedExpense = await response.json();
        setExpenses(prev => [...prev, savedExpense]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });
      if (response.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION HANDLERS
  const handleSeedData = async () => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });
      if (response.ok) {
        alert('Successfully seeded corporate mock datasets!');
        await fetchData();
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearDb = async () => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch('/api/admin/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });
      if (response.ok) {
        alert('Database wiped successfully.');
        setInvoices([]);
        setClients([]);
        setExpenses([]);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // INVOICE CRUDS
  const handleSaveInvoice = async (invoicePayload: Omit<Invoice, 'id' | 'userId'>) => {
    const userId = user?.id || 'default_user';
    const authHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userId}` 
    };

    try {
      let response;
      if (isEditing && currentInvoice) {
        // Update Existing
        response = await fetch(`/api/invoices/${currentInvoice.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(invoicePayload)
        });
      } else {
        // Create New
        response = await fetch('/api/invoices', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(invoicePayload)
        });
      }

      if (!response.ok) throw new Error('Failed to synchronize invoice payload');

      const savedInvoice = await response.json();
      
      // Update state locally
      if (isEditing) {
        setInvoices(invoices.map(inv => inv.id === savedInvoice.id ? savedInvoice : inv));
      } else {
        setInvoices([...invoices, savedInvoice]);
      }

      // Clean transition states
      setIsEditing(false);
      setScannedInvoiceData(null);
      setCurrentInvoice(savedInvoice); // Open details preview of saved invoice
      setActiveTab('invoices');
    } catch (err) {
      console.error('Invoice save failure:', err);
      alert('Error saving invoice details.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      if (response.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id));
        if (currentInvoice?.id === id) {
          setCurrentInvoice(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeStatus = async (id: string, status: InvoiceStatus) => {
    const userId = user?.id || 'default_user';
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;

    const updated = { ...invoice, status };

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(updated)
      });

      if (response.ok) {
        const payload = await response.json();
        setInvoices(invoices.map(i => i.id === id ? payload : i));
        if (currentInvoice?.id === id) {
          setCurrentInvoice(payload);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CLIENTS ADD
  const handleAddClient = async (clientPayload: Omit<ClientProfile, 'id' | 'userId'>) => {
    const userId = user?.id || 'default_user';
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(clientPayload)
      });
      if (response.ok) {
        const newClient = await response.json();
        setClients([...clients, newClient]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SETTINGS SUBMIT
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingCompany(true);
    setSettingsSuccess(false);
    setSettingsError('');

    // Regex Validation Checks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

    if (!emailRegex.test(companyEmail)) {
      setSettingsError('Please provide a valid corporate email address (e.g. name@company.com).');
      setUpdatingCompany(false);
      return;
    }

    if (companyPhone && !phoneRegex.test(companyPhone)) {
      setSettingsError('Please provide a valid phone number. Only numbers, spaces, dashes, parentheses and a leading + are allowed (7 to 20 characters).');
      setUpdatingCompany(false);
      return;
    }

    const userId = user?.id || 'default_user';
    const companyPayload: CompanyDetails = {
      name: companyName,
      email: companyEmail,
      phone: companyPhone,
      address: companyAddress,
      bankName,
      accountNumber,
      taxId
    };

    try {
      const response = await fetch('/api/auth/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(companyPayload)
      });

      if (response.ok) {
        const updatedDetails = await response.json();
        const updatedUser = { ...user, companyDetails: updatedDetails };
        setUser(updatedUser);
        localStorage.setItem('tallybird_user', JSON.stringify(updatedUser));
        localStorage.setItem('finvoice_user', JSON.stringify(updatedUser));
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        setSettingsError('Failed to update ledger configurations on the server.');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('An error occurred while saving details.');
    } finally {
      setUpdatingCompany(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || ''}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setChangePasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Close modal after brief delay
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setChangePasswordSuccess('');
        }, 1500);
      } else {
        setChangePasswordError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setChangePasswordError('An error occurred. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Scan OCR Import flow
  const handleImportScannedData = (scannedData: Partial<Invoice>) => {
    setScannedInvoiceData(scannedData);
    setIsEditing(false); // Make sure it's NEW
    setCurrentInvoice(null); // Clear selected
    setActiveTab('invoice_form'); // Move to form
  };

  // Bypass Auth
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="mt-3 text-xs text-slate-400 font-bold uppercase tracking-widest">Verifying Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans relative overflow-hidden flex-1 ${isDarkMode ? 'dark' : ''}`} id="app-root-container">
      
      {/* 1. Mobile Top Header Bar (hidden on desktop and during printing) */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden select-none flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              Tallybird
            </span>
            <span className="text-[8px] text-emerald-400 block font-bold uppercase tracking-wider -mt-0.5">
              Full-Stack Suite
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
          id="btn-mobile-menu-trigger"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Mobile Drawer Slide-over Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex print:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Element */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-slate-300 p-5 shadow-2xl transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white block">
                    Tallybird
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-bold uppercase tracking-wider">
                    Full-Stack Suite
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                id="btn-close-mobile-drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar navigation links */}
            <nav className="flex-1 space-y-1.5 pt-6">
              {/* Dashboard */}
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {/* Invoices */}
              <button
                onClick={() => {
                  setActiveTab('invoices');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'invoices' || activeTab === 'invoice_form'
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Invoices</span>
              </button>

              {/* AI Scanner */}
              <button
                onClick={() => {
                  setActiveTab('scanner');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'scanner' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>AI Scanner OCR</span>
              </button>

              {/* Clients */}
              <button
                onClick={() => {
                  setActiveTab('clients');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'clients' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Clients</span>
              </button>

              {/* Expenses */}
              <button
                onClick={() => {
                  setActiveTab('expenses');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'expenses' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Expenses</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              {/* Admin */}
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admin' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </nav>

            {/* Bottom Account area */}
            <div className="border-t border-slate-800 pt-5 space-y-4 flex-shrink-0">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center text-xs flex-shrink-0 shadow">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white text-xs block truncate">
                    {user.companyDetails?.name || 'My Company'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  )}
                  <span className="text-xs font-bold text-slate-300">Dark Mode</span>
                </div>
                <button
                  id="btn-mobile-theme-toggle"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle Theme Mode"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500/80" />
                <span>Log Out Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Sidebar (hidden on mobile and during printing) */}
      <aside className={`hidden md:flex bg-slate-900 text-slate-300 flex-shrink-0 flex-col justify-between p-5 border-r border-slate-850 print:hidden select-none transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-5'
      }`}>
        <div className="space-y-8">
          {/* Logo & Collapse Button */}
          <div className={`flex items-center px-2 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="transition-all duration-300 animate-fade-in">
                  <span className="font-extrabold tracking-tight text-white flex items-center gap-1.5 text-base whitespace-nowrap">
                    Tallybird <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-bold tracking-wider uppercase mt-0.5">
                    Full-Stack Suite
                  </span>
                </div>
              )}
            </div>
            
            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Collapse Sidebar"
                id="btn-toggle-sidebar-collapse"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <div className="flex justify-center border-b border-slate-850 pb-4">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Expand Sidebar"
                id="btn-toggle-sidebar-expand"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* Dashboard */}
            <button
              id="nav-btn-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Dashboard</span>}
            </button>

            {/* Invoices */}
            <button
              id="nav-btn-invoices"
              onClick={() => {
                setActiveTab('invoices');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'invoices' || activeTab === 'invoice_form'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Invoices" : ""}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Invoices</span>}
            </button>

            {/* AI Scanner */}
            <button
              id="nav-btn-scanner"
              onClick={() => {
                setActiveTab('scanner');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'scanner' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "AI Scanner OCR" : ""}
            >
              <Brain className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">AI Scanner OCR</span>}
            </button>

            {/* Clients */}
            <button
              id="nav-btn-clients"
              onClick={() => {
                setActiveTab('clients');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'clients' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Clients" : ""}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Clients</span>}
            </button>

            {/* Expenses */}
            <button
              id="nav-btn-expenses"
              onClick={() => {
                setActiveTab('expenses');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'expenses' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Expenses" : ""}
            >
              <Coins className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Expenses</span>}
            </button>

            {/* Settings */}
            <button
              id="nav-btn-settings"
              onClick={() => {
                setActiveTab('settings');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Settings" : ""}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Settings</span>}
            </button>

            {/* Admin */}
            <button
              id="nav-btn-admin"
              onClick={() => {
                setActiveTab('admin');
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              } ${
                activeTab === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
              title={isSidebarCollapsed ? "Admin" : ""}
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Admin</span>}
            </button>
          </nav>
        </div>

        {/* User Account / Signout block */}
        <div className="border-t border-slate-850 pt-5 mt-5 space-y-4">
          {/* Theme Toggle Section */}
          <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  )}
                  <span className="text-xs font-bold text-slate-300">Dark Mode</span>
                </div>
                <button
                  id="btn-sidebar-theme-toggle"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle Theme Mode"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </>
            ) : (
              <button
                id="btn-sidebar-theme-toggle-collapsed"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}
          </div>

          <div className={`flex items-center px-2 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center text-xs flex-shrink-0 shadow">
              {user.email[0].toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1 transition-all duration-300">
                <span className="font-bold text-white text-xs block truncate">
                  {user.companyDetails?.name || 'My Company'}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {user.email}
                </span>
              </div>
            )}
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 text-xs font-bold transition cursor-pointer ${
              isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
            }`}
            title={isSidebarCollapsed ? "Log Out Account" : ""}
          >
            <LogOut className="w-4 h-4 text-rose-500/80 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="transition-all duration-300 whitespace-nowrap">Log Out Account</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* Active tab route controller */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            invoices={invoices} 
            onNavigate={(tab) => {
              if (tab === 'chat_balances') {
                setIsChatOpen(true);
                setChatbotPreloadQuery('Analyze my cash flow collections rate');
              } else if (tab === 'chat_reminder') {
                setIsChatOpen(true);
                setChatbotPreloadQuery('Draft a polite payment reminder email for overdue client');
              } else if (tab === 'chat') {
                setIsChatOpen(true);
              } else {
                setActiveTab(tab);
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
              }
            }} 
            onSelectInvoice={(inv) => {
              setCurrentInvoice(inv);
              setActiveTab('invoices');
            }}
            onCreateInvoice={() => {
              setCurrentInvoice(null);
              setIsEditing(false);
              setScannedInvoiceData(null);
              setActiveTab('invoice_form');
            }}
          />
        )}

        {activeTab === 'invoices' && (
          currentInvoice ? (
            <InvoiceView 
              invoice={currentInvoice}
              onBack={() => setCurrentInvoice(null)}
              onEdit={(inv) => {
                setIsEditing(true);
                setCurrentInvoice(inv);
                setActiveTab('invoice_form');
              }}
              onChangeStatus={handleChangeStatus}
            />
          ) : (
            <InvoiceList 
              invoices={invoices}
              onSelectInvoice={(inv) => setCurrentInvoice(inv)}
              onEditInvoice={(inv) => {
                setIsEditing(true);
                setCurrentInvoice(inv);
                setActiveTab('invoice_form');
              }}
              onDeleteInvoice={handleDeleteInvoice}
              onChangeStatus={handleChangeStatus}
              onCreateInvoice={() => {
                setCurrentInvoice(null);
                setIsEditing(false);
                setScannedInvoiceData(null);
                setActiveTab('invoice_form');
              }}
            />
          )
        )}

        {activeTab === 'invoice_form' && (
          <InvoiceForm 
            invoice={isEditing ? currentInvoice : null}
            companyDetails={user.companyDetails}
            savedClients={clients}
            scannedData={scannedInvoiceData}
            onSave={handleSaveInvoice}
            onCancel={() => {
              setIsEditing(false);
              setScannedInvoiceData(null);
              setActiveTab('invoices');
            }}
          />
        )}

        {activeTab === 'scanner' && (
          <AIScanner onImport={handleImportScannedData} />
        )}

        {activeTab === 'clients' && (
          <ClientDirectory clients={clients} onAddClient={handleAddClient} />
        )}

        {activeTab === 'expenses' && (
          <Expenses 
            expenses={expenses} 
            onAddExpense={handleAddExpense} 
            onDeleteExpense={handleDeleteExpense} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
            onSeedData={handleSeedData} 
            onClearDb={handleClearDb} 
            invoiceCount={invoices.length} 
            clientCount={clients.length} 
            expenseCount={expenses.length} 
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6" id="settings-tab">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Ledger Settings
              </h1>
              <p className="text-slate-500 mt-1">Configure your corporate physical, mobile, and bank clearance criteria.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Building className="w-4 h-4 text-indigo-500" />
                Company Branding Details
              </h3>

              {settingsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Details saved successfully!
                </div>
              )}

              {settingsError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  {settingsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Company Legal Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Billing Contact Email</label>
                  <input
                    type="email"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    title="Please enter a valid email address (e.g. name@company.com)."
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. accounting@firm.com"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Billing Phone Number</label>
                  <input
                    type="text"
                    pattern="^\+?[0-9\s\-()]{7,20}$"
                    title="Please enter a valid phone number (7 to 20 characters: digits, spaces, hyphens, and parentheses allowed)."
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="e.g. +1 (415) 555-0199"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tax Registration Id (TIN/VAT)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Physical HQ Address</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="h-[1px] bg-slate-100 my-6"></div>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Direct Wire Transfer clearance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Beneficiary Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                    placeholder="e.g. Silicon Trust Bank"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Clearing Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                    placeholder="e.g. 120-456-9876"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-settings-submit"
                disabled={updatingCompany}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {updatingCompany ? 'Saving settings...' : 'Save Ledger Configurations'}
              </button>
            </form>

            {/* Security & Authentication Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                Security & Authentication
              </h3>
              <p className="text-xs text-slate-500">
                To update your security credentials, click the button below to securely change your account password.
              </p>
              <button
                type="button"
                id="btn-open-change-password"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-200"
              >
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" id="change-password-modal">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Change Account Password</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4">
                {changePasswordError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    {changePasswordError}
                  </div>
                )}

                {changePasswordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {changePasswordSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••••• (Min 6 characters)"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setChangePasswordError('');
                      setChangePasswordSuccess('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Interactive Ask AI Bubble Trigger (hidden on print) */}
        <div className="fixed bottom-6 right-6 z-40 print:hidden flex items-center gap-2" id="floating-chat-trigger-group">
          {/* Subtle helper text hint */}
          {!isChatOpen && (
            <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 select-none hidden sm:block animate-pulse">
              Ask AI Financial Assistant
            </div>
          )}
          <button
            id="btn-trigger-ai-chat"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer transition hover:scale-105 active:scale-95 duration-250 border border-indigo-500/50"
            title="Ask Financial AI"
          >
            {isChatOpen ? <ChevronRight className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 animate-pulse" />}
          </button>
        </div>

        {/* Interactive Chatbot Sidebar Panel (sliding layout) */}
        <AIChatbot 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          preloadQuery={chatbotPreloadQuery}
          onClearPreloadQuery={() => setChatbotPreloadQuery(null)}
        />
      </main>
    </div>
  );
}
