'use client';

import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'aria_services';

interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
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

// Shown the very first time (empty storage) so it's obvious how Edit,
// Delete, Duplicate and the active/inactive toggle work. Feel free to
// delete these once you've added your real services.
const DEMO_SERVICES: Service[] = [
  { id: 'demo-1', name: 'Haircut', price: '300', duration: '30 mins', active: true },
  { id: 'demo-2', name: 'Beard Trim', price: '150', duration: '15 mins', active: true },
  { id: 'demo-3', name: 'Hair Color', price: '1200', duration: '1.5 hours', active: false },
];

type SortKey = 'name' | 'price-asc' | 'price-desc';

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServiceForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Load saved services once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setServices(parsed.length > 0 ? parsed : DEMO_SERVICES);
      } else {
        // Nothing saved yet — show demo data instead of a blank state
        setServices(DEMO_SERVICES);
      }
    } catch (e) {
      console.error('Failed to load services', e);
      setServices(DEMO_SERVICES);
    }
    setLoaded(true);
  }, []);

  // Persist any change, but only after the initial load has happened
  // (otherwise the first render would wipe out saved data with [])
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services', e);
    }
  }, [services, loaded]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) return;

    if (editingId) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...form } : s))
      );
    } else {
      setServices((prev) => [
        ...prev,
        { id: Date.now().toString(), ...form, active: true },
      ]);
    }
    resetForm();
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: service.price,
      duration: service.duration || '',
    });
    setPendingDeleteId(null);
  };

  const handleDuplicate = (service: Service) => {
    setServices((prev) => [
      ...prev,
      {
        ...service,
        id: Date.now().toString(),
        name: `${service.name} (copy)`,
      },
    ]);
  };

  const handleToggleActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const confirmDelete = (id: string) => setPendingDeleteId(id);
  const cancelDelete = () => setPendingDeleteId(null);

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
    setPendingDeleteId(null);
  };

  const visibleServices = useMemo(() => {
    let list = services;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      return sortKey === 'price-asc' ? priceA - priceB : priceB - priceA;
    });

    return list;
  }, [services, search, sortKey]);

  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
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
              className="text-xs bg-ink text-paper px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
            >
              {editingId ? 'Save Changes' : 'Add Service'}
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

        {visibleServices.length === 0 ? (
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
                    onClick={() => handleToggleActive(s.id)}
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