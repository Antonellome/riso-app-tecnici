# 📱 Implementazioni per RISO Master

Questo documento contiene tutte le implementazioni che devono essere fatte nell'applicazione **RISO Master** per completare l'integrazione con **RISO App**.

---

## 📋 Indice

1. [Setup Firebase](#1-setup-firebase)
2. [Struttura Dati](#2-struttura-dati)
3. [Utility Firebase](#3-utility-firebase)
4. [Generazione Codici Attivazione](#4-generazione-codici-attivazione)
5. [UI per Gestione Configurazioni](#5-ui-per-gestione-configurazioni)
6. [Sistema Notifiche](#6-sistema-notifiche)
7. [AsyncStorage Condiviso](#7-asyncstorage-condiviso)

---

## 1. Setup Firebase

### 1.1 Installare Firebase SDK

```bash
npm install firebase
# oppure
yarn add firebase
```

### 1.2 Aggiungere Variabili d'Ambiente

Creare file `.env` (o `.env.local`) con le **STESSE** credenziali di RISO App:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=riso-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=riso-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=riso-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

⚠️ **IMPORTANTE**: Le credenziali DEVONO essere identiche in entrambe le app!

---

## 2. Struttura Dati

### 2.1 TypeScript Interfaces

Creare file `types/userConfig.ts`:

```typescript
export interface UserConfig {
  // Identificazione
  userId: string;
  apiKey: string;
  
  // Informazioni
  technicianName: string;
  companyName: string;
  
  // Configurazione
  serverUrl: string;
  autoSync: boolean;
  active: boolean;
  
  // Timestamp
  createdAt: number;
  updatedAt?: number;
  
  // Liste opzionali
  ships?: string[];
  locations?: string[];
  
  // Categorie tecnici
  technicianCategories?: TechnicianCategory[];
  
  // Configurazione lavoro
  work?: WorkConfig;
}

export interface TechnicianCategory {
  category: string;
  technicians: string[];
}

export interface WorkConfig {
  defaultStartTime: string;
  defaultEndTime: string;
  defaultPauseMinutes: number;
  hourlyRates: HourlyRate[];
}

export interface HourlyRate {
  type: string; // "Ordinaria", "Straordinaria", "Festiva", etc.
  rate: number;
}
```

---

## 3. Utility Firebase

### 3.1 Creare `utils/firebase.ts`

```typescript
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import type { UserConfig } from '@/types/userConfig';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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

// Salvare configurazione con codice attivazione
export const saveConfigForCode = async (
  activationCode: string, 
  config: UserConfig
): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', activationCode);
    await setDoc(configRef, {
      ...config,
      updatedAt: Date.now(),
    });
    console.log('[Firebase] Config saved for code:', activationCode);
  } catch (error) {
    console.error('[Firebase] Error saving config:', error);
    throw error;
  }
};

// Leggere configurazione
export const getConfigByCode = async (
  activationCode: string
): Promise<UserConfig | null> => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', activationCode);
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data() as UserConfig;
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Error getting config:', error);
    throw error;
  }
};

// Eliminare configurazione
export const deleteConfigByCode = async (
  activationCode: string
): Promise<void> => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', activationCode);
    await deleteDoc(configRef);
    console.log('[Firebase] Config deleted for code:', activationCode);
  } catch (error) {
    console.error('[Firebase] Error deleting config:', error);
    throw error;
  }
};

// Ottenere tutte le configurazioni
export const getAllConfigs = async (): Promise<
  Array<UserConfig & { activationCode: string }>
> => {
  try {
    const db = getFirestoreDb();
    const configsRef = collection(db, 'userConfigs');
    const q = query(configsRef);
    const querySnapshot = await getDocs(q);
    
    const configs: Array<UserConfig & { activationCode: string }> = [];
    querySnapshot.forEach((doc) => {
      configs.push({
        ...(doc.data() as UserConfig),
        activationCode: doc.id,
      });
    });
    
    return configs;
  } catch (error) {
    console.error('[Firebase] Error getting all configs:', error);
    throw error;
  }
};

// Disattivare/Riattivare codice
export const toggleConfigActive = async (
  activationCode: string,
  active: boolean
): Promise<void> => {
  try {
    const config = await getConfigByCode(activationCode);
    if (!config) {
      throw new Error('Config not found');
    }
    
    await saveConfigForCode(activationCode, {
      ...config,
      active,
    });
    
    console.log(`[Firebase] Config ${active ? 'activated' : 'deactivated'} for code:`, activationCode);
  } catch (error) {
    console.error('[Firebase] Error toggling config:', error);
    throw error;
  }
};

// Ascoltare modifiche real-time (opzionale per RISO Master)
export const subscribeToConfigUpdates = (
  activationCode: string,
  onUpdate: (config: UserConfig | null) => void
): Unsubscribe => {
  try {
    const db = getFirestoreDb();
    const configRef = doc(db, 'userConfigs', activationCode);
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserConfig);
      } else {
        onUpdate(null);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('[Firebase] Error subscribing:', error);
    throw error;
  }
};
```

---

## 4. Generazione Codici Attivazione

### 4.1 Creare `utils/activationCodes.ts`

```typescript
// Generare codice attivazione univoco (9 caratteri alfanumerici)
export const generateActivationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
};

// Validare formato codice
export const isValidActivationCode = (code: string): boolean => {
  return /^[A-Z0-9]{9}$/.test(code);
};

// Formattare codice per visualizzazione (ABC-123-XYZ)
export const formatActivationCode = (code: string): string => {
  if (code.length !== 9) return code;
  return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
};
```

---

## 5. UI per Gestione Configurazioni

### 5.1 Schermata Creazione Nuova Configurazione

Esempio di implementazione:

```typescript
import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { saveConfigForCode } from '@/utils/firebase';
import { generateActivationCode } from '@/utils/activationCodes';
import type { UserConfig } from '@/types/userConfig';

export default function CreateConfigScreen() {
  const [technicianName, setTechnicianName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userId, setUserId] = useState('');
  
  const handleCreate = async () => {
    try {
      // Generare codice attivazione
      const activationCode = generateActivationCode();
      
      // Creare configurazione
      const config: UserConfig = {
        userId: userId || `TEC${Date.now()}`,
        apiKey: `key_${Date.now()}`,
        technicianName,
        companyName,
        serverUrl: 'https://sync.riso.com',
        autoSync: true,
        active: true,
        createdAt: Date.now(),
        ships: [],
        locations: [],
        technicianCategories: [],
        work: {
          defaultStartTime: '07:30',
          defaultEndTime: '16:30',
          defaultPauseMinutes: 60,
          hourlyRates: [
            { type: 'Ordinaria', rate: 15 },
            { type: 'Straordinaria', rate: 22.5 },
            { type: 'Festiva', rate: 30 },
          ],
        },
      };
      
      // Salvare su Firebase
      await saveConfigForCode(activationCode, config);
      
      // Mostrare codice
      Alert.alert(
        'Configurazione Creata!',
        `Codice di attivazione: ${activationCode}\n\nFornisci questo codice a ${technicianName}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Nome Tecnico"
        value={technicianName}
        onChangeText={setTechnicianName}
      />
      <TextInput
        placeholder="Nome Azienda"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <TextInput
        placeholder="User ID (opzionale)"
        value={userId}
        onChangeText={setUserId}
      />
      <Button title="Crea Configurazione" onPress={handleCreate} />
    </View>
  );
}
```

### 5.2 Schermata Lista Configurazioni Attive

```typescript
import { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { getAllConfigs, toggleConfigActive } from '@/utils/firebase';
import type { UserConfig } from '@/types/userConfig';

export default function ConfigListScreen() {
  const [configs, setConfigs] = useState<Array<UserConfig & { activationCode: string }>>([]);
  
  useEffect(() => {
    loadConfigs();
  }, []);
  
  const loadConfigs = async () => {
    try {
      const data = await getAllConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };
  
  const handleToggleActive = async (code: string, currentActive: boolean) => {
    try {
      await toggleConfigActive(code, !currentActive);
      await loadConfigs();
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <FlatList
        data={configs}
        keyExtractor={(item) => item.activationCode}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>Codice: {item.activationCode}</Text>
            <Text>Tecnico: {item.technicianName}</Text>
            <Text>Stato: {item.active ? 'Attivo' : 'Disattivato'}</Text>
            <Button
              title={item.active ? 'Disattiva' : 'Riattiva'}
              onPress={() => handleToggleActive(item.activationCode, item.active)}
            />
          </View>
        )}
      />
    </View>
  );
}
```

### 5.3 Schermata Modifica Configurazione

```typescript
import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { getConfigByCode, saveConfigForCode } from '@/utils/firebase';
import type { UserConfig } from '@/types/userConfig';

interface EditConfigScreenProps {
  activationCode: string;
}

export default function EditConfigScreen({ activationCode }: EditConfigScreenProps) {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [ships, setShips] = useState('');
  const [locations, setLocations] = useState('');
  
  useEffect(() => {
    loadConfig();
  }, []);
  
  const loadConfig = async () => {
    try {
      const data = await getConfigByCode(activationCode);
      if (data) {
        setConfig(data);
        setShips(data.ships?.join(', ') || '');
        setLocations(data.locations?.join(', ') || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };
  
  const handleSave = async () => {
    if (!config) return;
    
    try {
      const updatedConfig: UserConfig = {
        ...config,
        ships: ships.split(',').map(s => s.trim()).filter(Boolean),
        locations: locations.split(',').map(l => l.trim()).filter(Boolean),
      };
      
      await saveConfigForCode(activationCode, updatedConfig);
      
      Alert.alert(
        'Configurazione Aggiornata!',
        'L\'app del tecnico riceverà automaticamente le modifiche.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Navi (separate da virgola)"
        value={ships}
        onChangeText={setShips}
        multiline
      />
      <TextInput
        placeholder="Cantieri (separati da virgola)"
        value={locations}
        onChangeText={setLocations}
        multiline
      />
      <Button title="Salva Modifiche" onPress={handleSave} />
    </View>
  );
}
```

---

## 6. Sistema Notifiche

### 6.1 Struttura Notifica

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
  type: 'info' | 'warning' | 'alert' | 'config';
  targetUsers: string[]; // ['all'] oppure ['TEC001', 'TEC002']
  createdBy: string;
  configData?: any; // Dati configurazione per tipo 'config'
}
```

### 6.2 Invio Notifica

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@riso_sync_server_notifications';

export const sendNotification = async (
  title: string,
  message: string,
  targetUsers: string[], // ['all'] o ['TEC001', 'TEC002']
  priority: 'low' | 'normal' | 'high' = 'normal',
  type: 'info' | 'warning' | 'alert' = 'info'
): Promise<void> => {
  try {
    const notificationsData = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications: Notification[] = notificationsData 
      ? JSON.parse(notificationsData) 
      : [];
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      priority,
      type,
      targetUsers,
      createdBy: 'MASTER',
    };
    
    notifications.push(newNotification);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    
    console.log('[Notifications] Sent notification to:', targetUsers);
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
    throw error;
  }
};

// Esempio di utilizzo:
// Notifica a tutti i tecnici
await sendNotification(
  'Aggiornamento Tariffe',
  'Le tariffe orarie sono state aggiornate.',
  ['all'],
  'high',
  'info'
);

// Notifica a tecnici specifici
await sendNotification(
  'Nuovo Cantiere',
  'È stato aggiunto il cantiere "Cantiere C".',
  ['TEC001', 'TEC002'],
  'normal',
  'info'
);
```

---

## 7. AsyncStorage Condiviso

### 7.1 Chiavi Condivise

Le seguenti chiavi AsyncStorage sono condivise tra RISO Master e RISO App:

```typescript
const SHARED_STORAGE_KEYS = {
  USERS: '@riso_sync_server_users',
  REPORTS: '@riso_sync_server_reports',
  NOTIFICATIONS: '@riso_sync_server_notifications',
  TECHNICIANS: '@riso_sync_server_technicians',
  SHIPS: '@riso_sync_server_ships',
  LOCATIONS: '@riso_sync_server_locations',
};
```

### 7.2 Gestione Navi e Cantieri

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHIPS_KEY = '@riso_sync_server_ships';
const LOCATIONS_KEY = '@riso_sync_server_locations';

// Aggiungere navi
export const updateShips = async (ships: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SHIPS_KEY, JSON.stringify(ships));
    console.log('[Storage] Ships updated');
  } catch (error) {
    console.error('[Storage] Error updating ships:', error);
    throw error;
  }
};

// Aggiungere cantieri
export const updateLocations = async (locations: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    console.log('[Storage] Locations updated');
  } catch (error) {
    console.error('[Storage] Error updating locations:', error);
    throw error;
  }
};

// Ottenere navi e cantieri
export const getShipsAndLocations = async (): Promise<{
  ships: string[];
  locations: string[];
}> => {
  try {
    const shipsData = await AsyncStorage.getItem(SHIPS_KEY);
    const locationsData = await AsyncStorage.getItem(LOCATIONS_KEY);
    
    return {
      ships: shipsData ? JSON.parse(shipsData) : [],
      locations: locationsData ? JSON.parse(locationsData) : [],
    };
  } catch (error) {
    console.error('[Storage] Error getting ships and locations:', error);
    throw error;
  }
};
```

### 7.3 Gestione Tecnici

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const TECHNICIANS_KEY = '@riso_sync_server_technicians';

export interface TechnicianCategory {
  category: string;
  technicians: string[];
}

// Aggiornare tecnici
export const updateTechnicians = async (
  categories: TechnicianCategory[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(TECHNICIANS_KEY, JSON.stringify(categories));
    console.log('[Storage] Technicians updated');
  } catch (error) {
    console.error('[Storage] Error updating technicians:', error);
    throw error;
  }
};

// Ottenere tecnici
export const getTechnicians = async (): Promise<TechnicianCategory[]> => {
  try {
    const data = await AsyncStorage.getItem(TECHNICIANS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Storage] Error getting technicians:', error);
    throw error;
  }
};
```

---

## 📝 Checklist Implementazione

- [ ] Installare Firebase SDK
- [ ] Configurare credenziali Firebase (identiche a RISO App)
- [ ] Creare `types/userConfig.ts`
- [ ] Creare `utils/firebase.ts`
- [ ] Creare `utils/activationCodes.ts`
- [ ] Implementare UI per creare configurazioni
- [ ] Implementare UI per lista configurazioni attive
- [ ] Implementare UI per modificare configurazioni
- [ ] Implementare sistema notifiche
- [ ] Implementare gestione navi e cantieri condivisi
- [ ] Implementare gestione tecnici condivisi
- [ ] Testare creazione codice attivazione
- [ ] Testare attivazione da RISO App
- [ ] Testare aggiornamento configurazione real-time
- [ ] Testare disattivazione/riattivazione codici

---

## 🎯 Test Completo

### Scenario di Test:

1. **RISO Master**: Creare nuova configurazione per "Mario Rossi"
2. **RISO Master**: Ricevere codice attivazione (es. ABC123XYZ)
3. **RISO App**: Inserire codice ABC123XYZ
4. **RISO App**: Verificare che la configurazione sia applicata
5. **RISO Master**: Modificare la configurazione (aggiungere una nave)
6. **RISO App**: Verificare che l'aggiornamento sia ricevuto automaticamente
7. **RISO Master**: Inviare notifica a tutti i tecnici
8. **RISO App**: Verificare ricezione notifica
9. **RISO Master**: Disattivare codice
10. **RISO App**: Verificare che il codice risulti disattivato

---

## 📞 Supporto

Per domande o problemi durante l'implementazione:

- Consultare `INTEGRAZIONE_RISO_APP.txt` per dettagli tecnici completi
- Verificare `FIREBASE_SETUP.md` per setup Firebase
- Controllare i log della console per errori Firebase

---

**Buon lavoro! 🚀**
