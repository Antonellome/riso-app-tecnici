import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SYNC_SERVER_KEYS = {
  USERS: '@riso_sync_server_users',
  REPORTS: '@riso_sync_server_reports',
  NOTIFICATIONS: '@riso_sync_server_notifications',
  TECHNICIANS: '@riso_sync_server_technicians',
  SHIPS: '@riso_sync_server_ships',
  LOCATIONS: '@riso_sync_server_locations',
};

class SharedStorage {
  static async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }

  static async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  }
}

export interface SyncServerUser {
  id: string;
  name: string;
  company: string;
  apiKey: string;
  createdAt: number;
  lastSync?: number;
  active: boolean;
}

export interface SyncServerReport {
  id: string;
  userId: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  ship: string;
  location: string;
  description: string;
  materials: string;
  workDone: string;
  technicians: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    pauseMinutes: number;
  }[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdByName?: string;
  isShared?: boolean;
}

export interface SyncConfigData {
  serverUrl: string;
  userId: string;
  apiKey: string;
  autoSync?: boolean;
  technicianName?: string;
  companyName?: string;
}

export interface SyncServerNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
  type: 'info' | 'warning' | 'alert' | 'config';
  targetUsers: string[];
  createdBy: string;
  configData?: SyncConfigData;
}

export interface SyncServerTechnicianCategory {
  category: string;
  technicians: string[];
}

export class MockSyncServer {
  static async authenticateUser(userId: string, apiKey: string): Promise<boolean> {
    try {
      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      if (!usersData) return false;
      
      const users: SyncServerUser[] = JSON.parse(usersData);
      const user = users.find(u => u.id === userId && u.apiKey === apiKey);
      
      return !!user && user.active;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return false;
    }
  }

  static async syncUserData(
    userId: string,
    apiKey: string,
    reports: SyncServerReport[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: 'Authentication failed' };
      }

      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      const users: SyncServerUser[] = usersData ? JSON.parse(usersData) : [];
      const currentUser = users.find(u => u.id === userId);
      const currentUserName = currentUser?.name || 'Utente Sconosciuto';

      const allReportsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.REPORTS);
      let allReports: SyncServerReport[] = allReportsData ? JSON.parse(allReportsData) : [];

      allReports = allReports.filter(r => !(r.userId === userId && !r.isShared));
      
      const reportsWithUserId = reports.map(r => ({ 
        ...r, 
        userId,
        createdBy: userId,
        createdByName: currentUserName,
        isShared: false
      }));
      
      allReports = [...allReports, ...reportsWithUserId];

      const sharedReportsToAdd: SyncServerReport[] = [];
      for (const report of reportsWithUserId) {
        if (report.technicians && report.technicians.length > 0) {
          for (const tech of report.technicians) {
            const techUser = users.find(u => u.name === tech.name);
            if (techUser && techUser.id !== userId) {
              const sharedReport: SyncServerReport = {
                ...report,
                id: `${report.id}_shared_${techUser.id}`,
                userId: techUser.id,
                startTime: tech.startTime,
                endTime: tech.endTime,
                pauseMinutes: tech.pauseMinutes,
                isShared: true,
                createdBy: userId,
                createdByName: currentUserName,
                technicians: [],
              };
              sharedReportsToAdd.push(sharedReport);
            }
          }
        }
      }

      allReports = [...allReports, ...sharedReportsToAdd];

      await SharedStorage.setItem(SYNC_SERVER_KEYS.REPORTS, JSON.stringify(allReports));

      if (usersData) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, lastSync: Date.now() } : u
        );
        await SharedStorage.setItem(SYNC_SERVER_KEYS.USERS, JSON.stringify(updatedUsers));
      }

      console.log(`[MockSyncServer] Synced ${reports.length} reports for user ${userId}, created ${sharedReportsToAdd.length} shared copies`);
      return { success: true, message: `Synced ${reports.length} reports, distributed to ${sharedReportsToAdd.length} technicians` };
    } catch (error) {
      console.error('Error syncing user data:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUserData(
    userId: string,
    apiKey: string
  ): Promise<{ success: boolean; data?: SyncServerReport[]; message: string }> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: 'Authentication failed' };
      }

      const allReportsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.REPORTS);
      if (!allReportsData) {
        return { success: true, data: [], message: 'No reports found' };
      }

      const allReports: SyncServerReport[] = JSON.parse(allReportsData);
      const userReports = allReports.filter(r => r.userId === userId);

      return { success: true, data: userReports, message: `Retrieved ${userReports.length} reports` };
    } catch (error) {
      console.error('Error getting user data:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getTechnicians(): Promise<{ success: boolean; data?: SyncServerTechnicianCategory[]; message: string }> {
    try {
      const techniciansData = await SharedStorage.getItem(SYNC_SERVER_KEYS.TECHNICIANS);
      if (!techniciansData) {
        return { success: true, data: [], message: 'No technicians found' };
      }

      const technicians: SyncServerTechnicianCategory[] = JSON.parse(techniciansData);
      return { success: true, data: technicians, message: `Retrieved technicians` };
    } catch (error) {
      console.error('Error getting technicians:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async setTechnicians(technicians: SyncServerTechnicianCategory[]): Promise<{ success: boolean; message: string }> {
    try {
      await SharedStorage.setItem(SYNC_SERVER_KEYS.TECHNICIANS, JSON.stringify(technicians));
      console.log('[MockSyncServer] Updated technicians list');
      return { success: true, message: 'Technicians updated' };
    } catch (error) {
      console.error('Error setting technicians:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUserNotifications(
    userId: string,
    apiKey: string
  ): Promise<{ success: boolean; data?: SyncServerNotification[]; message: string }> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: 'Authentication failed' };
      }

      const notificationsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.NOTIFICATIONS);
      if (!notificationsData) {
        return { success: true, data: [], message: 'No notifications found' };
      }

      const allNotifications: SyncServerNotification[] = JSON.parse(notificationsData);
      const userNotifications = allNotifications.filter(n => 
        n.targetUsers.includes('all') || n.targetUsers.includes(userId)
      );

      return { success: true, data: userNotifications, message: `Retrieved ${userNotifications.length} notifications` };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async addNotification(notification: SyncServerNotification): Promise<{ success: boolean; message: string }> {
    try {
      const notificationsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.NOTIFICATIONS);
      const notifications: SyncServerNotification[] = notificationsData ? JSON.parse(notificationsData) : [];
      
      notifications.push(notification);
      await SharedStorage.setItem(SYNC_SERVER_KEYS.NOTIFICATIONS, JSON.stringify(notifications));

      console.log('[MockSyncServer] Added notification');
      return { success: true, message: 'Notification added' };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async addUser(user: SyncServerUser): Promise<{ success: boolean; message: string }> {
    try {
      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      const users: SyncServerUser[] = usersData ? JSON.parse(usersData) : [];
      
      users.push(user);
      await SharedStorage.setItem(SYNC_SERVER_KEYS.USERS, JSON.stringify(users));

      console.log('[MockSyncServer] Added user:', user.name);
      return { success: true, message: 'User added' };
    } catch (error) {
      console.error('Error adding user:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async updateUser(userId: string, updates: Partial<SyncServerUser>): Promise<{ success: boolean; message: string }> {
    try {
      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      if (!usersData) {
        return { success: false, message: 'No users found' };
      }

      const users: SyncServerUser[] = JSON.parse(usersData);
      const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
      
      await SharedStorage.setItem(SYNC_SERVER_KEYS.USERS, JSON.stringify(updatedUsers));

      console.log('[MockSyncServer] Updated user:', userId);
      return { success: true, message: 'User updated' };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      if (!usersData) {
        return { success: false, message: 'No users found' };
      }

      const users: SyncServerUser[] = JSON.parse(usersData);
      const updatedUsers = users.filter(u => u.id !== userId);
      await SharedStorage.setItem(SYNC_SERVER_KEYS.USERS, JSON.stringify(updatedUsers));

      const reportsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.REPORTS);
      if (reportsData) {
        const reports: SyncServerReport[] = JSON.parse(reportsData);
        const updatedReports = reports.filter(r => r.userId !== userId);
        await SharedStorage.setItem(SYNC_SERVER_KEYS.REPORTS, JSON.stringify(updatedReports));
      }

      console.log('[MockSyncServer] Deleted user:', userId);
      return { success: true, message: 'User deleted' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getAllUsers(): Promise<{ success: boolean; data?: SyncServerUser[]; message: string }> {
    try {
      const usersData = await SharedStorage.getItem(SYNC_SERVER_KEYS.USERS);
      if (!usersData) {
        return { success: true, data: [], message: 'No users found' };
      }

      const users: SyncServerUser[] = JSON.parse(usersData);
      return { success: true, data: users, message: `Retrieved ${users.length} users` };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getAllReports(): Promise<{ success: boolean; data?: SyncServerReport[]; message: string }> {
    try {
      const reportsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.REPORTS);
      if (!reportsData) {
        return { success: true, data: [], message: 'No reports found' };
      }

      const reports: SyncServerReport[] = JSON.parse(reportsData);
      return { success: true, data: reports, message: `Retrieved ${reports.length} reports` };
    } catch (error) {
      console.error('Error getting all reports:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getShipsAndLocations(): Promise<{
    success: boolean;
    data?: { ships: string[], locations: string[] };
    message: string;
  }> {
    try {
      const shipsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.SHIPS);
      const locationsData = await SharedStorage.getItem(SYNC_SERVER_KEYS.LOCATIONS);
      
      const ships: string[] = shipsData ? JSON.parse(shipsData) : [];
      const locations: string[] = locationsData ? JSON.parse(locationsData) : [];
      
      return {
        success: true,
        data: { ships, locations },
        message: 'Ships and locations retrieved'
      };
    } catch (error) {
      console.error('Error getting ships and locations:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async setShipsAndLocations(
    ships: string[],
    locations: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      await SharedStorage.setItem(SYNC_SERVER_KEYS.SHIPS, JSON.stringify(ships));
      await SharedStorage.setItem(SYNC_SERVER_KEYS.LOCATIONS, JSON.stringify(locations));
      
      console.log('[MockSyncServer] Updated ships and locations');
      return { success: true, message: 'Ships and locations updated' };
    } catch (error) {
      console.error('Error setting ships and locations:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
