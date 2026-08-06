
// 'use client';
// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Appointment } from '@/types';
// import { statusBadge } from '@/utils/helpers';

// interface AppointmentsProps {
//   appointments: Appointment[];
//   loadingAppts: boolean;
//   apptError: string;
//   onAdd: (form: any) => Promise<void>;
//   onCancel: (id: string) => Promise<void>;
//   onComplete: (id: string) => Promise<void>;
//   loadAppointments: () => Promise<void>;
// }

// export function Appointments({ appointments, loadingAppts, apptError, onAdd, onCancel, onComplete }: AppointmentsProps) {
//   const [open, setOpen] = useState(false);
//   const [form, setForm] = useState({ name: '', phone: '', service: '', date: '', time: '' });
//   const [submitting, setSubmitting] = useState(false);
//   const [completingId, setCompletingId] = useState<string | null>(null);

//   const handleSubmit = async () => {
//     setSubmitting(true);
//     await onAdd(form);
//     setSubmitting(false);
//     setOpen(false);
//     setForm({ name: '', phone: '', service: '', date: '', time: '' });
//   };

//   const handleComplete = async (id: string) => {
//     setCompletingId(id);
//     try {
//       await onComplete(id);
//     } finally {
//       setCompletingId(null);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
//           <p className="text-sm text-muted-foreground mt-1">Live from http://localhost:5000/appointments.</p>
//         </div>
//         <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger render={<Button>+ Add manually</Button>} />
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>New Appointment</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label>Customer name</Label>
//                 <Input
//                   placeholder="Customer name"
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label>Phone number</Label>
//                 <Input
//                   placeholder="Phone number"
//                   value={form.phone}
//                   onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label>Service</Label>
//                 <Input
//                   placeholder="Service (e.g. Haircut)"
//                   value={form.service}
//                   onChange={(e) => setForm({ ...form, service: e.target.value })}
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label>Date</Label>
//                   <Input
//                     type="date"
//                     value={form.date}
//                     onChange={(e) => setForm({ ...form, date: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Time</Label>
//                   <Input
//                     type="time"
//                     value={form.time}
//                     onChange={(e) => setForm({ ...form, time: e.target.value })}
//                   />
//                 </div>
//               </div>
//               <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
//                 {submitting ? 'Saving…' : 'Save appointment'}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {apptError && (
//         <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
//           {apptError}
//         </div>
//       )}

//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Time</TableHead>
//                 <TableHead>Customer</TableHead>
//                 <TableHead>Service</TableHead>
//                 <TableHead>Phone</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {loadingAppts ? (
//                 <TableRow>
//                   <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
//                     Loading appointments…
//                   </TableCell>
//                 </TableRow>
//               ) : appointments.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
//                     No appointments yet. They&apos;ll show up here as Aria books them.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 appointments.map((a) => {
//                   const isActive = a.status !== 'cancelled' && a.status !== 'completed';
//                   return (
//                     <TableRow key={a.id}>
//                       <TableCell className="font-medium">{a.date} · {a.time}</TableCell>
//                       <TableCell>{a.name}</TableCell>
//                       <TableCell>{a.service}</TableCell>
//                       <TableCell className="text-muted-foreground">{a.phone}</TableCell>
//                       <TableCell>{statusBadge(a.status)}</TableCell>
//                       <TableCell className="text-right space-x-2">
//                         {isActive && (
//                           <>
//                             <Button
//                               size="sm"
//                               onClick={() => handleComplete(a.id)}
//                               disabled={completingId === a.id}
//                             >
//                               {completingId === a.id ? 'Completing…' : 'Complete'}
//                             </Button>
//                             <Button variant="outline" size="sm" onClick={() => onCancel(a.id)}>
//                               Cancel
//                             </Button>
//                           </>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
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

// Fixed slot size, mirrors SLOT_MINUTES in the backend's appointmentModel.ts.
// Kept in sync manually since this is a separate frontend/backend codebase.
const SLOT_MINUTES = 30;

interface AppointmentsProps {
  appointments: Appointment[];
  loadingAppts: boolean;
  apptError: string;
  onAdd: (form: any) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  loadAppointments: () => Promise<void>;
}

export function Appointments({ appointments, loadingAppts, apptError, onAdd, onCancel, onComplete }: AppointmentsProps) {
  const [open, setOpen] = useState(false);
  // ◄ CHANGED: `service: ''` -> `services: []`, so a booking can hold multiple
  // services at once (each one adds a 30-min slot to the appointment).
  const [form, setForm] = useState({ name: '', phone: '', services: [] as string[], date: '', time: '' });
  const [serviceDraft, setServiceDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const durationMinutes = form.services.length * SLOT_MINUTES;

  const addService = () => {
    const trimmed = serviceDraft.trim();
    if (!trimmed) return;
    // Avoid adding the same service twice by accident
    if (form.services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setServiceDraft('');
      return;
    }
    setForm({ ...form, services: [...form.services, trimmed] });
    setServiceDraft('');
  };

  const removeService = (index: number) => {
    setForm({ ...form, services: form.services.filter((_, i) => i !== index) });
  };

  const handleServiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter or comma both commit the current draft as a service chip
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addService();
    }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', services: [], date: '', time: '' });
    setServiceDraft('');
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');

    if (form.services.length === 0) {
      setFormError('Add at least one service.');
      return;
    }
    if (!form.name || !form.phone || !form.date || !form.time) {
      setFormError('Fill in name, phone, date, and time.');
      return;
    }

    setSubmitting(true);
    try {
      // `services` (array) is what the backend now expects — it computes
      // durationMinutes = 30 * services.length and checks for overlaps against it.
      await onAdd(form);
      setOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await onComplete(id);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Live from http://localhost:5000/appointments.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
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
                <Label>Services</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Haircut — press Enter to add"
                    value={serviceDraft}
                    onChange={(e) => setServiceDraft(e.target.value)}
                    onKeyDown={handleServiceKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={addService}>
                    Add
                  </Button>
                </div>

                {form.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.services.map((s, i) => (
                      <Badge key={`${s}-${i}`} variant="secondary" className="flex items-center gap-1.5 pr-1.5">
                        {s}
                        <button
                          type="button"
                          onClick={() => removeService(i)}
                          className="ml-0.5 rounded-full hover:bg-black/10 w-4 h-4 flex items-center justify-center text-xs leading-none"
                          aria-label={`Remove ${s}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {form.services.length === 0
                    ? `Each service takes a fixed ${SLOT_MINUTES}-min slot.`
                    : `${form.services.length} service${form.services.length > 1 ? 's' : ''} · ${durationMinutes} min total`}
                </p>
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

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? 'Saving…'
                  : durationMinutes > 0
                    ? `Save appointment (${durationMinutes} min)`
                    : 'Save appointment'}
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
                appointments.map((a) => {
                  const isActive = a.status !== 'cancelled' && a.status !== 'completed';
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.date} · {a.time}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.service}</TableCell>
                      <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {isActive && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleComplete(a.id)}
                              disabled={completingId === a.id}
                            >
                              {completingId === a.id ? 'Completing…' : 'Complete'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onCancel(a.id)}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}