import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  Unsubscribe,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import type { User, Report, Ship, Location } from '@/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBqY2bQ-mockkey-for-development",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "riso-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "riso-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "riso-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

let app: FirebaseApp;
let db: Firestore;

export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log('[Firebase] Initialized successfully');
    }
    return { app, db };
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      console.log('[Firebase] Already initialized');
      return { app, db };
    }
    console.error('[Firebase] Initialization error:', error);
    throw error;
  }
};

export const getFirestoreDb = (): Firestore => {
  if (!db) {
    const result = initializeFirebase();
    return result.db;
  }
  return db;
};

export interface UserConfig {
  userId: string;
  apiKey: string;
  technicianName: string;
  companyName: string;
  serverUrl: string;
  autoSync: boolean;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
  ships?: string[];
  locations?: string[];
  technicianCategories?: {
    category: string;
    technicians: string[];
  }[];
  work?: {
    defaultStartTime: string;
    defaultEndTime: string;
    defaultPauseMinutes: number;
    hourlyRates: {
      type: string;
      rate: number;
    }[];
  };
}

export const getConfigByCode = async (code: string): Promise<UserConfig | null> => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', code);
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data() as UserConfig;
      console.log('[Firebase] Config found for code:', code);
      return data;
    } else {
      console.log('[Firebase] No config found for code:', code);
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Error getting config:', error);
    throw error;
  }
};

export const subscribeToConfigUpdates = (
  code: string,
  onUpdate: (config: UserConfig | null) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', code);
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserConfig;
        console.log('[Firebase] Config updated for code:', code);
        onUpdate(data);
      } else {
        console.log('[Firebase] Config deleted or not found for code:', code);
        onUpdate(null);
      }
    }, (error) => {
      console.error('[Firebase] Snapshot error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing to config updates:', error);
    throw error;
  }
};

export const saveConfigForCode = async (code: string, config: UserConfig): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', code);
    await setDoc(configRef, {
      ...config,
      updatedAt: Date.now(),
    });
    console.log('[Firebase] Config saved for code:', code);
  } catch (error) {
    console.error('[Firebase] Error saving config:', error);
    throw error;
  }
};

export const getUserByActivationCode = async (codiceAttivazione: string): Promise<User | null> => {
  try {
    const db = getFirestoreDb();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('codiceAttivazione', '==', codiceAttivazione));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = { uid: userDoc.id, ...userDoc.data() } as User;
      console.log('[Firebase] User found for activation code:', codiceAttivazione);
      return userData;
    } else {
      console.log('[Firebase] No user found for activation code:', codiceAttivazione);
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Error getting user by activation code:', error);
    throw error;
  }
};

export const subscribeToUserUpdates = (
  uid: string,
  onUpdate: (user: User | null) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = { uid: docSnap.id, ...docSnap.data() } as User;
        console.log('[Firebase] User data updated for uid:', uid);
        onUpdate(userData);
      } else {
        console.log('[Firebase] User deleted or not found for uid:', uid);
        onUpdate(null);
      }
    }, (error) => {
      console.error('[Firebase] User snapshot error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing to user updates:', error);
    throw error;
  }
};

export const subscribeToShips = (
  onUpdate: (ships: Ship[]) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const shipsRef = collection(db, 'ships');
    const q = query(shipsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ships: Ship[] = [];
      querySnapshot.forEach((doc) => {
        ships.push({ id: doc.id, ...doc.data() } as Ship);
      });
      console.log('[Firebase] Ships updated:', ships.length);
      onUpdate(ships);
    }, (error) => {
      console.error('[Firebase] Ships snapshot error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing to ships:', error);
    throw error;
  }
};

export const subscribeToLocations = (
  onUpdate: (locations: Location[]) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const locations: Location[] = [];
      querySnapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() } as Location);
      });
      console.log('[Firebase] Locations updated:', locations.length);
      onUpdate(locations);
    }, (error) => {
      console.error('[Firebase] Locations snapshot error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing to locations:', error);
    throw error;
  }
};

export const subscribeToMyReports = (
  myUid: string,
  onUpdate: (reports: Report[]) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('recipientUserId', '==', myUid),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports: Report[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Report);
      });
      console.log('[Firebase] Reports updated for user:', myUid, reports.length);
      onUpdate(reports);
    }, (error) => {
      console.error('[Firebase] Reports snapshot error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing to reports:', error);
    throw error;
  }
};

export const createReport = async (report: Omit<Report, 'id'>): Promise<string> => {
  try {
    const db = getFirestoreDb();
    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, report);
    console.log('[Firebase] Report created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firebase] Error creating report:', error);
    throw error;
  }
};

export const createSharedReportCopies = async (
  originalReport: Omit<Report, 'id'>,
  originalReportId: string,
  technicians: { id: string; name: string; startTime: string; endTime: string; pauseMinutes: number }[]
): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const reportsRef = collection(db, 'reports');
    
    for (const tech of technicians) {
      const sharedCopy: Omit<Report, 'id'> = {
        ...originalReport,
        recipientUserId: tech.id,
        startTime: tech.startTime,
        endTime: tech.endTime,
        pauseMinutes: tech.pauseMinutes,
        technicians: [],
        isSharedCopy: true,
        createdBy: originalReport.recipientUserId,
      };
      
      await addDoc(reportsRef, sharedCopy);
      console.log('[Firebase] Shared report copy created for technician:', tech.id);
    }
  } catch (error) {
    console.error('[Firebase] Error creating shared report copies:', error);
    throw error;
  }
};

export const updateReport = async (reportId: string, updates: Partial<Report>): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: Date.now(),
    });
    console.log('[Firebase] Report updated:', reportId);
  } catch (error) {
    console.error('[Firebase] Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const reportRef = doc(db, 'reports', reportId);
    await deleteDoc(reportRef);
    console.log('[Firebase] Report deleted:', reportId);
  } catch (error) {
    console.error('[Firebase] Error deleting report:', error);
    throw error;
  }
};

export const updateUserLastAccess = async (uid: string): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ultimoAccesso: Date.now(),
    });
    console.log('[Firebase] User last access updated:', uid);
  } catch (error) {
    console.error('[Firebase] Error updating user last access:', error);
  }
};
