// src/utils/helpers.tsx
import { Appointment, ActivityItem } from '@/types';
import { Badge } from '@/components/ui/badge';

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function greetingForHour(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function buildActivityFeed(appointments: Appointment[]): ActivityItem[] {
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return sorted.slice(0, 6).map((a) => {
    let color = 'bg-slate-500';
    let text: React.ReactNode;

    switch (a.status) {
      case 'confirmed':
        color = 'bg-emerald-500';
        text = (
          <>
            <span className="font-semibold">{a.name}</span> confirmed for {a.service} at {a.time}
          </>
        );
        break;
      case 'completed':
        color = 'bg-emerald-500';
        text = (
          <>
            <span className="font-semibold">{a.name}</span>&apos;s {a.service} appointment is complete
          </>
        );
        break;
      case 'cancelled':
        color = 'bg-red-500';
        text = (
          <>
            <span className="font-semibold">{a.name}</span> cancelled their {a.service} booking
          </>
        );
        break;
      case 'rescheduled':
        color = 'bg-amber-500';
        text = (
          <>
            <span className="font-semibold">{a.name}</span> rescheduled to {a.date} · {a.time}
          </>
        );
        break;
      default:
        color = 'bg-amber-500';
        text = (
          <>
            <span className="font-semibold">{a.name}</span> booked {a.service}, awaiting confirmation
          </>
        );
        break;
    }

    return { color, text, time: timeAgo(a.updatedAt || a.createdAt) };
  });
}

// FIXED: Returns JSX instead of an object
export function statusBadge(status: string) {
  const variants: Record<string, { variant: 'default' | 'destructive' | 'warning' | 'secondary', label: string }> = {
    confirmed: { variant: 'default', label: 'Confirmed' },
    completed: { variant: 'default', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    rescheduled: { variant: 'warning', label: 'Rescheduled' },
    pending: { variant: 'warning', label: 'Pending' },
  };
  
  const config = variants[status] || variants.pending;
  
  // Return JSX directly
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}