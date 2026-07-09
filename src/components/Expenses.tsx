import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  PieChart,
  Tag,
  Calendar,
  CreditCard,
  X,
  FileText
} from 'lucide-react';
import { Expense } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function Expenses({ expenses, onAddExpense, onDeleteExpense }: ExpensesProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Software');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'cleared'>('cleared');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const categories = [
    'Software',
    'Marketing',
    'Consulting & Contractors',
    'Rent & Office',
    'Travel & Meals',
    'Utilities',
    'Taxes & Licenses',
    'Other'
  ];

  const paymentMethods = [
    'Credit Card',
    'Bank Wire',
    'Cash',
    'PayPal',
    'Stripe'
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onAddExpense({
      category,
      amount: parseFloat(amount),
      date,
      description,
      status,
      paymentMethod
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setCategory('Software');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('cleared');
    setPaymentMethod('Credit Card');
    setIsModalOpen(false);
  };

  // Compute stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const clearedExpenses = expenses.filter(e => e.status === 'cleared').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  // Category distributions
  const categorySummary = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryShare = Object.entries(categorySummary).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  // Filtered expense list
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase()) || exp.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCur = (v: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" id="expenses-dashboard-root">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Corporate Expenses
          </h1>
          <p className="text-slate-500 mt-1">Monitor operational costs, subscription bills, and clear custom expenses.</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          id="btn-add-expense-trigger"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Cash Out</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{formatCur(totalExpenses)}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{expenses.length} claims registered</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cleared & Settled</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{formatCur(clearedExpenses)}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 font-bold block">
              {totalExpenses > 0 ? Math.round((clearedExpenses / totalExpenses) * 100) : 0}% settlement rate
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Approval</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{formatCur(pendingExpenses)}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Waiting for clearance</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Expenses Ledger & Analytics breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Share Distribution Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Category Allocations
            </h2>
            
            {categoryShare.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No expense data available. Record an expense to view distribution charts.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryShare.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.category}</span>
                      <span className="font-mono text-slate-500">{formatCur(item.amount)} ({item.percentage}%)</span>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses List Ledger Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Filter Toolbar */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1 w-full md:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-medium text-slate-700 w-full md:w-auto"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-medium text-slate-700 w-full md:w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto">
              {filteredExpenses.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-300" />
                  <p>No expenses found matching filters.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Claim Detail</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Paid Via</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 block">{exp.description || 'General Expense Item'}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{exp.date}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{exp.category}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{exp.paymentMethod}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.status === 'cleared' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {exp.status === 'cleared' ? 'Cleared' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">{formatCur(exp.amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete claim"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Expense Form Dialog Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Record New Corporate Expense</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Submit receipts and specify payment categories.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expense Description / Detail</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Web Hosting Subscription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Paid</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-medium text-slate-700"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-medium text-slate-700"
                  >
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clearing Status</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus('cleared')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'cleared'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Cleared
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'pending'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> Pending
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Record Claim
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
