'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://minor-project-five-iota.vercel.app';
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: '',
    city: '',
    openingHours: '',
    closingHours: '',
    services: '',
    telegramBotToken: '',
  });

  const REG_STEPS = 3;
  const [regStep, setRegStep] = useState(1);

  const validateRegStep = (step: number) => {
    if (step === 1) {
      if (!regData.name || !regData.email || !regData.phone || !regData.password) {
        setErrorMsg('Please fill in all required fields before continuing.');
        return false;
      }
    }
    if (step === 2) {
      if (!regData.businessName || !regData.businessType) {
        setErrorMsg('Please fill in all required fields before continuing.');
        return false;
      }
    }
    setErrorMsg('');
    return true;
  };

  const goToRegStep = (step: number) => {
    if (step > regStep && !validateRegStep(regStep)) return;
    setErrorMsg('');
    setRegStep(step);
  };

  // If already logged in, skip straight to the dashboard instead of showing the form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('aria_auth_token') || localStorage.getItem('tenantToken');
      if (storedToken) {
        router.replace('/dashboard');
        return;
      }
    }
    setCheckingSession(false);
  }, [router]);

  const persistSession = (data: any, fallbackEmail: string, fallbackName: string) => {
    localStorage.setItem('aria_auth_token', data.token);
    localStorage.setItem('tenantToken', data.token);

    if (data.business) {
      localStorage.setItem('businessMeta', JSON.stringify(data.business));
      localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
    }
    if (data.user) {
      localStorage.setItem('aria_user_id', data.user.id || data.user._id || '');
      localStorage.setItem('aria_user_email', data.user.email || fallbackEmail);
      localStorage.setItem('aria_user_name', data.user.fullName || data.user.name || fallbackName);
    } else {
      localStorage.setItem('aria_user_email', fallbackEmail);
      localStorage.setItem('aria_user_name', fallbackName);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        persistSession(data, loginData.email, '');
        router.push('/dashboard');
      } else {
        setErrorMsg(data.message || 'Authentication credentials rejected.');
      }
    } catch (err) {
      setErrorMsg('Network transmission failure. Verify backend server routing status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (regStep < REG_STEPS) {
      goToRegStep(regStep + 1);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: regData.businessName,
        ownerName: regData.name,
        email: regData.email,
        password: regData.password,
        phone: regData.phone,
        businessType: regData.businessType,
        city: regData.city,
        hours: {
          opens: regData.openingHours || "10:00 AM",
          closes: regData.closingHours || "08:00 PM",
        },
        servicesProvided: regData.services
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        telegramBotToken: regData.telegramBotToken,
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        persistSession(data, regData.email, regData.name);

        if (!data.business) {
          localStorage.setItem('businessMeta', JSON.stringify({
            id: '',
            _id: '',
            name: regData.businessName,
            type: regData.businessType,
          }));
        }

        router.push('/dashboard');
      } else {
        setErrorMsg(data.message || 'Ecosystem deployment registration rejected.');
      }
    } catch (err) {
      setErrorMsg('Network transmission failure. Verify backend server routing status.');
    } finally {
      setLoading(false);
    }
  };

  // Avoid flashing the login form for a moment before the session-redirect kicks in
  if (checkingSession) {
    return <div className="min-h-screen bg-ink" />;
  }

  return (
    <div className="relative min-h-screen bg-ink font-body text-text-on-paper flex flex-col selection:bg-[#d9a05b]/20 overflow-hidden">
      {/* Mobile / tablet — static image */}
      <img
        src="https://res.cloudinary.com/xbicmhte/image/upload/v1786285653/aria.png"
        alt="Aria, your AI employee"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-[62%_26%]"
      />
      {/* Desktop — looping video */}
      <video
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-[100%_20%]"
        src="https://res.cloudinary.com/xbicmhte/video/upload/v1786268667/aria2.mp4"
        poster="/aria-hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 md:via-ink/70 to-ink/35 md:to-ink/15" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_85%_-10%,rgba(217,142,43,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-ink/45" />

      {/* Top nav — same component used on the landing page */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Card fills the remaining height below the nav and stays centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#d9a05b]" />

          <div className="flex items-center justify-center space-x-2 mb-8 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3ab795] animate-pulse" />
            <span className="font-display font-bold text-[22px] text-[#faf6ec] tracking-tight">Aria Console</span>
          </div>

          <div className="flex justify-center space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'login' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
              onClick={() => { setAuthTab('login'); setErrorMsg(''); setRegStep(1); }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'register' ? 'bg-[#d9a05b] text-ink shadow-sm' : 'text-[#faf6ec]/80 hover:text-[#faf6ec]'}`}
              onClick={() => { setAuthTab('register'); setErrorMsg(''); setRegStep(1); }}
              disabled={loading}
            >
              Register Shop
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Business Email</label>
                <input
                  type="email" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.email}
                  onChange={e => setLoginData({...loginData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition mt-4 shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Verifying Workspace Session...' : 'Access Workspace →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">

              <div className="mb-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#faf6ec]/60 uppercase tracking-widest">
                    Step {regStep} of {REG_STEPS}
                  </span>
                  <span className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest">
                    {regStep === 1 ? 'Your Details' : regStep === 2 ? 'Shop Details' : 'Inventory'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: REG_STEPS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i + 1 <= regStep ? 'bg-[#d9a05b]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">

                <div className={`space-y-3.5 ${regStep === 1 ? 'block' : 'hidden'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Full Name *</label>
                    <input
                      type="text" required placeholder="Rina Deshmukh"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.name}
                      onChange={e => setRegData({...regData, name: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Email Address *</label>
                    <input
                      type="email" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Mobile Number *</label>
                      <input
                        type="text" required placeholder="+91 98xxx xxxxx"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.phone}
                        onChange={e => setRegData({...regData, phone: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Password *</label>
                      <input
                        type="password" required minLength={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.password}
                        onChange={e => setRegData({...regData, password: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className={`space-y-3.5 ${regStep === 2 ? 'block' : 'hidden'}`}>
                  <div className="border-t border-white/10 pt-3 mt-1">
                    <p className="text-[10px] font-bold text-[#d9a05b] uppercase tracking-widest mb-2">Shop Details</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Name *</label>
                    <input
                      type="text" required placeholder="Rina Salon"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.businessName}
                      onChange={e => setRegData({...regData, businessName: e.target.value})}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Business Type *</label>
                      <input
                        type="text" required placeholder="e.g., Salon / Spa"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.businessType}
                        onChange={e => setRegData({...regData, businessType: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">City Location</label>
                      <input
                        type="text" placeholder="Pune"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.city}
                        onChange={e => setRegData({...regData, city: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Operating Hours</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Opens — 10:00 AM"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.openingHours}
                        onChange={e => setRegData({...regData, openingHours: e.target.value})}
                        disabled={loading}
                      />
                      <input
                        type="text" placeholder="Closes — 8:00 PM"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                        value={regData.closingHours}
                        onChange={e => setRegData({...regData, closingHours: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[10px] text-[#faf6ec]/55 mt-1">
                      Aria locks scheduling blocks within this timeframe unless overridden later in Settings.
                    </p>
                  </div>
                </div>

                <div className={`space-y-3.5 ${regStep === 3 ? 'block' : 'hidden'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Services / Products Inventory</label>
                    <textarea
                      placeholder="Haircut, hair spa, facial, bridal package..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50 resize-none"
                      value={regData.services}
                      onChange={e => setRegData({...regData, services: e.target.value})}
                      disabled={loading}
                    />
                    <p className="text-[10px] text-[#faf6ec]/55 mt-1">
                      Comma-separated. Aria reads this to confirm inventory or menu availability to customers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#faf6ec]/75 uppercase tracking-wider mb-0.5">Telegram Bot Token (Optional)</label>
                    <input
                      type="text" placeholder="123456:ABCdef..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[#faf6ec] text-sm placeholder:text-[#faf6ec]/40 focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                      value={regData.telegramBotToken}
                      onChange={e => setRegData({...regData, telegramBotToken: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => goToRegStep(regStep - 1)}
                  disabled={loading}
                  className={`${regStep === 1 ? 'hidden' : 'flex'} items-center justify-center px-4 py-3.5 rounded-xl border border-white/10 text-[#faf6ec]/80 text-sm font-medium hover:bg-white/5 transition disabled:opacity-50`}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => goToRegStep(regStep + 1)}
                  disabled={loading}
                  className={`${regStep < REG_STEPS ? 'flex' : 'hidden'} flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
                >
                  Continue →
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${regStep === REG_STEPS ? 'flex' : 'hidden'} flex-1 items-center justify-center bg-[#d9a05b] hover:bg-[#d9a05b]/90 text-ink font-semibold p-3.5 rounded-xl transition shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]`}
                >
                  {loading ? 'Provisioning Micro-Services...' : 'Deploy Shop Ecosystem →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}