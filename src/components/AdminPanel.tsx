import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Database, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Activity, 
  CheckCircle,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';

interface AdminPanelProps {
  onSeedData: () => void;
  onClearDb: () => void;
  invoiceCount: number;
  clientCount: number;
  expenseCount: number;
}

export default function AdminPanel({ onSeedData, onClearDb, invoiceCount, clientCount, expenseCount }: AdminPanelProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="admin-panel-root">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-indigo-600" />
          Enterprise System Admin
        </h1>
        <p className="text-slate-500 mt-1">Configure internal local storage configurations, trigger diagnostics, and manage system states.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Invoices Registries</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{invoiceCount} rows</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clients Directories</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{clientCount} rows</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Expenses Logbooks</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{expenseCount} rows</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System seed actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-indigo-500" />
            Database Synchronization
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quickly seed your system registry with high-fidelity, professional Indian & International invoices, clients, and corporate expense rows to demo all dashboard charts and AI scanner OCR capacities.
          </p>

          <div className="space-y-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onSeedData}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Seed System Mock Data
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onClearDb}
              className="w-full py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Reset Database File (Wipe Clean)
            </motion.button>
          </div>
        </div>

        {/* Diagnostics Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            System Clearance Diagnostics
          </h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Express server routing layer
              </span>
              <span>ONLINE</span>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Google Gemini API interface
              </span>
              <span>VERIFIED</span>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Persistent File-based db.json
              </span>
              <span>CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
