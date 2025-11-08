import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Save, Download, Upload, Cloud, HardDrive, Database, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
const Sharing = Platform.OS !== 'web' ? require('expo-sharing') : null;
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorageScreen() {
  const { settings, saveSettings, exportData, importData, autoBackup } = useApp();
  
  const [storageType, setStorageType] = useState(settings.storage.type);
  const [backupFrequency, setBackupFrequency] = useState(settings.storage.backupFrequency);
  const [externalProvider, setExternalProvider] = useState(settings.storage.externalProvider);
  const [showBackupPicker, setShowBackupPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        storage: {
          type: storageType,
          backupFrequency,
          externalProvider,
        },
      });

      if (backupFrequency !== 'none') {
        await autoBackup();
      }

      Alert.alert('Successo', 'Impostazioni archiviazione salvate con successo');
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

  const handleCreateBackup = async () => {
    try {
      if (storageType === 'browser') {
        await handleBrowserBackup();
      } else if (storageType === 'external' && externalProvider && externalProvider !== 'none') {
        await handleCloudBackup();
      } else {
        await handleDeviceBackup();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Errore', 'Impossibile creare il backup');
    }
  };

  const handleBrowserBackup = async () => {
    try {
      const jsonData = await exportData();
      const fileName = `ore_tecnico_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Backup Creato', 'Il backup è stato scaricato nel browser.');
      } else {
        Alert.alert('Info', 'Opzione Browser disponibile solo su web. Usa Dispositivo per salvare su mobile.');
      }
    } catch (error) {
      console.error('Error creating browser backup:', error);
      Alert.alert('Errore', 'Impossibile creare il backup nel browser');
    }
  };

  const handleDeviceBackup = async () => {
    try {
      const jsonData = await exportData();
      const fileName = `ore_tecnico_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Salva su Dispositivo',
          'Scegli dove salvare il backup:',
          [
            { 
              text: 'Download', 
              onPress: async () => {
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                Alert.alert('Backup Creato', 'Il backup è stato salvato nella cartella Download.');
              }
            },
            { text: 'Annulla', style: 'cancel' }
          ]
        );
      } else {
        const cacheDir = (() => { const fs: any = FileSystem as any; const dir = fs?.cacheDirectory ?? fs?.documentDirectory ?? ''; return typeof dir === 'string' ? dir : ''; })();
        const fileUri = `${cacheDir}${cacheDir.endsWith('/') ? '' : '/'}${fileName}`;
        
        console.log('Writing backup to:', fileUri);
        await FileSystem.writeAsStringAsync(fileUri, jsonData);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Salva Backup - Scegli Percorso',
            UTI: 'public.json'
          });
          Alert.alert('Backup Creato', 'Scegli dove salvare il file di backup');
        } else {
          Alert.alert('Backup Creato', `Il backup è stato salvato in: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Error creating device backup:', error);
      Alert.alert('Errore', `Impossibile creare il backup sul dispositivo: ${error}`);
    }
  };

  const handleCloudBackup = async () => {
    try {
      const providerName = externalProvider === 'google-drive' ? 'Google Drive' : 
                          externalProvider === 'dropbox' ? 'Dropbox' : 'OneDrive';
      
      const autoBackupData = await AsyncStorage.getItem('@ore_tecnico_auto_backup');
      const lastBackupTime = await AsyncStorage.getItem('@ore_tecnico_last_backup');
      
      let backupInfo = '';
      if (autoBackupData && lastBackupTime) {
        const backupDate = new Date(parseInt(lastBackupTime));
        backupInfo = `\n\nUltimo backup automatico: ${backupDate.toLocaleString('it-IT')}`;
      }
      
      if (externalProvider === 'google-drive') {
        Alert.alert(
          'Google Drive',
          `Il backup automatico locale è ${backupFrequency !== 'none' ? 'ATTIVO' : 'NON ATTIVO'}.${backupInfo}\n\nPer utilizzare Google Drive:\n\n1. Abilita backup automatico (consigliato: Ad Ogni Modifica)\n2. Scarica il backup quando necessario\n3. Carica manualmente su Google Drive\n\nVuoi scaricare il backup ora?`,
          [
            { text: 'Annulla', style: 'cancel' },
            { 
              text: 'Scarica Backup', 
              onPress: async () => {
                await handleDeviceBackup();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Backup Cloud',
          `Per salvare su ${providerName}:\n\n1. Crea prima il backup localmente\n2. Carica manualmente il file sul tuo account ${providerName}\n\nVuoi procedere con il backup locale?`,
          [
            { text: 'Annulla', style: 'cancel' },
            { 
              text: 'Crea Backup Locale', 
              onPress: async () => {
                await handleDeviceBackup();
                Alert.alert(
                  'Prossimo Passo',
                  `Ora carica il file scaricato sul tuo account ${providerName} tramite l'app o il sito web.`
                );
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating cloud backup:', error);
      Alert.alert('Errore', 'Impossibile creare il backup cloud');
    }
  };

  const handleLoadBackup = async () => {
    try {
      if (storageType === 'browser') {
        await handleBrowserRestore();
      } else if (storageType === 'external' && externalProvider && externalProvider !== 'none') {
        await handleCloudRestore();
      } else {
        await handleDeviceRestore();
      }
    } catch (error) {
      console.error('Error loading backup:', error);
      Alert.alert('Errore', 'Impossibile caricare il backup');
    }
  };

  const handleBrowserRestore = async () => {
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
                await importData(jsonData);
                Alert.alert('Successo', 'Backup ripristinato dal browser con successo');
              } catch {
                Alert.alert('Errore', 'File di backup non valido');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        Alert.alert('Info', 'Opzione Browser disponibile solo su web. Usa Dispositivo per caricare da mobile.');
      }
    } catch (error) {
      console.error('Error restoring browser backup:', error);
      Alert.alert('Errore', 'Impossibile ripristinare il backup dal browser');
    }
  };

  const handleDeviceRestore = async () => {
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
                await importData(jsonData);
                Alert.alert('Successo', 'Backup ripristinato dal dispositivo con successo');
              } catch {
                Alert.alert('Errore', 'File di backup non valido');
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
          await importData(jsonData);
          Alert.alert('Successo', 'Backup ripristinato dal dispositivo con successo');
        }
      }
    } catch (error) {
      console.error('Error restoring device backup:', error);
      Alert.alert('Errore', 'Impossibile ripristinare il backup dal dispositivo');
    }
  };

  const handleCloudRestore = async () => {
    try {
      const providerName = externalProvider === 'google-drive' ? 'Google Drive' : 
                          externalProvider === 'dropbox' ? 'Dropbox' : 'OneDrive';
      
      if (externalProvider === 'google-drive') {
        Alert.alert(
          'Ripristina da Google Drive',
          'Per ripristinare da Google Drive:\n\n1. Apri l\'app Google Drive\n2. Scarica il file di backup\n3. Seleziona il file scaricato\n\nVuoi procedere?',
          [
            { text: 'Annulla', style: 'cancel' },
            { 
              text: 'Seleziona File', 
              onPress: async () => {
                await handleDeviceRestore();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Carica da Cloud',
          `Per caricare da ${providerName}:\n\n1. Scarica il file di backup dal tuo account ${providerName}\n2. Seleziona il file scaricato\n\nVuoi procedere?`,
          [
            { text: 'Annulla', style: 'cancel' },
            { 
              text: 'Seleziona File', 
              onPress: async () => {
                await handleDeviceRestore();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error restoring cloud backup:', error);
      Alert.alert('Errore', 'Impossibile ripristinare il backup dal cloud');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Archiviazione Dati',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Tipo Archiviazione</Text>
            <View style={styles.storageTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.storageTypeButton,
                  storageType === 'device' && styles.storageTypeButtonActive
                ]}
                onPress={() => setStorageType('device')}
              >
                <HardDrive 
                  size={24} 
                  color={storageType === 'device' ? '#ffffff' : '#2563eb'} 
                />
                <Text style={[
                  styles.storageTypeText,
                  storageType === 'device' && styles.storageTypeTextActive
                ]}>Dispositivo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.storageTypeButton,
                  storageType === 'browser' && styles.storageTypeButtonActive
                ]}
                onPress={() => setStorageType('browser')}
              >
                <Database 
                  size={24} 
                  color={storageType === 'browser' ? '#ffffff' : '#2563eb'} 
                />
                <Text style={[
                  styles.storageTypeText,
                  storageType === 'browser' && styles.storageTypeTextActive
                ]}>Browser</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.storageTypeButton,
                  storageType === 'external' && styles.storageTypeButtonActive
                ]}
                onPress={() => setStorageType('external')}
              >
                <Cloud 
                  size={24} 
                  color={storageType === 'external' ? '#ffffff' : '#2563eb'} 
                />
                <Text style={[
                  styles.storageTypeText,
                  storageType === 'external' && styles.storageTypeTextActive
                ]}>Cloud</Text>
              </TouchableOpacity>
            </View>
          </View>

          {storageType === 'device' && Platform.OS !== 'web' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Su mobile, i backup vengono salvati localmente nell&apos;app. Usa &quot;Crea Backup&quot; per salvare su dispositivo tramite il menu di condivisione.
              </Text>
            </View>
          )}

          {storageType === 'device' && Platform.OS === 'web' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✓ I file verranno salvati nella cartella Download del browser
              </Text>
            </View>
          )}

          {storageType === 'external' && (
            <View style={styles.field}>
              <Text style={styles.label}>Provider Cloud</Text>
              <View style={styles.providerContainer}>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    externalProvider === 'google-drive' && styles.providerButtonActive
                  ]}
                  onPress={() => setExternalProvider('google-drive')}
                >
                  <Cloud 
                    size={20} 
                    color={externalProvider === 'google-drive' ? '#ffffff' : '#2563eb'} 
                  />
                  <Text style={[
                    styles.providerText,
                    externalProvider === 'google-drive' && styles.providerTextActive
                  ]}>Google Drive</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    externalProvider === 'dropbox' && styles.providerButtonActive
                  ]}
                  onPress={() => setExternalProvider('dropbox')}
                >
                  <Cloud 
                    size={20} 
                    color={externalProvider === 'dropbox' ? '#ffffff' : '#2563eb'} 
                  />
                  <Text style={[
                    styles.providerText,
                    externalProvider === 'dropbox' && styles.providerTextActive
                  ]}>Dropbox</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    externalProvider === 'onedrive' && styles.providerButtonActive
                  ]}
                  onPress={() => setExternalProvider('onedrive')}
                >
                  <Cloud 
                    size={20} 
                    color={externalProvider === 'onedrive' ? '#ffffff' : '#2563eb'} 
                  />
                  <Text style={[
                    styles.providerText,
                    externalProvider === 'onedrive' && styles.providerTextActive
                  ]}>OneDrive</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Backup Automatico</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowBackupPicker(!showBackupPicker)}
            >
              <Text style={styles.pickerText}>
                {backupFrequency === 'none' ? 'Disabilitato' : 
                 backupFrequency === 'onChange' ? 'Ad Ogni Modifica' :
                 backupFrequency === 'daily' ? 'Giornaliero' :
                 backupFrequency === 'weekly' ? 'Settimanale' : 'Mensile'}
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
            {showBackupPicker && (
              <View style={styles.pickerOptions}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setBackupFrequency('none');
                    setShowBackupPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Disabilitato</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setBackupFrequency('onChange');
                    setShowBackupPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Ad Ogni Modifica</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setBackupFrequency('daily');
                    setShowBackupPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Giornaliero</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setBackupFrequency('weekly');
                    setShowBackupPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Settimanale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setBackupFrequency('monthly');
                    setShowBackupPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Mensile</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {backupFrequency !== 'none' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {backupFrequency === 'onChange' 
                  ? '✓ Il backup locale verrà creato automaticamente ad ogni modifica dei report'
                  : backupFrequency === 'daily'
                  ? '✓ Il backup locale verrà creato automaticamente ogni giorno'
                  : backupFrequency === 'weekly'
                  ? '✓ Il backup locale verrà creato automaticamente ogni settimana'
                  : '✓ Il backup locale verrà creato automaticamente ogni mese'}
              </Text>
              <Text style={[styles.infoText, {marginTop: 8}]}>
                💾 Il backup automatico salva i dati localmente nell&apos;app (funziona offline). Per salvare su dispositivo o cloud, usa i pulsanti qui sotto.
              </Text>
            </View>
          )}

          <View style={styles.backupButtons}>
            <TouchableOpacity style={styles.backupButton} onPress={handleCreateBackup}>
              <Download size={18} color="#ffffff" />
              <Text style={styles.backupButtonText}>Crea Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backupButton} onPress={handleLoadBackup}>
              <Upload size={18} color="#ffffff" />
              <Text style={styles.backupButtonText}>Carica Backup</Text>
            </TouchableOpacity>
          </View>
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
  storageTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  storageTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingVertical: 16,
    gap: 8,
  },
  storageTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  storageTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  storageTypeTextActive: {
    color: '#ffffff',
  },
  providerContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  providerButton: {
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
  providerButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  providerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  providerTextActive: {
    color: '#ffffff',
  },
  infoBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    height: 48,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
