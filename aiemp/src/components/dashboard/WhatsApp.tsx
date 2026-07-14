'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function WhatsApp() {
  const [filter, setFilter] = useState('All');
  
  const conversations = [
    { name: 'Kiran Rao', message: '"Yes, hold it! I\'ll pick up by 6."', time: '4m ago', status: 'Resolved' },
    { name: 'John Doe', message: '"Can I get a discount on bulk order?"', time: '22m ago', status: 'Needs you' },
    { name: 'Neha Patil', message: '"Perfect, see you at 5pm."', time: '1h ago', status: 'Resolved' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">Conversations Aria handled on your business number.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
            <Input 
              className="max-w-sm" 
              placeholder="Search conversations..." 
            />
            <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
              {['All', 'Needs reply', 'Resolved'].map((f) => (
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
                <TableHead>Customer</TableHead>
                <TableHead>Last message</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conv, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{conv.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground italic">{conv.message}</TableCell>
                  <TableCell>{conv.time}</TableCell>
                  <TableCell>
                    <Badge variant={conv.status === 'Resolved' ? 'default' : 'warning'}>
                      {conv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={conv.status === 'Needs you' ? 'default' : 'outline'} size="sm">
                      Open chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">Mock data — no /whatsapp endpoint on the backend yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}