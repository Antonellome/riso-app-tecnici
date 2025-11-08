import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Save, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import TimePicker from '@/components/TimePicker';

export default function WorkHoursScreen() {
  const { settings, saveSettings } = useApp();
  
  const [defaultStartTime, setDefaultStartTime] = useState(settings.work.defaultStartTime);
  const [defaultEndTime, setDefaultEndTime] = useState(settings.work.defaultEndTime);
  const [defaultPauseMinutes, setDefaultPauseMinutes] = useState(settings.work.defaultPauseMinutes);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        work: {
          ...settings.work,
          defaultStartTime,
          defaultEndTime,
          defaultPauseMinutes,
        },
      });

      Alert.alert('Successo', 'Orari default salvati con successo');
      router.back();
    } catch {
      Alert.alert('Errore', 'Impossibile salvare gli orari');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Orari Default',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <TimePicker
                label="Ora Inizio"
                value={defaultStartTime}
                onChange={setDefaultStartTime}
              />
            </View>
            
            <View style={[styles.field, styles.flex1]}>
              <TimePicker
                label="Ora Fine"
                value={defaultEndTime}
                onChange={setDefaultEndTime}
              />
            </View>
          </View>
          
          <View style={styles.field}>
            <Text style={styles.label}>Pausa</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowPausePicker(!showPausePicker)}
            >
              <Text style={styles.pickerText}>
                {defaultPauseMinutes === 0 ? 'No Pausa' : `${defaultPauseMinutes} minuti`}
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
            {showPausePicker && (
              <View style={styles.pickerOptions}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setDefaultPauseMinutes(0);
                    setShowPausePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>No Pausa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setDefaultPauseMinutes(30);
                    setShowPausePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>30 minuti</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setDefaultPauseMinutes(60);
                    setShowPausePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>60 minuti</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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

        <View style={styles.footer}>
          <Text style={styles.footerText}>by AS</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
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
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
  },
});
