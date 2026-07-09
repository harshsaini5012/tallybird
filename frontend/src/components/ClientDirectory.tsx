import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { Users, Plus, Mail, Phone, MapPin, User, Save, Trash2, X, Search } from 'lucide-react';

interface ClientDirectoryProps {
  clients: ClientProfile[];
  onAddClient: (client: Omit<ClientProfile, 'id' | 'userId'>) => Promise<void>;
}

export default function ClientDirectory({ clients, onAddClient }: ClientDirectoryProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Client Name is required.');
    
    setSubmitting(true);
    try {
      await onAddClient({ name, email, phone, address });
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12" id="clients-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Client Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain accounts profiles to easily pre-fill invoices and coordinate billings.
          </p>
        </div>

        <button
          id="btn-add-client-toggle"
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-150 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client Profile
        </button>
      </div>

      {/* Add Client Dialog Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                New Client Registration
              </span>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Client Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-semibold text-slate-900"
                    placeholder="e.g. Acme Corp / Jane Doe"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Billing Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-medium text-slate-900"
                    placeholder="e.g. billing@acme.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Billing Mobile / Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-medium text-slate-900"
                    placeholder="e.g. +1 (555) 012-3456"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Corporate Physical Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white font-medium text-slate-900"
                    placeholder="e.g. 100 Main St, Suite 4B, Seattle"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Content and Search */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs bg-white text-slate-900 placeholder:text-slate-400 font-medium"
            placeholder="Search directory by name, email..."
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400 inline-block">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Client Profiles Registered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Add corporate or personal client contacts to easily assign billings with one-click selection dropdowns.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const initials = client.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'C';

              return (
                <div 
                  key={client.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md hover:border-slate-200/80 transition flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Circle Avatar badge */}
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold rounded-xl flex items-center justify-center flex-shrink-0 text-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-sm block truncate">{client.name}</span>
                      <span className="text-[10px] font-bold text-indigo-600 block mt-0.5 uppercase tracking-wide">Client ID: {client.id.substring(7, 12)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3 text-xs text-slate-500 font-semibold leading-relaxed">
                    {client.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{client.email}</span>
                      </p>
                    )}
                    {client.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </p>
                    )}
                    {client.address && (
                      <p className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{client.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
