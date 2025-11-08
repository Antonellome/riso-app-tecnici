import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Upload, Camera as CameraIcon } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function ScanConfigScreen() {
  const { config } = useLocalSearchParams<{ config?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { importSyncConfig, saveSettings, settings } = useApp();
  const insets = useSafeAreaInsets();

  const handleConfigData = useCallback(async (data: string) => {
    if (processing) return;
    
    setProcessing(true);
    setScanned(true);
    
    try {
      console.log('[ScanConfig] Processing config data...');
      
      let configData;
      try {
        configData = JSON.parse(data);
      } catch {
        try {
          configData = JSON.parse(decodeURIComponent(data));
        } catch {
          throw new Error('Formato dati non valido');
        }
      }

      if (!configData.serverUrl || !configData.userId || !configData.apiKey) {
        throw new Error('Configurazione incompleta. Campi richiesti: serverUrl, userId, apiKey');
      }

      await importSyncConfig(JSON.stringify(configData));

      const updatedSettings = {
        ...settings,
        sync: {
          enabled: true,
          serverUrl: configData.serverUrl,
          userId: configData.userId,
          apiKey: configData.apiKey,
          autoSync: configData.autoSync ?? false,
          lastSync: settings.sync?.lastSync,
        },
      };

      if (configData.technicianName && !settings.user.name) {
        updatedSettings.user.name = configData.technicianName;
      }
      if (configData.companyName && !settings.user.company) {
        updatedSettings.user.company = configData.companyName;
      }

      await saveSettings(updatedSettings);

      Alert.alert(
        'Configurazione Importata',
        'La sincronizzazione è stata configurata con successo! Puoi ora sincronizzare i dati con l&apos;app master.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('[ScanConfig] Error processing config:', error);
      Alert.alert(
        'Errore',
        error instanceof Error ? error.message : 'Impossibile elaborare la configurazione',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
        ]
      );
    }
  }, [importSyncConfig, saveSettings, settings, processing]);

  useEffect(() => {
    if (config && !scanned) {
      console.log('[ScanConfig] Received config via deep link');
      handleConfigData(config);
    }
  }, [config, scanned, handleConfigData]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned && !processing) {
      console.log('[ScanConfig] QR Code scanned');
      handleConfigData(data);
    }
  };

  const handleImportFile = async () => {
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
                await handleConfigData(jsonData);
              } catch (error) {
                console.error('[ScanConfig] Error reading file:', error);
                Alert.alert('Errore', 'File di configurazione non valido');
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
          await handleConfigData(jsonData);
        }
      }
    } catch (error) {
      console.error('[ScanConfig] Error importing file:', error);
      Alert.alert('Errore', 'Impossibile leggere il file');
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <CameraIcon size={64} color="#2563eb" />
          </View>
          
          <Text style={styles.title}>Permesso Fotocamera</Text>
          <Text style={styles.description}>
            Per scansionare il QR code di configurazione è necessario l&apos;accesso alla fotocamera.
          </Text>

          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Consenti Accesso</Text>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>oppure</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleImportFile}>
            <Upload size={20} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>Importa da File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (processing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.processingText}>Elaborazione configurazione...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={[styles.closeButton, { top: 16 }]} onPress={() => router.back()}>
        <X size={24} color="#ffffff" />
      </TouchableOpacity>

      {Platform.OS !== 'web' ? (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Inquadra il QR code ricevuto dall&apos;app master
              </Text>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.webFallback}>
          <View style={styles.webContent}>
            <CameraIcon size={64} color="#9ca3af" />
            <Text style={styles.webTitle}>Scansione QR non disponibile sul web</Text>
            <Text style={styles.webDescription}>
              La scansione del QR code è disponibile solo su dispositivi mobili.
              Usa il pulsante qui sotto per importare il file di configurazione.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.importButton} onPress={handleImportFile}>
          <Upload size={20} color="#ffffff" />
          <Text style={styles.importButtonText}>Importa da File</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    minWidth: 200,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#ffffff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  webFallback: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webContent: {
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  webDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
