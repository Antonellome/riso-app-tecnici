import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { Clock, X } from 'lucide-react-native';

interface TimeSliderProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export default function TimeSlider({ value, onChange, label }: TimeSliderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);
  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);

  const handleOpen = () => {
    const [h, m] = value.split(':').map(Number);
    setSelectedHour(h);
    setSelectedMinute(m);
    setIsVisible(true);
  };

  const handleConfirm = () => {
    const hour = String(selectedHour).padStart(2, '0');
    const minute = String(selectedMinute).padStart(2, '0');
    onChange(`${hour}:${minute}`);
    setIsVisible(false);
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

            <View style={styles.sliderContainer}>
              <View style={styles.sliderSection}>
                <Text style={styles.sliderLabel}>Ora</Text>
                <Text style={styles.sliderValue}>{String(selectedHour).padStart(2, '0')}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={selectedHour}
                  onValueChange={setSelectedHour}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#2563eb"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>00</Text>
                  <Text style={styles.sliderLabelText}>23</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.sliderSection}>
                <Text style={styles.sliderLabel}>Minuti</Text>
                <Text style={styles.sliderValue}>{String(selectedMinute).padStart(2, '0')}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={59}
                  step={1}
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#2563eb"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>00</Text>
                  <Text style={styles.sliderLabelText}>59</Text>
                </View>
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
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
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
