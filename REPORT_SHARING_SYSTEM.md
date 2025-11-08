# Sistema di Condivisione Report tra Tecnici

## Panoramica

Il sistema ora supporta la distribuzione automatica dei report a tutti i tecnici coinvolti, garantendo che ogni tecnico abbia traccia completa delle ore lavorate, sia per i report creati personalmente che per quelli in cui è stato inserito da altri tecnici.

## Come Funziona

### 1. Creazione del Report

Quando un utente (es. Tecnico A) crea un report:
- Inserisce i propri dati (orario di inizio/fine, pausa, tipo turno)
- Può aggiungere altri tecnici al report (es. Tecnico B e Tecnico C)
- Il report viene salvato localmente

### 2. Sincronizzazione con il Server

Quando il report viene sincronizzato con il server:
1. Il server riceve il report dal Tecnico A
2. Il server identifica tutti i tecnici menzionati nel report
3. Per ogni tecnico menzionato che ha un account attivo:
   - Crea una copia del report specificamente per quel tecnico
   - La copia contiene:
     - Gli orari specifici di quel tecnico (non quelli del creatore)
     - I minuti di pausa specifici di quel tecnico
     - Un flag `isShared: true`
     - Il nome del creatore originale (`createdByName`)
     - La data e le informazioni generali (nave, location, descrizione, ecc.)
     - **NESSUN** elenco di altri tecnici (per evitare ridondanza)

### 3. Sincronizzazione sul Dispositivo del Tecnico

Quando il Tecnico B sincronizza i suoi dati:
1. Scarica tutti i suoi report personali
2. Scarica automaticamente anche le copie condivise create per lui
3. Tutti i report (propri e condivisi) vengono salvati localmente

### 4. Visualizzazione e Calcoli

Nell'app di ogni tecnico:
- **Report Giornalieri**: Mostra tutti i report (propri e condivisi) con un badge distintivo per quelli ricevuti da altri
- **Statistiche**: I calcoli di ore settimanali, mensili e guadagni includono **tutti** i report, sia propri che condivisi
- **Filtri e Ricerche**: Funzionano su tutti i report indistintamente

## Struttura Dati

### Report con Campi Aggiuntivi

```typescript
interface Report {
  // Campi esistenti...
  id: string;
  userId?: string;
  date: string;
  // ...altri campi...
  
  // Nuovi campi per la condivisione
  createdBy?: string;        // ID dell'utente che ha creato il report
  createdByName?: string;    // Nome dell'utente che ha creato il report
  isShared?: boolean;        // true se questo è un report ricevuto da un altro tecnico
}
```

### Esempio Pratico

**Scenario**: Tecnico A crea un report con se stesso e Tecnico B

**Report nel database del server**:

1. **Report originale per Tecnico A**:
```json
{
  "id": "123456",
  "userId": "tecnicoA",
  "date": "2025-01-15",
  "startTime": "08:00",
  "endTime": "17:00",
  "pauseMinutes": 60,
  "technicians": [
    {
      "name": "Tecnico B",
      "startTime": "09:00",
      "endTime": "18:00",
      "pauseMinutes": 60
    }
  ],
  "createdBy": "tecnicoA",
  "createdByName": "Mario Rossi",
  "isShared": false
}
```

2. **Copia condivisa per Tecnico B** (creata automaticamente dal server):
```json
{
  "id": "123456_shared_tecnicoB",
  "userId": "tecnicoB",
  "date": "2025-01-15",
  "startTime": "09:00",
  "endTime": "18:00",
  "pauseMinutes": 60,
  "technicians": [],
  "createdBy": "tecnicoA",
  "createdByName": "Mario Rossi",
  "isShared": true
}
```

## Vantaggi del Sistema

1. **Tracciabilità Completa**: Ogni tecnico ha visibilità di tutte le ore lavorate
2. **Calcoli Corretti**: Le statistiche includono automaticamente tutte le ore
3. **Identificazione Chiara**: Badge visivi indicano i report ricevuti da altri
4. **Non Ridondante**: Gli orari specifici di ogni tecnico sono memorizzati correttamente
5. **Sincronizzazione Automatica**: Non richiede azioni manuali dai tecnici

## Interfaccia Utente

### Badge per Report Condivisi

Nei report giornalieri, i report ricevuti da altri tecnici mostrano un badge giallo:

```
┌─────────────────────────────────────┐
│ 📅 15/01/2025        [Ordinaria]    │
│                                     │
│ 📋 Report di Mario Rossi            │ ← Badge giallo
│                                     │
│ Descrizione del lavoro              │
│ Nave: TITANIC | Orario: 09:00-18:00│
└─────────────────────────────────────┘
```

## File Modificati

1. **types/index.ts**: Aggiunti campi `createdBy`, `createdByName`, `isShared`
2. **utils/mockSyncServer.ts**: Logica di distribuzione dei report ai tecnici coinvolti
3. **app/today-reports.tsx**: Visualizzazione badge per report condivisi
4. **contexts/AppContext.tsx**: Gestione report condivisi nelle statistiche

## Come Testare

1. Crea almeno 2 utenti nell'app master
2. Sul dispositivo del Tecnico A:
   - Configura la sincronizzazione
   - Crea un report includendo il Tecnico B
   - Sincronizza con il server
3. Sul dispositivo del Tecnico B:
   - Configura la sincronizzazione
   - Sincronizza con il server
   - Verifica che il report appaia con il badge "Report di [Nome Tecnico A]"
   - Controlla che le ore siano incluse nelle statistiche
