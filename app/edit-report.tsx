import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ship, MapPin, FileText, Users, Package, Wrench, Save, Trash2, Eye } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import type { ShiftType, Technician } from '@/types';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';

export default function EditReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports, updateReport, deleteReport, settings } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const report = reports.find(r => r.id === id);

  const [date, setDate] = useState(report?.date || '');
  const [shiftType, setShiftType] = useState<ShiftType>(report?.shiftType || 'Ordinaria');
  const [startTime, setStartTime] = useState(report?.startTime || '07:30');
  const [endTime, setEndTime] = useState(report?.endTime || '16:30');
  const [pauseMinutes, setPauseMinutes] = useState(report?.pauseMinutes || 60);
  const [ship, setShip] = useState(report?.ship || '');
  const [location, setLocation] = useState(report?.location || '');
  const [description, setDescription] = useState(report?.description || '');
  const [materials, setMaterials] = useState(report?.materials || '');
  const [workDone, setWorkDone] = useState(report?.workDone || '');
  const [technicians, setTechnicians] = useState<Technician[]>(report?.technicians || []);
  const [isSaving, setIsSaving] = useState(false);

  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [showShipPicker, setShowShipPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [showTechnicianPickers, setShowTechnicianPickers] = useState<Record<string, boolean>>({});

  const shiftTypes: ShiftType[] = ['Ordinaria', 'Straordinaria', 'Festiva', 'Ferie', 'Permesso', 'Malattia', '104'];
  const pauseOptions = [
    { label: 'No pausa', value: 0 },
    { label: '30 minuti', value: 30 },
    { label: '60 minuti', value: 60 },
  ];

  useEffect(() => {
    if (!report) {
      Alert.alert('Errore', 'Report non trovato', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [report]);

  if (!report) {
    return null;
  }

  const handleSave = async () => {
    if (!date) {
      Alert.alert('Errore', 'Seleziona una data');
      return;
    }

    if (!ship) {
      Alert.alert('Errore', 'Seleziona una nave');
      return;
    }

    if (!location) {
      Alert.alert('Errore', 'Seleziona un luogo');
      return;
    }

    setIsSaving(true);

    try {
      await updateReport(id, {
        date,
        shiftType,
        startTime,
        endTime,
        pauseMinutes,
        ship,
        location,
        description,
        materials,
        workDone,
        technicians,
      });

      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Successo', 'Report aggiornato con successo', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare il report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Report',
      'Sei sicuro di voler eliminare questo report?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReport(id);
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              Alert.alert('Successo', 'Report eliminato', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('Errore', 'Impossibile eliminare il report');
            }
          },
        },
      ]
    );
  };

  const addTechnician = () => {
    if (settings.technicians.length === 0) {
      Alert.alert('Attenzione', 'Aggiungi prima dei tecnici nelle impostazioni');
      return;
    }

    const newTech: Technician = {
      id: Date.now().toString(),
      name: settings.technicians[0],
      startTime: settings.work.defaultStartTime,
      endTime: settings.work.defaultEndTime,
      pauseMinutes: settings.work.defaultPauseMinutes,
    };
    setTechnicians([...technicians, newTech]);
  };

  const removeTechnician = (techId: string) => {
    setTechnicians(technicians.filter(t => t.id !== techId));
  };

  const updateTechnician = (techId: string, field: keyof Technician, value: string) => {
    setTechnicians(technicians.map(t => {
      if (t.id === techId) {
        if (field === 'pauseMinutes') {
          return { ...t, [field]: parseInt(value) };
        }
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const toggleTechnicianPicker = (id: string) => {
    setShowTechnicianPickers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const closeTechnicianPicker = (id: string) => {
    setShowTechnicianPickers(prev => ({ ...prev, [id]: false }));
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Modifica Report' }} />
      <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni Base</Text>

          <View style={styles.field}>
            <DatePicker value={date} onChange={setDate} label="Data" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Giornata</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowShiftPicker(!showShiftPicker)}
            >
              <Text style={styles.pickerText}>{shiftType}</Text>
            </TouchableOpacity>
            {showShiftPicker && (
              <View style={styles.pickerOptions}>
                {shiftTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerOption}
                    onPress={() => {
                      setShiftType(type);
                      setShowShiftPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <TimePicker value={startTime} onChange={setStartTime} label="Ora Inizio" />
            </View>

            <View style={[styles.field, styles.flex1]}>
              <TimePicker value={endTime} onChange={setEndTime} label="Ora Fine" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pausa</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowPausePicker(!showPausePicker)}
            >
              <Text style={styles.pickerText}>{pauseMinutes} minuti</Text>
            </TouchableOpacity>
            {showPausePicker && (
              <View style={styles.pickerOptions}>
                {pauseOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      setPauseMinutes(option.value);
                      setShowPausePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nave</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowShipPicker(!showShipPicker)}
            >
              <Ship size={20} color="#6b7280" style={styles.inputIcon} />
              <Text style={[styles.pickerText, !ship && styles.placeholder]}>
                {ship || 'Seleziona nave'}
              </Text>
            </TouchableOpacity>
            {showShipPicker && (
              <View style={styles.pickerOptions}>
                {settings.ships.length === 0 ? (
                  <View style={styles.pickerOption}>
                    <Text style={styles.pickerOptionText}>Nessuna nave disponibile</Text>
                  </View>
                ) : (
                  settings.ships.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.pickerOption}
                      onPress={() => {
                        setShip(s);
                        setShowShipPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{s}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Luogo</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
              <Text style={[styles.pickerText, !location && styles.placeholder]}>
                {location || 'Seleziona luogo'}
              </Text>
            </TouchableOpacity>
            {showLocationPicker && (
              <View style={styles.pickerOptions}>
                {settings.locations.length === 0 ? (
                  <View style={styles.pickerOption}>
                    <Text style={styles.pickerOptionText}>Nessun luogo disponibile</Text>
                  </View>
                ) : (
                  settings.locations.map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={styles.pickerOption}
                      onPress={() => {
                        setLocation(l);
                        setShowLocationPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{l}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Breve Descrizione</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrizione breve"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.note}>I dati seguenti appariranno solo nel report giornaliero</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettagli Report</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Materiali Impiegati</Text>
            <View style={styles.textAreaContainer}>
              <Package size={20} color="#6b7280" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                value={materials}
                onChangeText={setMaterials}
                placeholder="Descrivi i materiali utilizzati"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lavori Eseguiti</Text>
            <View style={styles.textAreaContainer}>
              <Wrench size={20} color="#6b7280" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                value={workDone}
                onChangeText={setWorkDone}
                placeholder="Descrivi i lavori eseguiti"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tecnici</Text>
            <TouchableOpacity style={styles.addTechButton} onPress={addTechnician}>
              <Users size={16} color="#ffffff" />
              <Text style={styles.addTechButtonText}>Aggiungi</Text>
            </TouchableOpacity>
          </View>

          {technicians.map((tech) => (
            <View key={tech.id} style={styles.techCard}>
              <View style={styles.techHeader}>
                <Text style={styles.techLabel}>Nome Tecnico</Text>
                <TouchableOpacity onPress={() => removeTechnician(tech.id)}>
                  <Text style={styles.removeButton}>Rimuovi</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.field}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => toggleTechnicianPicker(tech.id)}
                >
                  <Text style={[styles.pickerText, !tech.name && styles.placeholder]}>
                    {tech.name || 'Seleziona tecnico'}
                  </Text>
                </TouchableOpacity>
                {showTechnicianPickers[tech.id] && (
                  <View style={styles.pickerOptionsAbsolute}>
                    {settings.technicians.length === 0 ? (
                      <View style={styles.pickerOption}>
                        <Text style={styles.pickerOptionText}>Nessun tecnico disponibile</Text>
                      </View>
                    ) : (
                      settings.technicians.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={styles.pickerOption}
                          onPress={() => {
                            updateTechnician(tech.id, 'name', t);
                            closeTechnicianPicker(tech.id);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{t}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <TimePicker 
                    value={tech.startTime} 
                    onChange={(value) => updateTechnician(tech.id, 'startTime', value)} 
                    label="Ora Inizio" 
                  />
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <TimePicker 
                    value={tech.endTime} 
                    onChange={(value) => updateTechnician(tech.id, 'endTime', value)} 
                    label="Ora Fine" 
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Pausa</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowTechnicianPickers(prev => ({ ...prev, [`pause-${tech.id}`]: !prev[`pause-${tech.id}`] }))}
                >
                  <Text style={styles.pickerText}>{tech.pauseMinutes} minuti</Text>
                </TouchableOpacity>
                {showTechnicianPickers[`pause-${tech.id}`] && (
                  <View style={styles.pickerOptionsAbsolute}>
                    {pauseOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.pickerOption}
                        onPress={() => {
                          updateTechnician(tech.id, 'pauseMinutes', option.value.toString());
                          setShowTechnicianPickers(prev => ({ ...prev, [`pause-${tech.id}`]: false }));
                        }}
                      >
                        <Text style={styles.pickerOptionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.viewReportButton}
          onPress={() => router.push(`/daily-report?id=${id}`)}
        >
          <Eye size={20} color="#ffffff" />
          <Text style={styles.viewReportButtonText}>Visualizza Report Giornaliero</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color="#ffffff" />
            <Text style={styles.deleteButtonText}>Elimina</Text>
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
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 48,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9ca3af',
  },
  pickerOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOptionsAbsolute: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    overflow: 'scroll',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  textAreaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    minHeight: 120,
  },
  textAreaIcon: {
    marginBottom: 8,
  },
  textArea: {
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  note: {
    fontSize: 14,
    color: '#ef4444',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  addTechButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addTechButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  techCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  techHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  techLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  techInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  removeButton: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 12,
  },
  viewReportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
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
