# Firebase Auto-Configuration Setup

## Panoramica

Questo sistema permette all'app Master di generare codici univoci per ogni utente/tecnico. Quando un utente inserisce il codice nell'app mobile, l'app si auto-configura scaricando tutte le impostazioni da Firebase Firestore.

## Architettura

```
Master App (Desktop/Web)
    ↓
 Firebase Firestore
   (userConfigs/{code})
    ↓
Mobile App
   (Auto-configurazione)
```

## Setup Firebase

### 1. Creare un Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuovo progetto
3. Abilita Firestore Database

### 2. Configurare le Regole di Sicurezza

Nel Firebase Console, vai su Firestore Database → Rules e imposta:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userConfigs/{code} {
      // Lettura: solo con autenticazione o tramite codice valido
      allow read: if request.auth != null || resource.data.active == true;
      
      // Scrittura: solo autenticati (Master app)
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Ottenere le Credenziali

1. Nel Firebase Console, vai su Project Settings → General
2. Nella sezione "Your apps", aggiungi una Web App
3. Copia la configurazione Firebase
4. Aggiungi le variabili d'ambiente nell'app:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Struttura Dati Firestore

### Collection: `userConfigs`

Ogni documento ha l'ID uguale al codice di attivazione (es. "ABC123XYZ"):

```typescript
{
  // Identificazione
  userId: string;           // ID univoco utente
  apiKey: string;           // API key per sync
  active: boolean;          // Se il codice è attivo
  
  // Dati utente
  technicianName: string;   // Nome tecnico
  companyName: string;      // Nome azienda
  
  // Configurazione sync
  serverUrl: string;        // URL server di sincronizzazione
  autoSync: boolean;        // Auto-sync abilitato
  
  // Timestamp
  createdAt: number;        // Timestamp creazione
  updatedAt?: number;       // Timestamp ultimo aggiornamento
  
  // Configurazione app (opzionale)
  ships?: string[];         // Lista navi
  locations?: string[];     // Lista cantieri
  
  technicianCategories?: {
    category: string;
    technicians: string[];
  }[];
  
  work?: {
    defaultStartTime: string;      // es. "07:30"
    defaultEndTime: string;        // es. "16:30"
    defaultPauseMinutes: number;   // es. 60
    hourlyRates: {
      type: string;                // "Ordinaria", "Straordinaria", etc.
      rate: number;                // Tariffa oraria
    }[];
  };
}
```

## Implementazione Master App

### 1. Generazione Codici

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autentica Master (usa Firebase Authentication)
await signInWithEmailAndPassword(auth, 'master@email.com', 'password');

// Funzione per generare un codice univoco
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Funzione per creare una configurazione utente
async function createUserConfig(
  technicianName: string,
  companyName: string,
  serverUrl: string = 'https://your-server.com'
) {
  const code = generateCode();
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = `api_${Math.random().toString(36).substr(2, 32)}`;
  
  const config = {
    userId,
    apiKey,
    technicianName,
    companyName,
    serverUrl,
    autoSync: true,
    active: true,
    createdAt: Date.now(),
    
    // Configurazione opzionale
    ships: ['Nave 1', 'Nave 2'],
    locations: ['Cantiere A', 'Cantiere B'],
    
    work: {
      defaultStartTime: '07:30',
      defaultEndTime: '16:30',
      defaultPauseMinutes: 60,
      hourlyRates: [
        { type: 'Ordinaria', rate: 10 },
        { type: 'Straordinaria', rate: 15 },
        { type: 'Festiva', rate: 20 },
      ],
    },
    
    technicianCategories: [
      {
        category: 'Elettricisti',
        technicians: ['Mario Rossi', 'Luigi Bianchi'],
      },
      {
        category: 'Meccanici',
        technicians: ['Giuseppe Verdi', 'Antonio Neri'],
      },
    ],
  };
  
  // Salva in Firestore
  await setDoc(doc(db, 'userConfigs', code), config);
  
  console.log('Codice generato:', code);
  console.log('User ID:', userId);
  console.log('API Key:', apiKey);
  
  return { code, userId, apiKey };
}

// Esempio di utilizzo
const result = await createUserConfig(
  'Mario Rossi',
  'Azienda XYZ S.r.l.',
  'https://your-server.com'
);
```

### 2. Disattivare un Codice

```typescript
async function deactivateCode(code: string) {
  await setDoc(doc(db, 'userConfigs', code), {
    active: false,
    updatedAt: Date.now(),
  }, { merge: true });
  
  console.log(`Codice ${code} disattivato`);
}
```

### 3. Aggiornare Configurazione

Quando aggiorni la configurazione su Firestore, l'app mobile riceverà automaticamente gli aggiornamenti in tempo reale:

```typescript
async function updateUserConfig(code: string, updates: Partial<UserConfig>) {
  await setDoc(doc(db, 'userConfigs', code), {
    ...updates,
    updatedAt: Date.now(),
  }, { merge: true });
  
  console.log(`Configurazione aggiornata per codice ${code}`);
}

// Esempio: aggiungere una nuova nave
await updateUserConfig('ABC123XYZ', {
  ships: ['Nave 1', 'Nave 2', 'Nave 3'],
});
```

## Flusso Utente

### 1. Attivazione Iniziale

1. L'utente apre l'app mobile
2. Viene mostrata la schermata di attivazione
3. L'utente inserisce il codice fornito dal Master
4. L'app scarica la configurazione da Firebase
5. L'app si auto-configura con:
   - Dati utente (nome, azienda)
   - Configurazione sync (URL server, credenziali)
   - Liste (navi, cantieri, tecnici)
   - Impostazioni lavoro (orari, tariffe)

### 2. Aggiornamenti in Tempo Reale

Dopo l'attivazione, l'app rimane in ascolto delle modifiche su Firebase:

- Il Master aggiorna la configurazione su Firestore
- L'app mobile riceve automaticamente l'aggiornamento
- Le impostazioni vengono applicate senza riavviare l'app

### 3. Configurazione Manuale

Se l'utente clicca "Configura manualmente", può saltare l'attivazione con codice e configurare manualmente l'app dalle impostazioni.

## Sicurezza

### Best Practices

1. **Authentication**: Usa Firebase Authentication per il Master app
2. **Firestore Rules**: Limita l'accesso in scrittura solo agli utenti autenticati
3. **Code Generation**: Usa codici alfanumerici lunghi (9+ caratteri)
4. **API Keys**: Genera API keys uniche e sicure per ogni utente
5. **Deactivation**: Implementa un sistema per disattivare codici compromessi

### Gestione Codici Compromessi

Se un codice viene compromesso:

```typescript
// 1. Disattiva il codice vecchio
await deactivateCode('OLD_CODE');

// 2. Genera un nuovo codice per l'utente
const newResult = await createUserConfig(
  'Mario Rossi',
  'Azienda XYZ S.r.l.',
  'https://your-server.com'
);

// 3. Comunica il nuovo codice all'utente
```

## Testing

### Test Locale

Per testare localmente senza Firebase reale, le funzioni Firebase useranno valori di default se le variabili d'ambiente non sono configurate.

### Test con Firebase

1. Crea un progetto Firebase di test
2. Configura le variabili d'ambiente di test
3. Crea manualmente un documento in Firestore:
   - Collection: `userConfigs`
   - Document ID: `TEST123`
   - Dati: vedi esempio sopra

## Monitoraggio

Nel Firebase Console puoi monitorare:

- **Firestore**: Numero di documenti, letture/scritture
- **Authentication**: Utenti autenticati (Master)
- **Logs**: Errori e attività

## Costi

Firebase offre un piano gratuito (Spark) che include:
- 50K letture/giorno
- 20K scritture/giorno
- 1GB storage

Per un'app con ~100 utenti, questo è più che sufficiente.

## Troubleshooting

### Problema: "Codice non valido"

- Verifica che il documento esista in Firestore
- Verifica che `active: true`
- Controlla le regole di sicurezza Firestore

### Problema: "Errore di connessione"

- Verifica la connessione internet
- Verifica le credenziali Firebase nell'app
- Controlla i logs in Firebase Console

### Problema: "Updates non ricevuti"

- Verifica che il listener sia attivo (check logs)
- Verifica che `updatedAt` sia aggiornato in Firestore
- Riavvia l'app

## Supporto

Per domande o problemi, contatta il team di sviluppo o consulta la [Firebase Documentation](https://firebase.google.com/docs).
