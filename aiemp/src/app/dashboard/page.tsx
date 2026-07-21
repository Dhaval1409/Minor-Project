'use client';

import { useState, useEffect } from 'react';
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

// --- MAIN GATEKEEPER WRAPPER ---
export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    name: '', email: '', password: '', businessType: '', city: '', phone: '', telegramBotToken: ''
  });

  // Hydrate, bridge onboarding keys, and verify session status safely on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('aria_auth_token') || localStorage.getItem('tenantToken');
      
      if (storedToken) {
        // Bridge onboarding credentials to accommodate legacy useDashboard hooks
        if (!localStorage.getItem('tenantToken')) {
          localStorage.setItem('tenantToken', storedToken);
        }
        
        // Prevent blank shop profiles if redirected instantly from the onboarding module
        if (!localStorage.getItem('businessMeta')) {
          const fallbackName = localStorage.getItem('aria_user_name') || 'My Shop';
          const fallbackId = localStorage.getItem('aria_business_id') || '';
          localStorage.setItem('businessMeta', JSON.stringify({
            id: fallbackId,
            _id: fallbackId,
            name: fallbackName
          }));
        }
        
        setToken(storedToken);
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        localStorage.setItem('aria_auth_token', data.token);
        localStorage.setItem('tenantToken', data.token);
        
        if (data.business) {
          localStorage.setItem('businessMeta', JSON.stringify(data.business));
          localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
        }
        if (data.user) {
          localStorage.setItem('aria_user_id', data.user.id || data.user._id || '');
          localStorage.setItem('aria_user_email', data.user.email || loginData.email);
          localStorage.setItem('aria_user_name', data.user.fullName || data.user.name || '');
        }

        setToken(data.token);
        window.location.reload(); 
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
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        localStorage.setItem('aria_auth_token', data.token);
        localStorage.setItem('tenantToken', data.token);
        
        if (data.business) {
          localStorage.setItem('businessMeta', JSON.stringify(data.business));
          localStorage.setItem('aria_business_id', data.business.id || data.business._id || '');
        }
        
        localStorage.setItem('aria_user_email', regData.email);
        localStorage.setItem('aria_user_name', regData.name);

        setToken(data.token);
        window.location.reload(); 
      } else {
        setErrorMsg(data.message || 'Ecosystem deployment registration rejected.');
      }
    } catch (err) {
      setErrorMsg('Network transmission failure. Verify backend server routing status.');
    } finally {
      setLoading(false);
    }
  };

  // Render Login screen if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-paper font-body text-text-on-paper flex items-center justify-center p-6 selection:bg-[#d9a05b]/20">
        <div className="w-full max-w-md bg-paper border border-ink/10 rounded-2xl shadow-xl shadow-ink/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#d9a05b]" />

          <div className="flex items-center justify-center space-x-2 mb-8 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3ab795] animate-pulse" />
            <span className="font-display font-bold text-[22px] text-ink tracking-tight">Aria Console</span>
          </div>

          <div className="flex justify-center space-x-1 mb-6 bg-ink/5 p-1 rounded-xl">
            <button 
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'login' ? 'bg-ink text-paper shadow-sm' : 'text-text-on-paper-dim hover:text-ink'}`}
              onClick={() => { setAuthTab('login'); setErrorMsg(''); }}
              disabled={loading}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-200 ${authTab === 'register' ? 'bg-ink text-paper shadow-sm' : 'text-text-on-paper-dim hover:text-ink'}`}
              onClick={() => { setAuthTab('register'); setErrorMsg(''); }}
              disabled={loading}
            >
              Register Shop
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/5 text-rose-700 border border-rose-500/10 text-xs font-mono animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-1">Business Email</label>
                <input 
                  type="email" required 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-3 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.email}
                  onChange={e => setLoginData({...loginData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" required 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-3 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-ink hover:bg-ink/90 text-paper font-semibold p-3.5 rounded-xl transition mt-4 shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Verifying Workspace Session...' : 'Access Workspace →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[58vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Business Name *</label>
                <input 
                  type="text" required 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={regData.name}
                  onChange={e => setRegData({...regData, name: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Corporate Email *</label>
                <input 
                  type="email" required 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={regData.email}
                  onChange={e => setRegData({...regData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Dashboard Password *</label>
                <input 
                  type="password" required minLength={6} 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={regData.password}
                  onChange={e => setRegData({...regData, password: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Industry Type *</label>
                  <input 
                    type="text" required placeholder="e.g., Salon" 
                    className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                    value={regData.businessType}
                    onChange={e => setRegData({...regData, businessType: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">City Location</label>
                  <input 
                    type="text" 
                    className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                    value={regData.city}
                    onChange={e => setRegData({...regData, city: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Phone Number *</label>
                <input 
                  type="text" required placeholder="+91..." 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={regData.phone}
                  onChange={e => setRegData({...regData, phone: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-on-paper-dim uppercase tracking-wider mb-0.5">Telegram Bot Token (Optional)</label>
                <input 
                  type="text" placeholder="123456:ABCdef..." 
                  className="w-full bg-paper border border-ink/20 rounded-xl p-2.5 text-ink text-sm focus:outline-none focus:border-[#d9a05b] focus:ring-1 focus:ring-[#d9a05b] transition disabled:opacity-50"
                  value={regData.telegramBotToken}
                  onChange={e => setRegData({...regData, telegramBotToken: e.target.value})}
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-ink hover:bg-ink/90 text-paper font-semibold p-3.5 rounded-xl transition mt-4 shadow-sm text-sm tracking-tight disabled:opacity-50 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Provisioning Micro-Services...' : 'Deploy Shop Ecosystem →'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render dashboard workspace ONLY when token verification and key hydration are absolute
  return <AuthenticatedDashboard setToken={setToken} />;
}

// --- ISOLATED AUTHENTICATED WORKSPACE COMPONENT ---
function AuthenticatedDashboard({ setToken }: { setToken: (t: string | null) => void }) {
  const [view, setView] = useState('overview');
  
  // Hook safely initializes now because localStorage conditions are verified
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

  const handleLogout = () => {
    localStorage.removeItem('aria_auth_token');
    localStorage.removeItem('aria_business_id');
    localStorage.removeItem('aria_user_id');
    localStorage.removeItem('aria_user_email');
    localStorage.removeItem('aria_user_name');
    localStorage.removeItem('tenantToken');
    localStorage.removeItem('businessMeta');
    
    setToken(null);
    window.location.reload();
  };

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
      case 'reports': return <Reports />;
      case 'calls': return <Calls />;
      case 'whatsapp': return <WhatsApp />;
      case 'orders': return <Orders />;
      case 'leads': return <Leads />;
      case 'settings':
        return <Settings business={business} businessPhone={businessPhone} toggles={toggles} toggle={toggle} />;
      case 'billing': return <Billing />;
      default:
        return (
          <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
            View workspace segment not found
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-paper font-body text-text-on-paper flex selection:bg-[#d9a05b]/20">
      <Sidebar view={view} setView={setView} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex-shrink-0 h-[72px] bg-paper/85 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-8 z-40 lg:pl-8 pl-20">
          <div>
            <h1 className="font-display font-bold text-[20px] text-ink tracking-tight capitalize inline-block">
              {view}
            </h1>
            {business?.name && (
              <span className="ml-3 text-xs opacity-60 font-mono hidden sm:inline-block">
                ({business.name})
              </span>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="text-xs bg-ink/5 hover:bg-rose-500/10 text-text-on-paper hover:text-rose-600 border border-ink/10 hover:border-rose-500/20 px-3.5 py-2 rounded-lg transition duration-200 font-medium"
          >
            Sign Out
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1180px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}