'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function Leads() {
  const leads = [
    { name: 'Vikram Joshi', enquiry: 'Bridal package', source: '☎ Missed call', followup: 'Tomorrow, 11am', status: 'Scheduled' },
    { name: 'Anita Desai', enquiry: 'Bulk stationery order', source: '💬 WhatsApp', followup: 'Today, 5pm', status: 'Scheduled' },
    { name: 'Farhan Ali', enquiry: 'Gym membership', source: '☎ Call', followup: '—', status: 'No response (3)' },
    { name: 'Pooja Nair', enquiry: 'Facial package', source: '💬 WhatsApp', followup: '—', status: 'Converted' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">Enquiries that haven&apos;t converted yet — Aria is following up.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Enquired about</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Next follow-up</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{lead.name}</TableCell>
                  <TableCell>{lead.enquiry}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{lead.source}</TableCell>
                  <TableCell>{lead.followup}</TableCell>
                  <TableCell>
                    <Badge variant={
                      lead.status === 'Converted' ? 'default' :
                      lead.status === 'Scheduled' ? 'warning' : 'destructive'
                    }>
                      {lead.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground p-4">Mock data — no /leads endpoint on the backend yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}