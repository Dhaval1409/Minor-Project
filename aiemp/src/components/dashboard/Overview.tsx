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
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold mt-3">{value}</div>
        <div className={cn(
          'text-xs font-medium mt-2 flex items-center gap-1',
          down ? 'text-red-500' : 'text-emerald-500'
        )}>
          {down ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {delta}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {greeting}, {business?.name || 'Your Business'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what Aria handled since you last checked.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Last 7 days ▾
          </Button>
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Aria is on duty
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Calls answered" icon={Phone} value="128" delta="18% vs last week" />
        <StatCard 
          label="Appointments booked" 
          icon={Calendar} 
          value={loadingAppts ? '…' : String(bookedCount)} 
          delta={loadingAppts ? 'Loading…' : 'Live from backend'} 
        />
        <StatCard label="Orders taken" icon={ShoppingBag} value="31" delta="4% vs last week" down />
        <StatCard label="Leads followed up" icon={Target} value="19" delta="26% vs last week" />
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Calls, Orders and Leads are placeholder data until those endpoints exist on the backend.
        Appointments and the activity feed below are live.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Conversations this week</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              View reports
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-44 pt-4 border-b px-2">
              {barDays.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all duration-300 relative group-hover:opacity-90',
                      d.val === barMax ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ height: `${(d.val / barMax) * 100}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] bg-popover text-popover-foreground px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border shadow-xl">
                      {d.val}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground pb-1">{d.day}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[220px] px-5">
              <div className="divide-y divide-border">
                {activities.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No appointment activity yet.</div>
                ) : (
                  activities.map((a, idx) => (
                    <div key={idx} className="flex gap-3 py-3 items-start">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', a.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground leading-normal break-words">{a.text}</div>
                        <div className="font-mono text-[11px] text-muted-foreground mt-1">{a.time}</div>
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