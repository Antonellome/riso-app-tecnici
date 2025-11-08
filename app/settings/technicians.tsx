import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Save, Plus, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export default function TechniciansScreen() {
  const { settings, saveSettings } = useApp();
  
  const [technicians, setTechnicians] = useState(settings.technicians);
  const [newTechnician, setNewTechnician] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addTechnician = () => {
    if (newTechnician.trim()) {
      setTechnicians([...technicians, newTechnician.trim()]);
      setNewTechnician('');
    }
  };

  const removeTechnician = (technician: string) => {
    setTechnicians(technicians.filter(t => t !== technician));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        technicians,
      });

      Alert.alert('Successo', 'Elenco tecnici salvato con successo');
      router.back();
    } catch {
      Alert.alert('Errore', 'Impossibile salvare i tecnici');
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
        title: 'Tecnici',
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
            <View style={styles.content}>
              {settings.sync?.enabled && settings.technicianCategories && settings.technicianCategories.length > 0 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ✓ Elenco tecnici sincronizzato dall&apos;app master
                  </Text>
                  {settings.technicianCategories.map((cat, idx) => (
                    <Text key={idx} style={styles.categoryText}>
                      • {cat.category}: {cat.technicians.length} {cat.technicians.length === 1 ? 'tecnico' : 'tecnici'}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.addItemContainer}>
                <TextInput
                  style={styles.addItemInput}
                  value={newTechnician}
                  onChangeText={setNewTechnician}
                  placeholder="Nome tecnico"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity style={styles.addButton} onPress={addTechnician}>
                  <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.itemsList}
                keyboardShouldPersistTaps="handled"
              >
                {technicians.map((technician) => (
                  <View key={technician} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{technician}</Text>
                    <TouchableOpacity onPress={() => removeTechnician(technician)}>
                      <X size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    marginTop: 4,
    marginLeft: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
  },
  itemChipText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500' as const,
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
