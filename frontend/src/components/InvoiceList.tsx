import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  RefreshCcw, 
  FileText, 
  Printer, 
  ArrowUpDown, 
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onChangeStatus: (id: string, status: InvoiceStatus) => void;
  onCreateInvoice: () => void;
}

export default function InvoiceList({ 
  invoices, 
  onSelectInvoice, 
  onEditInvoice, 
  onDeleteInvoice, 
  onChangeStatus,
  onCreateInvoice
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | InvoiceStatus>('all');
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Advanced filtering state variables
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Extract unique client names dynamically from loaded invoices list
  const uniqueClients = useMemo(() => {
    const clientsSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.clientDetails?.name) {
        clientsSet.add(inv.clientDetails.name);
      }
    });
    return Array.from(clientsSet).sort();
  }, [invoices]);

  // Count active advanced filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedClient !== 'all') count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [startDate, endDate, selectedClient, minAmount, maxAmount]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedClient('all');
    setMinAmount('');
    setMaxAmount('');
  };

  // Toggle sorting helper
  const handleSort = (field: 'date' | 'total') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter and sort the invoices array
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Status tab filtering
    if (activeTab !== 'all') {
      result = result.filter(inv => inv.status === activeTab);
    }

    // Client filtering
    if (selectedClient !== 'all') {
      result = result.filter(inv => inv.clientDetails.name === selectedClient);
    }

    // Date range filtering
    if (startDate) {
      result = result.filter(inv => inv.date >= startDate);
    }
    if (endDate) {
      result = result.filter(inv => inv.date <= endDate);
    }

    // Amount range filtering
    if (minAmount) {
      result = result.filter(inv => inv.grandTotal >= parseFloat(minAmount));
    }
    if (maxAmount) {
      result = result.filter(inv => inv.grandTotal <= parseFloat(maxAmount));
    }

    // Keyword search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(lower) ||
        inv.clientDetails.name.toLowerCase().includes(lower) ||
        inv.clientDetails.email.toLowerCase().includes(lower) ||
        inv.items.some(it => it.name.toLowerCase().includes(lower))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a.date;
      let valB: any = b.date;

      if (sortField === 'total') {
        valA = a.grandTotal;
        valB = b.grandTotal;
      } else {
        valA = new Date(a.date).getTime() || 0;
        valB = new Date(b.date).getTime() || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, activeTab, searchTerm, sortField, sortAsc, startDate, endDate, selectedClient, minAmount, maxAmount]);

  // Format currency based on invoice spec
  const formatCur = (val: number, cur: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur === '$' ? 'USD' : cur === '₹' ? 'INR' : cur === '€' ? 'EUR' : 'USD',
      maximumFractionDigits: 0
    }).format(val).replace('USD', '$').replace('INR', '₹').replace('EUR', '€');
  };

  return (
    <div className="space-y-6 pb-12" id="invoices-list-tab">
      {/* Tab Control header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, customize, track, and manage your billing accounts easily.
          </p>
        </div>
        <button
          id="btn-list-create"
          onClick={onCreateInvoice}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-150 transition cursor-pointer self-start md:self-auto"
        >
          Create Invoice
        </button>
      </div>

      {/* Filter Tabs & Search Bar Row */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* State Tabs */}
        <div className="flex items-center overflow-x-auto gap-1 border border-slate-100 p-1 rounded-xl bg-slate-50/50 flex-wrap sm:flex-nowrap scrollbar-none">
          {(['all', 'paid', 'sent', 'overdue', 'draft'] as const).map(tab => (
            <button
              key={tab}
              id={`tab-filter-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition whitespace-nowrap cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'sent' ? 'Pending' : tab}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === tab ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/50 text-slate-400'
              }`}>
                {tab === 'all' 
                  ? invoices.length 
                  : invoices.filter(inv => inv.status === tab).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Filter Options */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <input
              type="text"
              id="search-invoices-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="Search by ID, client name, item..."
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <button
            type="button"
            id="btn-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showFilters || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div 
          id="advanced-filters-panel"
          className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-xs">Refine Invoice History</h3>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-1">
              <label htmlFor="filter-start-date" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                id="filter-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label htmlFor="filter-end-date" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                id="filter-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Client Select */}
            <div className="space-y-1">
              <label htmlFor="filter-client" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Client
              </label>
              <select
                id="filter-client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="all">All Clients ({uniqueClients.length})</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Due Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="filter-min-amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-500 placeholder:text-slate-400 font-medium"
                />
                <span className="text-slate-400 text-xs font-bold">to</span>
                <input
                  type="number"
                  id="filter-max-amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-500 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Invoices List / Grid Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              No records matched the filter or search criteria. Try creating a new invoice or clearing the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-slate-900 text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6">Invoice ID</th>
                  <th className="py-3 px-6 cursor-pointer hover:text-slate-900 transition" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">
                      Billing Date
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6 cursor-pointer hover:text-slate-900 transition" onClick={() => handleSort('total')}>
                    <span className="flex items-center gap-1">
                      Total Due
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const isMenuOpen = activeActionMenuId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-6">
                        <span 
                          onClick={() => onSelectInvoice(inv)}
                          className="font-bold text-indigo-600 hover:underline cursor-pointer block text-sm"
                        >
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          {inv.items.length} line items
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inv.date}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          Due on {inv.dueDate}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800 text-sm block">
                          {inv.clientDetails.name}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5 truncate max-w-[200px]">
                          {inv.clientDetails.email || 'No email'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {formatCur(inv.grandTotal, inv.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                          Currency: {inv.currency}
                        </span>
                      </td>

                      {/* Status pill */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                          inv.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : inv.status === 'sent' 
                              ? 'bg-amber-50 text-amber-700' 
                              : inv.status === 'overdue' 
                                ? 'bg-rose-50 text-rose-700' 
                                : 'bg-slate-50 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-500' 
                              : inv.status === 'sent' 
                                ? 'bg-amber-500' 
                                : inv.status === 'overdue' 
                                  ? 'bg-rose-500' 
                                  : 'bg-slate-400'
                          }`}></span>
                          {inv.status === 'sent' ? 'Pending' : inv.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            id={`btn-action-view-${inv.id}`}
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            title="View statement"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            id={`btn-action-edit-${inv.id}`}
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu Toggle */}
                          <div className="relative">
                            <button
                              id={`btn-menu-toggle-${inv.id}`}
                              onClick={() => setActiveActionMenuId(isMenuOpen ? null : inv.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setActiveActionMenuId(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50 p-1 border border-slate-100 text-left">
                                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                    Change Status
                                  </div>
                                  
                                  <button
                                    id={`menu-mark-paid-${inv.id}`}
                                    onClick={() => {
                                      onChangeStatus(inv.id, 'paid');
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    Mark as Paid
                                  </button>

                                  <button
                                    id={`menu-mark-pending-${inv.id}`}
                                    onClick={() => {
                                      onChangeStatus(inv.id, 'sent');
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <RefreshCcw className="w-3.5 h-3.5 text-amber-500" />
                                    Mark as Pending
                                  </button>

                                  <button
                                    id={`menu-mark-overdue-${inv.id}`}
                                    onClick={() => {
                                      onChangeStatus(inv.id, 'overdue');
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                    Mark as Overdue
                                  </button>

                                  <div className="h-[1px] bg-slate-100 my-1"></div>

                                  <button
                                    id={`menu-print-${inv.id}`}
                                    onClick={() => {
                                      onSelectInvoice(inv);
                                      setTimeout(() => window.print(), 300);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                                    Print Statement
                                  </button>

                                  <button
                                    id={`menu-delete-${inv.id}`}
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete invoice #${inv.invoiceNumber}?`)) {
                                        onDeleteInvoice(inv.id);
                                      }
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Record
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
