// 'use client';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';

// const navGroups = [
//   {
//     label: 'Overview',
//     items: [
//       { key: 'overview', icon: '◧', label: 'Dashboard' },
//       { key: 'reports', icon: '▤', label: 'Reports' },
//     ],
//   },
//   {
//     label: 'Activity',
//     items: [
//       { key: 'calls', icon: '☎', label: 'Calls' },
//       { key: 'whatsapp', icon: '💬', label: 'WhatsApp' },
//       { key: 'appointments', icon: '🗓', label: 'Appointments' },
//       { key: 'orders', icon: '🧾', label: 'Orders' },
//       { key: 'leads', icon: '🎯', label: 'Leads' },
//     ],
//   },
//   {
//     label: 'Manage',
//     items: [
//       { key: 'settings', icon: '⚙', label: 'Aria Settings' },
//       { key: 'billing', icon: '💳', label: 'Billing' },
//     ],
//   },
// ];

// const barDays = [
//   { day: 'Mon', val: 42 },
//   { day: 'Tue', val: 55 },
//   { day: 'Wed', val: 38 },
//   { day: 'Thu', val: 61 },
//   { day: 'Fri', val: 70 },
//   { day: 'Sat', val: 48 },
//   { day: 'Sun', val: 66 },
// ];
// const barMax = Math.max(...barDays.map((d) => d.val));

// // NOTE: Calls / WhatsApp / Orders / Leads / Billing have no backend endpoints
// // yet (api_test.http + appointmentRoutes.ts only expose appointments and
// // business registration), so this activity feed and those tabs stay mock
// // until those routes exist on your Express server.
// const activities = [
//   { color: 'bg-emerald-500', text: <><span className="font-semibold text-slate-100">Priya Nair</span> booked hair spa for 6:15pm</>, time: '2m ago' },
//   { color: 'bg-amber-500', text: <>Order <span className="font-semibold text-slate-100">#1042</span> confirmed with Neha</>, time: '11m ago' },
//   { color: 'bg-emerald-500', text: <span className="text-slate-300">Reminder sent for tomorrow&apos;s 5 appointments</span>, time: '28m ago' },
//   { color: 'bg-red-500', text: <>Missed call from <span className="font-semibold text-slate-100">+91 97xxxxx881</span></>, time: '1h ago' },
//   { color: 'bg-emerald-500', text: <><span className="font-semibold text-slate-100">Vikram Joshi</span> follow-up scheduled</>, time: '2h ago' },
// ];

// // ---------------------------------------------------------------------------
// // Types matching src/models/appointmentModel.ts on your Express backend
// // ---------------------------------------------------------------------------
// type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled';

// interface Appointment {
//   id: string;
//   businessId?: string;
//   userId: string;
//   name: string;
//   phone: string;
//   businessType: string;
//   service: string;
//   date: string;
//   time: string;
//   status: AppointmentStatus;
//   createdAt: string;
//   updatedAt: string;
// }

// function Badge({ variant, children }: { variant: 'ok' | 'warn' | 'bad' | 'muted'; children: React.ReactNode }) {
//   const styles = {
//     ok: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
//     warn: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
//     bad: 'bg-red-500/10 text-red-400 border border-red-500/20',
//     muted: 'bg-slate-800 text-slate-400 border border-slate-700',
//   };
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${styles[variant]}`}>
//       {children}
//     </span>
//   );
// }

// function statusBadge(status: AppointmentStatus) {
//   switch (status) {
//     case 'confirmed':
//     case 'completed':
//       return <Badge variant="ok">{status === 'completed' ? 'Completed' : 'Confirmed'}</Badge>;
//     case 'cancelled':
//       return <Badge variant="bad">Cancelled</Badge>;
//     case 'rescheduled':
//       return <Badge variant="warn">Rescheduled</Badge>;
//     case 'pending':
//     default:
//       return <Badge variant="warn">Pending</Badge>;
//   }
// }

// function StatCard({ label, icon, value, delta, down }: { label: string; icon: string; value: string; delta: string; down?: boolean }) {
//   return (
//     <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors">
//       <div className="text-xs font-medium text-slate-400 flex justify-between items-center uppercase tracking-wider">
//         {label}
//         <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base text-slate-300 border border-slate-700">{icon}</span>
//       </div>
//       <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-3">{value}</div>
//       <div className={`text-xs font-mono mt-2 flex items-center gap-1 ${down ? 'text-red-400' : 'text-emerald-400'}`}>
//         {delta}
//       </div>
//     </div>
//   );
// }

// function CardHead({ title, link }: { title: string; link?: string }) {
//   return (
//     <div className="flex justify-between items-center mb-6">
//       <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
//       {link && <span className="text-xs text-amber-400 font-medium hover:underline cursor-pointer transition-all">{link}</span>}
//     </div>
//   );
// }

// function Th({ children }: { children: React.ReactNode }) {
//   return <th className="text-left font-mono text-[11px] uppercase tracking-wider text-slate-400 pb-3 px-4 border-b border-slate-800 font-semibold bg-slate-900/50">{children}</th>;
// }
// function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
//   return <td className={`py-3.5 px-4 text-sm text-slate-300 border-b border-slate-800/60 align-middle ${className}`}>{children}</td>;
// }

// function Avatar({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 shadow-sm">
//       {children}
//     </div>
//   );
// }

// function BtnSm({ children, primary = false, onClick, disabled }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; disabled?: boolean }) {
//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={`text-xs font-medium px-3.5 py-2 rounded-lg cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
//         primary
//           ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
//           : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function ReportRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
//   return (
//     <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-700 transition-colors">
//       <div className="flex gap-4 items-center">
//         <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">{icon}</div>
//         <div>
//           <div className="font-medium text-sm text-white">{title}</div>
//           <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
//         </div>
//       </div>
//       <BtnSm>Download PDF</BtnSm>
//     </div>
//   );
// }

// function SettingsRow({ label, sub, control }: { label: string; sub: string; control: React.ReactNode }) {
//   return (
//     <div className="flex justify-between items-center py-4 border-b border-slate-800 last:border-b-0 gap-4">
//       <div>
//         <div className="font-medium text-sm text-white">{label}</div>
//         <div className="text-xs text-slate-400 mt-1 leading-relaxed">{sub}</div>
//       </div>
//       <div className="flex-shrink-0">{control}</div>
//     </div>
//   );
// }

// function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200 outline-none ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}
//     >
//       <span
//         className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200 shadow-sm ${on ? 'left-[23px]' : 'left-[3px]'}`}
//       />
//     </button>
//   );
// }

// function UsageBar({ pct, color = 'bg-amber-500' }: { pct: number; color?: string }) {
//   return (
//     <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-2 border border-slate-700/30">
//       <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
//     </div>
//   );
// }

// const emptyForm = { name: '', phone: '', service: '', date: '', time: '' };

// export default function Dashboard() {
//   const [view, setView] = useState('overview');
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [toggles, setToggles] = useState({
//     calls: true,
//     whatsapp: true,
//     reminders: true,
//     followup: false,
//   });
//   const [callFilter, setCallFilter] = useState('All');
//   const [waFilter, setWaFilter] = useState('All');

//   // ---- Real appointment data, straight from Express ----
//   const [appointments, setAppointments] = useState<Appointment[]>([]);
//   const [loadingAppts, setLoadingAppts] = useState(true);
//   const [apptError, setApptError] = useState('');
//   const [businessId, setBusinessId] = useState<string | null>(null);

//   const [showAddForm, setShowAddForm] = useState(false);
//   const [addForm, setAddForm] = useState(emptyForm);
//   const [addSubmitting, setAddSubmitting] = useState(false);

//   // GET http://localhost:5000/appointments — no ?businessId= filter exists
//   // on the backend yet, so we fetch everything and filter client-side
//   // against the businessId saved during onboarding.
//   async function loadAppointments(bizId: string | null) {
//     setLoadingAppts(true);
//     setApptError('');
//     try {
//       const res = await fetch('http://localhost:5000/appointments');
//       const data = await res.json();
//       if (!res.ok || data.success === false) {
//         throw new Error(data.message || 'Failed to load appointments.');
//       }
//       const all: Appointment[] = data.data ?? [];
//       setAppointments(bizId ? all.filter((a) => a.businessId === bizId) : all);
//     } catch (err: any) {
//       setApptError(err.message || 'Could not reach the Aria backend. Is it running on localhost:5000?');
//     } finally {
//       setLoadingAppts(false);
//     }
//   }

//   useEffect(() => {
//     const id = typeof window !== 'undefined' ? localStorage.getItem('aria_business_id') : null;
//     setBusinessId(id);
//     loadAppointments(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const toggle = (key: keyof typeof toggles) => setToggles((t) => ({ ...t, [key]: !t[key] }));

//   const appointmentsBooked = appointments.filter((a) => a.status !== 'cancelled').length;

//   // POST http://localhost:5000/appointments
//   async function handleAddAppointment() {
//     if (!addForm.name || !addForm.phone || !addForm.service || !addForm.date || !addForm.time) {
//       setApptError('Fill in name, phone, service, date, and time.');
//       return;
//     }
//     setAddSubmitting(true);
//     setApptError('');
//     try {
//       const res = await fetch('http://localhost:5000/appointments', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           businessId: businessId || undefined,
//           name: addForm.name,
//           phone: addForm.phone,
//           businessType: 'salon_spa',
//           service: addForm.service,
//           date: addForm.date,
//           time: addForm.time,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok || data.success === false) {
//         throw new Error(data.message || 'Failed to create appointment.');
//       }
//       setAddForm(emptyForm);
//       setShowAddForm(false);
//       await loadAppointments(businessId);
//     } catch (err: any) {
//       setApptError(err.message || 'Failed to create appointment.');
//     } finally {
//       setAddSubmitting(false);
//     }
//   }

//   // DELETE http://localhost:5000/appointments/:id
//   async function handleCancelAppointment(id: string) {
//     try {
//       const res = await fetch(`http://localhost:5000/appointments/${id}`, { method: 'DELETE' });
//       const data = await res.json();
//       if (!res.ok || data.success === false) {
//         throw new Error(data.message || 'Failed to cancel appointment.');
//       }
//       await loadAppointments(businessId);
//     } catch (err: any) {
//       setApptError(err.message || 'Failed to cancel appointment.');
//     }
//   }

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans antialiased">

//   {/* ================= SIDEBAR ================= */}
// <aside className={`w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 flex flex-col lg:fixed lg:h-screen z-20 transition-all`}>
//   <div className="flex items-center justify-between pb-6 border-b border-slate-800 lg:border-0">

//     <Link href="/" className="flex items-center gap-3 font-semibold text-lg tracking-tight text-white hover:opacity-90 transition-opacity">
//       <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
//       Aria Workspace
//     </Link>

//     <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1 text-slate-400 hover:text-white">
//       {mobileMenuOpen ? '✕' : '☰'}
//     </button>
//   </div>

//         <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-6 flex-1 overflow-y-auto space-y-6`}>
//           {navGroups.map((group) => (
//             <div key={group.label}>
//               <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-slate-500 px-2.5 mb-2">
//                 {group.label}
//               </div>
//               <div className="space-y-0.5">
//                 {group.items.map((item) => (
//                   <div
//                     key={item.key}
//                     onClick={() => {
//                       setView(item.key);
//                       setMobileMenuOpen(false);
//                     }}
//                     className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
//                       view === item.key
//                         ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
//                         : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
//                     }`}
//                   >
//                     <span className="text-base leading-none text-slate-400">{item.icon}</span>
//                     {item.label}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-auto pt-4 border-t border-slate-800`}>
//           <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60 font-mono text-xs text-slate-400 flex justify-between items-center">
//             <span>Plan: <b className="text-amber-400 font-medium">Growth</b></span>
//             <span className="text-slate-500">₹3,999/mo</span>
//           </div>
//         </div>
//       </aside>

//       {/* ================= MAIN CONTAINER ================= */}
//       <main className="flex-1 lg:pl-64 min-w-0 w-full">
//         <div className="p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto space-y-8">

//           {/* ============ OVERVIEW ============ */}
//           {view === 'overview' && (
//             <div className="space-y-6 animate-fadeIn">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
//                 <div>
//                   <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Good morning, Rina Salon</h1>
//                   <p className="text-sm text-slate-400 mt-1">Here&apos;s what Aria handled since you last checked.</p>
//                 </div>
//                 <div className="flex items-center gap-3 w-full sm:w-auto">
//                   <div className="font-mono text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-slate-300 shadow-sm cursor-pointer hover:bg-slate-800">
//                     Last 7 days ▾
//                   </div>
//                   <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold px-4 py-2 rounded-full border border-emerald-500/20">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//                     Aria is on duty
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                 <StatCard label="Calls answered" icon="☎" value="128" delta="↑ 18% vs last week" />
//                 <StatCard
//                   label="Appointments booked"
//                   icon="🗓"
//                   value={loadingAppts ? '…' : String(appointmentsBooked)}
//                   delta={loadingAppts ? 'Loading…' : 'Live from backend'}
//                 />
//                 <StatCard label="Orders taken" icon="🧾" value="31" delta="↓ 4% vs last week" down />
//                 <StatCard label="Leads followed up" icon="🎯" value="19" delta="↑ 26% vs last week" />
//               </div>
//               <p className="text-xs text-slate-500 -mt-2">
//                 Calls, Orders and Leads are placeholder data until those endpoints exist on the backend. Appointments is live.
//               </p>

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2 shadow-sm">
//                   <CardHead title="Conversations this week" link="View reports" />
//                   <div className="flex items-end gap-3 h-44 pt-4 border-b border-slate-800 px-2">
//                     {barDays.map((d) => (
//                       <div key={d.day} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
//                         <div
//                           className={`w-full rounded-t-md transition-all duration-300 relative group-hover:opacity-90 ${d.val === barMax ? 'bg-amber-500' : 'bg-slate-700'}`}
//                           style={{ height: `${(d.val / barMax) * 100}%` }}
//                         >
//                           <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl">{d.val}</span>
//                         </div>
//                         <div className="font-mono text-xs text-slate-500 pb-1">{d.day}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
//                   <CardHead title="Live activity" />
//                   <div className="divide-y divide-slate-800 max-h-[220px] overflow-y-auto pr-1">
//                     {activities.map((a, idx) => (
//                       <div key={idx} className="flex gap-3 py-3 items-start first:pt-0 last:pb-0">
//                         <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.color} shadow-[0_0_8px_currentColor]`} />
//                         <div className="flex-1">
//                           <div className="text-sm text-slate-300 leading-normal">{a.text}</div>
//                           <div className="font-mono text-[11px] text-slate-500 mt-1">{a.time}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ============ REPORTS ============ */}
//           {view === 'reports' && (
//             <div className="space-y-6">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
//                 <div>
//                   <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
//                   <p className="text-sm text-slate-400 mt-1">Daily, weekly and monthly summaries of everything Aria did.</p>
//                 </div>
//                 <BtnSm primary>Download all (.csv)</BtnSm>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2 shadow-sm">
//                   <CardHead title="Conversion trend — last 30 days" />
//                   <div className="pt-4">
//                     <svg viewBox="0 0 480 150" width="100%" height="150" className="overflow-visible">
//                       <polyline
//                         points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25"
//                         fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
//                       />
//                       <polyline
//                         points="0,110 40,95 80,100 120,80 160,85 200,60 240,68 280,45 320,50 360,30 400,38 440,20 480,25 480,150 0,150"
//                         fill="url(#gradient)" stroke="none"
//                       />
//                       <defs>
//                         <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
//                           <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
//                         </linearGradient>
//                       </defs>
//                     </svg>
//                   </div>
//                 </div>

//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
//                   <CardHead title="Where conversations happen" />
//                   <div className="space-y-5 my-auto">
//                     <div>
//                       <div className="flex justify-between text-sm mb-1.5 font-medium">
//                         <span className="text-slate-300">Voice calls</span>
//                         <span className="text-emerald-400 font-mono">62%</span>
//                       </div>
//                       <UsageBar pct={62} color="bg-emerald-500" />
//                     </div>
//                     <div>
//                       <div className="flex justify-between text-sm mb-1.5 font-medium">
//                         <span className="text-slate-300">WhatsApp</span>
//                         <span className="text-amber-400 font-mono">38%</span>
//                       </div>
//                       <UsageBar pct={38} color="bg-amber-500" />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
//                 <CardHead title="Generated reports" />
//                 <div className="space-y-3">
//                   <ReportRow icon="📄" title="Weekly Summary — 23 Jun to 29 Jun" sub="128 calls · 54 bookings · 31 orders" />
//                   <ReportRow icon="📄" title="Weekly Summary — 16 Jun to 22 Jun" sub="109 calls · 47 bookings · 28 orders" />
//                   <ReportRow icon="📄" title="Monthly Summary — May 2026" sub="462 calls · 201 bookings · 118 orders" />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ============ CALLS ============ */}
//           {view === 'calls' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">Calls</h1>
//                 <p className="text-sm text-slate-400 mt-1">Every call Aria answered, with outcome and transcript.</p>
//               </div>
//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
//                 <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
//                   <input className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 min-w-[260px] flex-1 sm:flex-none" placeholder="Search by caller name or number..." />
//                   <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/80 overflow-x-auto">
//                     {['All', 'Booked', 'Missed', 'Escalated'].map((f) => (
//                       <button
//                         key={f}
//                         onClick={() => callFilter !== f && setCallFilter(f)}
//                         className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
//                           callFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
//                         }`}
//                       >
//                         {f}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto -mx-5">
//                   <div className="inline-block min-w-full align-middle px-5">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr><Th>Caller</Th><Th>Time</Th><Th>Duration</Th><Th>Language</Th><Th>Outcome</Th><Th></Th></tr>
//                       </thead>
//                       <tbody>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>P</Avatar><div><div className="font-semibold text-white">Priya Nair</div><div className="text-xs text-slate-400 mt-0.5">+91 98xxxxx210</div></div></div></Td>
//                           <Td>Today, 6:04pm</Td><Td>1m 42s</Td><Td>English</Td><Td><Badge variant="ok">Booked</Badge></Td><Td className="text-right"><BtnSm>Transcript</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>R</Avatar><div><div className="font-semibold text-white">Rahul Sharma</div><div className="text-xs text-slate-400 mt-0.5">+91 98xxxxx543</div></div></div></Td>
//                           <Td>Today, 4:20pm</Td><Td>0m 58s</Td><Td>Hindi</Td><Td><Badge variant="ok">Booked</Badge></Td><Td className="text-right"><BtnSm>Transcript</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>?</Avatar><div><div className="font-semibold text-white">Unknown caller</div><div className="text-xs text-slate-400 mt-0.5">+91 97xxxxx881</div></div></div></Td>
//                           <Td>Today, 2:11pm</Td><Td>0m 12s</Td><Td>—</Td><Td><Badge variant="bad">Missed</Badge></Td><Td className="text-right"><BtnSm primary>Call back</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>S</Avatar><div><div className="font-semibold text-white">Sneha Gupta</div><div className="text-xs text-slate-400 mt-0.5">+91 98xxxxx004</div></div></div></Td>
//                           <Td>Today, 11:47am</Td><Td>2m 30s</Td><Td>Marathi</Td><Td><Badge variant="warn">Escalated</Badge></Td><Td className="text-right"><BtnSm>Transcript</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>A</Avatar><div><div className="font-semibold text-white">Arjun Mehta</div><div className="text-xs text-slate-400 mt-0.5">+91 98xxxxx712</div></div></div></Td>
//                           <Td>Yesterday, 5:32pm</Td><Td>1m 05s</Td><Td>English</Td><Td><Badge variant="muted">Info only</Badge></Td><Td className="text-right"><BtnSm>Transcript</BtnSm></Td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//                 <p className="text-xs text-slate-500 mt-4">Mock data — no /calls endpoint on the backend yet.</p>
//               </div>
//             </div>
//           )}

//           {/* ============ WHATSAPP ============ */}
//           {view === 'whatsapp' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp</h1>
//                 <p className="text-sm text-slate-400 mt-1">Conversations Aria handled on your business number.</p>
//               </div>
//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
//                 <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
//                   <input className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 min-w-[260px] flex-1 sm:flex-none" placeholder="Search conversations..." />
//                   <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
//                     {['All', 'Needs reply', 'Resolved'].map((f) => (
//                       <button
//                         key={f}
//                         onClick={() => setWaFilter(f)}
//                         className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
//                           waFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
//                         }`}
//                       >
//                         {f}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto -mx-5">
//                   <div className="inline-block min-w-full align-middle px-5">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr><Th>Customer</Th><Th>Last message</Th><Th>Time</Th><Th>Status</Th><Th></Th></tr>
//                       </thead>
//                       <tbody>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>K</Avatar><span className="font-semibold text-white">Kiran Rao</span></div></Td>
//                           <Td className="text-slate-400 italic font-normal">&quot;Yes, hold it! I&apos;ll pick up by 6.&quot;</Td>
//                           <Td>4m ago</Td><Td><Badge variant="ok">Resolved</Badge></Td><Td className="text-right"><BtnSm>Open chat</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>J</Avatar><span className="font-semibold text-white">John Doe</span></div></Td>
//                           <Td className="text-slate-400 italic font-normal">&quot;Can I get a discount on bulk order?&quot;</Td>
//                           <Td>22m ago</Td><Td><Badge variant="warn">Needs you</Badge></Td><Td className="text-right"><BtnSm primary>Open chat</BtnSm></Td>
//                         </tr>
//                         <tr>
//                           <Td><div className="flex items-center gap-3"><Avatar>N</Avatar><span className="font-semibold text-white">Neha Patil</span></div></Td>
//                           <Td className="text-slate-400 italic font-normal">&quot;Perfect, see you at 5pm.&quot;</Td>
//                           <Td>1h ago</Td><Td><Badge variant="ok">Resolved</Badge></Td><Td className="text-right"><BtnSm>Open chat</BtnSm></Td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//                 <p className="text-xs text-slate-500 mt-4">Mock data — no /whatsapp endpoint on the backend yet.</p>
//               </div>
//             </div>
//           )}

//           {/* ============ APPOINTMENTS (LIVE) ============ */}
//           {view === 'appointments' && (
//             <div className="space-y-6">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
//                 <div>
//                   <h1 className="text-2xl font-bold text-white tracking-tight">Appointments</h1>
//                   <p className="text-sm text-slate-400 mt-1">Live from http://localhost:5000/appointments.</p>
//                 </div>
//                 <BtnSm primary onClick={() => setShowAddForm((s) => !s)}>
//                   {showAddForm ? 'Cancel' : '+ Add manually'}
//                 </BtnSm>
//               </div>

//               {apptError && (
//                 <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
//                   {apptError}
//                 </div>
//               )}

//               {showAddForm && (
//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
//                   <CardHead title="New appointment" />
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <input
//                       className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
//                       placeholder="Customer name"
//                       value={addForm.name}
//                       onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
//                     />
//                     <input
//                       className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
//                       placeholder="Phone number"
//                       value={addForm.phone}
//                       onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
//                     />
//                     <input
//                       className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
//                       placeholder="Service (e.g. Haircut)"
//                       value={addForm.service}
//                       onChange={(e) => setAddForm((f) => ({ ...f, service: e.target.value }))}
//                     />
//                     <div className="grid grid-cols-2 gap-3">
//                       <input
//                         type="date"
//                         className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-slate-700"
//                         value={addForm.date}
//                         onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
//                       />
//                       <input
//                         type="time"
//                         className="text-sm px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-slate-700"
//                         value={addForm.time}
//                         onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
//                       />
//                     </div>
//                   </div>
//                   <div className="flex justify-end">
//                     <BtnSm primary onClick={handleAddAppointment} disabled={addSubmitting}>
//                       {addSubmitting ? 'Saving…' : 'Save appointment'}
//                     </BtnSm>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
//                 {loadingAppts ? (
//                   <div className="text-sm text-slate-400 py-8 text-center">Loading appointments…</div>
//                 ) : appointments.length === 0 ? (
//                   <div className="text-sm text-slate-400 py-8 text-center">
//                     No appointments yet. They&apos;ll show up here as Aria books them, or add one manually above.
//                   </div>
//                 ) : (
//                   <table className="w-full border-collapse">
//                     <thead>
//                       <tr><Th>Time</Th><Th>Customer</Th><Th>Service</Th><Th>Phone</Th><Th>Status</Th><Th></Th></tr>
//                     </thead>
//                     <tbody>
//                       {appointments.map((a) => (
//                         <tr key={a.id}>
//                           <Td className="font-semibold text-white">{a.date} · {a.time}</Td>
//                           <Td>{a.name}</Td>
//                           <Td>{a.service}</Td>
//                           <Td className="text-slate-400">{a.phone}</Td>
//                           <Td>{statusBadge(a.status)}</Td>
//                           <Td className="text-right">
//                             {a.status !== 'cancelled' && (
//                               <BtnSm onClick={() => handleCancelAppointment(a.id)}>Cancel</BtnSm>
//                             )}
//                           </Td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* ============ ORDERS ============ */}
//           {view === 'orders' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">Orders</h1>
//                 <p className="text-sm text-slate-400 mt-1">Orders taken by Aria across calls and WhatsApp.</p>
//               </div>
//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
//                 <table className="w-full border-collapse">
//                   <thead>
//                     <tr><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Amount</Th><Th>Status</Th></tr>
//                   </thead>
//                   <tbody>
//                     <tr><Td className="font-semibold text-white">#1042</Td><Td>Neha Patil</Td><Td>Blue kurta (M) × 1</Td><Td className="font-mono text-emerald-400">₹1,299</Td><Td><Badge variant="ok">Confirmed</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">#1041</Td><Td>Sundar Traders</Td><Td>Rice 25kg × 2</Td><Td className="font-mono text-emerald-400">₹3,400</Td><Td><Badge variant="ok">Confirmed</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">#1040</Td><Td>Meera Iyer</Td><Td>Face wash × 3</Td><Td className="font-mono text-emerald-400">₹840</Td><Td><Badge variant="warn">Payment pending</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">#1039</Td><Td>Rohit Shah</Td><Td>Formal shirt (L) × 2</Td><Td className="font-mono text-emerald-400">₹2,198</Td><Td><Badge variant="ok">Confirmed</Badge></Td></tr>
//                   </tbody>
//                 </table>
//                 <p className="text-xs text-slate-500 mt-4">Mock data — no /orders endpoint on the backend yet.</p>
//               </div>
//             </div>
//           )}

//           {/* ============ LEADS ============ */}
//           {view === 'leads' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
//                 <p className="text-sm text-slate-400 mt-1">Enquiries that haven&apos;t converted yet — Aria is following up.</p>
//               </div>
//               <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
//                 <table className="w-full border-collapse">
//                   <thead>
//                     <tr><Th>Name</Th><Th>Enquired about</Th><Th>Source</Th><Th>Next follow-up</Th><Th>Status</Th></tr>
//                   </thead>
//                   <tbody>
//                     <tr><Td className="font-semibold text-white">Vikram Joshi</Td><Td>Bridal package</Td><Td className="text-xs text-slate-400">☎ Missed call</Td><Td>Tomorrow, 11am</Td><Td><Badge variant="warn">Scheduled</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">Anita Desai</Td><Td>Bulk stationery order</Td><Td className="text-xs text-slate-400">💬 WhatsApp</Td><Td>Today, 5pm</Td><Td><Badge variant="warn">Scheduled</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">Farhan Ali</Td><Td>Gym membership</Td><Td className="text-xs text-slate-400">☎ Call</Td><Td>—</Td><Td><Badge variant="bad">No response (3)</Badge></Td></tr>
//                     <tr><Td className="font-semibold text-white">Pooja Nair</Td><Td>Facial package</Td><Td className="text-xs text-slate-400">💬 WhatsApp</Td><Td>—</Td><Td><Badge variant="ok">Converted</Badge></Td></tr>
//                   </tbody>
//                 </table>
//                 <p className="text-xs text-slate-500 mt-4">Mock data — no /leads endpoint on the backend yet.</p>
//               </div>
//             </div>
//           )}

//           {/* ============ SETTINGS ============ */}
//           {view === 'settings' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">Aria Settings</h1>
//                 <p className="text-sm text-slate-400 mt-1">How Aria represents your business.</p>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
//                   <CardHead title="Business profile" />
//                   <div className="divide-y divide-slate-800">
//                     <SettingsRow label="Business name" sub="Rina Salon" control={<BtnSm>Edit</BtnSm>} />
//                     <SettingsRow label="Business number" sub="+91 98xxx xxxxx" control={<BtnSm>Edit</BtnSm>} />
//                     <SettingsRow label="Business hours" sub="10:00 AM – 8:00 PM, Mon–Sat" control={<BtnSm>Edit</BtnSm>} />
//                     <SettingsRow label="Connected calendar" sub="Google Calendar — connected" control={<BtnSm>Change</BtnSm>} />
//                   </div>
//                 </div>

//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
//                   <CardHead title="Aria's behaviour" />
//                   <div className="divide-y divide-slate-800">
//                     <SettingsRow label="Answer calls" sub="Pick up automatically 24×7" control={<Toggle on={toggles.calls} onClick={() => toggle('calls')} />} />
//                     <SettingsRow label="Reply on WhatsApp" sub="Auto-reply to new messages" control={<Toggle on={toggles.whatsapp} onClick={() => toggle('whatsapp')} />} />
//                     <SettingsRow label="Send appointment reminders" sub="2 hours before each booking" control={<Toggle on={toggles.reminders} onClick={() => toggle('reminders')} />} />
//                     <SettingsRow label="Auto follow-up on missed leads" sub="After 24 hours of no reply" control={<Toggle on={toggles.followup} onClick={() => toggle('followup')} />} />
//                     <div className="py-4 last:pb-0">
//                       <div className="font-medium text-sm text-white mb-3">Active Languages</div>
//                       <div className="flex flex-wrap gap-1.5">
//                         {['English ✓', 'Hindi ✓', 'Marathi ✓'].map((lang) => (
//                           <span key={lang} className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300">{lang}</span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ============ BILLING ============ */}
//           {view === 'billing' && (
//             <div className="space-y-6">
//               <div className="border-b border-slate-900 pb-6">
//                 <h1 className="text-2xl font-bold text-white tracking-tight">Billing</h1>
//                 <p className="text-sm text-slate-400 mt-1">Your plan, usage and invoices.</p>
//               </div>

//               <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/5 border border-amber-500/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
//                 <div>
//                   <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-amber-400">Current plan</div>
//                   <div className="text-2xl font-bold text-white mt-1">Growth Tier</div>
//                   <div className="font-mono text-xs text-slate-400 mt-1">₹3,999 / month · Renews on <span className="text-slate-200">1 Aug 2026</span></div>
//                 </div>
//                 <button className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all active:scale-95 shadow-md">
//                   Upgrade to Pro
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
//                   <CardHead title="Usage this cycle" />
//                   <div>
//                     <div className="flex justify-between text-xs mb-1.5 font-medium">
//                       <span className="text-slate-300">Conversations</span>
//                       <span className="text-slate-400 font-mono">612 / 1,500</span>
//                     </div>
//                     <UsageBar pct={41} color="bg-amber-500" />
//                   </div>
//                   <div>
//                     <div className="flex justify-between text-xs mb-1.5 font-medium">
//                       <span className="text-slate-300">Voice minutes</span>
//                       <span className="text-slate-400 font-mono">340 / 800 min</span>
//                     </div>
//                     <UsageBar pct={42} color="bg-emerald-500" />
//                   </div>
//                 </div>

//                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
//                   <CardHead title="Invoices" />
//                   <div className="space-y-3">
//                     <ReportRow icon="🧾" title="July 2026 Invoice" sub="₹3,999 · Settled via Card" />
//                     <ReportRow icon="🧾" title="June 2026 Invoice" sub="₹3,999 · Settled via Card" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Overview } from '@/components/dashboard/Overview';
import { Appointments } from '@/components/dashboard/Appointments';
import { Reports } from '@/components/dashboard/Reports';
import { Calls } from '@/components/dashboard/Calls';
import { WhatsApp } from '@/components/dashboard/WhatsApp';
import { Orders } from '@/components/dashboard/Orders';
import { Leads } from '@/components/dashboard/Leads';
import { Settings } from '@/components/dashboard/Settings';
import { Billing } from '@/components/dashboard/Billing';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const [view, setView] = useState('overview');
  const {
    appointments,
    loadingAppts,
    apptError,
    business,
    businessPhone,
    greeting,
    toggles,
    toggle,
    loadAppointments,
    handleAddAppointment,
    handleCancelAppointment,
  } = useDashboard();

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <Overview appointments={appointments} loadingAppts={loadingAppts} business={business} greeting={greeting} />;
      case 'appointments':
        return (
          <Appointments
            appointments={appointments}
            loadingAppts={loadingAppts}
            apptError={apptError}
            onAdd={handleAddAppointment}
            onCancel={handleCancelAppointment}
            loadAppointments={loadAppointments}
          />
        );
      case 'reports':
        return <Reports />;
      case 'calls':
        return <Calls />;
      case 'whatsapp':
        return <WhatsApp />;
      case 'orders':
        return <Orders />;
      case 'leads':
        return <Leads />;
      case 'settings':
        return <Settings business={business} businessPhone={businessPhone} toggles={toggles} toggle={toggle} />;
      case 'billing':
        return <Billing />;
      default:
        return <div className="text-center text-slate-400 py-12">View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

