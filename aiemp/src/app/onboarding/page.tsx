// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import OptionCard from '@/components/onboarding/OptionCard';
// import Chip from '@/components/onboarding/Chip';
// import ConnectRow from '@/components/onboarding/ConnectRow';
// import ProgressBar from '@/components/onboarding/ProgressBar';

// const TOTAL_STEPS = 7;

// const jobOptions = [
//   { key: 'answer', icon: '📞', title: 'Answer customers', sub: 'Calls + WhatsApp questions', defaultSelected: true },
//   { key: 'book', icon: '🗓️', title: 'Book appointments', sub: 'Syncs to your calendar', defaultSelected: true },
//   { key: 'orders', icon: '🧾', title: 'Handle orders', sub: 'Takes and confirms orders', defaultSelected: false },
//   { key: 'remind', icon: '⏰', title: 'Send reminders', sub: 'Before each appointment', defaultSelected: true },
//   { key: 'followup', icon: '🎯', title: 'Follow up with leads', sub: 'Missed calls, unanswered chats', defaultSelected: true },
//   { key: 'report', icon: '📊', title: 'Daily report', sub: 'Sent to you every evening', defaultSelected: true },
// ];

// const languageOptions = [
//   { key: 'en', label: 'English', defaultSelected: true },
//   { key: 'hi', label: 'Hindi', defaultSelected: true },
//   { key: 'mr', label: 'Marathi', defaultSelected: true },
//   { key: 'gu', label: 'Gujarati', defaultSelected: false },
//   { key: 'ta', label: 'Tamil', defaultSelected: false },
// ];

// const phoneOptions = [
//   { key: 'existing', icon: '📱', title: 'Use my existing number', sub: "We'll set up call forwarding — takes 2 minutes, no new SIM needed." },
//   { key: 'new', icon: '🆕', title: 'Get a new business number', sub: 'We provide a dedicated number for Aria to answer.' },
// ];

// const inputClass =
//   'w-full rounded-[9px] border border-ink/10 bg-paper px-3.5 py-3 text-[14px] text-ink placeholder:text-text-faint focus:outline-2 focus:outline-amber focus:outline-offset-1';
// const labelClass = 'mb-2 block text-[13px] font-semibold text-ink';

// export default function Onboarding() {
//   const router = useRouter();
//   const [current, setCurrent] = useState(1);
//   const [selectedPhoneOpt, setSelectedPhoneOpt] = useState('existing');
//   const [selectedJobs, setSelectedJobs] = useState<string[]>(
//     jobOptions.filter((j) => j.defaultSelected).map((j) => j.key)
//   );
//   const [selectedLangs, setSelectedLangs] = useState<string[]>(
//     languageOptions.filter((l) => l.defaultSelected).map((l) => l.key)
//   );
//   const [connected, setConnected] = useState<Record<string, boolean>>({
//     forwarding: false,
//     whatsapp: true,
//     calendar: true,
//     slots: false,
//     payment: false,
//   });

//   const toggleJob = (key: string) =>
//     setSelectedJobs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
//   const toggleLang = (key: string) =>
//     setSelectedLangs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
//   const connect = (key: string) => setConnected((prev) => ({ ...prev, [key]: true }));

//   const goNext = () => setCurrent((c) => c + 1);
//   const goBack = () => setCurrent((c) => Math.max(1, c - 1));

//   return (
//     <div className="min-h-screen bg-paper font-body text-text-on-paper">
//       <div className="mx-auto max-w-[960px] px-6 pb-[100px] pt-10">
//         <div className="mb-11 flex items-center justify-between">
//           <div className="flex items-center gap-2.5 font-display text-[18px] font-bold text-ink">
//             <span className="h-[9px] w-[9px] rounded-full bg-emerald" />
//             Aria
//           </div>
//           <div className="font-mono text-[11.5px] text-text-faint">Progress saved automatically</div>
//         </div>

//         {current <= TOTAL_STEPS && <ProgressBar current={current} total={TOTAL_STEPS} />}

//         {/* STEP 1 — ACCOUNT */}
//         {current === 1 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 1 of 7" title="Create your account" desc="This is how you'll log in to see Aria's reports and manage your settings." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="mb-5"><label className={labelClass}>Full name</label><input className={inputClass} type="text" placeholder="Rina Deshmukh" /></div>
//               <div className="mb-5"><label className={labelClass}>Email address</label><input className={inputClass} type="email" placeholder="rina@rinasalon.in" /></div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div><label className={labelClass}>Mobile number</label><input className={inputClass} type="text" placeholder="+91 98xxx xxxxx" /></div>
//                 <div><label className={labelClass}>Password</label><input className={inputClass} type="password" placeholder="Create a password" /></div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 2 — BUSINESS */}
//         {current === 2 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 2 of 7" title="Tell us about your business" desc="Aria uses this to answer customer questions correctly from day one." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="mb-5"><label className={labelClass}>Business name</label><input className={inputClass} type="text" placeholder="Rina Salon" /></div>
//               <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className={labelClass}>Business type</label>
//                   <select className={inputClass}>
//                     <option>Salon / Spa</option>
//                     <option>Clinic</option>
//                     <option>Restaurant / Cafe</option>
//                     <option>Retail store</option>
//                     <option>Services (repair, tuition, etc.)</option>
//                     <option>Other</option>
//                   </select>
//                 </div>
//                 <div><label className={labelClass}>City</label><input className={inputClass} type="text" placeholder="Pune" /></div>
//               </div>
//               <div className="mb-5">
//                 <label className={labelClass}>Business hours</label>
//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   <input className={inputClass} type="text" placeholder="Opens — 10:00 AM" />
//                   <input className={inputClass} type="text" placeholder="Closes — 8:00 PM" />
//                 </div>
//                 <div className="mt-1.5 text-[12px] text-text-faint">Aria will only take bookings inside these hours unless you turn on 24×7 mode later.</div>
//               </div>
//               <div>
//                 <label className={labelClass}>Services / products you offer</label>
//                 <textarea className={inputClass} rows={3} placeholder="Haircut, hair spa, facial, bridal package..." />
//                 <div className="mt-1.5 text-[12px] text-text-faint">One line is fine — Aria uses this to answer "do you offer X" questions.</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 3 — PHONE */}
//         {current === 3 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 3 of 7" title="Connect your phone number" desc="Calls to this number will be picked up by Aria. Your existing number stays the same." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="mb-2 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
//                 {phoneOptions.map((opt) => (
//                   <OptionCard
//                     key={opt.key}
//                     icon={opt.icon}
//                     title={opt.title}
//                     sub={opt.sub}
//                     selected={selectedPhoneOpt === opt.key}
//                     onClick={() => setSelectedPhoneOpt(opt.key)}
//                   />
//                 ))}
//               </div>
//               <div className="mb-2 mt-5"><label className={labelClass}>Your business number</label><input className={inputClass} type="text" placeholder="+91 98xxx xxxxx" /></div>
//               <ConnectRow
//                 icon="☎"
//                 title="Call forwarding"
//                 sub="Not connected yet"
//                 connected={connected.forwarding}
//                 actionLabel="Set up forwarding"
//                 onConnect={() => connect('forwarding')}
//               />
//             </div>
//           </div>
//         )}

//         {/* STEP 4 — WHATSAPP */}
//         {current === 4 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 4 of 7" title="Connect WhatsApp" desc="Aria replies to customer messages on your WhatsApp Business number." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <ConnectRow
//                 icon="💬"
//                 title="WhatsApp Business"
//                 sub="Connect the same number as your call line"
//                 connected={connected.whatsapp}
//                 onConnect={() => connect('whatsapp')}
//               />
//               <ConnectRow
//                 icon="🖼"
//                 title="Business profile photo & catalog"
//                 sub="Optional — shows in customer chats"
//                 connected={false}
//                 actionLabel="Upload"
//                 onConnect={() => {}}
//               />
//               <div className="mt-6 rounded-xl bg-ink p-5 text-text-on-ink">
//                 <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-text-on-ink-dim">
//                   How it will look to your customer
//                 </div>
//                 <div className="rounded-[10px] bg-white/[0.06] p-3.5 text-[13.5px] leading-relaxed">
//                   Hi! This is Rina Salon 👋 I'm Aria, I help with bookings and questions here. How can I help you today?
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 5 — CONFIGURE ARIA */}
//         {current === 5 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 5 of 7" title="Set up what Aria can do" desc="Turn on the jobs you want handled automatically. You can change these anytime." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
//                 {jobOptions.map((job) => (
//                   <OptionCard
//                     key={job.key}
//                     icon={job.icon}
//                     title={job.title}
//                     sub={job.sub}
//                     selected={selectedJobs.includes(job.key)}
//                     onClick={() => toggleJob(job.key)}
//                   />
//                 ))}
//               </div>

//               <div className="mt-6">
//                 <label className={labelClass}>Languages Aria should speak</label>
//                 <div className="flex flex-wrap gap-2.5">
//                   {languageOptions.map((lang) => (
//                     <Chip
//                       key={lang.key}
//                       label={lang.label}
//                       selected={selectedLangs.includes(lang.key)}
//                       onClick={() => toggleLang(lang.key)}
//                     />
//                   ))}
//                 </div>
//               </div>

//               <div className="mt-5">
//                 <label className={labelClass}>Aria's greeting</label>
//                 <textarea
//                   className={inputClass}
//                   rows={2}
//                   defaultValue="Hi! This is Rina Salon, I'm Aria — how can I help you today?"
//                 />
//                 <div className="mt-1.5 text-[12px] text-text-faint">This is the first thing customers hear or read.</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 6 — CALENDAR */}
//         {current === 6 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 6 of 7" title="Connect your calendar" desc="So Aria only books real, open slots." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <ConnectRow icon="📅" title="Google Calendar" sub="Recommended" connected={connected.calendar} onConnect={() => connect('calendar')} />
//               <ConnectRow icon="🗂️" title="Simple slot list instead" sub="No calendar? Set fixed daily slots" connected={connected.slots} actionLabel="Set up" onConnect={() => connect('slots')} />
//               <ConnectRow icon="💳" title="Payment link (optional)" sub="For order confirmations" connected={connected.payment} actionLabel="Add UPI / link" onConnect={() => connect('payment')} />
//             </div>
//           </div>
//         )}

//         {/* STEP 7 — REVIEW */}
//         {current === 7 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 7 of 7" title="Review before Aria goes live" desc="Check everything below — Aria starts answering as soon as you launch." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <SummaryRow k="Business" v="Rina Salon · Salon / Spa · Pune" onEdit={() => setCurrent(2)} />
//               <SummaryRow k="Phone" v={`+91 98xxx xxxxx · ${connected.forwarding ? 'forwarding set up' : 'forwarding pending'}`} onEdit={() => setCurrent(3)} />
//               <SummaryRow k="WhatsApp" v={connected.whatsapp ? 'Connected' : 'Not connected'} onEdit={() => setCurrent(4)} />
//               <SummaryRow k="Jobs enabled" v={`${selectedJobs.length} selected`} onEdit={() => setCurrent(5)} />
//               <SummaryRow k="Languages" v={`${selectedLangs.length} selected`} onEdit={() => setCurrent(5)} />
//               <SummaryRow k="Calendar" v={connected.calendar ? 'Google Calendar connected' : 'Not connected'} onEdit={() => setCurrent(6)} />
//               <SummaryRow k="Plan" v="Growth — ₹3,999/month" onEdit={() => router.push('/#pricing')} isLast />
//             </div>
//           </div>
//         )}

//         {/* SUCCESS */}
//         {current === 8 && (
//           <div className="animate-in fade-in rounded-[14px] border border-ink/10 bg-white p-[50px] text-center duration-300">
//             <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-full bg-emerald-soft text-[32px] text-emerald">
//               ✓
//             </div>
//             <h1 className="font-display text-[28px] font-bold text-ink">Aria is on duty.</h1>
//             <p className="mx-auto mt-2.5 max-w-[420px] text-[15px] text-text-on-paper-dim">
//               She's now answering calls and WhatsApp messages for Rina Salon. You'll get your first daily report tonight.
//             </p>
//             <button
//               className="mt-6 rounded-full bg-ink px-[26px] py-3.5 text-[14.5px] font-semibold text-text-on-ink hover:opacity-90"
//               onClick={() => router.push('/dashboard')}
//             >
//               Go to my dashboard →
//             </button>
//           </div>
//         )}

//         {/* NAV */}
//         {current <= TOTAL_STEPS && (
//           <div className="mt-7 flex items-center justify-between">
//             <button
//               className="text-[14px] font-semibold text-text-on-paper-dim"
//               style={{ visibility: current === 1 ? 'hidden' : 'visible' }}
//               onClick={goBack}
//             >
//               ← Back
//             </button>
//             <button
//               className={`rounded-full px-[26px] py-3.5 text-[14.5px] font-semibold ${
//                 current === TOTAL_STEPS ? 'bg-amber text-ink' : 'bg-ink text-text-on-ink'
//               } hover:opacity-90`}
//               onClick={goNext}
//             >
//               {current === TOTAL_STEPS ? 'Launch Aria →' : 'Continue →'}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function StepHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
//   return (
//     <div className="mb-7">
//       <div className="mb-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-amber">{eyebrow}</div>
//       <h1 className="font-display text-[30px] font-bold tracking-tight text-ink">{title}</h1>
//       <p className="mt-2 max-w-[520px] text-[15px] text-text-on-paper-dim">{desc}</p>
//     </div>
//   );
// }

// function SummaryRow({ k, v, onEdit, isLast }: { k: string; v: string; onEdit: () => void; isLast?: boolean }) {
//   return (
//     <div className={`flex justify-between py-3.5 text-[13.5px] ${isLast ? '' : 'border-b border-dashed border-ink/10'}`}>
//       <span className="text-text-on-paper-dim">{k}</span>
//       <span className="font-semibold text-ink">
//         {v} <button onClick={onEdit} className="ml-2 text-[12px] font-semibold text-amber">Edit</button>
//       </span>
//     </div>
//   );
// }   'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import OptionCard from '@/components/onboarding/OptionCard';
// import Chip from '@/components/onboarding/Chip';
// import ConnectRow from '@/components/onboarding/ConnectRow';
// import ProgressBar from '@/components/onboarding/ProgressBar';

// const TOTAL_STEPS = 7;

// const jobOptions = [
//   { key: 'answer', icon: '📞', title: 'Answer customers', sub: 'Calls + WhatsApp questions', defaultSelected: true },
//   { key: 'book', icon: '🗓️', title: 'Book appointments', sub: 'Syncs to your calendar', defaultSelected: true },
//   { key: 'orders', icon: '🧾', title: 'Handle orders', sub: 'Takes and confirms orders', defaultSelected: false },
//   { key: 'remind', icon: '⏰', title: 'Send reminders', sub: 'Before each appointment', defaultSelected: true },
//   { key: 'followup', icon: '🎯', title: 'Follow up with leads', sub: 'Missed calls, unanswered chats', defaultSelected: true },
//   { key: 'report', icon: '📊', title: 'Daily report', sub: 'Sent to you every evening', defaultSelected: true },
// ];

// const languageOptions = [
//   { key: 'en', label: 'English', defaultSelected: true },
//   { key: 'hi', label: 'Hindi', defaultSelected: true },
//   { key: 'mr', label: 'Marathi', defaultSelected: true },
//   { key: 'gu', label: 'Gujarati', defaultSelected: false },
//   { key: 'ta', label: 'Tamil', defaultSelected: false },
// ];

// const inputClass =
//   'w-full rounded-[9px] border border-ink/10 bg-paper px-3.5 py-3 text-[14px] text-ink placeholder:text-text-faint focus:outline-2 focus:outline-amber focus:outline-offset-1';
// const labelClass = 'mb-2 block text-[13px] font-semibold text-ink';

// export default function Onboarding() {
//   const router = useRouter();
//   const [current, setCurrent] = useState(1);
//   const [telegramToken, setTelegramToken] = useState('');
//   const [selectedJobs, setSelectedJobs] = useState<string[]>(
//     jobOptions.filter((j) => j.defaultSelected).map((j) => j.key)
//   );
//   const [selectedLangs, setSelectedLangs] = useState<string[]>(
//     languageOptions.filter((l) => l.defaultSelected).map((l) => l.key)
//   );
//   const [connected, setConnected] = useState<Record<string, boolean>>({
//     forwarding: false,
//     whatsapp: true,
//     calendar: true,
//     slots: false,
//     payment: false,
//   });

//   const toggleJob = (key: string) =>
//     setSelectedJobs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
//   const toggleLang = (key: string) =>
//     setSelectedLangs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
//   const connect = (key: string) => setConnected((prev) => ({ ...prev, [key]: true }));

//   const goNext = () => setCurrent((c) => c + 1);
//   const goBack = () => setCurrent((c) => Math.max(1, c - 1));

//   return (
//     <div className="min-h-screen bg-paper font-body text-text-on-paper">
//       <div className="mx-auto max-w-[960px] px-6 pb-[100px] pt-10">
//         <div className="mb-11 flex items-center justify-between">
//           <div className="flex items-center gap-2.5 font-display text-[18px] font-bold text-ink">
//             <span className="h-[9px] w-[9px] rounded-full bg-emerald" />
//             Aria
//           </div>
//           <div className="font-mono text-[11.5px] text-text-faint">Progress saved automatically</div>
//         </div>

//         {current <= TOTAL_STEPS && <ProgressBar current={current} total={TOTAL_STEPS} />}

//         {/* STEP 1 — ACCOUNT */}
//         {current === 1 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 1 of 7" title="Create your account" desc="This is how you'll log in to see Aria's reports and manage your settings." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="mb-5"><label className={labelClass}>Full name</label><input className={inputClass} type="text" placeholder="Rina Deshmukh" /></div>
//               <div className="mb-5"><label className={labelClass}>Email address</label><input className={inputClass} type="email" placeholder="rina@rinasalon.in" /></div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div><label className={labelClass}>Mobile number</label><input className={inputClass} type="text" placeholder="+91 98xxx xxxxx" /></div>
//                 <div><label className={labelClass}>Password</label><input className={inputClass} type="password" placeholder="Create a password" /></div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 2 — BUSINESS */}
//         {current === 2 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 2 of 7" title="Tell us about your business" desc="Aria uses this to answer customer questions correctly from day one." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="mb-5"><label className={labelClass}>Business name</label><input className={inputClass} type="text" placeholder="Rina Salon" /></div>
//               <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className={labelClass}>Business type</label>
//                   <select className={inputClass}>
//                     <option>Salon / Spa</option>
//                     <option>Clinic</option>
//                     <option>Restaurant / Cafe</option>
//                     <option>Retail store</option>
//                     <option>Services (repair, tuition, etc.)</option>
//                     <option>Other</option>
//                   </select>
//                 </div>
//                 <div><label className={labelClass}>City</label><input className={inputClass} type="text" placeholder="Pune" /></div>
//               </div>
//               <div className="mb-5">
//                 <label className={labelClass}>Business hours</label>
//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   <input className={inputClass} type="text" placeholder="Opens — 10:00 AM" />
//                   <input className={inputClass} type="text" placeholder="Closes — 8:00 PM" />
//                 </div>
//                 <div className="mt-1.5 text-[12px] text-text-faint">Aria will only take bookings inside these hours unless you turn on 24×7 mode later.</div>
//               </div>
//               <div>
//                 <label className={labelClass}>Services / products you offer</label>
//                 <textarea className={inputClass} rows={3} placeholder="Haircut, hair spa, facial, bridal package..." />
//                 <div className="mt-1.5 text-[12px] text-text-faint">One line is fine — Aria uses this to answer "do you offer X" questions.</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 3 — TELEGRAM BOT CONFIGURATION */}
//         {current === 3 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead
//               eyebrow="Step 3 of 7"
//               title="Deploy your individual AI employee"
//               desc="Create a dedicated Telegram bot for your shop. Aria will answer customers directly through it."
//             />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">

//               {/* Mini-Guide for User Experience */}
//               <div className="mb-6 rounded-[10px] border border-amber/20 bg-amber/10 p-4 text-[13.5px] text-ink/80">
//                 <p className="mb-1 font-bold">💡 Quick 1-Minute Setup:</p>
//                 <ol className="list-inside list-decimal space-y-1 text-[13px]">
//                   <li>
//                     Open Telegram and search for{' '}
//                     <a
//                       href="https://t.me/BotFather"
//                       target="_blank"
//                       rel="noreferrer"
//                       className="font-semibold text-amber underline"
//                     >
//                       @BotFather
//                     </a>
//                   </li>
//                   <li>Send the command <code>/newbot</code> and follow the prompts to name it.</li>
//                   <li>Copy the <strong>HTTP API Token</strong> provided by BotFather and paste it below.</li>
//                 </ol>
//               </div>

//               <div className="mb-5">
//                 <label className={labelClass}>Your Telegram Bot Token</label>
//                 <input
//                   className={inputClass}
//                   type="text"
//                   placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
//                   value={telegramToken}
//                   onChange={(e) => setTelegramToken(e.target.value)}
//                 />
//               </div>

//               <ConnectRow
//                 icon="🤖"
//                 title="Bot Connection Status"
//                 sub={telegramToken ? 'Token detected! Ready to initialize.' : 'Waiting for bot token...'}
//                 connected={telegramToken.length > 20}
//                 actionLabel="Verify Token"
//                 onConnect={() => {
//                   // Optional: call your backend here to verify the token with Telegram's API
//                   // e.g. https://api.telegram.org/bot<token>/getMe
//                   connect('forwarding');
//                 }}
//               />
//             </div>
//           </div>
//         )}

//         {/* STEP 4 — WHATSAPP */}
//         {current === 4 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 4 of 7" title="Connect WhatsApp" desc="Aria replies to customer messages on your WhatsApp Business number." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <ConnectRow
//                 icon="💬"
//                 title="WhatsApp Business"
//                 sub="Connect the same number as your call line"
//                 connected={connected.whatsapp}
//                 onConnect={() => connect('whatsapp')}
//               />
//               <ConnectRow
//                 icon="🖼"
//                 title="Business profile photo & catalog"
//                 sub="Optional — shows in customer chats"
//                 connected={false}
//                 actionLabel="Upload"
//                 onConnect={() => {}}
//               />
//               <div className="mt-6 rounded-xl bg-ink p-5 text-text-on-ink">
//                 <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-text-on-ink-dim">
//                   How it will look to your customer
//                 </div>
//                 <div className="rounded-[10px] bg-white/[0.06] p-3.5 text-[13.5px] leading-relaxed">
//                   Hi! This is Rina Salon 👋 I'm Aria, I help with bookings and questions here. How can I help you today?
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 5 — CONFIGURE ARIA */}
//         {current === 5 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 5 of 7" title="Set up what Aria can do" desc="Turn on the jobs you want handled automatically. You can change these anytime." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
//                 {jobOptions.map((job) => (
//                   <OptionCard
//                     key={job.key}
//                     icon={job.icon}
//                     title={job.title}
//                     sub={job.sub}
//                     selected={selectedJobs.includes(job.key)}
//                     onClick={() => toggleJob(job.key)}
//                   />
//                 ))}
//               </div>

//               <div className="mt-6">
//                 <label className={labelClass}>Languages Aria should speak</label>
//                 <div className="flex flex-wrap gap-2.5">
//                   {languageOptions.map((lang) => (
//                     <Chip
//                       key={lang.key}
//                       label={lang.label}
//                       selected={selectedLangs.includes(lang.key)}
//                       onClick={() => toggleLang(lang.key)}
//                     />
//                   ))}
//                 </div>
//               </div>

//               <div className="mt-5">
//                 <label className={labelClass}>Aria's greeting</label>
//                 <textarea
//                   className={inputClass}
//                   rows={2}
//                   defaultValue="Hi! This is Rina Salon, I'm Aria — how can I help you today?"
//                 />
//                 <div className="mt-1.5 text-[12px] text-text-faint">This is the first thing customers hear or read.</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* STEP 6 — CALENDAR */}
//         {current === 6 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 6 of 7" title="Connect your calendar" desc="So Aria only books real, open slots." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <ConnectRow icon="📅" title="Google Calendar" sub="Recommended" connected={connected.calendar} onConnect={() => connect('calendar')} />
//               <ConnectRow icon="🗂️" title="Simple slot list instead" sub="No calendar? Set fixed daily slots" connected={connected.slots} actionLabel="Set up" onConnect={() => connect('slots')} />
//               <ConnectRow icon="💳" title="Payment link (optional)" sub="For order confirmations" connected={connected.payment} actionLabel="Add UPI / link" onConnect={() => connect('payment')} />
//             </div>
//           </div>
//         )}

//         {/* STEP 7 — REVIEW */}
//         {current === 7 && (
//           <div className="animate-in fade-in duration-300">
//             <StepHead eyebrow="Step 7 of 7" title="Review before Aria goes live" desc="Check everything below — Aria starts answering as soon as you launch." />
//             <div className="rounded-[14px] border border-ink/10 bg-white p-7">
//               <SummaryRow k="Business" v="Rina Salon · Salon / Spa · Pune" onEdit={() => setCurrent(2)} />
//               <SummaryRow
//                 k="Telegram Bot"
//                 v={telegramToken ? 'Bot token connected' : 'Not connected'}
//                 onEdit={() => setCurrent(3)}
//               />
//               <SummaryRow k="WhatsApp" v={connected.whatsapp ? 'Connected' : 'Not connected'} onEdit={() => setCurrent(4)} />
//               <SummaryRow k="Jobs enabled" v={`${selectedJobs.length} selected`} onEdit={() => setCurrent(5)} />
//               <SummaryRow k="Languages" v={`${selectedLangs.length} selected`} onEdit={() => setCurrent(5)} />
//               <SummaryRow k="Calendar" v={connected.calendar ? 'Google Calendar connected' : 'Not connected'} onEdit={() => setCurrent(6)} />
//               <SummaryRow k="Plan" v="Growth — ₹3,999/month" onEdit={() => router.push('/#pricing')} isLast />
//             </div>
//           </div>
//         )}

//         {/* SUCCESS */}
//         {current === 8 && (
//           <div className="animate-in fade-in rounded-[14px] border border-ink/10 bg-white p-[50px] text-center duration-300">
//             <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-full bg-emerald-soft text-[32px] text-emerald">
//               ✓
//             </div>
//             <h1 className="font-display text-[28px] font-bold text-ink">Aria is on duty.</h1>
//             <p className="mx-auto mt-2.5 max-w-[420px] text-[15px] text-text-on-paper-dim">
//               She's now answering calls and WhatsApp messages for Rina Salon. You'll get your first daily report tonight.
//             </p>
//             <button
//               className="mt-6 rounded-full bg-ink px-[26px] py-3.5 text-[14.5px] font-semibold text-text-on-ink hover:opacity-90"
//               onClick={() => router.push('/dashboard')}
//             >
//               Go to my dashboard →
//             </button>
//           </div>
//         )}

//         {/* NAV */}
//         {current <= TOTAL_STEPS && (
//           <div className="mt-7 flex items-center justify-between">
//             <button
//               className="text-[14px] font-semibold text-text-on-paper-dim"
//               style={{ visibility: current === 1 ? 'hidden' : 'visible' }}
//               onClick={goBack}
//             >
//               ← Back
//             </button>
//             <button
//               className={`rounded-full px-[26px] py-3.5 text-[14.5px] font-semibold ${
//                 current === TOTAL_STEPS ? 'bg-amber text-ink' : 'bg-ink text-text-on-ink'
//               } hover:opacity-90`}
//               onClick={goNext}
//             >
//               {current === TOTAL_STEPS ? 'Launch Aria →' : 'Continue →'}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function StepHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
//   return (
//     <div className="mb-7">
//       <div className="mb-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-amber">{eyebrow}</div>
//       <h1 className="font-display text-[30px] font-bold tracking-tight text-ink">{title}</h1>
//       <p className="mt-2 max-w-[520px] text-[15px] text-text-on-paper-dim">{desc}</p>
//     </div>
//   );
// }

// function SummaryRow({ k, v, onEdit, isLast }: { k: string; v: string; onEdit: () => void; isLast?: boolean }) {
//   return (
//     <div className={`flex justify-between py-3.5 text-[13.5px] ${isLast ? '' : 'border-b border-dashed border-ink/10'}`}>
//       <span className="text-text-on-paper-dim">{k}</span>
//       <span className="font-semibold text-ink">
//         {v} <button onClick={onEdit} className="ml-2 text-[12px] font-semibold text-amber">Edit</button>
//       </span>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OptionCard from '@/components/onboarding/OptionCard';
import Chip from '@/components/onboarding/Chip';
import ConnectRow from '@/components/onboarding/ConnectRow';
import ProgressBar from '@/components/onboarding/ProgressBar';

const TOTAL_STEPS = 7;

const jobOptions = [
  { key: 'answer', icon: '📞', title: 'Answer customers', sub: 'Calls + WhatsApp questions', defaultSelected: true },
  { key: 'book', icon: '🗓️', title: 'Book appointments', sub: 'Syncs to your calendar', defaultSelected: true },
  { key: 'orders', icon: '🧾', title: 'Handle orders', sub: 'Takes and confirms orders', defaultSelected: false },
  { key: 'remind', icon: '⏰', title: 'Send reminders', sub: 'Before each appointment', defaultSelected: true },
  { key: 'followup', icon: '🎯', title: 'Follow up with leads', sub: 'Missed calls, unanswered chats', defaultSelected: true },
  { key: 'report', icon: '📊', title: 'Daily report', sub: 'Sent to you every evening', defaultSelected: true },
];

const languageOptions = [
  { key: 'en', label: 'English', defaultSelected: true },
  { key: 'hi', label: 'Hindi', defaultSelected: true },
  { key: 'mr', label: 'Marathi', defaultSelected: true },
  { key: 'gu', label: 'Gujarati', defaultSelected: false },
  { key: 'ta', label: 'Tamil', defaultSelected: false },
];

const inputClass =
  'w-full rounded-[9px] border border-ink/10 bg-paper px-3.5 py-3 text-[14px] text-ink placeholder:text-text-faint focus:outline-2 focus:outline-amber focus:outline-offset-1';
const labelClass = 'mb-2 block text-[13px] font-semibold text-ink';

export default function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Account State (Step 1)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  // Business State (Step 2)
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Salon / Spa');
  const [city, setCity] = useState('');
  const [opens, setOpens] = useState('');
  const [closes, setCloses] = useState('');
  const [servicesProvided, setServicesProvided] = useState('');

  // Telegram Token State (Step 3)
  const [telegramToken, setTelegramToken] = useState('');

  // Extra Options State (Steps 4 - 6)
  const [selectedJobs, setSelectedJobs] = useState<string[]>(
    jobOptions.filter((j) => j.defaultSelected).map((j) => j.key)
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    languageOptions.filter((l) => l.defaultSelected).map((l) => l.key)
  );
  const [connected, setConnected] = useState<Record<string, boolean>>({
    forwarding: false,
    whatsapp: true,
    calendar: true,
    slots: false,
    payment: false,
  });

  const toggleJob = (key: string) =>
    setSelectedJobs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleLang = (key: string) =>
    setSelectedLangs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const connect = (key: string) => setConnected((prev) => ({ ...prev, [key]: true }));

  const goBack = () => {
    setErrorMsg('');
    setCurrent((c) => Math.max(1, c - 1));
  };

  const handleLaunchAria = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/appointments/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName || 'Unnamed Business',
          businessType: businessType.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          city: city || 'Unknown City',
          opens: opens || '09:00 AM',
          closes: closes || '08:00 PM',
          servicesProvided: servicesProvided || 'General Services',
          telegramBotToken: telegramToken,
          // Optional structural data for future scale expansion:
          ownerDetails: { fullName, email, mobile }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize system registration backend profile.');
      }

      // Save the businessId so the dashboard knows which appointments belong
      // to this business. Your backend has no auth/session yet, so this is
      // currently the only link between the browser and a specific business.
      if (data.businessId) {
        localStorage.setItem('aria_business_id', data.businessId);
      }

      // If backend registration is clean, transition to step 8 success splash element
      setCurrent(8);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error. Ensure your server environment is listening.');
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (current === TOTAL_STEPS) {
      handleLaunchAria();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-body text-text-on-paper">
      <div className="mx-auto max-w-[960px] px-6 pb-[100px] pt-10">
        <div className="mb-11 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display text-[18px] font-bold text-ink">
            <span className="h-[9px] w-[9px] rounded-full bg-emerald" />
            Aria
          </div>
          <div className="font-mono text-[11.5px] text-text-faint">Progress saved automatically</div>
        </div>

        {current <= TOTAL_STEPS && <ProgressBar current={current} total={TOTAL_STEPS} />}

        {/* ERROR BOX */}
        {errorMsg && (
          <div className="mb-6 rounded-[10px] bg-rose-50 border border-rose-200 p-4 text-[13.5px] text-rose-700 animate-in fade-in duration-200">
            ⚠️ <strong>Launch Failed:</strong> {errorMsg}
          </div>
        )}

        {/* STEP 1 — ACCOUNT */}
        {current === 1 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 1 of 7" title="Create your account" desc="This is how you'll log in to see Aria's reports and manage your settings." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <div className="mb-5"><label className={labelClass}>Full name</label><input className={inputClass} type="text" placeholder="Rina Deshmukh" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div className="mb-5"><label className={labelClass}>Email address</label><input className={inputClass} type="email" placeholder="rina@rinasalon.in" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>Mobile number</label><input className={inputClass} type="text" placeholder="+91 98xxx xxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>
                <div><label className={labelClass}>Password</label><input className={inputClass} type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — BUSINESS */}
        {current === 2 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 2 of 7" title="Tell us about your business" desc="Aria uses this to answer customer questions correctly from day one." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <div className="mb-5"><label className={labelClass}>Business name</label><input className={inputClass} type="text" placeholder="Rina Salon" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></div>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Business type</label>
                  <select className={inputClass} value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                    <option>Salon / Spa</option>
                    <option>Clinic</option>
                    <option>Restaurant / Cafe</option>
                    <option>Retail store</option>
                    <option>Services (repair, tuition, etc.)</option>
                    <option>Other</option>
                  </select>
                </div>
                <div><label className={labelClass}>City</label><input className={inputClass} type="text" placeholder="Pune" value={city} onChange={(e) => setCity(e.target.value)} /></div>
              </div>
              <div className="mb-5">
                <label className={labelClass}>Business hours</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input className={inputClass} type="text" placeholder="Opens — 10:00 AM" value={opens} onChange={(e) => setOpens(e.target.value)} />
                  <input className={inputClass} type="text" placeholder="Closes — 8:00 PM" value={closes} onChange={(e) => setCloses(e.target.value)} />
                </div>
                <div className="mt-1.5 text-[12px] text-text-faint">Aria will only take bookings inside these hours unless you turn on 24×7 mode later.</div>
              </div>
              <div>
                <label className={labelClass}>Services / products you offer</label>
                <textarea className={inputClass} rows={3} placeholder="Haircut, hair spa, facial, bridal package..." value={servicesProvided} onChange={(e) => setServicesProvided(e.target.value)} />
                <div className="mt-1.5 text-[12px] text-text-faint">One line is fine — Aria uses this to answer "do you offer X" questions.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — TELEGRAM BOT CONFIGURATION */}
        {current === 3 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 3 of 7" title="Deploy your individual AI employee" desc="Create a dedicated Telegram bot for your shop. Aria will answer customers directly through it." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <div className="mb-6 rounded-[10px] border border-amber/20 bg-amber/10 p-4 text-[13.5px] text-ink/80">
                <p className="mb-1 font-bold">💡 Quick 1-Minute Setup:</p>
                <ol className="list-inside list-decimal space-y-1 text-[13px]">
                  <li>Open Telegram and search for <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="font-semibold text-amber underline">@BotFather</a></li>
                  <li>Send the command <code>/newbot</code> and follow the prompts to name it.</li>
                  <li>Copy the <strong>HTTP API Token</strong> provided by BotFather and paste it below.</li>
                </ol>
              </div>

              <div className="mb-5">
                <label className={labelClass}>Your Telegram Bot Token</label>
                <input className={inputClass} type="text" placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} />
              </div>

              <ConnectRow
                icon="🤖"
                title="Bot Connection Status"
                sub={telegramToken ? 'Token detected! Ready to initialize.' : 'Waiting for bot token...'}
                connected={telegramToken.length > 20}
                actionLabel="Verify Token"
                onConnect={() => connect('forwarding')}
              />
            </div>
          </div>
        )}

        {/* STEP 4 — WHATSAPP */}
        {current === 4 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 4 of 7" title="Connect WhatsApp" desc="Aria replies to customer messages on your WhatsApp Business number." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <ConnectRow icon="💬" title="WhatsApp Business" sub="Connect the same number as your call line" connected={connected.whatsapp} onConnect={() => connect('whatsapp')} />
              <ConnectRow icon="🖼" title="Business profile photo & catalog" sub="Optional — shows in customer chats" connected={false} actionLabel="Upload" onConnect={() => {}} />
              <div className="mt-6 rounded-xl bg-ink p-5 text-text-on-ink">
                <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-text-on-ink-dim">How it will look to your customer</div>
                <div className="rounded-[10px] bg-white/[0.06] p-3.5 text-[13.5px] leading-relaxed">
                  Hi! This is {businessName || 'Our Shop'} 👋 I'm Aria, I help with bookings and questions here. How can I help you today?
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — CONFIGURE ARIA */}
        {current === 5 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 5 of 7" title="Set up what Aria can do" desc="Turn on the jobs you want handled automatically. You can change these anytime." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {jobOptions.map((job) => (
                  <OptionCard key={job.key} icon={job.icon} title={job.title} sub={job.sub} selected={selectedJobs.includes(job.key)} onClick={() => toggleJob(job.key)} />
                ))}
              </div>
              <div className="mt-6">
                <label className={labelClass}>Languages Aria should speak</label>
                <div className="flex flex-wrap gap-2.5">
                  {languageOptions.map((lang) => (
                    <Chip key={lang.key} label={lang.label} selected={selectedLangs.includes(lang.key)} onClick={() => toggleLang(lang.key)} />
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <label className={labelClass}>Aria's greeting</label>
                <textarea className={inputClass} rows={2} defaultValue={`Hi! This is ${businessName || 'Our Shop'}, I'm Aria — how can I help you today?`} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 — CALENDAR */}
        {current === 6 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 6 of 7" title="Connect your calendar" desc="So Aria only books real, open slots." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <ConnectRow icon="📅" title="Google Calendar" sub="Recommended" connected={connected.calendar} onConnect={() => connect('calendar')} />
              <ConnectRow icon="🗂️" title="Simple slot list instead" sub="No calendar? Set fixed daily slots" connected={connected.slots} actionLabel="Set up" onConnect={() => connect('slots')} />
              <ConnectRow icon="💳" title="Payment link (optional)" sub="For order confirmations" connected={connected.payment} actionLabel="Add UPI / link" onConnect={() => connect('payment')} />
            </div>
          </div>
        )}

        {/* STEP 7 — REVIEW */}
        {current === 7 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 7 of 7" title="Review before Aria goes live" desc="Check everything below — Aria starts answering as soon as you launch." />
            <div className="rounded-[14px] border border-ink/10 bg-white p-7">
              <SummaryRow k="Business" v={`${businessName || 'Not Set'} · ${businessType} · ${city || 'Not Set'}`} onEdit={() => setCurrent(2)} />
              <SummaryRow k="Telegram Bot" v={telegramToken ? `Connected Bot (${telegramToken.substring(0, 6)}...)` : 'Not connected'} onEdit={() => setCurrent(3)} />
              <SummaryRow k="WhatsApp" v={connected.whatsapp ? 'Connected' : 'Not connected'} onEdit={() => setCurrent(4)} />
              <SummaryRow k="Jobs enabled" v={`${selectedJobs.length} selected`} onEdit={() => setCurrent(5)} />
              <SummaryRow k="Languages" v={`${selectedLangs.length} selected`} onEdit={() => setCurrent(5)} />
              <SummaryRow k="Calendar" v={connected.calendar ? 'Google Calendar connected' : 'Not connected'} onEdit={() => setCurrent(6)} />
              <SummaryRow k="Plan" v="Growth — ₹3,999/month" onEdit={() => router.push('/#pricing')} isLast />
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {current === 8 && (
          <div className="animate-in fade-in rounded-[14px] border border-ink/10 bg-white p-[50px] text-center duration-300">
            <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-full bg-emerald-soft text-[32px] text-emerald">✓</div>
            <h1 className="font-display text-[28px] font-bold text-ink">Aria is on duty.</h1>
            <p className="mx-auto mt-2.5 max-w-[420px] text-[15px] text-text-on-paper-dim">
              She's now answering messages for <strong>{businessName || 'your business'}</strong>. You'll get your first report tonight.
            </p>
            <button className="mt-6 rounded-full bg-ink px-[26px] py-3.5 text-[14.5px] font-semibold text-text-on-ink hover:opacity-90" onClick={() => router.push('/dashboard')}>
              Go to my dashboard →
            </button>
          </div>
        )}

        {/* NAV */}
        {current <= TOTAL_STEPS && (
          <div className="mt-7 flex items-center justify-between">
            <button className="text-[14px] font-semibold text-text-on-paper-dim" style={{ visibility: current === 1 ? 'hidden' : 'visible' }} onClick={goBack} disabled={loading}>
              ← Back
            </button>
            <button
              className={`rounded-full px-[26px] py-3.5 text-[14.5px] font-semibold transition-opacity ${
                current === TOTAL_STEPS ? 'bg-amber text-ink' : 'bg-ink text-text-on-ink'
              } hover:opacity-90 disabled:opacity-50`}
              onClick={goNext}
              disabled={loading}
            >
              {loading ? 'Processing...' : current === TOTAL_STEPS ? 'Launch Aria →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-amber">{eyebrow}</div>
      <h1 className="font-display text-[30px] font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-[520px] text-[15px] text-text-on-paper-dim">{desc}</p>
    </div>
  );
}

function SummaryRow({ k, v, onEdit, isLast }: { k: string; v: string; onEdit: () => void; isLast?: boolean }) {
  return (
    <div className={`flex justify-between py-3.5 text-[13.5px] ${isLast ? '' : 'border-b border-dashed border-ink/10'}`}>
      <span className="text-text-on-paper-dim">{k}</span>
      <span className="font-semibold text-ink">
        {v} <button onClick={onEdit} className="ml-2 text-[12px] font-semibold text-amber">Edit</button>
      </span>
    </div>
  );
}

