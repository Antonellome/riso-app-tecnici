import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import type { AppSettings, Report, DailyStats, Notification } from '@/types';

const STORAGE_KEYS = {
  SETTINGS: '@riso_app_settings',
  REPORTS: '@riso_app_reports',
  NOTIFICATIONS: '@riso_app_notifications',
  RECENT_TECHNICIANS: '@riso_app_recent_technicians',
};

const DEFAULT_SETTINGS: AppSettings = {
  user: {
    name: '',
    company: '',
  },
  work: {
    defaultStartTime: '07:30',
    defaultEndTime: '16:30',
    defaultPauseMinutes: 60,
    hourlyRates: [
      { type: 'Ordinaria', rate: 18.50 },
      { type: 'Straordinaria', rate: 27.75 },
      { type: 'Festiva', rate: 35.00 },
      { type: 'Ferie', rate: 18.50 },
      { type: 'Permesso', rate: 18.50 },
      { type: 'Malattia', rate: 15.00 },
      { type: '104', rate: 18.50 },
    ],
  },
  storage: {
    type: 'device',
    backupFrequency: 'none',
    externalProvider: 'none',
  },
  sync: {
    enabled: false,
    serverUrl: '',
    userId: '',
    apiKey: '',
    autoSync: false,
  },
  ships: [],
  locations: [],
  technicians: [],
  technicianCategories: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentTechnicians, setRecentTechnicians] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AppContext] Starting data load...');
    let isMounted = true;
    
    const loadData = async () => {
      try {
        console.log('[AppContext] Loading from AsyncStorage...');
        
        const [settingsData, reportsData, notificationsData, recentTechniciansData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS).catch(e => { console.error('Settings load error:', e); return null; }),
          AsyncStorage.getItem(STORAGE_KEYS.REPORTS).catch(e => { console.error('Reports load error:', e); return null; }),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS).catch(e => { console.error('Notifications load error:', e); return null; }),
          AsyncStorage.getItem(STORAGE_KEYS.RECENT_TECHNICIANS).catch(e => { console.error('Recent techs load error:', e); return null; }),
        ]);
        
        console.log('[AppContext] Data loaded:', {
          hasSettings: !!settingsData,
          hasReports: !!reportsData,
          hasNotifications: !!notificationsData,
          hasRecentTechnicians: !!recentTechniciansData,
        });
        
        if (!isMounted) {
          console.log('[AppContext] Component unmounted, aborting');
          return;
        }
        
        if (settingsData) {
          try {
            const parsed = JSON.parse(settingsData);
            console.log('[AppContext] Settings parsed successfully');
            setSettings(parsed);
          } catch (e) {
            console.error('[AppContext] Error parsing settings:', e);
          }
        } else {
          console.log('[AppContext] No settings data, using defaults');
        }
        
        if (reportsData) {
          try {
            const parsed = JSON.parse(reportsData);
            console.log('[AppContext] Reports parsed successfully:', parsed.length);
            setReports(parsed);
          } catch (e) {
            console.error('[AppContext] Error parsing reports:', e);
          }
        } else {
          console.log('[AppContext] No reports data');
        }
        
        if (notificationsData) {
          try {
            const parsed = JSON.parse(notificationsData);
            console.log('[AppContext] Notifications parsed successfully');
            setNotifications(parsed);
          } catch (e) {
            console.error('[AppContext] Error parsing notifications:', e);
          }
        }
        
        if (recentTechniciansData) {
          try {
            const parsed = JSON.parse(recentTechniciansData);
            console.log('[AppContext] Recent technicians parsed successfully');
            setRecentTechnicians(parsed);
          } catch (e) {
            console.error('[AppContext] Error parsing recentTechnicians:', e);
          }
        }
        
        console.log('[AppContext] Data loaded successfully');
      } catch (error) {
        console.error('[AppContext] Error loading data:', error);
        console.log('[AppContext] Continuing with default data');
      } finally {
        if (isMounted) {
          console.log('[AppContext] Setting isLoading to false');
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      console.log('[AppContext] Cleanup');
      isMounted = false;
    };
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, []);

  const setPassword = useCallback(async (password: string) => {
    try {
      await AsyncStorage.setItem('@riso_app_password', password);
    } catch (error) {
      console.error('Error saving password:', error);
      throw error;
    }
  }, []);



  const saveReports = useCallback(async (newReports: Report[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(newReports));
      setReports(newReports);
    } catch (error) {
      console.error('Error saving reports:', error);
      throw error;
    }
  }, []);

  const addReport = useCallback(async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReport: Report = {
      ...report,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedReports = [...reports, newReport];
    await saveReports(updatedReports);
    
    if (report.technicians && report.technicians.length > 0) {
      const techNames = report.technicians.map(t => t.name).filter(name => name);
      if (techNames.length > 0) {
        const updatedRecent = [
          ...techNames,
          ...recentTechnicians.filter(t => !techNames.includes(t)),
        ].slice(0, 20);
        setRecentTechnicians(updatedRecent);
        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_TECHNICIANS, JSON.stringify(updatedRecent));
      }
    }
    
    return newReport;
  }, [reports, saveReports, recentTechnicians]);

  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    const updatedReports = reports.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
    );
    await saveReports(updatedReports);
  }, [reports, saveReports]);

  const deleteReport = useCallback(async (id: string) => {
    const updatedReports = reports.filter(r => r.id !== id);
    await saveReports(updatedReports);
  }, [reports, saveReports]);





  const calculateHours = useCallback((startTime: string, endTime: string, pauseMinutes: number): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const totalMinutes = endMinutes - startMinutes - pauseMinutes;
    return totalMinutes / 60;
  }, []);

  const getStats = useCallback((): DailyStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const reportsToday = reports.filter(r => r.date === today).length;
    const reportsTotal = reports.length;
    
    const hoursThisWeek = reports
      .filter(r => new Date(r.date) >= startOfWeek)
      .reduce((sum, r) => sum + calculateHours(r.startTime, r.endTime, r.pauseMinutes), 0);
    
    const hoursThisMonth = reports
      .filter(r => new Date(r.date) >= startOfMonth)
      .reduce((sum, r) => sum + calculateHours(r.startTime, r.endTime, r.pauseMinutes), 0);
    
    const earningsThisMonth = reports
      .filter(r => new Date(r.date) >= startOfMonth)
      .reduce((sum, r) => {
        const hours = calculateHours(r.startTime, r.endTime, r.pauseMinutes);
        const rate = settings.work.hourlyRates.find(hr => hr.type === r.shiftType)?.rate || 0;
        return sum + (hours * rate);
      }, 0);
    
    return {
      reportsToday,
      reportsTotal,
      hoursThisWeek,
      hoursThisMonth,
      earningsThisMonth,
    };
  }, [reports, settings.work.hourlyRates, calculateHours]);

  const getRecentReports = useCallback((limit: number = 5): Report[] => {
    return [...reports]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }, [reports]);

  const exportData = useCallback(async (): Promise<string> => {
    const data = {
      settings,
      reports,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data);
  }, [settings, reports]);

  const importData = useCallback(async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) {
        await saveSettings(data.settings);
      }
      if (data.reports) {
        await saveReports(data.reports);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }, [saveSettings, saveReports]);

  const autoBackup = useCallback(async () => {
    try {
      const data = await exportData();
      await AsyncStorage.setItem('@ore_tecnico_auto_backup', data);
      await AsyncStorage.setItem('@ore_tecnico_last_backup', Date.now().toString());
    } catch (error) {
      console.error('Error creating auto backup:', error);
    }
  }, [exportData]);

  const syncToServer = useCallback(async (): Promise<boolean> => {
    try {
      if (!settings.sync?.enabled || !settings.sync?.serverUrl) return false;
      
      const data = await exportData();
      const response = await fetch(`${settings.sync.serverUrl}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': settings.sync.userId || '',
          'X-API-Key': settings.sync.apiKey || '',
        },
        body: data,
      });
      
      if (response.ok) {
        await saveSettings({
          ...settings,
          sync: {
            ...settings.sync,
            lastSync: Date.now(),
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing to server:', error);
      return false;
    }
  }, [settings, exportData, saveSettings]);

  const syncFromServer = useCallback(async (): Promise<boolean> => {
    try {
      if (!settings.sync?.enabled || !settings.sync?.serverUrl) return false;
      
      const response = await fetch(`${settings.sync.serverUrl}/api/sync/download`, {
        method: 'GET',
        headers: {
          'X-User-ID': settings.sync.userId || '',
          'X-API-Key': settings.sync.apiKey || '',
        },
      });
      
      if (response.ok) {
        const data = await response.text();
        await importData(data);
        await saveSettings({
          ...settings,
          sync: {
            ...settings.sync,
            lastSync: Date.now(),
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing from server:', error);
      return false;
    }
  }, [settings, importData, saveSettings]);

  const syncTechniciansFromServer = useCallback(async (): Promise<boolean> => {
    try {
      if (!settings.sync?.enabled || !settings.sync?.serverUrl) return false;
      
      const response = await fetch(`${settings.sync.serverUrl}/api/sync/technicians`, {
        method: 'GET',
        headers: {
          'X-User-ID': settings.sync.userId || '',
          'X-API-Key': settings.sync.apiKey || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        await saveSettings({
          ...settings,
          technicians: data.technicians || [],
          technicianCategories: data.technicianCategories || [],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing technicians from server:', error);
      return false;
    }
  }, [settings, saveSettings]);

  const syncShipsAndLocationsFromServer = useCallback(async (): Promise<boolean> => {
    try {
      if (!settings.sync?.enabled || !settings.sync?.serverUrl) return false;
      
      const response = await fetch(`${settings.sync.serverUrl}/api/sync/ships-locations`, {
        method: 'GET',
        headers: {
          'X-User-ID': settings.sync.userId || '',
          'X-API-Key': settings.sync.apiKey || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        await saveSettings({
          ...settings,
          ships: data.ships || [],
          locations: data.locations || [],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing ships and locations from server:', error);
      return false;
    }
  }, [settings, saveSettings]);

  const importSyncConfig = useCallback(async (jsonData: string) => {
    try {
      const config = JSON.parse(jsonData);
      await saveSettings({
        ...settings,
        sync: {
          enabled: true,
          serverUrl: config.serverUrl || '',
          userId: config.userId || '',
          apiKey: config.apiKey || '',
          autoSync: config.autoSync || false,
          lastSync: settings.sync?.lastSync,
        },
      });
    } catch (error) {
      console.error('Error importing sync config:', error);
      throw error;
    }
  }, [settings, saveSettings]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const updatedNotifications = notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [notifications]);

  const getUnreadNotificationsCount = useCallback((): number => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return {
    settings,
    reports,
    notifications,
    recentTechnicians,
    isLoading,
    saveSettings,
    setPassword,
    addReport,
    updateReport,
    deleteReport,
    calculateHours,
    getStats,
    getRecentReports,
    exportData,
    importData,
    autoBackup,
    syncToServer,
    syncFromServer,
    syncTechniciansFromServer,
    syncShipsAndLocationsFromServer,
    importSyncConfig,
    markNotificationAsRead,
    deleteNotification,
    getUnreadNotificationsCount,
  };
});
