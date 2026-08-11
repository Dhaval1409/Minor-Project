// 'use client';
// import { Card, CardContent } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';

// export function Leads() {
//   const leads = [
//     { name: 'Vikram Joshi', enquiry: 'Bridal package', source: '☎ Missed call', followup: 'Tomorrow, 11am', status: 'Scheduled' },
//     { name: 'Anita Desai', enquiry: 'Bulk stationery order', source: '💬 WhatsApp', followup: 'Today, 5pm', status: 'Scheduled' },
//     { name: 'Farhan Ali', enquiry: 'Gym membership', source: '☎ Call', followup: '—', status: 'No response (3)' },
//     { name: 'Pooja Nair', enquiry: 'Facial package', source: '💬 WhatsApp', followup: '—', status: 'Converted' },
//   ];

//   return (
//     <div className="space-y-6">
//       <div className="pb-6 border-b">
//         <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
//         <p className="text-sm text-muted-foreground mt-1">Enquiries that haven&apos;t converted yet — Aria is following up.</p>
//       </div>

//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Enquired about</TableHead>
//                 <TableHead>Source</TableHead>
//                 <TableHead>Next follow-up</TableHead>
//                 <TableHead>Status</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {leads.map((lead, i) => (
//                 <TableRow key={i}>
//                   <TableCell className="font-semibold">{lead.name}</TableCell>
//                   <TableCell>{lead.enquiry}</TableCell>
//                   <TableCell className="text-xs text-muted-foreground">{lead.source}</TableCell>
//                   <TableCell>{lead.followup}</TableCell>
//                   <TableCell>
//                     <Badge variant={
//                       lead.status === 'Converted' ? 'default' :
//                       lead.status === 'Scheduled' ? 'secondary' : 'destructive'
//                     }>
//                       {lead.status}
//                     </Badge>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//           <p className="text-xs text-muted-foreground p-4">Mock data — no /leads endpoint on the backend yet.</p>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  name: string;
  enquiry: string;
  source: string;
  followUpAt?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  score: number;
  scoreLabel: 'Hot' | 'Warm' | 'Cold';
  messageCount: number;
}

const SOURCE_LABEL: Record<string, string> = {
  telegram_call: '☎ Missed call',
  telegram_chat: '💬 Chat',
  whatsapp: '💬 WhatsApp',
  manual: '✍️ Manual',
};

const STATUS_LABEL: Record<Lead['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  converted: 'Converted',
  lost: 'No response',
};

function statusVariant(status: Lead['status']) {
  if (status === 'converted') return 'default' as const;
  if (status === 'scheduled') return 'secondary' as const;
  if (status === 'lost') return 'destructive' as const;
  return 'outline' as const;
}

function scoreVariant(label: Lead['scoreLabel']) {
  if (label === 'Hot') return 'destructive' as const;
  if (label === 'Warm') return 'secondary' as const;
  return 'outline' as const;
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      setError('');
      try {
        const businessId = localStorage.getItem('aria_business_id');
        const url = businessId
          ? `${API_BASE}/leads?businessId=${businessId}`
          : `${API_BASE}/leads`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(data.message || 'Failed to load leads.');
        }

        setLeads(data.data ?? []);
      } catch (err: any) {
        console.error('❌ Error loading leads:', err);
        setError(err.message || 'Could not reach the backend.');
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, [API_BASE]);

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enquiries that haven&apos;t converted yet — ranked by Aria&apos;s lead score, hottest first.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground p-4">Loading leads…</p>
          ) : error ? (
            <p className="text-sm text-destructive p-4">{error}</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No leads yet — they&apos;ll show up here as Aria chats with customers.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enquired about</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Next follow-up</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-semibold">{lead.name}</TableCell>
                    <TableCell>{lead.enquiry}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {SOURCE_LABEL[lead.source] || lead.source}
                    </TableCell>
                    <TableCell>{lead.followUpAt || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={scoreVariant(lead.scoreLabel)}>
                          {lead.scoreLabel} · {lead.score}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(lead.status)}>
                        {lead.status === 'lost' && lead.messageCount <= 1
                          ? STATUS_LABEL.lost
                          : STATUS_LABEL[lead.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground p-4">
            Score = recency + engagement + how close the enquiry got to a full booking, recomputed live on every load.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}