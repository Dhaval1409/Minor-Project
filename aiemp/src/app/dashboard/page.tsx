'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// --- GATEKEEPER: redirects to /login if there's no session ---
export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('aria_auth_token') || localStorage.getItem('tenantToken');

      if (!storedToken) {
        router.replace('/login');
        return;
      }

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

      setReady(true);
    }
  }, [router]);

  // Nothing to show while we check the session / while redirecting to /login
  if (!ready) {
    return <div className="min-h-screen bg-paper" />;
  }

  return <AuthenticatedDashboard />;
}

// --- AUTHENTICATED WORKSPACE ---
function AuthenticatedDashboard() {
  const router = useRouter();
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
    handleCompleteAppointment,
  } = useDashboard();

  const handleLogout = () => {
    localStorage.removeItem('aria_auth_token');
    localStorage.removeItem('aria_business_id');
    localStorage.removeItem('aria_user_id');
    localStorage.removeItem('aria_user_email');
    localStorage.removeItem('aria_user_name');
    localStorage.removeItem('tenantToken');
    localStorage.removeItem('businessMeta');

    router.replace('/login');
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
            onComplete={handleCompleteAppointment}
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