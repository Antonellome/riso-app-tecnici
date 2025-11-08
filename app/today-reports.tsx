import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Calendar, Edit2, X, FileText } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/utils/dateFormat';
import * as Print from 'expo-print';
let Sharing: any = null;
if (Platform.OS !== 'web') {
  Sharing = require('expo-sharing');
}
import type { Report as ReportType } from '@/types';

export default function TodayReportsScreen() {
  const router = useRouter();
  const appContext = useApp();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  
  const todayReports = useMemo(() => {
    if (!appContext) return [] as ReportType[];
    const today = new Date().toISOString().split('T')[0];
    return [...appContext.getRecentReports(100)].filter(r => r.date === today);
  }, [appContext]);

  if (!appContext || appContext.isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Report Odierni',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' as const },
        }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </>
    );
  }
  
  const { settings, calculateHours } = appContext;

  const formatTime = (time: string) => time;

  const generateDailyReportHTML = (report: ReportType) => {
    const userHours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
    const techniciansHours = report.technicians
      .map(tech => ({ name: tech.name, startTime: tech.startTime, endTime: tech.endTime, pause: report.pauseMinutes, hours: calculateHours(tech.startTime, tech.endTime, report.pauseMinutes) }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalTechniciansHours = techniciansHours.reduce((sum, tech) => sum + tech.hours, 0);
    const totalReportHours = userHours + totalTechniciansHours;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Giornaliero</title></head><body><h1>Report Giornaliero</h1></body></html>`;
  };

  const generateDailyReportExcelData = (report: ReportType) => {
    const userHours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
    const techniciansData = report.technicians
      .map(tech => ({ name: tech.name, startTime: tech.startTime, endTime: tech.endTime, pause: report.pauseMinutes, hours: calculateHours(tech.startTime, tech.endTime, report.pauseMinutes) }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalTechniciansHours = techniciansData.reduce((sum, tech) => sum + tech.hours, 0);
    const totalReportHours = userHours + totalTechniciansHours;

    return { title: `Report Giornaliero di ${settings.user.name || '[Nome Utente]'}`, subtitle: `della ditta ${settings.user.company || '[Nome Ditta]'}`, info: { date: formatDate(report.date), ship: report.ship, location: report.location }, technicians: [ { name: settings.user.name || '[Utente]', startTime: report.startTime, endTime: report.endTime, pause: report.pauseMinutes, hours: userHours, isUser: true }, ...techniciansData.map(t => ({ ...t, isUser: false })) ], materials: report.materials || 'Nessun materiale specificato', workDone: report.workDone || 'Nessun lavoro specificato', summary: { userHours, techniciansHours: totalTechniciansHours, totalHours: totalReportHours } };
  };

  const generateDailyReportExcelHTML = (data: ReturnType<typeof generateDailyReportExcelData>) => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Excel</title></head><body><h1>Report Excel</h1></body></html>`;
  };

  const handleViewPDF = async () => {
    if (!selectedReport) return;
    try {
      const html = generateDailyReportHTML(selectedReport);
      const title = `Report Giornaliero - ${formatDate(selectedReport.date)}`;
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({ pathname: '/view-pdf', params: { html: encodeURIComponent(html), title: encodeURIComponent(title) } });
      }
      setShowFormatModal(false);
    } catch (error) {
      console.error('Errore apertura PDF:', error);
      Alert.alert('Errore', 'Impossibile aprire il PDF');
    }
  };

  const handleViewExcel = () => {
    if (!selectedReport) return;
    try {
      const data = generateDailyReportExcelData(selectedReport);
      const title = `Report Giornaliero - ${formatDate(selectedReport.date)}`;
      if (Platform.OS === 'web') {
        const html = generateDailyReportExcelHTML(data);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({ pathname: '/view-excel', params: { data: encodeURIComponent(JSON.stringify(data)), title: encodeURIComponent(title) } });
      }
      setShowFormatModal(false);
    } catch (error) {
      console.error('Errore apertura Excel:', error);
      Alert.alert('Errore', 'Impossibile aprire Excel');
    }
  };
  
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Report Odierni',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {todayReports.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={64} color="#d1d5db" />
              <Text style={styles.emptyStateText}>Nessun report oggi</Text>
              <Text style={styles.emptyStateSubtext}>I report inseriti oggi appariranno qui</Text>
            </View>
          ) : (
            <View style={styles.reportsList}>
              {todayReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => { setSelectedReport(report); setShowFormatModal(true); }}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reportDateContainer}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
                    </View>
                    <View style={styles.reportBadge}>
                      <Text style={styles.reportBadgeText}>{report.shiftType}</Text>
                    </View>
                  </View>
                  
                  {report.isShared && report.createdByName && (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedBadgeText}>📋 Report di {report.createdByName}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.reportDescription} numberOfLines={1}>
                    {report.description || 'Nessuna descrizione'}
                  </Text>
                  
                  <View style={styles.reportFooter}>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportInfoLabel}>Nave:</Text>
                      <Text style={styles.reportInfoValue}>{report.ship || '-'}</Text>
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportInfoLabel}>Orario:</Text>
                      <Text style={styles.reportInfoValue}>
                        {formatTime(report.startTime)} - {formatTime(report.endTime)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.editIcon} onPress={() => router.push({ pathname: '/edit-report', params: { id: report.id } })}>
                      <Edit2 size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>by AS</Text>
          </View>
        </ScrollView>

        <Modal visible={showFormatModal} transparent animationType="fade" onRequestClose={() => setShowFormatModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFormatModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scegli Formato</Text>
                <TouchableOpacity onPress={() => setShowFormatModal(false)}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.formatButton, styles.pdfButton]} onPress={handleViewPDF}>
                  <FileText size={24} color="#ffffff" />
                  <Text style={styles.formatButtonText}>PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.formatButton, styles.excelButton]} onPress={handleViewExcel}>
                  <FileText size={24} color="#ffffff" />
                  <Text style={styles.formatButtonText}>Excel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed' as const,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center' as const,
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  reportBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportBadgeText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  sharedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  sharedBadgeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500' as const,
  },
  reportDescription: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportInfoLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reportInfoValue: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  editIcon: {
    marginLeft: 'auto',
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 16,
    gap: 12,
  },
  formatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  pdfButton: {
    backgroundColor: '#2563eb',
  },
  excelButton: {
    backgroundColor: '#10b981',
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
