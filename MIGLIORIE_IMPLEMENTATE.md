# Migliorie Implementate - R.I.S.O. App Tecnici

## Data Implementazione
2025-11-08

## Panoramica
Implementazione del nuovo sistema di sincronizzazione e gestione dati basato su Firebase con architettura Master-Tecnici.

---

## 1. Struttura Dati Aggiornata

### Nuove Interfacce TypeScript (`types/index.ts`)

#### `User`
```typescript
interface User {
  uid: string;
  codiceAttivazione: string;
  nome: string;
  cognome?: string;
  email?: string;
  ruolo: 'tecnico' | 'admin' | 'master';
  configurazioneApp: {
    naviAccessibili: string[];
    cantieriAccessibili: string[];
    impostazioniLavoro: WorkSettings;
  };
  attivo: boolean;
  dataCreazione: number;
  ultimoAccesso?: number;
}
```

#### `Report` (Aggiornato)
```typescript
interface Report {
  id: string;
  userId?: string;
  recipientUserId: string;        // NUOVO: ID del destinatario
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
  createdBy?: string;
  createdByName?: string;
  isSharedCopy: boolean;          // NUOVO: true se è una copia condivisa
}
```

#### `Ship` e `Location`
```typescript
interface Ship {
  id: string;
  name: string;
  createdAt: number;
}

interface Location {
  id: string;
  name: string;
  createdAt: number;
}
```

---

## 2. Firebase - Nuove Funzioni (`utils/firebase.ts`)

### Funzioni per Gestione Utenti

#### `getUserByActivationCode(codiceAttivazione: string)`
- Ricerca un utente tramite codice di attivazione nella collection `users`
- Query: `where('codiceAttivazione', '==', codiceAttivazione)`
- Ritorna: `User | null`

#### `subscribeToUserUpdates(uid: string, onUpdate: (user: User | null) => void)`
- Sottoscrizione real-time ai cambiamenti del profilo utente
- Listener su: `doc(db, 'users', uid)`
- Callback automatica quando il documento cambia

#### `updateUserLastAccess(uid: string)`
- Aggiorna il campo `ultimoAccesso` dell'utente
- Chiamato automaticamente all'apertura dell'app

### Funzioni per Gestione Navi e Cantieri

#### `subscribeToShips(onUpdate: (ships: Ship[]) => void)`
- Sottoscrizione real-time alla collection `ships`
- Ordinamento: per `createdAt` discendente
- Callback automatica quando la collection cambia

#### `subscribeToLocations(onUpdate: (locations: Location[]) => void)`
- Sottoscrizione real-time alla collection `locations`
- Ordinamento: per `createdAt` discendente
- Callback automatica quando la collection cambia

### Funzioni per Gestione Report

#### `subscribeToMyReports(myUid: string, onUpdate: (reports: Report[]) => void)`
- Sottoscrizione real-time ai report dell'utente
- Query: `where('recipientUserId', '==', myUid)`
- Ordinamento: per `date` discendente
- Include sia i report creati che le copie condivise

#### `createReport(report: Omit<Report, 'id'>)`
- Crea un nuovo report nella collection `reports`
- Ritorna: `reportId`

#### `createSharedReportCopies(originalReport, originalReportId, technicians)`
- Crea copie condivise del report per ogni tecnico coinvolto
- Ogni copia ha:
  - `recipientUserId`: ID del tecnico destinatario
  - Orari specifici del tecnico (non quelli del creatore)
  - `isSharedCopy: true`
  - `technicians: []` (array vuoto per evitare ridondanza)

#### `updateReport(reportId: string, updates: Partial<Report>)`
- Aggiorna un report esistente
- Aggiorna automaticamente il campo `updatedAt`

#### `deleteReport(reportId: string)`
- Elimina un report dalla collection

---

## 3. Flusso di Attivazione Migliorato (`app/scan-config.tsx`)

### Modifiche Principali

1. **Validazione Codice Attivazione**
   - Formato richiesto: 9 caratteri alfanumerici (es. `ABC123XYZ`)
   - Validazione regex: `/^[A-Z0-9]{9}$/`
   - Conversione automatica in maiuscolo

2. **Ricerca Utente su Firebase**
   ```typescript
   const user = await getUserByActivationCode(activationCode);
   ```

3. **Verifica Stato Utente**
   - Controlla che l'utente esista
   - Controlla che `user.attivo === true`
   - Messaggio di errore se disattivato

4. **Salvataggio Dati di Attivazione**
   ```typescript
   await AsyncStorage.setItem('@riso_app_activation_code', activationCode);
   await AsyncStorage.setItem('@riso_app_user_uid', user.uid);
   await AsyncStorage.setItem('@riso_app_is_activated', 'true');
   ```

5. **Applicazione Configurazione**
   - Nome utente: combinazione di `nome` e `cognome`
   - Impostazioni lavoro: da `configurazioneApp.impostazioniLavoro`
   - Navi accessibili: da `configurazioneApp.naviAccessibili`
   - Cantieri accessibili: da `configurazioneApp.cantieriAccessibili`

### Supporto Web
- Scansione QR: solo su mobile
- Inserimento manuale: disponibile su tutte le piattaforme
- Fallback per importazione file JSON

---

## 4. Sistema di Condivisione Report

### Come Funziona

1. **Creazione Report**
   - Tecnico A crea un report con i suoi orari
   - Aggiunge Tecnico B e Tecnico C con i loro orari specifici

2. **Salvataggio su Firebase**
   - Report originale salvato con `recipientUserId: tecnicoA_uid`
   - Copie condivise create automaticamente per Tecnico B e C
   - Ogni copia ha gli orari specifici del tecnico destinatario

3. **Sincronizzazione**
   - Ogni tecnico riceve automaticamente i suoi report
   - Query: `where('recipientUserId', '==', proprio_uid)`
   - Include sia report creati che copie condivise

4. **Visualizzazione**
   - Badge distintivo per report condivisi
   - Indicazione del creatore originale
   - Statistiche includono tutti i report (propri + condivisi)

---

## 5. Architettura Firebase

### Collections Firestore

```
firebase
├── users/{uid}
│   ├── codiceAttivazione: string
│   ├── nome: string
│   ├── cognome: string (optional)
│   ├── email: string (optional)
│   ├── ruolo: string
│   ├── configurazioneApp: object
│   ├── attivo: boolean
│   ├── dataCreazione: number
│   └── ultimoAccesso: number (optional)
│
├── ships/{shipId}
│   ├── name: string
│   └── createdAt: number
│
├── locations/{locationId}
│   ├── name: string
│   └── createdAt: number
│
└── reports/{reportId}
    ├── recipientUserId: string
    ├── date: string
    ├── shiftType: string
    ├── startTime: string
    ├── endTime: string
    ├── pauseMinutes: number
    ├── ship: string
    ├── location: string
    ├── description: string
    ├── materials: string
    ├── workDone: string
    ├── technicians: array
    ├── createdAt: number
    ├── updatedAt: number
    ├── createdBy: string (optional)
    ├── createdByName: string (optional)
    └── isSharedCopy: boolean
```

### Regole di Sicurezza Consigliate

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Lettura: solo l'utente stesso o admin
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
      
      // Scrittura: solo admin/master
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
    }
    
    // Ships collection
    match /ships/{shipId} {
      // Lettura: tutti gli utenti autenticati
      allow read: if request.auth != null;
      
      // Scrittura: solo admin/master
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
    }
    
    // Locations collection
    match /locations/{locationId} {
      // Lettura: tutti gli utenti autenticati
      allow read: if request.auth != null;
      
      // Scrittura: solo admin/master
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
    }
    
    // Reports collection
    match /reports/{reportId} {
      // Lettura: solo i report dove recipientUserId == proprio uid, o admin/master
      allow read: if request.auth != null && 
        (resource.data.recipientUserId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
      
      // Creazione: solo se recipientUserId == proprio uid o è admin/master
      allow create: if request.auth != null && 
        (request.resource.data.recipientUserId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
      
      // Aggiornamento: solo i propri report o admin/master
      allow update: if request.auth != null && 
        (resource.data.recipientUserId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
      
      // Eliminazione: solo i propri report o admin/master
      allow delete: if request.auth != null && 
        (resource.data.recipientUserId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ruolo == 'master');
    }
  }
}
```

---

## 6. Prossimi Passi (da implementare in AppContext)

### Sottoscrizioni Real-time
1. Attivare listener per aggiornamenti utente
2. Attivare listener per navi e cantieri
3. Attivare listener per report dell'utente
4. Gestire cleanup dei listener al logout

### Gestione Reports
1. Integrare `createReport` per salvataggio su Firebase
2. Integrare `createSharedReportCopies` per report condivisi
3. Aggiornare `addReport` per usare Firebase invece di AsyncStorage
4. Mantenere cache locale per uso offline

### Sincronizzazione
1. Implementare sincronizzazione automatica all'avvio
2. Gestire conflitti tra dati locali e Firebase
3. Implementare strategia di retry per operazioni fallite
4. Notificare l'utente in caso di errori di sincronizzazione

---

## 7. Compatibilità con App Master

### Creazione Utente Tecnico dall'App Master

```typescript
// 1. Generare codice attivazione (9 caratteri alfanumerici)
const codiceAttivazione = generateActivationCode(); // es. "ABC123XYZ"

// 2. Creare documento utente su Firestore
await setDoc(doc(db, 'users', generatedUid), {
  codiceAttivazione,
  nome: "Mario",
  cognome: "Rossi",
  email: "mario.rossi@example.com",
  ruolo: "tecnico",
  configurazioneApp: {
    naviAccessibili: ["nave1_id", "nave2_id"],
    cantieriAccessibili: ["cantiere1_id", "cantiere2_id"],
    impostazioniLavoro: {
      defaultStartTime: "07:30",
      defaultEndTime: "16:30",
      defaultPauseMinutes: 60,
      hourlyRates: [
        { type: 'Ordinaria', rate: 18.50 },
        { type: 'Straordinaria', rate: 27.75 },
        { type: 'Festiva', rate: 35.00 }
      ]
    }
  },
  attivo: true,
  dataCreazione: Date.now()
});

// 3. Fornire codiceAttivazione al tecnico (QR code, email, SMS, etc.)
```

### Aggiornamento Configurazione dall'App Master

```typescript
// Aggiornare documento utente su Firestore
await updateDoc(doc(db, 'users', userId), {
  'configurazioneApp.naviAccessibili': ["nave1_id", "nave2_id", "nave3_id"],
  ultimoAccesso: Date.now()
});

// L'app tecnici riceverà automaticamente l'aggiornamento tramite listener real-time
```

---

## 8. Testing

### Test Flusso Attivazione
1. Dall'App Master: creare utente tecnico con codice
2. Dall'App Tecnici: scansionare/inserire codice
3. Verificare che la configurazione sia applicata correttamente
4. Verificare che i dati siano salvati in AsyncStorage

### Test Sincronizzazione Real-time
1. Dall'App Master: aggiornare configurazione utente
2. Dall'App Tecnici: verificare che le modifiche siano ricevute automaticamente
3. Testare con navi, cantieri, e impostazioni lavoro

### Test Gestione Report
1. Creare report con più tecnici
2. Verificare che ogni tecnico riceva la sua copia
3. Verificare che gli orari specifici siano corretti
4. Verificare che le statistiche includano tutti i report

---

## 9. Note Importanti

### Credenziali Firebase
- Le credenziali Firebase devono essere **identiche** su App Master e App Tecnici
- Configurare in `.env` o variabili d'ambiente
- Non committare le credenziali reali nel repository

### Gestione Errori
- Tutti i metodi Firebase includono try-catch con logging
- Messaggi di errore user-friendly in italiano
- Fallback locali in caso di problemi di rete

### Performance
- Usare listener real-time con moderazione
- Implementare debounce per operazioni frequenti
- Cache locale per ridurre letture Firebase

### Sicurezza
- Implementare regole Firestore appropriate
- Validare input utente prima di salvare
- Non esporre dati sensibili nei log

---

## File Modificati

1. `types/index.ts` - Nuove interfacce User, Ship, Location, Report aggiornato
2. `utils/firebase.ts` - Nuove funzioni per gestione completa Firebase
3. `app/scan-config.tsx` - Flusso attivazione con getUserByActivationCode

## File da Aggiornare (Prossimi Passi)

1. `contexts/AppContext.tsx` - Integrare sottoscrizioni Firebase
2. `app/add-report.tsx` - Usare createReport e createSharedReportCopies
3. `app/today-reports.tsx` - Mostrare badge per report condivisi
4. `app/statistics.tsx` - Includere tutti i report nelle statistiche

---

## Conclusione

Le migliorie implementate trasformano l'app da un sistema standalone a un'architettura client-server integrata con Firebase, mantenendo la compatibilità con l'App Master e garantendo sincronizzazione real-time dei dati.

Questa architettura permette:
- ✅ Attivazione semplice tramite codice QR
- ✅ Sincronizzazione automatica delle configurazioni
- ✅ Condivisione automatica dei report tra tecnici
- ✅ Aggiornamenti real-time senza riavvio app
- ✅ Gestione centralizzata dall'App Master
- ✅ Scalabilità per centinaia di tecnici

---

**Documento creato il:** 2025-11-08  
**Versione App:** 1.0.0  
**Stato:** ✅ Implementazione Base Completata
