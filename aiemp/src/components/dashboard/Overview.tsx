'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Phone, ShoppingBag, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment, Business } from '../types';
import { buildActivityFeed } from '@/utils/helpers';

interface OverviewProps {
  appointments: Appointment[];
  loadingAppts: boolean;
  business: Business | null;
  greeting: string;
}

export function Overview({ appointments, loadingAppts, business, greeting }: OverviewProps) {
  const activities = buildActivityFeed(appointments);
  const bookedCount = appointments.filter((a) => a.status !== 'cancelled').length;
  
  const barDays = [
    { day: 'Mon', val: 42 },
    { day: 'Tue', val: 55 },
    { day: 'Wed', val: 38 },
    { day: 'Thu', val: 61 },
    { day: 'Fri', val: 70 },
    { day: 'Sat', val: 48 },
    { day: 'Sun', val: 66 },
  ];
  const barMax = Math.max(...barDays.map((d) => d.val));

  const StatCard = ({ label, icon: Icon, value, delta, down }: any) => (
    <Card className="bg-card border border-ink/10 rounded-[18px] shadow-[0_12px_24px_-12px_rgba(18,23,43,0.05)] hover:border-ink/30 transition-colors">
      <CardContent className="p-[26px]">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[11px] font-semibold text-text-on-paper-dim uppercase tracking-wider">
            {label}
          </span>
          <div className="p-2 rounded-[10px] bg-paper-dim">
            <Icon className="h-4 w-4 text-text-on-paper-dim" />
          </div>
        </div>
        <div className="font-display text-[32px] font-bold text-ink mt-3">
          {value}
        </div>
        <div className={cn(
          'text-[13px] font-medium mt-2 flex items-center gap-1.5',
          down ? 'text-red-500' : 'text-emerald'
        )}>
          {down ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          {delta}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 text-text-on-paper">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-ink/10">
        <div>
          <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-tight text-ink">
            {greeting}, {business?.name || 'Your Business'}
          </h1>
          <p className="text-[14.5px] text-text-on-paper-dim mt-1.5">
            Here&apos;s what Aria handled since you last checked.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="font-mono text-[12px] border-ink/10 text-ink hover:bg-ink/5">
            Last 7 days ▾
          </Button>
          <Badge variant="default" className="bg-emerald/12 text-emerald border-none gap-2 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider hover:bg-emerald/20 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            Aria is on duty
          </Badge>
        </div>
      </div>

      {/* ---------- STATS GRID ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Calls answered" icon={Phone} value="128" delta="18% vs last week" />
        <StatCard 
          label="Appointments" 
          icon={Calendar} 
          value={loadingAppts ? '…' : String(bookedCount)} 
          delta={loadingAppts ? 'Loading…' : 'Live from backend'} 
        />
        <StatCard label="Orders taken" icon={ShoppingBag} value="31" delta="4% vs last week" down />
        <StatCard label="Leads followed" icon={Target} value="19" delta="26% vs last week" />
      </div>

      <p className="font-mono text-[11.5px] text-text-on-paper-dim -mt-3 uppercase tracking-wide">
        * Calls, Orders and Leads are placeholder data until endpoints are live.
      </p>

      {/* ---------- CHARTS & ACTIVITY ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <Card className="lg:col-span-2 bg-card border border-ink/10 rounded-[18px]">
          <CardHeader className="flex flex-row items-center justify-between p-[26px] pb-0">
            <CardTitle className="font-display text-[18px] text-ink font-bold">Conversations this week</CardTitle>
            <Button variant="ghost" size="sm" className="text-[13px] font-semibold text-ink hover:bg-ink/5">
              View reports
            </Button>
          </CardHeader>
          <CardContent className="p-[26px]">
            <div className="flex items-end gap-3 h-48 pt-4 border-b border-ink/10 px-2">
              {barDays.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div
                    className={cn(
                      'w-full rounded-t-[6px] transition-all duration-300 relative group-hover:opacity-90',
                      d.val === barMax ? 'bg-amber' : 'bg-paper-dim border border-ink/5'
                    )}
                    style={{ height: `${(d.val / barMax) * 100}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[10.5px] bg-ink text-text-on-ink px-2 py-1 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_12px_24px_-12px_rgba(18,23,43,0.3)] pointer-events-none">
                      {d.val}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-text-on-paper-dim pb-2">
                    {d.day}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="bg-card border border-ink/10 rounded-[18px] flex flex-col">
          <CardHeader className="p-[26px] pb-4 border-b border-dashed border-ink/10">
            <CardTitle className="font-display text-[18px] text-ink font-bold">Live activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-[250px] px-[26px]">
              <div className="divide-y divide-ink/10">
                {activities.length === 0 ? (
                  <div className="text-[13.5px] text-text-on-paper-dim py-8 text-center font-mono">
                    No appointment activity yet.
                  </div>
                ) : (
                  activities.map((a, idx) => (
                    <div key={idx} className="flex gap-3.5 py-4 items-start">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', a.color || 'bg-emerald')} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] text-ink leading-snug break-words">
                          {a.text}
                        </div>
                        <div className="font-mono text-[11px] text-text-on-paper-dim mt-1.5 uppercase tracking-wide">
                          {a.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}