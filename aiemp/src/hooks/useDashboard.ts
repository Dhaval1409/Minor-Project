'use client';

import { useState, useEffect } from 'react';
import { Appointment, Business } from '@/types';

export function useDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [apptError, setApptError] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [businessPhone, setBusinessPhone] = useState('Not set');
  const [greeting, setGreeting] = useState('Good morning');
  const [toggles, setToggles] = useState({
    calls: true,
    whatsapp: true,
    reminders: true,
    followup: false,
  });

  // Base API configuration URL
  const API_BASE = 'http://localhost:5000';

  const loadAppointments = async (bizId: string | null = businessId) => {
    setLoadingAppts(true);
    setApptError('');
    try {
      console.log('🔄 Fetching appointments from backend...');
      const res = await fetch(`${API_BASE}/appointments`);
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to load appointments.');
      }
      
      const all: Appointment[] = data.data ?? [];
      // Filter out records based on structural matching if a valid business context exists
      setAppointments(bizId ? all.filter((a) => a.businessId === bizId) : all);
    } catch (err: any) {
      console.error('❌ Error loading appointments:', err);
      setApptError(err.message || 'Could not reach the backend.');
    } finally {
      setLoadingAppts(false);
    }
  };

  const loadBusiness = async (bizId: string | null) => {
    if (!bizId) {
      setLoadingBusiness(false);
      return;
    }
    setLoadingBusiness(true);
    try {
      console.log('🔄 Fetching business profile for ID:', bizId);
      // NOTE: Verify if your backend uses a prefix pattern like: `${API_BASE}/api/business/${bizId}`
      const res = await fetch(`${API_BASE}/business/${bizId}`);
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to load business profile.');
      }
      
      setBusiness(data.data ?? null);
      console.log('✅ Business profile data mounted successfully:', data.data);
    } catch (err) {
      console.error('❌ Could not load business profile:', err);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handleAddAppointment = async (form: any) => {
    if (!form.name || !form.phone || !form.service || !form.date || !form.time) {
      setApptError('Fill in name, phone, service, date, and time.');
      return;
    }
    // Fallback logic to protect context metrics if state parameters are still syncing
    const activeBizId = businessId || localStorage.getItem('aria_business_id');
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBizId || undefined,
          ...form,
          businessType: 'salon_spa',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to create appointment.');
      }
      await loadAppointments(activeBizId);
    } catch (err: any) {
      setApptError(err.message || 'Failed to create appointment.');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    const activeBizId = businessId || localStorage.getItem('aria_business_id');
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to cancel appointment.');
      }
      await loadAppointments(activeBizId);
    } catch (err: any) {
      setApptError(err.message || 'Failed to cancel appointment.');
    }
  };

  const toggle = (key: keyof typeof toggles) => {
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  };

  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('aria_business_id') : null;
    console.log('🔑 Initializing session with Business ID:', id);
    
    setBusinessId(id);
    loadAppointments(id);
    loadBusiness(id);
    
    const savedPhone = localStorage.getItem('aria_business_phone');
    if (savedPhone) setBusinessPhone(savedPhone);
    
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return {
    appointments,
    loadingAppts,
    apptError,
    business,
    loadingBusiness,
    businessPhone,
    greeting,
    toggles,
    toggle,
    loadAppointments,
    handleAddAppointment,
    handleCancelAppointment,
  };
}

function greetingForHour(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
