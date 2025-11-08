# 📋 REQUISITI PER RISO MASTER
## Documento Completo per Integrazione con RISO App

---

## 🎯 INDICE

1. [Panoramica Sistema](#panoramica-sistema)
2. [Configurazione Firebase](#configurazione-firebase)
3. [Variabili d'Ambiente](#variabili-dambiente)
4. [Strutture Dati TypeScript](#strutture-dati-typescript)
5. [Chiavi AsyncStorage](#chiavi-asyncstorage)
6. [API MockSyncServer](#api-mocksyncserver)
7. [Funzionalità da Implementare](#funzionalità-da-implementare)
8. [Flusso di Attivazione](#flusso-di-attivazione)
9. [Checklist Implementazione](#checklist-implementazione)

---

## 📖 PANORAMICA SISTEMA

**Architettura di Integrazione:**

```
RISO Master (App Desktop/Web)
    ↓
    ├─→ Firebase Firestore (Configurazioni Real-time)
    │   └─→ Collection: userConfigs/{CODICE_ATTIVAZIONE}
    │
    └─→ AsyncStorage/LocalStorage (Database Condiviso)
        └─→ MockSyncServer (Reports, Tecnici, Navi, Cantieri)
            ↓
        RISO App (App Mobile Tecnici)
```

**Flusso Principale:**
1. RISO Master crea configurazione tecnico
2. Genera codice attivazione (9 caratteri alfanumerici)
3. Salva configurazione su Firebase
4. Tecnico inserisce codice in RISO App
5. RISO App scarica e applica configurazione automaticamente
6. Modifiche successive in RISO Master si sincronizzano in tempo reale

---

## 🔥 CONFIGURAZIONE FIREBASE

### Credenziali (DEVONO essere identiche in entrambe le app)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=riso-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=riso-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=riso-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Struttura Firestore

```
Firebase Firestore
└── userConfigs (Collection)
    ├── ABC123XYZ (Document - Codice Attivazione)
    │   ├── userId: "TEC001"
    │   ├── apiKey: "key_abc123"
    │   ├── technicianName: "Mario Rossi"
    │   ├── companyName: "Riso S.r.l."
    │   ├── serverUrl: "https://sync.riso.com"
    │   ├── autoSync: true
    │   ├── active: true
    │   ├── createdAt: 1234567890
    │   ├── updatedAt: 1234567890
    │   ├── ships: ["Nave Alpha", "Nave Beta"]
    │   ├── locations: ["Cantiere A", "Cantiere B"]
    │   ├── technicianCategories: [...]
    │   └── work: {...}
    │
    └── XYZ789ABC (Document - Altro Tecnico)
        └── ...
```

---

## 🔐 VARIABILI D'AMBIENTE

### File `.env` (o `.env.local`)

```env
# Firebase Configuration (IDENTICHE a RISO App)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=riso-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=riso-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=riso-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server Configuration
SYNC_SERVER_URL=https://sync.riso.com

# App Configuration
APP_NAME=RISO Master
APP_VERSION=1.0.0
```

⚠️ **CRITICO**: Le credenziali Firebase devono essere ESATTAMENTE le stesse in entrambe le applicazioni!

---

## 📦 STRUTTURE DATI TYPESCRIPT

### 1. UserConfig (Configurazione Tecnico)

```typescript
export interface UserConfig {
  // === CAMPI OBBLIGATORI ===
  
  userId: string;              // ID univoco tecnico (es. "TEC001")
  apiKey: string;              // API Key per autenticazione (es. "key_abc123")
  technicianName: string;      // Nome completo tecnico (es. "Mario Rossi")
  companyName: string;         // Nome azienda (es. "Riso S.r.l.")
  serverUrl: string;           // URL server sync (es. "https://sync.riso.com")
  autoSync: boolean;           // Sincronizzazione automatica (true/false)
  active: boolean;             // Se configurazione è attiva (true/false)
  createdAt: number;           // Timestamp creazione (Date.now())
  
  // === CAMPI OPZIONALI ===
  
  updatedAt?: number;          // Timestamp ultimo aggiornamento
  ships?: string[];            // Lista navi ["Nave Alpha", "Nave Beta"]
  locations?: string[];        // Lista cantieri ["Cantiere A", "Cantiere B"]
  technicianCategories?: TechnicianCategory[];  // Categorie tecnici
  work?: WorkConfig;           // Configurazione lavoro e tariffe
}
```

### 2. TechnicianCategory (Categorie Tecnici)

```typescript
export interface TechnicianCategory {
  category: string;            // Nome categoria (es. "Elettricisti")
  technicians: string[];       // Lista nomi tecnici ["Luigi Verdi", "Paolo Bianchi"]
}
```

**Esempio:**
```typescript
const categories: TechnicianCategory[] = [
  {
    category: "Elettricisti",
    technicians: ["Luigi Verdi", "Paolo Bianchi", "Marco Neri"]
  },
  {
    category: "Meccanici",
    technicians: ["Giovanni Rossi", "Francesco Gialli"]
  },
  {
    category: "Idraulici",
    technicians: ["Andrea Blu", "Stefano Verdi"]
  }
];
```

### 3. WorkConfig (Configurazione Lavoro)

```typescript
export interface WorkConfig {
  defaultStartTime: string;        // Orario inizio default (es. "07:30")
  defaultEndTime: string;          // Orario fine default (es. "16:30")
  defaultPauseMinutes: number;     // Minuti pausa default (es. 60)
  hourlyRates: HourlyRate[];       // Tariffe orarie per tipo turno
}
```

### 4. HourlyRate (Tariffa Oraria)

```typescript
export interface HourlyRate {
  type: ShiftType;    // Tipo turno
  rate: number;       // Tariffa €/ora
}

export type ShiftType = 
  | 'Ordinaria'       // Orario normale
  | 'Straordinaria'   // Straordinario
  | 'Festiva'         // Festivo
  | 'Ferie'           // Ferie
  | 'Permesso'        // Permesso
  | 'Malattia'        // Malattia
  | '104';            // Legge 104
```

**Esempio:**
```typescript
const hourlyRates: HourlyRate[] = [
  { type: 'Ordinaria', rate: 15.00 },
  { type: 'Straordinaria', rate: 22.50 },
  { type: 'Festiva', rate: 30.00 },
  { type: 'Ferie', rate: 15.00 },
  { type: 'Permesso', rate: 15.00 },
  { type: 'Malattia', rate: 15.00 },
  { type: '104', rate: 15.00 }
];
```

### 5. Report (Rapporto Giornaliero)

```typescript
export interface Report {
  id: string;                      // ID univoco report
  userId: string;                  // ID tecnico proprietario
  date: string;                    // Data formato "YYYY-MM-DD" (es. "2025-01-15")
  shiftType: ShiftType;            // Tipo turno
  startTime: string;               // Orario inizio (es. "07:30")
  endTime: string;                 // Orario fine (es. "16:30")
  pauseMinutes: number;            // Minuti pausa
  ship: string;                    // Nome nave
  location: string;                // Cantiere/Location
  description: string;             // Descrizione lavoro
  materials: string;               // Materiali utilizzati
  workDone: string;                // Lavoro svolto
  technicians: Technician[];       // Tecnici presenti
  createdAt: number;               // Timestamp creazione
  updatedAt: number;               // Timestamp ultimo aggiornamento
}
```

### 6. Technician (Tecnico in Report)

```typescript
export interface Technician {
  id: string;           // ID univoco
  name: string;         // Nome tecnico
  startTime: string;    // Orario inizio (es. "07:30")
  endTime: string;      // Orario fine (es. "16:30")
  pauseMinutes: number; // Minuti pausa
}
```

### 7. Notification (Notifica)

```typescript
export interface Notification {
  id: string;                      // ID univoco
  title: string;                   // Titolo notifica
  message: string;                 // Messaggio
  date: string;                    // Data formato "YYYY-MM-DD"
  timestamp: number;               // Timestamp
  priority: 'low' | 'normal' | 'high';  // Priorità
  type: 'info' | 'warning' | 'alert' | 'config';  // Tipo
  targetUsers: string[];           // ['all'] o ['TEC001', 'TEC002']
  createdBy: string;               // Creatore (es. "MASTER")
  configData?: SyncConfigData;     // Dati config (se type === 'config')
}
```

### 8. SyncServerUser (Utente Server)

```typescript
export interface SyncServerUser {
  id: string;          // ID univoco (uguale a userId)
  name: string;        // Nome tecnico
  company: string;     // Azienda
  apiKey: string;      // API Key
  createdAt: number;   // Timestamp creazione
  lastSync?: number;   // Timestamp ultima sync
  active: boolean;     // Se utente è attivo
}
```

---

## 💾 CHIAVI ASYNCSTORAGE

### Chiavi App RISO App (NON modificare)

```typescript
// Chiavi private RISO App
'@riso_app_settings'           // Impostazioni app
'@riso_app_reports'            // Reports locali
'@riso_app_password'           // Password protezione
'@riso_app_notifications'      // Notifiche locali
'@riso_app_recent_technicians' // Tecnici usati recentemente
'@riso_app_activation_code'    // Codice attivazione
'@riso_app_is_activated'       // Flag attivazione
```

### Chiavi Condivise (RISO Master DEVE usare queste)

```typescript
export const SYNC_SERVER_KEYS = {
  USERS: '@riso_sync_server_users',              // Utenti registrati
  REPORTS: '@riso_sync_server_reports',          // Reports sincronizzati
  NOTIFICATIONS: '@riso_sync_server_notifications',  // Notifiche server
  TECHNICIANS: '@riso_sync_server_technicians',  // Lista tecnici categorizzati
  SHIPS: '@riso_sync_server_ships',              // Lista navi
  LOCATIONS: '@riso_sync_server_locations',      // Lista cantieri/location
};
```

### Formato Dati nelle Chiavi

```typescript
// @riso_sync_server_users
SyncServerUser[]

// @riso_sync_server_reports
Report[]

// @riso_sync_server_notifications
Notification[]

// @riso_sync_server_technicians
TechnicianCategory[]

// @riso_sync_server_ships
string[]  // ["Nave Alpha", "Nave Beta", ...]

// @riso_sync_server_locations
string[]  // ["Cantiere A", "Cantiere B", ...]
```

---

## 🔌 API MOCKSYNCSERVER

RISO Master deve utilizzare queste API per gestire dati condivisi con RISO App.

### Classe MockSyncServer

```typescript
import { MockSyncServer } from '@/utils/mockSyncServer';
```

### Metodi Disponibili

#### 1. Autenticazione Utente

```typescript
MockSyncServer.authenticateUser(
  userId: string,
  apiKey: string
): Promise<boolean>
```

**Uso:**
```typescript
const isValid = await MockSyncServer.authenticateUser("TEC001", "key_abc123");
if (isValid) {
  console.log("Utente autenticato");
}
```

---

#### 2. Gestione Utenti

**Aggiungere Utente:**
```typescript
MockSyncServer.addUser(
  user: SyncServerUser
): Promise<{ success: boolean; message: string }>
```

**Esempio:**
```typescript
await MockSyncServer.addUser({
  id: "TEC001",
  name: "Mario Rossi",
  company: "Riso S.r.l.",
  apiKey: "key_abc123",
  createdAt: Date.now(),
  active: true
});
```

**Aggiornare Utente:**
```typescript
MockSyncServer.updateUser(
  userId: string,
  updates: Partial<SyncServerUser>
): Promise<{ success: boolean; message: string }>
```

**Ottenere Tutti gli Utenti:**
```typescript
MockSyncServer.getAllUsers(): Promise<{
  success: boolean;
  data?: SyncServerUser[];
  message: string;
}>
```

**Eliminare Utente:**
```typescript
MockSyncServer.deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }>
```

---

#### 3. Gestione Reports

**Ottenere Reports Utente:**
```typescript
MockSyncServer.getUserData(
  userId: string,
  apiKey: string
): Promise<{
  success: boolean;
  data?: Report[];
  message: string;
}>
```

**Ottenere Tutti i Reports:**
```typescript
MockSyncServer.getAllReports(): Promise<{
  success: boolean;
  data?: Report[];
  message: string;
}>
```

**Esempio - Visualizzare Reports di un Tecnico:**
```typescript
const result = await MockSyncServer.getUserData("TEC001", "key_abc123");
if (result.success && result.data) {
  console.log(`Trovati ${result.data.length} reports`);
  result.data.forEach(report => {
    console.log(`${report.date} - ${report.ship} - ${report.location}`);
  });
}
```

---

#### 4. Gestione Tecnici

**Ottenere Lista Tecnici:**
```typescript
MockSyncServer.getTechnicians(): Promise<{
  success: boolean;
  data?: TechnicianCategory[];
  message: string;
}>
```

**Aggiornare Lista Tecnici:**
```typescript
MockSyncServer.setTechnicians(
  technicians: TechnicianCategory[]
): Promise<{ success: boolean; message: string }>
```

**Esempio - Aggiungere Categoria Tecnici:**
```typescript
const categories: TechnicianCategory[] = [
  {
    category: "Elettricisti",
    technicians: ["Luigi Verdi", "Paolo Bianchi"]
  },
  {
    category: "Meccanici",
    technicians: ["Giovanni Rossi"]
  }
];

await MockSyncServer.setTechnicians(categories);
```

---

#### 5. Gestione Navi e Cantieri

**Ottenere Navi e Cantieri:**
```typescript
MockSyncServer.getShipsAndLocations(): Promise<{
  success: boolean;
  data?: {
    ships: string[];
    locations: string[];
  };
  message: string;
}>
```

**Aggiornare Navi e Cantieri:**
```typescript
MockSyncServer.setShipsAndLocations(
  ships: string[],
  locations: string[]
): Promise<{ success: boolean; message: string }>
```

**Esempio:**
```typescript
await MockSyncServer.setShipsAndLocations(
  ["Nave Alpha", "Nave Beta", "Nave Gamma"],
  ["Cantiere A", "Cantiere B", "Porto C"]
);
```

---

#### 6. Gestione Notifiche

**Ottenere Notifiche Utente:**
```typescript
MockSyncServer.getUserNotifications(
  userId: string,
  apiKey: string
): Promise<{
  success: boolean;
  data?: Notification[];
  message: string;
}>
```

**Aggiungere Notifica:**
```typescript
MockSyncServer.addNotification(
  notification: Notification
): Promise<{ success: boolean; message: string }>
```

**Esempio - Inviare Notifica a Tutti:**
```typescript
await MockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "Aggiornamento Importante",
  message: "Le tariffe orarie sono state aggiornate.",
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  priority: 'high',
  type: 'info',
  targetUsers: ['all'],  // Tutti i tecnici
  createdBy: 'MASTER'
});
```

**Esempio - Inviare Notifica a Tecnici Specifici:**
```typescript
await MockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "Nuovo Cantiere",
  message: "È stato aggiunto il cantiere 'Cantiere C'.",
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  priority: 'normal',
  type: 'info',
  targetUsers: ['TEC001', 'TEC002'],  // Solo questi tecnici
  createdBy: 'MASTER'
});
```

---

## 🛠️ FUNZIONALITÀ DA IMPLEMENTARE

### 1. Utility Firebase (`utils/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, getDocs } from 'firebase/firestore';

// Inizializzare Firebase
export const initializeFirebase = () => { /* ... */ };

// Salvare configurazione con codice
export const saveConfigForCode = async (
  code: string, 
  config: UserConfig
): Promise<void> => { /* ... */ };

// Leggere configurazione
export const getConfigByCode = async (
  code: string
): Promise<UserConfig | null> => { /* ... */ };

// Eliminare configurazione
export const deleteConfigByCode = async (
  code: string
): Promise<void> => { /* ... */ };

// Ottenere tutte le configurazioni
export const getAllConfigs = async (): Promise<
  Array<UserConfig & { activationCode: string }>
> => { /* ... */ };

// Disattivare/Riattivare codice
export const toggleConfigActive = async (
  code: string,
  active: boolean
): Promise<void> => { /* ... */ };
```

### 2. Generazione Codici Attivazione (`utils/activationCodes.ts`)

```typescript
// Generare codice attivazione (9 caratteri alfanumerici)
export const generateActivationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Validare formato codice
export const isValidActivationCode = (code: string): boolean => {
  return /^[A-Z0-9]{9}$/.test(code);
};

// Formattare per visualizzazione (ABC-123-XYZ)
export const formatActivationCode = (code: string): string => {
  if (code.length !== 9) return code;
  return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
};
```

### 3. UI Screens da Creare

#### A. Creazione Nuova Configurazione
- Input: Nome Tecnico, Azienda, User ID
- Lista Navi (multi-selezione)
- Lista Cantieri (multi-selezione)
- Lista Categorie Tecnici
- Configurazione Orari di Lavoro
- Tariffe Orarie per Tipo Turno
- Bottone "Genera Codice Attivazione"
- Mostrare codice generato in popup

#### B. Lista Configurazioni Attive
- Tabella con colonne:
  - Codice Attivazione
  - Nome Tecnico
  - Azienda
  - Stato (Attivo/Disattivato)
  - Data Creazione
  - Ultima Sincronizzazione
  - Azioni (Modifica, Disattiva, Elimina)

#### C. Modifica Configurazione
- Modificare tutti i campi della configurazione
- Aggiungere/Rimuovere Navi
- Aggiungere/Rimuovere Cantieri
- Modificare Categorie Tecnici
- Modificare Tariffe
- Bottone "Salva" → Aggiorna su Firebase

#### D. Gestione Tecnici Globale
- Lista Categorie
- Aggiungere/Modificare/Eliminare Categorie
- Aggiungere/Rimuovere Tecnici da Categorie
- Salva su MockSyncServer

#### E. Gestione Navi e Cantieri Globale
- Lista Navi (aggiungere, modificare, eliminare)
- Lista Cantieri (aggiungere, modificare, eliminare)
- Salva su MockSyncServer

#### F. Dashboard Reports
- Visualizzare tutti i reports di tutti i tecnici
- Filtri: Data, Tecnico, Nave, Cantiere, Tipo Turno
- Esportare in PDF/Excel
- Statistiche: Ore totali, Costi, Reports per tecnico

#### G. Invio Notifiche
- Input: Titolo, Messaggio
- Selezionare Destinatari: Tutti / Tecnici Specifici
- Priorità: Low / Normal / High
- Tipo: Info / Warning / Alert
- Bottone "Invia Notifica"

---

## 🔄 FLUSSO DI ATTIVAZIONE

### LATO RISO MASTER

#### Step 1: Creare Configurazione

```typescript
const config: UserConfig = {
  userId: "TEC001",
  apiKey: `key_${Date.now()}`,
  technicianName: "Mario Rossi",
  companyName: "Riso S.r.l.",
  serverUrl: "https://sync.riso.com",
  autoSync: true,
  active: true,
  createdAt: Date.now(),
  ships: ["Nave Alpha", "Nave Beta"],
  locations: ["Cantiere A", "Cantiere B"],
  technicianCategories: [
    {
      category: "Elettricisti",
      technicians: ["Luigi Verdi", "Paolo Bianchi"]
    }
  ],
  work: {
    defaultStartTime: "07:30",
    defaultEndTime: "16:30",
    defaultPauseMinutes: 60,
    hourlyRates: [
      { type: "Ordinaria", rate: 15 },
      { type: "Straordinaria", rate: 22.5 },
      { type: "Festiva", rate: 30 },
      { type: "Ferie", rate: 15 },
      { type: "Permesso", rate: 15 },
      { type: "Malattia", rate: 15 },
      { type: "104", rate: 15 }
    ]
  }
};
```

#### Step 2: Generare Codice

```typescript
const activationCode = generateActivationCode();
// Risultato: "ABC123XYZ"
```

#### Step 3: Salvare su Firebase

```typescript
await saveConfigForCode(activationCode, config);
```

#### Step 4: Registrare Utente su MockSyncServer

```typescript
await MockSyncServer.addUser({
  id: config.userId,
  name: config.technicianName,
  company: config.companyName,
  apiKey: config.apiKey,
  createdAt: Date.now(),
  active: true
});
```

#### Step 5: Fornire Codice al Tecnico

```typescript
// Mostrare in UI:
alert(`Codice attivazione per ${config.technicianName}: ${activationCode}`);
// O stampare, inviare via email, ecc.
```

### LATO RISO APP (Automatico)

1. Tecnico avvia app per prima volta
2. Vede schermata attivazione
3. Inserisce codice: `ABC123XYZ`
4. App scarica configurazione da Firebase
5. Applica tutte le impostazioni automaticamente
6. Salva codice per aggiornamenti futuri
7. Attiva listener real-time per modifiche

### Aggiornamento Configurazione

Quando RISO Master modifica una configurazione:

```typescript
// Aggiornare su Firebase
config.ships.push("Nave Gamma");
config.updatedAt = Date.now();
await saveConfigForCode(activationCode, config);

// RISO App riceverà automaticamente l'aggiornamento!
```

---

## ✅ CHECKLIST IMPLEMENTAZIONE

### Setup Iniziale

- [ ] Installare Firebase SDK (`npm install firebase`)
- [ ] Configurare credenziali Firebase (identiche a RISO App)
- [ ] Creare file `types/userConfig.ts` con tutte le interfacce
- [ ] Creare file `utils/firebase.ts` con funzioni Firebase
- [ ] Creare file `utils/activationCodes.ts` con utility codici

### Firebase Integration

- [ ] Implementare `initializeFirebase()`
- [ ] Implementare `saveConfigForCode()`
- [ ] Implementare `getConfigByCode()`
- [ ] Implementare `deleteConfigByCode()`
- [ ] Implementare `getAllConfigs()`
- [ ] Implementare `toggleConfigActive()`
- [ ] Testare connessione Firebase

### MockSyncServer Integration

- [ ] Importare `MockSyncServer` da RISO App
- [ ] Implementare gestione utenti
- [ ] Implementare gestione tecnici
- [ ] Implementare gestione navi e cantieri
- [ ] Implementare gestione notifiche
- [ ] Implementare visualizzazione reports

### UI Screens

- [ ] Schermata: Creazione Configurazione
- [ ] Schermata: Lista Configurazioni Attive
- [ ] Schermata: Modifica Configurazione
- [ ] Schermata: Gestione Tecnici Globale
- [ ] Schermata: Gestione Navi e Cantieri
- [ ] Schermata: Dashboard Reports
- [ ] Schermata: Invio Notifiche
- [ ] Schermata: Statistiche e Analytics

### Funzionalità Extra

- [ ] Esportazione Reports in PDF
- [ ] Esportazione Reports in Excel
- [ ] Statistiche per Tecnico
- [ ] Statistiche per Cantiere/Nave
- [ ] Statistiche per Periodo
- [ ] Backup/Restore Database
- [ ] Log attività utenti

### Testing

- [ ] Test: Creare configurazione e generare codice
- [ ] Test: Attivare RISO App con codice
- [ ] Test: Modificare configurazione da RISO Master
- [ ] Test: Verificare aggiornamento real-time in RISO App
- [ ] Test: Disattivare/Riattivare codice
- [ ] Test: Inviare notifica a tutti i tecnici
- [ ] Test: Inviare notifica a tecnico specifico
- [ ] Test: Aggiungere tecnici e verificare sync
- [ ] Test: Aggiungere navi/cantieri e verificare sync
- [ ] Test: Visualizzare reports di tutti i tecnici

---

## 🎯 ESEMPI PRATICI

### Esempio 1: Creare e Attivare Nuovo Tecnico

**RISO Master:**
```typescript
// 1. Creare configurazione
const config: UserConfig = {
  userId: "TEC002",
  apiKey: "key_luigi_verdi",
  technicianName: "Luigi Verdi",
  companyName: "Riso S.r.l.",
  serverUrl: "https://sync.riso.com",
  autoSync: true,
  active: true,
  createdAt: Date.now(),
  ships: ["Nave Alpha"],
  locations: ["Cantiere A"],
  technicianCategories: [],
  work: {
    defaultStartTime: "08:00",
    defaultEndTime: "17:00",
    defaultPauseMinutes: 60,
    hourlyRates: [
      { type: "Ordinaria", rate: 18 }
    ]
  }
};

// 2. Generare codice
const code = generateActivationCode(); // "XYZ456ABC"

// 3. Salvare su Firebase
await saveConfigForCode(code, config);

// 4. Registrare su MockSyncServer
await MockSyncServer.addUser({
  id: config.userId,
  name: config.technicianName,
  company: config.companyName,
  apiKey: config.apiKey,
  createdAt: Date.now(),
  active: true
});

// 5. Fornire codice
console.log(`Codice per Luigi Verdi: ${code}`);
```

**RISO App (Luigi):**
- Inserisce codice `XYZ456ABC`
- App si configura automaticamente
- Pronta all'uso!

### Esempio 2: Aggiungere Nuova Nave

**RISO Master:**
```typescript
// 1. Ottenere configurazione corrente
const config = await getConfigByCode("ABC123XYZ");

if (config) {
  // 2. Aggiungere nave
  config.ships = [...(config.ships || []), "Nave Delta"];
  config.updatedAt = Date.now();
  
  // 3. Salvare su Firebase
  await saveConfigForCode("ABC123XYZ", config);
  
  // 4. Aggiungere anche alla lista globale
  const { data } = await MockSyncServer.getShipsAndLocations();
  if (data) {
    await MockSyncServer.setShipsAndLocations(
      [...data.ships, "Nave Delta"],
      data.locations
    );
  }
}
```

**RISO App (Mario):**
- Riceve automaticamente l'aggiornamento
- "Nave Delta" appare nelle selezioni
- Nessuna azione richiesta!

### Esempio 3: Inviare Notifica Urgente

**RISO Master:**
```typescript
await MockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "⚠️ URGENTE",
  message: "Tutti i lavori su Nave Alpha sono sospesi fino a nuovo avviso.",
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  priority: 'high',
  type: 'alert',
  targetUsers: ['all'],
  createdBy: 'MASTER'
});
```

**RISO App (Tutti i tecnici):**
- Ricevono notifica nella schermata Notifiche
- Badge rosso con numero notifiche non lette
- Possono vedere dettagli e marcare come letta

---

## 📞 SUPPORTO E DOCUMENTAZIONE

### File di Riferimento

- **INTEGRAZIONE_RISO_APP.txt** - Documentazione completa integrazione
- **IMPLEMENTAZIONI_RISO_MASTER.md** - Istruzioni implementazione dettagliate
- **FIREBASE_SETUP.md** - Setup Firebase step-by-step
- **types/index.ts** - Tutte le interfacce TypeScript
- **utils/firebase.ts** - Utility Firebase
- **utils/mockSyncServer.ts** - API MockSyncServer
- **contexts/AppContext.tsx** - Logica RISO App

### Contatto

Per domande tecniche o problemi durante l'implementazione, consultare i file di documentazione sopra elencati.

---

## 🚀 CONCLUSIONE

Questo documento contiene **TUTTE** le informazioni necessarie per implementare la compatibilità completa tra RISO Master e RISO App.

**Prossimi Passi:**

1. Implementare utility Firebase
2. Implementare generazione codici attivazione
3. Creare UI per gestione configurazioni
4. Integrare MockSyncServer per dati condivisi
5. Testare flusso completo di attivazione
6. Implementare dashboard reports e statistiche

**Ricorda:** Le credenziali Firebase DEVONO essere identiche in entrambe le app!

---

📅 **Ultima Revisione:** 2025-11-02  
📱 **RISO App Version:** 1.0.0  
🖥️ **RISO Master Target Version:** 1.0.0
