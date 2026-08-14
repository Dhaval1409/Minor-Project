'use client';

import { useState, useEffect, useMemo } from 'react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration?: string;
  active: boolean;
}

interface ServiceForm {
  name: string;
  price: string;
  duration: string;
}

function emptyForm(): ServiceForm {
  return { name: '', price: '', duration: '' };
}

type SortKey = 'name' | 'price-asc' | 'price-desc';

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServiceForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('aria_business_id') : null;

  const loadServices = async () => {
    if (!businessId) {
      setError('No business selected. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/services`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to load services.');
      }
      setServices(data.data ?? []);
    } catch (err: any) {
      console.error('❌ Error loading services:', err);
      setError(err.message || 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!form.name.trim() || !form.price.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        duration: form.duration.trim(),
      };

      const url = editingId
        ? `${API_BASE}/business/${businessId}/services/${editingId}`
        : `${API_BASE}/business/${businessId}/services`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to save service.');
      }

      setServices(data.data ?? []);
      resetForm();
    } catch (err: any) {
      console.error('❌ Error saving service:', err);
      setError(err.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: String(service.price),
      duration: service.duration || '',
    });
    setPendingDeleteId(null);
  };

  const handleDuplicate = async (service: Service) => {
    if (!businessId) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${service.name} (copy)`,
          price: service.price,
          duration: service.duration || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to duplicate service.');
      }
      setServices(data.data ?? []);
    } catch (err: any) {
      console.error('❌ Error duplicating service:', err);
      setError(err.message || 'Failed to duplicate service.');
    }
  };

  const handleToggleActive = async (service: Service) => {
    if (!businessId) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update service.');
      }
      setServices(data.data ?? []);
    } catch (err: any) {
      console.error('❌ Error toggling service:', err);
      setError(err.message || 'Failed to update service.');
    }
  };

  const confirmDelete = (id: string) => setPendingDeleteId(id);
  const cancelDelete = () => setPendingDeleteId(null);

  const handleDelete = async (id: string) => {
    if (!businessId) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/services/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete service.');
      }
      setServices(data.data ?? []);
      if (editingId === id) resetForm();
    } catch (err: any) {
      console.error('❌ Error deleting service:', err);
      setError(err.message || 'Failed to delete service.');
    } finally {
      setPendingDeleteId(null);
    }
  };

  // ◄ ADDED: pulls in service names from the legacy `servicesProvided`
  // field (set during onboarding, still used by the AI bot) that haven't
  // been added to the new Services list yet. Prices default to 0 —
  // edit each to set a real price after importing.
  const handleImportLegacy = async () => {
    if (!businessId) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/business/${businessId}/services/import-legacy`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to import services.');
      }
      setServices(data.data ?? []);
    } catch (err: any) {
      console.error('❌ Error importing legacy services:', err);
      setError(err.message || 'Failed to import services.');
    } finally {
      setImporting(false);
    }
  };

  const visibleServices = useMemo(() => {
    let list = services;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return sortKey === 'price-asc' ? a.price - b.price : b.price - a.price;
    });

    return list;
  }, [services, search, sortKey]);

  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Import banner — only shown once the list is confirmed empty */}
      {!loading && services.length === 0 && !error && (
        <div className="bg-[#d9a05b]/10 border border-[#d9a05b]/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-ink">
            You may already have services listed from onboarding. Import them here instead of retyping.
          </p>
          <button
            onClick={handleImportLegacy}
            disabled={importing}
            className="text-xs bg-ink text-paper px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
          >
            {importing ? 'Importing...' : 'Import from setup'}
          </button>
        </div>
      )}

      {/* Add / edit form */}
      <div className="bg-white/60 border border-ink/10 rounded-xl p-6">
        <h2 className="font-display font-bold text-[16px] text-ink mb-4">
          {editingId ? 'Edit Service' : 'Add a Service'}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-mono text-text-on-paper-dim mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Haircut"
              className="w-full bg-paper border border-ink/15 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-[#d9a05b]/60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-on-paper-dim mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 500"
              className="w-full bg-paper border border-ink/15 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-[#d9a05b]/60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-on-paper-dim mb-1">
              Time Taken <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g. 30 mins"
              className="w-full bg-paper border border-ink/15 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-[#d9a05b]/60"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="text-xs bg-ink text-paper px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs bg-ink/5 text-text-on-paper border border-ink/10 px-4 py-2 rounded-lg hover:bg-ink/10 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Toolbar: search, sort, summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="bg-white/60 border border-ink/10 rounded-lg px-3 py-2 text-sm text-ink w-full sm:w-56 focus:outline-none focus:border-[#d9a05b]/60"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-white/60 border border-ink/10 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-[#d9a05b]/60"
          >
            <option value="name">Sort: Name</option>
            <option value="price-asc">Sort: Price (low to high)</option>
            <option value="price-desc">Sort: Price (high to low)</option>
          </select>
        </div>

        <p className="text-xs font-mono text-text-on-paper-dim">
          {activeCount} active / {services.length} total
        </p>
      </div>

      {/* List of existing services */}
      <div className="bg-white/60 border border-ink/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-ink/10">
          <h2 className="font-display font-bold text-[16px] text-ink">
            Services Offered
          </h2>
        </div>

        {loading ? (
          <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
            Loading services...
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
            {services.length === 0
              ? 'No services added yet'
              : 'No services match your search'}
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {visibleServices.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-6 py-4 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleActive(s)}
                    title={s.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                    className={`shrink-0 w-2.5 h-2.5 rounded-full transition ${
                      s.active ? 'bg-emerald-500' : 'bg-ink/20'
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        s.active ? 'text-ink' : 'text-text-on-paper-dim line-through'
                      }`}
                    >
                      {s.name}
                    </p>
                    {s.duration && (
                      <p className="text-xs text-text-on-paper-dim font-mono mt-0.5">
                        {s.duration}
                      </p>
                    )}
                    {s.price === 0 && (
                      <p className="text-xs text-[#b5793a] font-mono mt-0.5">
                        Price not set
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-mono text-ink">
                    ₹{s.price}
                  </span>

                  {pendingDeleteId === s.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 font-medium">
                        Delete?
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-md hover:opacity-90 transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="text-xs bg-ink/5 text-text-on-paper border border-ink/10 px-2.5 py-1 rounded-md hover:bg-ink/10 transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-xs text-text-on-paper-dim hover:text-ink transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(s)}
                        className="text-xs text-text-on-paper-dim hover:text-ink transition"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => confirmDelete(s.id)}
                        className="text-xs text-text-on-paper-dim hover:text-rose-600 transition"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}