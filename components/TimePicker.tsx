import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Clock, X } from 'lucide-react-native';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);
  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);
  const scrollViewHourRef = React.useRef<ScrollView>(null);
  const scrollViewMinuteRef = React.useRef<ScrollView>(null);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const hour = String(selectedHour).padStart(2, '0');
    const minute = String(selectedMinute).padStart(2, '0');
    onChange(`${hour}:${minute}`);
    setIsVisible(false);
  };

  const handleOpen = () => {
    setIsVisible(true);
    setTimeout(() => {
      const itemHeight = 44;
      scrollViewHourRef.current?.scrollTo({ y: selectedHour * itemHeight, animated: false });
      scrollViewMinuteRef.current?.scrollTo({ y: selectedMinute * itemHeight, animated: false });
    }, 100);
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <Clock size={20} color="#6b7280" style={styles.icon} />
        <Text style={styles.inputText}>{value}</Text>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Orario</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Ora</Text>
                <ScrollView ref={scrollViewHourRef} style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hourOptions.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.pickerItem, selectedHour === hour && styles.pickerItemSelected]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[styles.pickerItemText, selectedHour === hour && styles.pickerItemTextSelected]}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minuti</Text>
                <ScrollView ref={scrollViewMinuteRef} style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minuteOptions.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.pickerItem, selectedMinute === minute && styles.pickerItemSelected]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[styles.pickerItemText, selectedMinute === minute && styles.pickerItemTextSelected]}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Conferma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerScroll: {
    maxHeight: 180,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    height: 44,
  },
  pickerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#2563eb',
    fontWeight: '700' as const,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
