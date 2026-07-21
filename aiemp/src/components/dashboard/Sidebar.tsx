'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Menu, LayoutDashboard, FileText, Phone, MessageCircle, Calendar, ShoppingBag, Target, Settings, CreditCard } from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { key: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'reports', icon: FileText, label: 'Reports' },
    ],
  },
  {
    label: 'Activity',
    items: [
      { key: 'calls', icon: Phone, label: 'Calls' },
      { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
      { key: 'appointments', icon: Calendar, label: 'Appointments' },
      { key: 'orders', icon: ShoppingBag, label: 'Orders' },
      { key: 'leads', icon: Target, label: 'Leads' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { key: 'settings', icon: Settings, label: 'Aria Settings' },
      { key: 'billing', icon: CreditCard, label: 'Billing' },
    ],
  },
];

interface SidebarProps {
  view: string;
  setView: (view: string) => void;
}

export function Sidebar({ view, setView }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-paper-dim text-text-on-paper select-none">
      {/* ---------- BRAND LOGO ---------- */}
      <div className="p-6 border-b border-ink/10 flex items-center h-[72px]">
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-[20px] tracking-tight text-ink">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald shadow-[0_0_0_4px_rgba(31,138,112,0.15)] animate-pulse" />
          <span>Aria Workspace</span>
        </Link>
      </div>

      {/* ---------- NAVIGATION SCROLL ---------- */}
      <ScrollArea className="flex-1 px-4 py-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <h3 className="font-mono text-[11px] font-semibold text-text-on-paper-dim uppercase tracking-wider px-3 mb-2.5">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.key;
                return (
                  <Button
                    key={item.key}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-[14px] font-medium rounded-[10px] transition-all duration-200 py-2.5 px-3 h-auto',
                      isActive 
                        ? 'bg-ink text-text-on-ink hover:bg-ink hover:text-text-on-ink shadow-sm font-semibold' 
                        : 'text-text-on-paper-dim hover:text-ink hover:bg-ink/5'
                    )}
                    onClick={() => {
                      setView(item.key);
                      setOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* ---------- SUBSCRIPTION STATE COUNTER ---------- */}
      <div className="p-4 border-t border-ink/10 mt-auto">
        <div className="rounded-[12px] bg-card border border-ink/10 p-3.5 text-[12.5px] flex justify-between items-center shadow-[0_8px_16px_-6px_rgba(18,23,43,0.04)]">
          <span className="text-text-on-paper font-medium">
            Plan: <strong className="font-bold text-amber">Growth</strong>
          </span>
          <span className="font-mono text-text-on-paper-dim text-[11.5px]">
            ₹3,999/mo
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Floating Drawer Navigation Container */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 border border-ink/10 bg-paper text-ink hover:bg-ink/5 shadow-sm rounded-[10px]"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-paper-dim border-r border-ink/10">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation Container */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 flex-col border-r border-ink/10 bg-paper-dim">
        <SidebarContent />
      </aside>
    </>
  );
}