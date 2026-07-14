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
        return (
          <div className="text-center text-text-on-paper-dim font-mono text-[13px] py-12">
            View not found
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-paper font-body text-text-on-paper flex">
      
      {/* 
        FIXED: Changed currentView={view} onViewChange={setView} 
        to view={view} setView={setView} so it matches your Sidebar component!
      */}
      <Sidebar view={view} setView={setView} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Dashboard Header */}
        <header className="flex-shrink-0 h-[72px] bg-paper/85 backdrop-blur-md border-b border-ink/10 flex items-center px-8 z-40 lg:pl-8 pl-20">
          <h1 className="font-display font-bold text-[20px] text-ink tracking-tight capitalize">
            {view}
          </h1>
        </header>

        {/* Dashboard Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1180px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}