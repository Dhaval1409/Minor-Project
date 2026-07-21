'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';

function Reveal({ children }: { children: ReactNode }) {
  const [isIn, setIsIn] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setIsIn(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-600 ease-out ${
        isIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[18px]'
      }`}
    >
      {children}
    </div>
  );
}

const responsibilities = [
  { icon: '📞', title: 'Answer customers', desc: 'Picks up every call and WhatsApp message, answers questions about hours, pricing, and services.' },
  { icon: '🗓️', title: 'Book appointments', desc: 'Checks your calendar live and confirms a slot on the spot — no back-and-forth.' },
  { icon: '🧾', title: 'Handle orders', desc: 'Takes down orders, confirms details, and passes them straight to your counter.' },
  { icon: '⏰', title: 'Send reminders', desc: 'Follows up before appointments so customers actually show up.' },
  { icon: '🎯', title: 'Follow up with leads', desc: "Calls back anyone who enquired but didn't convert, in their preferred language." },
  { icon: '📊', title: 'Generate reports', desc: 'Sends you a daily summary — calls handled, bookings made, leads pending.' },
];

const testimonials = [
  { quote: "I used to lose bookings every time I was cutting someone's hair. Now Aria takes them while I work.", initial: 'R', name: 'Rina Salon', biz: 'Unisex Salon, Pune' },
  { quote: 'Customers message us at 11pm asking about stock. Aria replies, I just check the report in the morning.', initial: 'S', name: 'Sundar Kirana', biz: 'General Store, Nashik' },
  { quote: "Cheaper than one part-time receptionist and doesn't take a single day off.", initial: 'M', name: 'Meera Clinic', biz: 'Dental Clinic, Thane' },
];

const faqs = [
  { q: 'Does Aria really sound natural on calls?', a: "Yes — Aria uses a natural voice engine, not a robotic IVR. Most customers don't realise they're speaking to an AI unless told." },
  { q: "What happens if a customer asks something Aria can't answer?", a: 'She notes it down and either escalates to you directly on WhatsApp or offers a callback — she never guesses.' },
  { q: 'Do I need any special hardware or a new phone number?', a: 'No. Aria connects to your existing business number and calendar — nothing to install.' },
  { q: 'Can I cancel anytime?', a: 'Yes, month to month, no lock-in contract.' },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="bg-paper font-body text-text-on-paper min-h-screen">
      {/* ---------- NAV ---------- */}
      <nav className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-[1180px] mx-auto px-8 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-2.5 font-display font-bold text-[20px] tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald shadow-[0_0_0_4px_rgba(31,138,112,0.15)]"></span>
            Aria
          </div>
          <div className="hidden md:flex gap-9 text-[14.5px] font-medium text-text-on-paper-dim">
            <a href="#responsibilities" className="hover:text-ink transition-colors">What she does</a>
            <a href="#channels" className="hover:text-ink transition-colors">Calls + WhatsApp</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
            <a href="/onboarding" className="hover:text-ink transition-colors">setUp</a>
            <a href="/dashboard" className="hover:text-ink transition-colors">Dashboard</a>
          </div>
          <button className="bg-ink text-text-on-ink px-5 py-2.5 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity">
            Hire Aria
          </button>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="py-22 md:py-[88px] pb-[100px] bg-[radial-gradient(600px_300px_at_85%_-10%,rgba(217,142,43,0.16),transparent_60%)] overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <div className="font-mono text-[12.5px] tracking-[0.08em] uppercase text-emerald font-semibold flex items-center gap-2 mb-[22px] before:content-[''] before:w-1.5 before:h-1.5 before:bg-emerald before:rounded-full">
              Now hiring — starts today
            </div>
            <h1 className="font-display font-bold text-[38px] md:text-[58px] leading-[1.04] tracking-tight text-ink">
              Hire an AI<br />employee for<br />
              <span className="text-amber">₹1,999/month.</span>
            </h1>
            <p className="mt-[22px] text-[18px] text-text-on-paper-dim max-w-[460px] leading-relaxed">
              Aria answers your phone, replies on WhatsApp, books appointments, and follows up with every lead — while you run the shop.
            </p>
            <div className="flex flex-wrap gap-3.5 mt-[34px]">
              <button className="bg-ink text-text-on-ink py-[15px] px-[26px] rounded-full font-semibold text-[15px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                Hire Aria today →
              </button>
              <button className="bg-transparent text-ink border-[1.5px] border-ink/10 py-[15px] px-[26px] rounded-full font-semibold text-[15px] hover:bg-ink/5 transition-colors">
                Hear a sample call
              </button>
            </div>
            <div className="mt-[18px] text-[13px] text-text-on-paper-dim font-mono">
              No hardware. No hiring hassle. Cancel anytime.
            </div>
          </div>

          {/* ID Badge Widget */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-[360px]">
              <div className="bg-ink rounded-[20px] p-[26px] text-text-on-ink shadow-[0_30px_60px_-20px_rgba(18,23,43,0.45)] relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <div className="font-mono text-[10.5px] tracking-wider uppercase text-text-on-ink-dim">Employee ID · AI-0417</div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald font-semibold">
                    <span className="w-[7px] h-[7px] rounded-full bg-emerald animate-ping"></span>
                    ON DUTY
                  </div>
                </div>
                <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-amber-soft to-amber flex items-center justify-center font-display font-bold text-2xl text-ink mb-4">
                  A
                </div>
                <div className="font-display text-[22px] font-bold">Aria</div>
                <div className="text-[13.5px] text-text-on-ink-dim mt-0.5">Front Desk &amp; Bookings</div>
                <div className="h-px bg-line-dark my-[18px]"></div>
                <div className="flex justify-between text-[12.5px] py-1.5 font-mono text-text-on-ink-dim"><span>DEPARTMENT</span><span className="font-sans font-semibold text-text-on-ink">Calls + WhatsApp</span></div>
                <div className="flex justify-between text-[12.5px] py-1.5 font-mono text-text-on-ink-dim"><span>SHIFT</span><span className="font-sans font-semibold text-text-on-ink">24 × 7</span></div>
                <div className="flex justify-between text-[12.5px] py-1.5 font-mono text-text-on-ink-dim"><span>LANGUAGES</span><span className="font-sans font-semibold text-text-on-ink">EN · HI · MR</span></div>
                <div className="flex justify-between text-[12.5px] py-1.5 font-mono text-text-on-ink-dim"><span>REPORTS TO</span><span className="font-sans font-semibold text-text-on-ink">You</span></div>
              </div>

              {/* Ticker Updates */}
              <div className="max-w-[340px] mt-[-30px] ml-10 relative z-0 space-y-2.5">
                <div className="bg-paper border border-ink/10 rounded-[12px] p-3 text-[12.5px] flex items-center gap-2.5 shadow-[0_12px_24px_-12px_rgba(18,23,43,0.18)]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald"></span>
                  <span><b className="font-semibold">Booked</b> 4:30pm haircut</span>
                  <span className="text-text-on-paper-dim font-mono text-[11px] ml-auto whitespace-nowrap">just now</span>
                </div>
                <div className="bg-paper border border-ink/10 rounded-[12px] p-3 text-[12.5px] flex items-center gap-2.5 shadow-[0_12px_24px_-12px_rgba(18,23,43,0.18)]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber"></span>
                  <span><b className="font-semibold">Order</b> confirmed #1042</span>
                  <span className="text-text-on-paper-dim font-mono text-[11px] ml-auto whitespace-nowrap">2m ago</span>
                </div>
                <div className="bg-paper border border-ink/10 rounded-[12px] p-3 text-[12.5px] flex items-center gap-2.5 shadow-[0_12px_24px_-12px_rgba(18,23,43,0.18)]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald"></span>
                  <span><b className="font-semibold">Reminder</b> sent to 12 leads</span>
                  <span className="text-text-on-paper-dim font-mono text-[11px] ml-auto whitespace-nowrap">6m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STAT STRIP ---------- */}
      <section className="bg-ink text-text-on-ink py-11">
        <div className="max-w-[1180px] mx-auto px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div>
            <div className="font-display text-[34px] font-bold text-amber-soft">0</div>
            <div className="text-[13.5px] text-text-on-ink-dim mt-1">Calls missed after hiring Aria</div>
          </div>
          <div>
            <div className="font-display text-[34px] font-bold text-amber-soft">24×7</div>
            <div className="text-[13.5px] text-text-on-ink-dim mt-1">Always answers, even at 2am</div>
          </div>
          <div>
            <div className="font-display text-[34px] font-bold text-amber-soft">₹1,999</div>
            <div className="text-[13.5px] text-text-on-ink-dim mt-1">Cheaper than a part-time receptionist</div>
          </div>
        </div>
      </section>

      {/* ---------- JOB DESCRIPTION ---------- */}
      <section className="py-[110px]" id="responsibilities">
        <div className="max-w-[1180px] mx-auto px-8">
          <Reveal>
            <div className="max-w-[600px] mb-14">
              <div className="font-mono text-[12.5px] tracking-wider uppercase text-amber font-semibold flex items-center gap-2 mb-4 before:content-[''] before:w-1.5 before:h-1.5 before:bg-amber before:rounded-full">
                Job description
              </div>
              <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-ink">
                Everything a front-desk hire would do — minus the sick days.
              </h2>
              <p className="mt-3.5 text-[16.5px] text-text-on-paper-dim">Aria&apos;s role is written into her onboarding, the same as any new employee.</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-card border border-ink/10 rounded-[18px] overflow-hidden shadow-[0_40px_80px_-40px_rgba(18,23,43,0.2)]">
              <div className="p-[26px] sm:px-8 border-b border-dashed border-ink/10 flex justify-between items-center flex-wrap gap-2">
                <span className="font-mono text-[12px] tracking-wider uppercase text-text-on-paper-dim">Role &amp; Responsibilities</span>
                <span className="font-mono text-[12px] text-text-on-paper-dim">Doc AI-0417 / Rev. 3</span>
              </div>
              {responsibilities.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr_1fr] gap-5 p-[22px] sm:px-8 border-b border-ink/10 last:border-b-0 items-start">
                  <div className="w-10 h-10 rounded-[10px] bg-paper-dim flex items-center justify-center text-[18px]">
                    {item.icon}
                  </div>
                  <div className="font-display font-semibold text-[17px] text-ink">{item.title}</div>
                  <div className="text-[14.5px] text-text-on-paper-dim col-span-2 sm:col-span-1 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CHANNELS ---------- */}
      <section className="pb-[110px]" id="channels">
        <div className="max-w-[1180px] mx-auto px-8">
          <Reveal>
            <div className="max-w-[600px] mb-14">
              <div className="font-mono text-[12.5px] tracking-wider uppercase text-amber font-semibold flex items-center gap-2 mb-4 before:content-[''] before:w-1.5 before:h-1.5 before:bg-amber before:rounded-full">
                Two ways in
              </div>
              <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-ink">She picks up the phone. She replies on WhatsApp too.</h2>
              <p className="mt-3.5 text-[16.5px] text-text-on-paper-dim">Customers reach you however they already do — Aria handles both the same way.</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Voice Card */}
              <div className="bg-ink rounded-[18px] p-[30px] text-text-on-ink overflow-hidden">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-amber/18 text-amber-soft mb-[18px]">
                  ☎ Voice call
                </span>
                <h3 className="font-display text-[22px] font-bold mb-2.5">Sounds like a real person</h3>
                <p className="text-[14.5px] text-text-on-ink-dim leading-relaxed">Natural voice, no call-centre script. Understands Hindi, Marathi and English mid-conversation.</p>
                <div className="mt-[22px] flex flex-col gap-2">
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-bl-sm text-[13px] leading-snug bg-white/5 self-start">Do you have a slot tomorrow evening?</div>
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-br-sm text-[13px] leading-snug bg-amber text-ink self-end font-medium">Yes — 6:15pm is open. Should I book that for you?</div>
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-bl-sm text-[13px] leading-snug bg-white/5 self-start">Yes please, under Priya.</div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-paper-dim border border-ink/10 rounded-[18px] p-[30px] text-text-on-paper overflow-hidden">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald/12 text-emerald mb-[18px]">
                  💬 WhatsApp
                </span>
                <h3 className="font-display text-[22px] font-bold mb-2.5">Same conversation, in writing</h3>
                <p className="text-[14.5px] text-text-on-paper-dim leading-relaxed">Order confirmations, reminders and follow-ups land where your customers already check first.</p>
                <div className="mt-[22px] flex flex-col gap-2">
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-bl-sm text-[13px] leading-snug bg-white border border-ink/10 self-start">Is the blue kurta size M in stock?</div>
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-br-sm text-[13px] leading-snug bg-emerald text-white self-end">Yes, 2 left. Want me to hold one and share the payment link?</div>
                  <div className="max-w-[82%] p-3.5 rounded-[12px] rounded-bl-sm text-[13px] leading-snug bg-white border border-ink/10 self-start">Yes, hold it!</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- PRICING ---------- */}
      <section className="py-[110px] bg-paper-dim" id="pricing">
        <div className="max-w-[1180px] mx-auto px-8">
          <Reveal>
            <div className="max-w-[600px] mb-14">
              <div className="font-mono text-[12.5px] tracking-wider uppercase text-amber font-semibold flex items-center gap-2 mb-4 before:content-[''] before:w-1.5 before:h-1.5 before:bg-amber before:rounded-full">
                Offer letter
              </div>
              <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-ink">Simple pricing. No setup fee, no call-minute math.</h2>
              <p className="mt-3.5 text-[16.5px] text-text-on-paper-dim">Pick a plan the way you&apos;d pick a role for a new hire.</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Plan 1 */}
              <div className="bg-card border border-ink/10 rounded-[18px] flex flex-col overflow-hidden">
                <div className="p-[26px] pb-5 border-b border-dashed border-ink/10">
                  <div className="font-mono text-[10.5px] text-text-on-paper-dim uppercase tracking-wider mb-3.5">Part-time hire</div>
                  <div className="font-display font-bold text-[20px]">Starter</div>
                  <div className="mt-3.5 flex items-baseline gap-1.5">
                    <span className="font-display text-[36px] font-bold">₹1,999</span>
                    <span className="text-[13px] text-text-on-paper-dim">/ month</span>
                  </div>
                </div>
                <div className="p-[26px] pt-[22px] flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>WhatsApp replies + order handling</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Up to 300 conversations / month</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Daily report on WhatsApp</div>
                    <div className="flex gap-2.5 text-[13.5px] text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>English + Hindi</div>
                  </div>
                  <button className="mt-6 w-full py-3.5 rounded-[10px] font-semibold text-[14px] border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink/5 transition-colors">
                    Hire on Starter
                  </button>
                </div>
              </div>

              {/* Plan 2 Featured */}
              <div className="bg-card border-2 border-ink rounded-[18px] flex flex-col overflow-hidden relative lg:-translate-y-2.5 shadow-lg">
                <div className="absolute top-0 right-0 bg-amber text-ink font-mono text-[10.5px] font-semibold tracking-wider px-3.5 py-1.5 rounded-bl-[10px] uppercase">Most hired</div>
                <div className="p-[26px] pb-5 border-b border-dashed border-ink/10">
                  <div className="font-mono text-[10.5px] text-text-on-paper-dim uppercase tracking-wider mb-3.5">Full-time hire</div>
                  <div className="font-display font-bold text-[20px]">Growth</div>
                  <div className="mt-3.5 flex items-baseline gap-1.5">
                    <span className="font-display text-[36px] font-bold">₹3,999</span>
                    <span className="text-[13px] text-text-on-paper-dim">/ month</span>
                  </div>
                </div>
                <div className="p-[26px] pt-[22px] flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Everything in Starter</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Voice calls, 24×7</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Appointment booking + calendar sync</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Lead follow-up calls</div>
                    <div className="flex gap-2.5 text-[13.5px] text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>English + Hindi + Marathi</div>
                  </div>
                  <button className="mt-6 w-full py-3.5 rounded-[10px] font-semibold text-[14px] bg-ink text-text-on-ink hover:opacity-90 transition-opacity">
                    Hire on Growth
                  </button>
                </div>
              </div>

              {/* Plan 3 */}
              <div className="bg-card border border-ink/10 rounded-[18px] flex flex-col overflow-hidden">
                <div className="p-[26px] pb-5 border-b border-dashed border-ink/10">
                  <div className="font-mono text-[10.5px] text-text-on-paper-dim uppercase tracking-wider mb-3.5">Team of one, output of five</div>
                  <div className="font-display font-bold text-[20px]">Pro</div>
                  <div className="mt-3.5 flex items-baseline gap-1.5">
                    <span className="font-display text-[36px] font-bold">₹6,999</span>
                    <span className="text-[13px] text-text-on-paper-dim">/ month</span>
                  </div>
                </div>
                <div className="p-[26px] pt-[22px] flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Everything in Growth</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Unlimited conversations</div>
                    <div className="flex gap-2.5 text-[13.5px] border-b border-ink/10 pb-2 text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Multiple staff logins</div>
                    <div className="flex gap-2.5 text-[13.5px] text-text-on-paper-dim"><span className="text-emerald font-bold">✓</span>Priority support line</div>
                  </div>
                  <button className="mt-6 w-full py-3.5 rounded-[10px] font-semibold text-[14px] border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink/5 transition-colors">
                    Hire on Pro
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="py-[110px]">
        <div className="max-w-[1180px] mx-auto px-8">
          <Reveal>
            <div className="max-w-[600px] mb-14">
              <div className="font-mono text-[12.5px] tracking-wider uppercase text-amber font-semibold flex items-center gap-2 mb-4 before:content-[''] before:w-1.5 before:h-1.5 before:bg-amber before:rounded-full">
                From the shop floor
              </div>
              <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-ink">Small business owners, on hiring Aria.</h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-card border border-ink/10 rounded-[16px] p-[26px]">
                  <p className="text-[14.5px] leading-relaxed text-text-on-paper">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-2.5 mt-[18px]">
                    <div className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center font-display font-bold text-[13px] text-ink">{t.initial}</div>
                    <div>
                      <div className="text-[13px] font-semibold">{t.name}</div>
                      <div className="text-[12px] text-text-on-paper-dim">{t.biz}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="pb-[110px]" id="faq">
        <div className="max-w-[1180px] mx-auto px-8">
          <Reveal>
            <div className="max-w-[600px] mb-14">
              <div className="font-mono text-[12.5px] tracking-wider uppercase text-amber font-semibold flex items-center gap-2 mb-4 before:content-[''] before:w-1.5 before:h-1.5 before:bg-amber before:rounded-full">
                Before you hire
              </div>
              <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-ink">Common questions</h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="max-w-[760px] border-t border-ink/10">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border-b border-ink/10">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full bg-none border-none text-left py-[22px] flex justify-between items-center cursor-pointer font-display text-[16.5px] font-semibold text-ink"
                    >
                      {faq.q}
                      <span className={`text-[20px] text-amber transform transition-transform duration-250 ${isOpen ? 'rotate-45' : ''}`}>
                        +
                      </span>
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ maxHeight: isOpen ? '200px' : '0px' }}
                    >
                      <p className="pb-[22px] text-[14.5px] text-text-on-paper-dim leading-relaxed max-w-[600px]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="bg-ink text-text-on-ink py-[110px] text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(500px_260px_at_50%_0%,rgba(217,142,43,0.18),transparent_65%)]">
        <div className="max-w-[1180px] mx-auto px-8 relative z-10">
          <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-text-on-ink">
            Your next employee doesn&apos;t need a desk.
          </h2>
          <p className="text-text-on-ink-dim max-w-[460px] mx-auto mt-4 text-[16.5px]">
            Onboard Aria in under 15 minutes and stop missing calls today.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 mt-[34px]">
            <button className="bg-amber text-ink py-[15px] px-[26px] rounded-full font-semibold text-[15px] hover:opacity-95 transition-opacity">
              Hire Aria today →
            </button>
            <button className="bg-transparent text-text-on-ink border-[1.5px] border-line-dark py-[15px] px-[26px] rounded-full font-semibold text-[15px] hover:bg-white/5 transition-colors">
              Talk to us first
            </button>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="py-11 border-t border-ink/10">
        <div className="max-w-[1180px] mx-auto px-8 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 font-display font-bold text-[20px] tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald"></span>
            Aria
          </div>
          <div className="flex gap-6 text-[13.5px] text-text-on-paper-dim">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">Contact</a>
          </div>
          <div className="text-[13px] text-text-on-paper-dim font-mono">
            © 2026 Aria AI Employees
          </div>
        </div>
      </footer>
    </div>
  );
}