export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled';

export interface Appointment {
  id: string;
  businessId?: string;
  userId: string;
  name: string;
  phone: string;
  businessType: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  _id: string;
  name: string;
  businessType: string;
  city?: string;
  hours?: { opens?: string; closes?: string };
  servicesProvided?: string[];
  telegramBotToken?: string;
}

export interface ActivityItem {
  color: string;
  text: React.ReactNode;
  time: string;
}