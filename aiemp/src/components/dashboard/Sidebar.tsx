'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Phone,
  MessageCircle,
  Calendar,
  ShoppingBag,
  Target,
  Sparkles,
  Settings as SettingsIcon,
  CreditCard,
  IdCard,
  Menu,
  X,
  Home,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Activity',
    items: [
      { id: 'calls', label: 'Calls', icon: Phone },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'leads', label: 'Leads', icon: Target },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'services', label: 'Services', icon: Sparkles },
      { id: 'visiting-card', label: 'Visiting Card', icon: IdCard },
      { id: 'settings', label: 'Aria Settings', icon: SettingsIcon },
      { id: 'billing', label: 'Billing', icon: CreditCard },
    ],
  },
];

export function Sidebar({ view, setView }: { view: string; setView: (view: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (id: string) => {
    setView(id);
    setMobileOpen(false);
  };

  const goHome = () => {
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-ink/10"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Dim overlay behind sidebar on mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/20 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-40 w-[254px] h-[100dvh] lg:h-screen bg-paper border-r border-ink/10 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 pt-20 lg:pt-6 space-y-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Home shortcut — goes to home page, does NOT log out */}
          <button
            onClick={goHome}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-on-paper hover:bg-ink/5 transition border border-ink/10 mb-2"
          >
            <Home size={16} />
            Back to Home
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-mono font-semibold tracking-wider text-text-on-paper-dim uppercase mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        active
                          ? 'bg-ink text-paper'
                          : 'text-text-on-paper hover:bg-ink/5'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}