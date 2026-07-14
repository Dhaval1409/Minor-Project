'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Calls() {
  const [filter, setFilter] = useState('All');
  
  const calls = [
    { name: 'Priya Nair', phone: '+91 98xxxxx210', time: 'Today, 6:04pm', duration: '1m 42s', lang: 'English', outcome: 'Booked' },
    { name: 'Rahul Sharma', phone: '+91 98xxxxx543', time: 'Today, 4:20pm', duration: '0m 58s', lang: 'Hindi', outcome: 'Booked' },
    { name: 'Unknown caller', phone: '+91 97xxxxx881', time: 'Today, 2:11pm', duration: '0m 12s', lang: '—', outcome: 'Missed' },
    { name: 'Sneha Gupta', phone: '+91 98xxxxx004', time: 'Today, 11:47am', duration: '2m 30s', lang: 'Marathi', outcome: 'Escalated' },
    { name: 'Arjun Mehta', phone: '+91 98xxxxx712', time: 'Yesterday, 5:32pm', duration: '1m 05s', lang: 'English', outcome: 'Info only' },
  ];

  const getBadgeVariant = (outcome: string) => {
    switch(outcome) {
      case 'Booked': return 'default';
      case 'Missed': return 'destructive';
      case 'Escalated': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
        <p className="text-sm text-muted-foreground mt-1">Every call Aria answered, with outcome and transcript.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
            <Input 
              className="max-w-sm" 
              placeholder="Search by caller name or number..." 
            />
            <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
              {['All', 'Booked', 'Missed', 'Escalated'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="text-xs"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caller</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{call.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{call.name}</div>
                        <div className="text-xs text-muted-foreground">{call.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{call.time}</TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell>{call.lang}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(call.outcome)}>{call.outcome}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      {call.outcome === 'Missed' ? 'Call back' : 'Transcript'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">Mock data — no /calls endpoint on the backend yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}