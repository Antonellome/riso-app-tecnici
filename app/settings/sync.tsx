import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Save, Upload, Download, Users, Ship, QrCode } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function SyncScreen() {
  const { settings, saveSettings, syncToServer, syncFromServer, syncTechniciansFromServer, syncShipsAndLocationsFromServer, importSyncConfig } = useApp();
  
  const [syncEnabled, setSyncEnabled] = useState(settings.sync?.enabled || false);
  const [serverUrl, setServerUrl] = useState(settings.sync?.serverUrl || '');
  const [userId, setUserId] = useState(settings.sync?.userId || '');
  const [apiKey, setApiKey] = useState(settings.sync?.apiKey || '');
  const [autoSync, setAutoSync] = useState(settings.sync?.autoSync || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        sync: {
          enabled: syncEnabled,
          serverUrl,
          userId,
          apiKey,
          autoSync,
          lastSync: settings.sync?.lastSync,
        },
      });

      Alert.alert('Successo', 'Impostazioni sincronizzazione salvate con successo');
      router.back();
    } catch {
      Alert.alert('Errore', 'Impossibile salvare le impostazioni');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSyncToServer = async () => {
    if (!syncEnabled) {
      Alert.alert('Sincronizzazione Disabilitata', 'Abilita la sincronizzazione nelle impostazioni prima di procedere.');
      return;
    }

    if (!serverUrl || !userId || !apiKey) {
      Alert.alert('Configurazione Incompleta', 'Compila tutti i campi della sincronizzazione prima di procedere.');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncToServer();
      if (success) {
        Alert.alert('Successo', 'Dati sincronizzati con il server con successo');
      } else {
        Alert.alert('Errore', 'Impossibile sincronizzare i dati con il server');
      }
    } catch (error) {
      console.error('Error syncing to server:', error);
      Alert.alert('Errore', 'Impossibile sincronizzare i dati con il server');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromServer = async () => {
    if (!syncEnabled) {
      Alert.alert('Sincronizzazione Disabilitata', 'Abilita la sincronizzazione nelle impostazioni prima di procedere.');
      return;
    }

    if (!serverUrl || !userId || !apiKey) {
      Alert.alert('Configurazione Incompleta', 'Compila tutti i campi della sincronizzazione prima di procedere.');
      return;
    }

    Alert.alert(
      'Conferma',
      'Questa operazione sovrascriverà i dati locali con quelli del server. Vuoi continuare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Continua',
          onPress: async () => {
            setIsSyncing(true);
            try {
              const success = await syncFromServer();
              if (success) {
                Alert.alert('Successo', 'Dati scaricati dal server con successo');
              } else {
                Alert.alert('Errore', 'Impossibile scaricare i dati dal server');
              }
            } catch (error) {
              console.error('Error syncing from server:', error);
              Alert.alert('Errore', 'Impossibile scaricare i dati dal server');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleSyncTechnicians = async () => {
    if (!syncEnabled) {
      Alert.alert('Sincronizzazione Disabilitata', 'Abilita la sincronizzazione nelle impostazioni prima di procedere.');
      return;
    }

    if (!serverUrl || !userId || !apiKey) {
      Alert.alert('Configurazione Incompleta', 'Compila tutti i campi della sincronizzazione prima di procedere.');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncTechniciansFromServer();
      if (success) {
        Alert.alert('Successo', 'Elenco tecnici sincronizzato con successo dall\'app master');
      } else {
        Alert.alert('Errore', 'Impossibile sincronizzare l\'elenco tecnici');
      }
    } catch (error) {
      console.error('Error syncing technicians:', error);
      Alert.alert('Errore', 'Impossibile sincronizzare l\'elenco tecnici');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncShipsAndLocations = async () => {
    if (!syncEnabled) {
      Alert.alert('Sincronizzazione Disabilitata', 'Abilita la sincronizzazione nelle impostazioni prima di procedere.');
      return;
    }

    if (!serverUrl || !userId || !apiKey) {
      Alert.alert('Configurazione Incompleta', 'Compila tutti i campi della sincronizzazione prima di procedere.');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncShipsAndLocationsFromServer();
      if (success) {
        Alert.alert('Successo', `Sincronizzato: ${settings.ships.length} navi e ${settings.locations.length} luoghi dall'app master`);
      } else {
        Alert.alert('Errore', 'Impossibile sincronizzare navi e luoghi');
      }
    } catch (error) {
      console.error('Error syncing ships and locations:', error);
      Alert.alert('Errore', 'Impossibile sincronizzare navi e luoghi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportSyncConfig = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event: any) => {
              try {
                const jsonData = event.target.result;
                await importSyncConfig(jsonData);
                
                const config = JSON.parse(jsonData);
                setSyncEnabled(true);
                setServerUrl(config.serverUrl);
                setUserId(config.userId);
                setApiKey(config.apiKey);
                setAutoSync(config.autoSync ?? false);
                
                Alert.alert(
                  'Configurazione Importata',
                  'La configurazione di sincronizzazione è stata caricata con successo. Clicca "Salva" per applicare le modifiche.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Error importing sync config:', error);
                Alert.alert('Errore', 'File di configurazione non valido o corrotto');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileUri = result.assets[0].uri;
          const jsonData = await FileSystem.readAsStringAsync(fileUri);
          await importSyncConfig(jsonData);
          
          const config = JSON.parse(jsonData);
          setSyncEnabled(true);
          setServerUrl(config.serverUrl);
          setUserId(config.userId);
          setApiKey(config.apiKey);
          setAutoSync(config.autoSync ?? false);
          
          Alert.alert(
            'Configurazione Importata',
            'La configurazione di sincronizzazione è stata caricata con successo. Clicca "Salva" per applicare le modifiche.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error importing sync config:', error);
      Alert.alert('Errore', 'Impossibile importare la configurazione');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Sincronizzazione',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Abilita Sincronizzazione</Text>
              <TouchableOpacity
                style={[styles.switch, syncEnabled && styles.switchActive]}
                onPress={() => setSyncEnabled(!syncEnabled)}
              >
                <View style={[styles.switchThumb, syncEnabled && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Abilita per condividere i rapportini con un&apos;app master centralizzata
            </Text>
          </View>

          <View style={styles.field}>
            <TouchableOpacity 
              style={styles.importConfigButton}
              onPress={() => router.push('/scan-config')}
            >
              <QrCode size={18} color="#2563eb" />
              <Text style={styles.importConfigButtonText}>Scansiona QR Code</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Scansiona il QR code fornito dall&apos;app master per configurare automaticamente
            </Text>
          </View>

          <View style={styles.field}>
            <TouchableOpacity 
              style={styles.importConfigButton}
              onPress={handleImportSyncConfig}
            >
              <Upload size={18} color="#2563eb" />
              <Text style={styles.importConfigButtonText}>Importa Configurazione da File</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Carica un file di configurazione fornito dal gestore dell&apos;app master
            </Text>
          </View>

          {syncEnabled && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>URL Server</Text>
                <TextInput
                  style={styles.input}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="https://esempio.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>ID Utente</Text>
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Il tuo ID utente"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>API Key</Text>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="La tua chiave API"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Sincronizzazione Automatica</Text>
                  <TouchableOpacity
                    style={[styles.switch, autoSync && styles.switchActive]}
                    onPress={() => setAutoSync(!autoSync)}
                  >
                    <View style={[styles.switchThumb, autoSync && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>
                  Sincronizza automaticamente ad ogni modifica
                </Text>
              </View>

              {settings.sync?.lastSync && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Ultima sincronizzazione: {new Date(settings.sync.lastSync).toLocaleString('it-IT')}
                  </Text>
                </View>
              )}

              <View style={styles.backupButtons}>
                <TouchableOpacity 
                  style={[styles.backupButton, isSyncing && styles.backupButtonDisabled]} 
                  onPress={handleSyncToServer}
                  disabled={isSyncing}
                >
                  <Upload size={18} color="#ffffff" />
                  <Text style={styles.backupButtonText}>
                    {isSyncing ? 'Sincronizzazione...' : 'Invia al Server'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.backupButton, isSyncing && styles.backupButtonDisabled]} 
                  onPress={handleSyncFromServer}
                  disabled={isSyncing}
                >
                  <Download size={18} color="#ffffff" />
                  <Text style={styles.backupButtonText}>
                    {isSyncing ? 'Sincronizzazione...' : 'Scarica dal Server'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <TouchableOpacity 
                  style={[styles.syncTechniciansButton, isSyncing && styles.backupButtonDisabled]} 
                  onPress={handleSyncTechnicians}
                  disabled={isSyncing}
                >
                  <Users size={18} color="#ffffff" />
                  <Text style={styles.backupButtonText}>
                    {isSyncing ? 'Sincronizzazione...' : 'Sincronizza Elenco Tecnici'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <TouchableOpacity 
                  style={[styles.syncTechniciansButton, isSyncing && styles.backupButtonDisabled]} 
                  onPress={handleSyncShipsAndLocations}
                  disabled={isSyncing}
                >
                  <Ship size={18} color="#ffffff" />
                  <Text style={styles.backupButtonText}>
                    {isSyncing ? 'Sincronizzazione...' : 'Sincronizza Navi e Luoghi'}
                  </Text>
                </TouchableOpacity>
              </View>

              {settings.technicianCategories && settings.technicianCategories.length > 0 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ✓ Elenco tecnici sincronizzato: {settings.technicianCategories.length} {settings.technicianCategories.length === 1 ? 'categoria' : 'categorie'}
                  </Text>
                  {settings.technicianCategories.map((cat, idx) => (
                    <Text key={idx} style={styles.categoryText}>
                      • {cat.category}: {cat.technicians.length} {cat.technicians.length === 1 ? 'tecnico' : 'tecnici'}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#10b981',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  importConfigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingVertical: 12,
    gap: 8,
  },
  importConfigButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  categoryText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    marginTop: 4,
    marginLeft: 8,
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  backupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  backupButtonDisabled: {
    opacity: 0.6,
  },
  syncTechniciansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  buttonContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
