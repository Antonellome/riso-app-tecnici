import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

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
