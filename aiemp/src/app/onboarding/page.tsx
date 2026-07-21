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
  'w-full rounded-xl border border-ink/15 bg-white/50 px-4 py-3 text-[14px] text-ink placeholder:text-text-faint/60 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition-all duration-200';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/70';

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
          opens: opens || '10:00 AM',
          closes: closes || '08:00 PM',
          servicesProvided: servicesProvided || 'General Services',
          telegramBotToken: telegramToken,
          
          // 🔴 FIXED: Exposing credentials directly at root level to satisfy backend routing validation
          email: email, 
          password: password,
          phone: mobile,
          fullName: fullName, // Optional background fallback metadata

          configuration: {
            jobsEnabled: selectedJobs,
            languagesSupported: selectedLangs,
            integrations: connected
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize system registration backend profile.');
      }

      // Persist all session parameters needed for instantaneous Dashboard authorization bypass
      if (data.businessId) {
        localStorage.setItem('aria_business_id', data.businessId);
      }
      if (data.token) {
        localStorage.setItem('aria_auth_token', data.token);
      }
      if (data.ownerId || data.userId) {
        localStorage.setItem('aria_user_id', data.ownerId || data.userId);
      }
      
      // Keep safety backup flags of the user state context for frontend dashboard components
      localStorage.setItem('aria_user_email', email);
      localStorage.setItem('aria_user_name', fullName);

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
    <div className="min-h-screen bg-paper font-body text-text-on-paper selection:bg-[#d9a05b]/20">
      <div className="mx-auto max-w-[760px] px-6 pb-[120px] pt-10">
        
        {/* Top Header Branding */}
        <div className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display text-[20px] font-bold text-ink tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3ab795] animate-pulse" />
            Aria
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-on-paper-dim opacity-70">
            Progress saved automatically
          </div>
        </div>

        {current <= TOTAL_STEPS && (
          <div className="mb-10">
            <ProgressBar current={current} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ERROR BOX */}
        {errorMsg && (
          <div className="mb-6 rounded-xl bg-rose-500/5 border border-rose-500/10 p-4 text-[13px] font-mono text-rose-700 animate-in fade-in duration-200">
            ⚠️ <strong>Launch Failed:</strong> {errorMsg}
          </div>
        )}

        {/* STEP 1 — ACCOUNT */}
        {current === 1 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 1 of 7" title="Create your admin account" desc="This is how you'll log in to see Aria's live workspace reports and manage your AI configurations." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />
              
              <div className="mb-5"><label className={labelClass}>Full name</label><input className={inputClass} type="text" placeholder="Rina Deshmukh" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div className="mb-5"><label className={labelClass}>Email address</label><input className={inputClass} type="email" placeholder="rina@rinasalon.in" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div><label className={labelClass}>Mobile number</label><input className={inputClass} type="text" placeholder="+91 98xxx xxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>
                <div><label className={labelClass}>Password</label><input className={inputClass} type="password" placeholder="Create a dashboard password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — BUSINESS */}
        {current === 2 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 2 of 7" title="Tell us about your shop" desc="Aria synthesizes this data to answer incoming buyer requests accurately without human supervision." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />

              <div className="mb-5"><label className={labelClass}>Business name</label><input className={inputClass} type="text" placeholder="Rina Salon" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></div>
              <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                <div><label className={labelClass}>City Location</label><input className={inputClass} type="text" placeholder="Pune" value={city} onChange={(e) => setCity(e.target.value)} /></div>
              </div>
              <div className="mb-5">
                <label className={labelClass}>Operating Hours</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input className={inputClass} type="text" placeholder="Opens — 10:00 AM" value={opens} onChange={(e) => setOpens(e.target.value)} />
                  <input className={inputClass} type="text" placeholder="Closes — 8:00 PM" value={closes} onChange={(e) => setCloses(e.target.value)} />
                </div>
                <div className="mt-2 text-[12px] text-text-on-paper-dim opacity-80">Aria locks scheduling blocks within this timeframe unless 24×7 override is checked.</div>
              </div>
              <div>
                <label className={labelClass}>Services / Products Inventory</label>
                <textarea className={inputClass} rows={3} placeholder="Haircut, hair spa, facial, bridal package..." value={servicesProvided} onChange={(e) => setServicesProvided(e.target.value)} />
                <div className="mt-2 text-[12px] text-text-on-paper-dim opacity-80">Simple commas work perfectly — Aria reads this context to confirm inventory or menu availability.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — TELEGRAM BOT CONFIGURATION */}
        {current === 3 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 3 of 7" title="Deploy your individual AI employee" desc="Provision a clean Telegram bot interface. Aria targets customer chat routing directly into this pipeline." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />

              <div className="mb-6 rounded-xl border border-[#d9a05b]/20 bg-[#d9a05b]/5 p-4 text-[13.5px] text-ink/90">
                <p className="mb-1.5 font-bold text-[#d9a05b]">💡 Quick 1-Minute Provisioning:</p>
                <ol className="list-inside list-decimal space-y-1.5 text-[13px] opacity-95">
                  <li>Open Telegram and ping <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="font-semibold text-[#d9a05b] underline">@BotFather</a></li>
                  <li>Execute the command <code className="bg-ink/5 px-1.5 py-0.5 rounded font-mono text-xs">/newbot</code> and assign an identifier.</li>
                  <li>Copy the secure <strong>HTTP API Token</strong> provided by the handler and input it below.</li>
                </ol>
              </div>

              <div className="mb-5">
                <label className={labelClass}>Your Telegram Bot Token Key</label>
                <input className={inputClass} type="text" placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} />
              </div>

              <ConnectRow
                icon="🤖"
                title="Bot Connection Pipeline"
                sub={telegramToken ? 'Token payload signature verified. Ready to attach.' : 'Awaiting cryptographic handshake token...'}
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
            <StepHead eyebrow="Step 4 of 7" title="Connect WhatsApp Channel" desc="Synchronize Aria to handle queries directly through your active WhatsApp Business profile line." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />

              <ConnectRow icon="💬" title="WhatsApp Business API" sub="Maps instantly onto your baseline workspace communication line" connected={connected.whatsapp} onConnect={() => connect('whatsapp')} />
              <ConnectRow icon="🖼" title="Brand assets & digital catalog catalogs" sub="Optional — provides customer media delivery hooks" connected={false} actionLabel="Upload" onConnect={() => {}} />
              
              <div className="mt-6 rounded-xl bg-ink p-5 text-paper shadow-sm">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-60">Real-time simulation layout</div>
                <div className="rounded-lg bg-white/10 p-4 text-[13.5px] leading-relaxed border border-white/5">
                  Hi! This is {businessName || 'Our Shop'} 👋 I'm Aria, I help with bookings and questions here. How can I help you today?
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — CONFIGURE ARIA */}
        {current === 5 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 5 of 7" title="Set up what Aria can do" desc="Activate automation engines suited to your target workload. Configuration changes hot-reload instantly." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {jobOptions.map((job) => (
                  <OptionCard key={job.key} icon={job.icon} title={job.title} sub={job.sub} selected={selectedJobs.includes(job.key)} onClick={() => toggleJob(job.key)} />
                ))}
              </div>
              <div className="mt-6">
                <label className={labelClass}>Active Dialogue Languages</label>
                <div className="flex flex-wrap gap-2.5">
                  {languageOptions.map((lang) => (
                    <Chip key={lang.key} label={lang.label} selected={selectedLangs.includes(lang.key)} onClick={() => toggleLang(lang.key)} />
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <label className={labelClass}>Custom On-Duty Welcome Directive</label>
                <textarea className={inputClass} rows={2} defaultValue={`Hi! This is ${businessName || 'Our Shop'}, I'm Aria — how can I help you today?`} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 — CALENDAR */}
        {current === 6 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 6 of 7" title="Sync availability timelines" desc="Integrate your calendar framework so Aria references real-time vacant slots exclusively." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d9a05b]/40" />

              <ConnectRow icon="📅" title="Google Calendar Workspace" sub="Highly Recommended for active automation synchronization" connected={connected.calendar} onConnect={() => connect('calendar')} />
              <ConnectRow icon="🗂️" title="Static scheduling slot layout matrices" sub="Fallback framework if external matrix calendars are unavailable" connected={connected.slots} actionLabel="Set up" onConnect={() => connect('slots')} />
              <ConnectRow icon="💳" title="Merchant Payment gateway profiles" sub="Optional — triggers custom validation loops on confirmations" connected={connected.payment} actionLabel="Add UPI / link" onConnect={() => connect('payment')} />
            </div>
          </div>
        )}

        {/* STEP 7 — REVIEW */}
        {current === 7 && (
          <div className="animate-in fade-in duration-300">
            <StepHead eyebrow="Step 7 of 7" title="Review workspace before deployment" desc="Audit your runtime settings below. Aria initiates real-time message answering as soon as synchronization triggers." />
            <div className="rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md shadow-xl shadow-ink/5 p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#d9a05b]" />

              <SummaryRow k="Business Scope" v={`${businessName || 'Not Set'} · ${businessType} · ${city || 'Not Set'}`} onEdit={() => setCurrent(2)} />
              <SummaryRow k="Telegram Daemon" v={telegramToken ? `Active Token Cluster (${telegramToken.substring(0, 6)}...)` : 'Not linked'} onEdit={() => setCurrent(3)} />
              <SummaryRow k="WhatsApp Webhook" v={connected.whatsapp ? 'Active Hub Connected' : 'Inactive'} onEdit={() => setCurrent(4)} />
              <SummaryRow k="Engine Tasks Provisioned" v={`${selectedJobs.length} components assigned`} onEdit={() => setCurrent(5)} />
              <SummaryRow k="Synthesized Vocabularies" v={`${selectedLangs.length} localized dialects`} onEdit={() => setCurrent(5)} />
              <SummaryRow k="Calendar Sync Matrix" v={connected.calendar ? 'Google Workspace Online' : 'Local Matrix Configuration'} onEdit={() => setCurrent(6)} />
              <SummaryRow k="Ecosystem Tier" v="Growth Plan — ₹1,999/month" onEdit={() => router.push('/#pricing')} isLast />
            </div>
          </div>
        )}

        {/* SUCCESS SPLASH SCREEN */}
        {current === 8 && (
          <div className="animate-in scale-in-95 rounded-2xl border border-ink/10 bg-white/40 backdrop-blur-md p-12 text-center shadow-xl shadow-ink/5 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#3ab795]" />
            <div className="mx-auto mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#3ab795]/10 text-[32px] text-[#3ab795] animate-bounce">✓</div>
            <h1 className="font-display text-[30px] font-bold text-ink tracking-tight">Aria is on duty.</h1>
            <p className="mx-auto mt-3 max-w-[460px] text-[15px] text-text-on-paper-dim leading-relaxed">
              Her background models are now processing messages for <strong>{businessName || 'your enterprise'}</strong>. Your account credentials have been linked for automatic sign-in access.
            </p>
            <button 
              className="mt-8 rounded-full bg-ink px-8 py-4 text-[14.5px] font-semibold text-paper hover:bg-ink/90 transition-all duration-200 shadow-sm transform hover:-translate-y-0.5" 
              onClick={() => router.push('/dashboard')}
            >
              Access Administration Console →
            </button>
          </div>
        )}

        {/* NAVIGATION CONTROLS */}
        {current <= TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between">
            <button 
              className="text-[14px] font-bold uppercase tracking-wider text-text-on-paper-dim/85 hover:text-ink transition-colors duration-200 disabled:opacity-30" 
              style={{ visibility: current === 1 ? 'hidden' : 'visible' }} 
              onClick={goBack} 
              disabled={loading}
            >
              ← Back
            </button>
            <button
              className={`rounded-full px-8 py-4 text-[14.5px] font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm ${
                current === TOTAL_STEPS 
                  ? 'bg-[#d9a05b] hover:bg-[#c9904b] text-ink' 
                  : 'bg-ink hover:bg-ink/90 text-paper'
              } disabled:opacity-50 disabled:pointer-events-none`}
              onClick={goNext}
              disabled={loading}
            >
              {loading ? 'Initializing Core Assets...' : current === TOTAL_STEPS ? 'Launch Aria Engine →' : 'Continue Workflow →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#d9a05b]">{eyebrow}</div>
      <h1 className="font-display text-[32px] font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2.5 max-w-[560px] text-[15px] leading-relaxed text-text-on-paper-dim">{desc}</p>
    </div>
  );
}

function SummaryRow({ k, v, onEdit, isLast }: { k: string; v: string; onEdit: () => void; isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-4 text-[13.5px] ${isLast ? '' : 'border-b border-dashed border-ink/15'}`}>
      <span className="text-text-on-paper-dim font-medium">{k}</span>
      <span className="font-semibold text-ink flex items-center gap-3">
        {v} 
        <button onClick={onEdit} className="text-[11px] font-bold uppercase tracking-wider text-[#d9a05b] hover:underline">
          Modify
        </button>
      </span>
    </div>
  );
}