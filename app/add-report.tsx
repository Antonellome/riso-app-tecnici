import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ship, MapPin, FileText, Users, Package, Wrench, Save, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import type { ShiftType, Technician } from '@/types';
import { getTodayISO } from '@/utils/dateFormat';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';

export default function AddReportScreen() {
  const router = useRouter();
  const { addReport, settings, recentTechnicians } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const today = getTodayISO();

  const [date, setDate] = useState(today);
  const [shiftType, setShiftType] = useState<ShiftType>('Ordinaria');
  const [startTime, setStartTime] = useState(settings.work.defaultStartTime);
  const [endTime, setEndTime] = useState(settings.work.defaultEndTime);
  const [pauseMinutes, setPauseMinutes] = useState(settings.work.defaultPauseMinutes);
  const [ship, setShip] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [showShipPicker, setShowShipPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [showTechnicianPicker, setShowTechnicianPicker] = useState<string | null>(null);
  const [newTechId, setNewTechId] = useState<string | null>(null);

  const shiftTypes: ShiftType[] = ['Ordinaria', 'Straordinaria', 'Festiva', 'Ferie', 'Permesso', 'Malattia', '104'];
  const pauseOptions = [
    { label: 'No pausa', value: 0 },
    { label: '30 minuti', value: 30 },
    { label: '60 minuti', value: 60 },
  ];

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
      await addReport({
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
      Alert.alert('Successo', 'Report salvato con successo', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Errore', 'Impossibile salvare il report');
    } finally {
      setIsSaving(false);
    }
  };

  const addTechnician = () => {
    const isSyncMode = settings.sync?.enabled && settings.technicianCategories && settings.technicianCategories.length > 0;
    const hasLocalTechnicians = settings.technicians && settings.technicians.length > 0;
    
    if (!isSyncMode && !hasLocalTechnicians) {
      Alert.alert('Attenzione', 'Aggiungi prima dei tecnici nelle impostazioni');
      return;
    }
    
    if (isSyncMode && !hasLocalTechnicians) {
      const newTech: Technician = {
        id: Date.now().toString(),
        name: '',
        startTime: settings.work.defaultStartTime,
        endTime: settings.work.defaultEndTime,
        pauseMinutes: settings.work.defaultPauseMinutes,
      };
      setTechnicians([...technicians, newTech]);
      setNewTechId(newTech.id);
      setShowTechnicianPicker(newTech.id);
      return;
    }

    const newTech: Technician = {
      id: Date.now().toString(),
      name: '',
      startTime: settings.work.defaultStartTime,
      endTime: settings.work.defaultEndTime,
      pauseMinutes: settings.work.defaultPauseMinutes,
    };
    setTechnicians([...technicians, newTech]);
    setNewTechId(newTech.id);
    setShowTechnicianPicker(newTech.id);
  };

  const removeTechnician = (id: string) => {
    setTechnicians(technicians.filter(t => t.id !== id));
  };

  const updateTechnician = (id: string, field: keyof Technician, value: string) => {
    setTechnicians(technicians.map(t => {
      if (t.id === id) {
        if (field === 'pauseMinutes') {
          return { ...t, [field]: parseInt(value) };
        }
        return { ...t, [field]: value };
      }
      return t;
    }));
    if (field === 'name' && id === newTechId) {
      setNewTechId(null);
    }
  };

  const toggleTechnicianPicker = (id: string) => {
    setShowTechnicianPicker(showTechnicianPicker === id ? null : id);
  };

  const closeTechnicianPicker = () => {
    setShowTechnicianPicker(null);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
            <View style={styles.pickerOptionsAbsolute}>
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
            <View style={styles.pickerOptionsAbsolute}>
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
            <View style={styles.pickerOptionsAbsolute}>
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
            <View style={styles.pickerOptionsAbsolute}>
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
        <Text style={styles.sectionTitle}>Tecnici</Text>

        {technicians.length > 0 && (
          <View style={styles.selectedTechniciansContainer}>
            {technicians.map((tech) => (
              tech.name && (
                <View key={`chip-${tech.id}`} style={styles.techChip}>
                  <Text style={styles.techChipText}>{tech.name}</Text>
                  <TouchableOpacity onPress={() => removeTechnician(tech.id)}>
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )
            ))}
          </View>
        )}

        {technicians.map((tech) => (
          <View key={tech.id} style={styles.techCard}>
            <View style={styles.techHeader}>
              <Text style={styles.techLabel}>Tecnico</Text>
              <TouchableOpacity onPress={() => removeTechnician(tech.id)}>
                <Text style={styles.removeButton}>Rimuovi</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => toggleTechnicianPicker(tech.id)}
              >
                <Users size={20} color="#6b7280" style={styles.inputIcon} />
                <Text style={[styles.pickerText, !tech.name && styles.placeholder]}>
                  {tech.name || 'Seleziona tecnico'}
                </Text>
              </TouchableOpacity>
              {showTechnicianPicker === tech.id && (
                <View style={styles.pickerOptionsAbsolute}>
                  {(() => {
                    const isSyncMode = settings.sync?.enabled && settings.technicianCategories && settings.technicianCategories.length > 0;
                    const hasLocalTechnicians = settings.technicians && settings.technicians.length > 0;
                    
                    if (isSyncMode && !hasLocalTechnicians) {
                      const allTechnicians = settings.technicianCategories!.flatMap(cat => cat.technicians);
                      const recentFiltered = recentTechnicians.filter(t => allTechnicians.includes(t));
                      const otherTechnicians = allTechnicians.filter(t => !recentFiltered.includes(t));
                      
                      return (
                        <ScrollView style={styles.pickerScrollView}>
                          {recentFiltered.length > 0 && (
                            <View>
                              <View style={styles.categoryHeader}>
                                <Text style={styles.categoryHeaderText}>Recenti</Text>
                              </View>
                              {recentFiltered.map((t) => (
                                <TouchableOpacity
                                  key={t}
                                  style={styles.pickerOption}
                                  onPress={() => {
                                    updateTechnician(tech.id, 'name', t);
                                    closeTechnicianPicker();
                                  }}
                                >
                                  <Text style={styles.pickerOptionText}>{t}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                          {settings.technicianCategories!.map((category) => {
                            const categoryTechs = category.technicians.filter(t => !recentFiltered.includes(t));
                            if (categoryTechs.length === 0) return null;
                            
                            return (
                              <View key={category.category}>
                                <View style={styles.categoryHeader}>
                                  <Text style={styles.categoryHeaderText}>{category.category}</Text>
                                </View>
                                {categoryTechs.map((t) => (
                                  <TouchableOpacity
                                    key={t}
                                    style={styles.pickerOption}
                                    onPress={() => {
                                      updateTechnician(tech.id, 'name', t);
                                      closeTechnicianPicker();
                                    }}
                                  >
                                    <Text style={styles.pickerOptionText}>{t}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            );
                          })}
                        </ScrollView>
                      );
                    }
                    
                    if (!hasLocalTechnicians) {
                      return (
                        <View style={styles.pickerOption}>
                          <Text style={styles.pickerOptionText}>Nessun tecnico disponibile</Text>
                        </View>
                      );
                    }
                    
                    const recentFiltered = recentTechnicians.filter(t => settings.technicians.includes(t));
                    const otherTechnicians = settings.technicians.filter(t => !recentFiltered.includes(t));
                    
                    return (
                      <>
                        {recentFiltered.length > 0 && (
                          <View>
                            <View style={styles.categoryHeader}>
                              <Text style={styles.categoryHeaderText}>Recenti</Text>
                            </View>
                            {recentFiltered.map((t) => (
                              <TouchableOpacity
                                key={t}
                                style={styles.pickerOption}
                                onPress={() => {
                                  updateTechnician(tech.id, 'name', t);
                                  closeTechnicianPicker();
                                }}
                              >
                                <Text style={styles.pickerOptionText}>{t}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                        {otherTechnicians.length > 0 && (
                          <View>
                            {recentFiltered.length > 0 && (
                              <View style={styles.categoryHeader}>
                                <Text style={styles.categoryHeaderText}>Altri</Text>
                              </View>
                            )}
                            {otherTechnicians.map((t) => (
                              <TouchableOpacity
                                key={t}
                                style={styles.pickerOption}
                                onPress={() => {
                                  updateTechnician(tech.id, 'name', t);
                                  closeTechnicianPicker();
                                }}
                              >
                                <Text style={styles.pickerOptionText}>{t}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
            {tech.name !== '' && (
              <>
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
                    onPress={() => setShowTechnicianPicker(showTechnicianPicker === `pause-${tech.id}` ? null : `pause-${tech.id}`)}
                  >
                    <Text style={styles.pickerText}>{tech.pauseMinutes} minuti</Text>
                  </TouchableOpacity>
                  {showTechnicianPicker === `pause-${tech.id}` && (
                    <View style={styles.pickerOptionsAbsolute}>
                      {pauseOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={styles.pickerOption}
                          onPress={() => {
                            updateTechnician(tech.id, 'pauseMinutes', option.value.toString());
                            setShowTechnicianPicker(null);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addTechButtonCenter} onPress={addTechnician}>
          <Users size={20} color="#ffffff" />
          <Text style={styles.addTechButtonText}>Aggiungi Tecnico</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Save size={20} color="#ffffff" />
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Salvataggio...' : 'Conferma Report'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>by AS</Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    zIndex: -1,
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
    zIndex: -1,
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
  addTechButtonCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  categoryHeader: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#2563eb',
    textTransform: 'uppercase' as const,
  },
  selectedTechniciansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  techChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    gap: 6,
  },
  techChipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
  },
});
