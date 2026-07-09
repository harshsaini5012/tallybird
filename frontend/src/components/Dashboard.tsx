import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  invoices: Invoice[];
  onNavigate: (tab: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onCreateInvoice: () => void;
}

export default function Dashboard({ 
  invoices, 
  onNavigate, 
  onSelectInvoice, 
  onCreateInvoice 
}: DashboardProps) {
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);

  // Financial Statistics
  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      const amount = inv.grandTotal || 0;
      total += amount;
      if (inv.status === 'paid') paid += amount;
      else if (inv.status === 'sent') pending += amount;
      else if (inv.status === 'overdue') overdue += amount;
      else if (inv.status === 'draft') pending += amount; // Draft counts as pending if not paid
    });

    return { total, paid, pending, overdue };
  }, [invoices]);

  // Aggregate monthly trends for our custom SVG chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dataMap = months.reduce((acc, m) => {
      acc[m] = { month: m, paid: 0, pending: 0, total: 0 };
      return acc;
    }, {} as Record<string, { month: string; paid: number; pending: number; total: number }>);

    invoices.forEach(inv => {
      const date = new Date(inv.date);
      if (isNaN(date.getTime())) return;
      const mLabel = months[date.getMonth()];
      const amount = inv.grandTotal || 0;

      if (dataMap[mLabel]) {
        dataMap[mLabel].total += amount;
        if (inv.status === 'paid') {
          dataMap[mLabel].paid += amount;
        } else {
          dataMap[mLabel].pending += amount;
        }
      }
    });

    return Object.values(dataMap);
  }, [invoices]);

  // Highest monthly invoice total to scale the chart
  const maxMonthlyVal = useMemo(() => {
    const maxVal = Math.max(...monthlyData.map(d => d.total), 100);
    return Math.ceil(maxVal / 500) * 500; // Round up to nearest 500
  }, [monthlyData]);

  // Get dynamic current currency or default to "$"
  const activeCurrency = invoices[0]?.currency || '$';

  // Format currency helper
  const formatCur = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: activeCurrency === '$' ? 'USD' : activeCurrency === '₹' ? 'INR' : activeCurrency === '€' ? 'EUR' : 'USD',
      maximumFractionDigits: 0
    }).format(val).replace('USD', '$').replace('INR', '₹').replace('EUR', '€');
  };

  // Upcoming due invoices (within next 14 days or already overdue)
  const dueAlerts = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [invoices]);

  return (
    <div className="pb-12 space-y-8" id="dashboard-tab">
      {/* Welcome Hero / Quick Stats Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Finance Overview <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
          </h1>
          <p className="text-slate-500 mt-1">Real-time ledger analytics and intelligent invoicing operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            id="btn-nav-scanner"
            onClick={() => onNavigate('scanner')}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl shadow-sm hover:bg-slate-50 font-medium transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Scan Invoice
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            id="btn-create-invoice-dash"
            onClick={onCreateInvoice}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Invoiced */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center hover:shadow-md hover:border-slate-200/80 transition-all duration-300 p-6 gap-5"
          id="stat-card-total"
        >
          <div className="bg-indigo-50 text-indigo-600 rounded-xl p-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-xs">Total Invoiced</span>
            <span className="font-bold text-slate-900 block text-2xl mt-1">{formatCur(stats.total)}</span>
            <span className="text-slate-500 block text-xs mt-0.5">{invoices.length} invoices generated</span>
          </div>
        </motion.div>

        {/* Card 2: Received / Paid */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center hover:shadow-md hover:border-slate-200/80 transition-all duration-300 p-6 gap-5"
          id="stat-card-paid"
        >
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-xs">Received Payments</span>
            <span className="font-bold text-slate-900 block text-2xl mt-1">{formatCur(stats.paid)}</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1 block text-xs mt-0.5">
              {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}% collection rate
            </span>
          </div>
        </motion.div>

        {/* Card 3: Pending/Outstanding */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center hover:shadow-md hover:border-slate-200/80 transition-all duration-300 p-6 gap-5"
          id="stat-card-pending"
        >
          <div className="bg-amber-50 text-amber-600 rounded-xl p-3">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-xs">Outstanding Due</span>
            <span className="font-bold text-slate-900 block text-2xl mt-1">{formatCur(stats.pending)}</span>
            <span className="text-slate-500 block text-xs mt-0.5">Waiting for collection</span>
          </div>
        </motion.div>

        {/* Card 4: Overdue */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center hover:shadow-md hover:border-slate-200/80 transition-all duration-300 p-6 gap-5"
          id="stat-card-overdue"
        >
          <div className="bg-rose-50 text-rose-600 rounded-xl p-3">
            <AlertTriangle className="animate-bounce w-6 h-6" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-xs">Overdue Balances</span>
            <span className="font-bold text-rose-600 block text-2xl mt-1">{formatCur(stats.overdue)}</span>
            <span className="text-rose-500 font-medium block text-xs mt-0.5">Urgent action needed</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Layout (Chart and Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Custom SVG Interactive Chart Column */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-6 h-[400px]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-lg">Cash Flow Analytics</h2>
              <p className="text-xs text-slate-500">Overview of paid collections vs pending receivables per month.</p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-full inline-block"></span>
                <span className="text-slate-600 font-medium">Received (Paid)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded-full inline-block"></span>
                <span className="text-slate-600 font-medium">Pending/Receivables</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Graph Area */}
          <div className="flex-1 relative min-h-0 w-full mt-2 select-none overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="h-full min-w-[600px] lg:min-w-0 relative">
              {/* Y Axis Grid Lines with Sticky Labels */}
              <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono pointer-events-none pb-8">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                  <div key={idx} className="flex items-center w-full">
                    {/* Sticky Label Container */}
                    <div className="sticky left-0 bg-white/95 backdrop-blur-[1px] z-10 pr-2 pl-1 w-12 text-right shrink-0">
                      {formatCur(maxMonthlyVal * ratio)}
                    </div>
                    {/* Grid Line */}
                    <div className="flex-1 border-t border-slate-100"></div>
                  </div>
                ))}
              </div>

              {/* Bars container */}
              <div className="absolute left-14 right-4 top-1 flex items-end justify-between bottom-8 h-[calc(100%-2rem)]">
                {monthlyData.map((d, idx) => {
                  const totalHeight = d.total > 0 ? (d.total / maxMonthlyVal) * 100 : 0;
                  const paidHeight = d.total > 0 ? (d.paid / d.total) * 100 : 0;
                  const pendingHeight = d.total > 0 ? (d.pending / d.total) * 100 : 0;

                  const isHovered = selectedChartMonth === d.month;

                  return (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center flex-1 h-full justify-end group px-1 relative"
                      onMouseEnter={() => setSelectedChartMonth(d.month)}
                      onMouseLeave={() => setSelectedChartMonth(null)}
                    >
                      {/* The Stacked Bar */}
                      <motion.div 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 + idx * 0.04, ease: "easeOut" }}
                        style={{ height: `${Math.max(totalHeight, 1.5)}%`, originY: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="w-8 md:w-10 rounded-t-md overflow-hidden flex flex-col justify-end shadow-sm cursor-pointer hover:shadow transition-all duration-300 bg-slate-50 relative"
                      >
                        {/* Pending Part (Top) */}
                        <div 
                          className="w-full bg-indigo-100 group-hover:bg-indigo-150 transition-colors" 
                          style={{ height: `${pendingHeight}%` }} 
                        />
                        {/* Paid Part (Bottom) */}
                        <div 
                          className="w-full bg-indigo-600 group-hover:bg-indigo-700 transition-colors" 
                          style={{ height: `${paidHeight}%` }} 
                        />
                      </motion.div>

                      {/* X-Axis Labels */}
                      <span className="absolute text-xs font-medium text-slate-500 uppercase mt-2 -bottom-6">
                        {d.month}
                      </span>

                      {/* Tooltip Popup */}
                      {isHovered && d.total > 0 && (
                        <div className="absolute bottom-full mb-3 bg-slate-900 text-white rounded-xl p-3 shadow-xl text-left z-55 w-44 pointer-events-none border border-slate-800">
                          <span className="font-bold text-xs block mb-1.5 border-b border-slate-800 pb-1">{d.month} Analytics</span>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-1">
                              <span className="text-slate-400">Received:</span>
                              <span className="font-semibold text-emerald-400">{formatCur(d.paid)}</span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="text-slate-400">Pending:</span>
                              <span className="font-semibold text-amber-400">{formatCur(d.pending)}</span>
                            </div>
                            <div className="flex justify-between gap-1 border-t border-slate-800 pt-1 mt-1 font-semibold">
                              <span>Total:</span>
                              <span>{formatCur(d.total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alerts / Tasks Sidebar Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-lg">Upcoming Payments</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              Action Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-5">Outstanding invoices listed in order of nearest deadline.</p>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[260px]">
            {dueAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <span className="font-medium text-slate-700">All caught up!</span>
                <span className="text-xs text-slate-400 mt-1">No pending invoices left.</span>
              </div>
            ) : (
              dueAlerts.map((inv, index) => {
                const daysLeft = Math.ceil(
                  (new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysLeft < 0 || inv.status === 'overdue';

                return (
                  <motion.div 
                    key={inv.id} 
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    onClick={() => onSelectInvoice(inv)}
                    className="border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition cursor-pointer flex items-center justify-between p-3.5"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm block truncate">
                          #{inv.invoiceNumber}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isOverdue 
                            ? 'bg-rose-50 text-rose-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Due'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 block mt-1 truncate">
                        {inv.clientDetails.name}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-slate-900 block text-sm">
                        {formatCur(inv.grandTotal)}
                      </span>
                      <span className={`text-[10px] block mt-1 font-semibold ${
                        isOverdue ? 'text-rose-600' : 'text-slate-400'
                       }`}>
                        {isOverdue 
                          ? `${Math.abs(daysLeft)} days late` 
                          : daysLeft === 0 
                            ? 'Due today' 
                            : `${daysLeft} days left`}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            id="btn-navigate-invoices-alert"
            onClick={() => onNavigate('invoices')}
            className="w-full mt-5 py-2.5 bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-1.5 border border-slate-100 cursor-pointer"
          >
            Manage Invoices
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </motion.div>
      </div>

      {/* Directory & Core Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Invoices Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Recent Activities
            </h2>
            <button 
              id="btn-nav-all-invoices"
              onClick={() => onNavigate('invoices')}
              className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              See All
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3.5">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No invoices found. Generate an invoice to see activity log.
              </div>
            ) : (
              invoices.slice(0, 3).map((inv, idx) => (
                <motion.div 
                  key={inv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-slate-50/50 rounded-xl transition cursor-pointer flex items-center justify-between border border-dashed border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 text-sm block">Invoice #{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Created on {inv.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm block">{formatCur(inv.grandTotal)}</span>
                    <span className={`text-[10px] uppercase font-semibold block mt-0.5 ${
                      inv.status === 'paid' 
                        ? 'text-emerald-600' 
                        : inv.status === 'sent' 
                          ? 'text-amber-600' 
                          : inv.status === 'overdue' 
                            ? 'text-rose-600' 
                            : 'text-slate-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Launch Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-slate-900 text-white rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden relative p-6 min-h-[220px]"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Tallybird Analytics</span>
            <h2 className="font-bold leading-snug mt-2 text-xl">Ask the AI Financial Assistant</h2>
            <p className="text-slate-400 text-xs mt-2.5 max-w-sm leading-relaxed">
              Analyze cash flow, write professional reminder drafts, or audit outstanding balances automatically in natural language.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 z-10 mt-6">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="btn-chat-shortcut-balances"
              onClick={() => onNavigate('chat_balances')}
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/30"
            >
              Analyze Balances
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="btn-chat-shortcut-reminder"
              onClick={() => onNavigate('chat_reminder')}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
            >
              Draft Reminders
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
