import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Ship, MapPin, Search, ChevronDown, Edit2 } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import type { Report } from '@/types';
import { formatDate, getTodayISO } from '@/utils/dateFormat';
import DatePicker from '@/components/DatePicker';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    ship?: string;
    location?: string;
  }>();
  const { reports, settings } = useApp();
  
  const today = getTodayISO();
  const [searchType, setSearchType] = useState<'date' | 'ship' | 'location'>(
    (params.type as 'date' | 'ship' | 'location') || 'date'
  );
  const [dateFrom, setDateFrom] = useState(params.dateFrom || today);
  const [dateTo, setDateTo] = useState(params.dateTo || today);
  const [selectedShip, setSelectedShip] = useState(params.ship || '');
  const [selectedLocation, setSelectedLocation] = useState(params.location || '');
  
  const [showShipPicker, setShowShipPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (params.type) {
      setSearchType(params.type as 'date' | 'ship' | 'location');
    }
    if (params.dateFrom) {
      setDateFrom(params.dateFrom);
    }
    if (params.dateTo) {
      setDateTo(params.dateTo);
    }
    if (params.ship) {
      setSelectedShip(params.ship);
    }
    if (params.location) {
      setSelectedLocation(params.location);
    }
  }, [params]);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (searchType === 'date' && (dateFrom || dateTo)) {
      filtered = filtered.filter(r => {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
      });
    }

    if (searchType === 'ship' && selectedShip) {
      filtered = filtered.filter(r => r.ship === selectedShip);
    }

    if (searchType === 'location' && selectedLocation) {
      filtered = filtered.filter(r => r.location === selectedLocation);
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, searchType, dateFrom, dateTo, selectedShip, selectedLocation]);



  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Cerca',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.searchTypeContainer}>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'date' && styles.searchTypeButtonActive]}
          onPress={() => setSearchType('date')}
        >
          <Calendar size={18} color={searchType === 'date' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.searchTypeText, searchType === 'date' && styles.searchTypeTextActive]}>
            Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'ship' && styles.searchTypeButtonActive]}
          onPress={() => setSearchType('ship')}
        >
          <Ship size={18} color={searchType === 'ship' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.searchTypeText, searchType === 'ship' && styles.searchTypeTextActive]}>
            Nave
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'location' && styles.searchTypeButtonActive]}
          onPress={() => setSearchType('location')}
        >
          <MapPin size={18} color={searchType === 'location' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.searchTypeText, searchType === 'location' && styles.searchTypeTextActive]}>
            Luogo
          </Text>
        </TouchableOpacity>
      </View>

      {searchType === 'date' && (
        <View style={styles.section}>
          <View style={styles.field}>
            <DatePicker value={dateFrom} onChange={setDateFrom} label="Data Inizio" />
          </View>
          <View style={styles.field}>
            <DatePicker value={dateTo} onChange={setDateTo} label="Data Fine" />
          </View>
        </View>
      )}

      {searchType === 'ship' && (
        <View style={styles.section}>
          <Text style={styles.label}>Seleziona Nave</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowShipPicker(!showShipPicker)}
          >
            <Ship size={20} color="#6b7280" style={styles.inputIcon} />
            <Text style={[styles.pickerText, !selectedShip && styles.placeholder]}>
              {selectedShip || 'Seleziona nave'}
            </Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
          {showShipPicker && (
            <View style={styles.pickerOptions}>
              {settings.ships.map((ship) => (
                <TouchableOpacity
                  key={ship}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedShip(ship);
                    setShowShipPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{ship}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {searchType === 'location' && (
        <View style={styles.section}>
          <Text style={styles.label}>Seleziona Luogo</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowLocationPicker(!showLocationPicker)}
          >
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <Text style={[styles.pickerText, !selectedLocation && styles.placeholder]}>
              {selectedLocation || 'Seleziona luogo'}
            </Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
          {showLocationPicker && (
            <View style={styles.pickerOptions}>
              {settings.locations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedLocation(location);
                    setShowLocationPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>
          {filteredReports.length} Report Trovati
        </Text>
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>Nessun report trovato</Text>
            <Text style={styles.emptyStateSubtext}>Prova a modificare i criteri di ricerca</Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => router.push(`/edit-report?id=${report.id}`)}
              >
                <View style={styles.reportRow}>
                  <View style={styles.reportCell}>
                    <Text style={styles.reportCellLabel}>Data</Text>
                    <Text style={styles.reportCellValue}>{formatDate(report.date)}</Text>
                  </View>
                  <View style={styles.reportCell}>
                    <Text style={styles.reportCellLabel}>Nave</Text>
                    <Text style={styles.reportCellValue} numberOfLines={1}>{report.ship}</Text>
                  </View>
                </View>
                <View style={styles.reportRow}>
                  <View style={styles.reportCell}>
                    <Text style={styles.reportCellLabel}>Luogo</Text>
                    <Text style={styles.reportCellValue} numberOfLines={1}>{report.location}</Text>
                  </View>
                  <View style={styles.reportCell}>
                    <Text style={styles.reportCellLabel}>Tipo</Text>
                    <Text style={styles.reportCellValue}>{report.shiftType}</Text>
                  </View>
                </View>
                <View style={styles.reportDescription}>
                  <Text style={styles.reportDescriptionLabel}>Descrizione</Text>
                  <Text style={styles.reportDescriptionText} numberOfLines={2}>
                    {report.description || 'Nessuna descrizione'}
                  </Text>
                </View>
                <View style={styles.reportFooter}>
                  <TouchableOpacity style={styles.editIcon}>
                    <Edit2 size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 20,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  searchTypeTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
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
    borderWidth: 2,
    borderColor: '#d1d5db',
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
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportCell: {
    flex: 1,
  },
  reportCellLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  reportCellValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  reportDescription: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  reportDescriptionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  reportDescriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editIcon: {
    padding: 4,
  },
});
