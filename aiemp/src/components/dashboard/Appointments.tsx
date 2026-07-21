'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Appointment } from '@/types';
import { statusBadge } from '@/utils/helpers';

interface AppointmentsProps {
  appointments: Appointment[];
  loadingAppts: boolean;
  apptError: string;
  onAdd: (form: any) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  loadAppointments: () => Promise<void>;
}

export function Appointments({ appointments, loadingAppts, apptError, onAdd, onCancel }: AppointmentsProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', service: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onAdd(form);
    setSubmitting(false);
    setOpen(false);
    setForm({ name: '', phone: '', service: '', date: '', time: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Live from http://localhost:5000/appointments.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Add manually</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer name</Label>
                <Input
                  placeholder="Customer name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service</Label>
                <Input
                  placeholder="Service (e.g. Haircut)"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save appointment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apptError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {apptError}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingAppts ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Loading appointments…
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No appointments yet. They&apos;ll show up here as Aria books them.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.date} · {a.time}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.service}</TableCell>
                    <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell className="text-right">
                      {a.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => onCancel(a.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}