export type ShiftType = 'Ordinaria' | 'Straordinaria' | 'Festiva' | 'Ferie' | 'Permesso' | 'Malattia' | '104';

export interface HourlyRate {
  type: ShiftType;
  rate: number;
}

export interface Technician {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
}

export interface TechnicianCategory {
  category: string;
  technicians: string[];
}

export interface Report {
  id: string;
  userId?: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  ship: string;
  location: string;
  description: string;
  materials: string;
  workDone: string;
  technicians: Technician[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  name: string;
  company: string;
  password?: string;
}

export interface WorkSettings {
  defaultStartTime: string;
  defaultEndTime: string;
  defaultPauseMinutes: number;
  hourlyRates: HourlyRate[];
}

export interface StorageSettings {
  type: 'browser' | 'device' | 'external';
  path?: string;
  backupFrequency: 'onChange' | 'daily' | 'weekly' | 'monthly' | 'none';
  externalProvider: 'google-drive' | 'dropbox' | 'onedrive' | 'none';
}

export interface SyncSettings {
  enabled: boolean;
  serverUrl: string;
  userId: string;
  apiKey: string;
  autoSync: boolean;
  lastSync?: number;
}

export interface SyncData {
  userId: string;
  reports: Report[];
  settings: AppSettings;
  timestamp: number;
}

export interface AppSettings {
  user: UserSettings;
  work: WorkSettings;
  storage: StorageSettings;
  sync?: SyncSettings;
  ships: string[];
  locations: string[];
  technicians: string[];
  technicianCategories?: TechnicianCategory[];
}

export interface DailyStats {
  reportsToday: number;
  reportsTotal: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
  earningsThisMonth: number;
}

export interface MonthlyReportData {
  totalHours: number;
  totalEarnings: number;
  hoursByType: Record<ShiftType, number>;
  earningsByType: Record<ShiftType, number>;
  reports: Report[];
}

export interface SyncConfigData {
  serverUrl: string;
  userId: string;
  apiKey: string;
  autoSync?: boolean;
  technicianName?: string;
  companyName?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  type: 'info' | 'warning' | 'alert' | 'config';
  configData?: SyncConfigData;
}
