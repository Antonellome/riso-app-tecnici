import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Save, RotateCcw } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import type { ShiftType } from '@/types';

export default function RatesScreen() {
  const { settings, saveSettings } = useApp();
  
  const [hourlyRates, setHourlyRates] = useState(settings.work.hourlyRates);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const DEFAULT_RATES = [
    { type: 'Ordinaria' as ShiftType, rate: 18.50 },
    { type: 'Straordinaria' as ShiftType, rate: 27.75 },
    { type: 'Festiva' as ShiftType, rate: 35.00 },
    { type: 'Ferie' as ShiftType, rate: 18.50 },
    { type: 'Permesso' as ShiftType, rate: 18.50 },
    { type: 'Malattia' as ShiftType, rate: 15.00 },
    { type: '104' as ShiftType, rate: 18.50 },
  ];

  const updateRate = (type: ShiftType, text: string) => {
    setInputValues(prev => ({ ...prev, [type]: text }));
    
    const cleanedRate = text.replace(',', '.');
    
    if (cleanedRate === '' || cleanedRate === '.') {
      setHourlyRates(hourlyRates.map(hr => 
        hr.type === type ? { ...hr, rate: 0 } : hr
      ));
      return;
    }
    
    const rateValue = parseFloat(cleanedRate);
    if (!isNaN(rateValue) && rateValue >= 0) {
      setHourlyRates(hourlyRates.map(hr => 
        hr.type === type ? { ...hr, rate: rateValue } : hr
      ));
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Ripristina Tariffe',
      'Vuoi ripristinare le tariffe ai valori predefiniti?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Ripristina',
          style: 'destructive',
          onPress: () => setHourlyRates(DEFAULT_RATES),
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        work: {
          ...settings.work,
          hourlyRates,
        },
      });

      Alert.alert('Successo', 'Tariffe orarie salvate con successo');
      router.back();
    } catch {
      Alert.alert('Errore', 'Impossibile salvare le tariffe');
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
        title: 'Tariffe Orarie',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                {hourlyRates.map((hr) => (
                  <View key={hr.type} style={styles.rateRow}>
                    <Text style={styles.rateLabel}>{hr.type}</Text>
                    <View style={styles.rateInputContainer}>
                      <Text style={styles.euroSymbol}>€</Text>
                      <TextInput
                        style={styles.rateInput}
                        value={focusedInput === hr.type 
                          ? (inputValues[hr.type] !== undefined ? inputValues[hr.type] : (hr.rate === 0 ? '' : hr.rate.toString().replace('.', ',')))
                          : hr.rate.toFixed(2).replace('.', ',')
                        }
                        onChangeText={(value) => updateRate(hr.type, value)}
                        onFocus={() => {
                          setFocusedInput(hr.type);
                          setInputValues(prev => ({ ...prev, [hr.type]: hr.rate === 0 ? '' : hr.rate.toString().replace('.', ',') }));
                        }}
                        onBlur={() => {
                          setFocusedInput(null);
                          setInputValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[hr.type];
                            return newValues;
                          });
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.resetContainer}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <RotateCcw size={18} color="#6b7280" />
                <Text style={styles.resetButtonText}>Ripristina valori predefiniti</Text>
              </TouchableOpacity>
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  content: {
    padding: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#374151',
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    height: 40,
    minWidth: 100,
  },
  euroSymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginRight: 4,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  resetContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
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
