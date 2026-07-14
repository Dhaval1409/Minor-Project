'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-3 font-semibold text-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
          <span>Aria Workspace</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.key;
                return (
                  <Button
                    key={item.key}
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 text-sm font-medium',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                    onClick={() => {
                      setView(item.key);
                      setOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t mt-auto">
        <div className="rounded-lg bg-muted p-3 text-xs flex justify-between items-center">
          <span>Plan: <strong className="text-primary">Growth</strong></span>
          <span className="text-muted-foreground">₹3,999/mo</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        {/* FIX: Remove asChild and use a div wrapper */}
        <SheetTrigger asChild>
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 flex-col border-r bg-background">
        <SidebarContent />
      </aside>
    </>
  );
}