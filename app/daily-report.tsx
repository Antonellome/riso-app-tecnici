import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/utils/dateFormat';
import { Printer, Download } from 'lucide-react-native';

export default function DailyReportScreen() {
  const { id } = useLocalSearchParams();
  const { reports, settings, calculateHours } = useApp();

  const report = reports.find(r => r.id === id);

  if (!report) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Report non trovato</Text>
      </View>
    );
  }

  const userHours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
  
  const techniciansHours = report.technicians.map(tech => ({
    name: tech.name,
    startTime: tech.startTime,
    endTime: tech.endTime,
    pause: report.pauseMinutes,
    hours: calculateHours(tech.startTime, tech.endTime, report.pauseMinutes),
  }));

  const totalTechniciansHours = techniciansHours.reduce((sum, tech) => sum + tech.hours, 0);
  const totalReportHours = userHours + totalTechniciansHours;

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('Info', 'La stampa è disponibile solo su web. Usa il pulsante Esporta per salvare il PDF.');
    }
  };

  const handleExport = () => {
    Alert.alert('Esporta', 'Funzionalità di esportazione in sviluppo');
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={handlePrint}>
          <Printer size={20} color="#ffffff" />
          <Text style={styles.toolbarButtonText}>Stampa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleExport}>
          <Download size={20} color="#ffffff" />
          <Text style={styles.toolbarButtonText}>Esporta PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Report Giornaliero di {settings.user.name || '[Nome Utente]'}
            </Text>
            <Text style={styles.subtitle}>
              della ditta {settings.user.company || '[Nome Ditta]'}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data del Report:</Text>
              <Text style={styles.infoValue}>{formatDate(report.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome della Nave:</Text>
              <Text style={styles.infoValue}>{report.ship}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Luogo:</Text>
              <Text style={styles.infoValue}>{report.location}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tecnici</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.technicianCol]}>Tecnico</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Ora Inizio</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Ora Fine</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Pausa</Text>
                <Text style={[styles.tableHeaderCell, styles.hoursCol]}>Ore Lavorate</Text>
              </View>

              <View style={[styles.tableRow, styles.userRow]}>
                <Text style={[styles.tableCell, styles.technicianCol]}>{settings.user.name || '[Utente]'}</Text>
                <Text style={[styles.tableCell, styles.timeCol]}>{report.startTime}</Text>
                <Text style={[styles.tableCell, styles.timeCol]}>{report.endTime}</Text>
                <Text style={[styles.tableCell, styles.timeCol]}>{report.pauseMinutes} min</Text>
                <Text style={[styles.tableCell, styles.hoursCol]}>{userHours.toFixed(2)}h</Text>
              </View>

              {techniciansHours.map((tech, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.technicianCol]}>{tech.name}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.startTime}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.endTime}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.pause} min</Text>
                  <Text style={[styles.tableCell, styles.hoursCol]}>{tech.hours.toFixed(2)}h</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materiali Utilizzati</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>
                {report.materials || 'Nessun materiale specificato'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lavori Eseguiti</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>
                {report.workDone || 'Nessun lavoro specificato'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riepilogo Ore</Text>
            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Totale Ore Utente:</Text>
                <Text style={styles.summaryValue}>{userHours.toFixed(2)}h</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Totale Ore Tecnici:</Text>
                <Text style={styles.summaryValue}>{totalTechniciansHours.toFixed(2)}h</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Totale Ore Report:</Text>
                <Text style={styles.totalValue}>{totalReportHours.toFixed(2)}h</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Report generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toolbarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toolbarButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    minHeight: 1122,
    width: '100%',
    maxWidth: 794,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    width: 140,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  userRow: {
    backgroundColor: '#eff6ff',
  },
  tableCell: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  technicianCol: {
    flex: 2,
    textAlign: 'left',
  },
  timeCol: {
    flex: 1,
  },
  hoursCol: {
    flex: 1,
    fontWeight: '600' as const,
  },
  textBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  textContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  summaryTable: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600' as const,
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700' as const,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 32,
  },
});
