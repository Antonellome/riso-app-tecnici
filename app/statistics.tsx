import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Calendar, Clock, Euro, FileText } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { getTodayISO } from '@/utils/dateFormat';

export default function StatisticsScreen() {
  const router = useRouter();
  const appContext = useApp();
  
  const stats = useMemo(() => {
    if (!appContext) return { reportsToday: 0, reportsTotal: 0, hoursThisWeek: 0, hoursThisMonth: 0, earningsThisMonth: 0 };
    return appContext.getStats();
  }, [appContext]);

  if (!appContext || appContext.isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Statistiche',
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

  const handleReportsTodayPress = () => {
    const today = getTodayISO();
    router.push({ pathname: '/search', params: { type: 'date', dateFrom: today, dateTo: today } });
  };

  const handleReportsMonthlyPress = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = new Date(year, now.getMonth() + 1, 0);
    const endDate = `${year}-${month}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
    
    router.push({ pathname: '/search', params: { type: 'date', dateFrom: startOfMonth, dateTo: endDate } });
  };
  
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Statistiche',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} onPress={handleReportsTodayPress}>
              <View style={styles.statIconContainer}>
                <FileText size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stats.reportsToday}</Text>
              <Text style={styles.statLabel}>Report Oggi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={handleReportsMonthlyPress}>
              <View style={styles.statIconContainer}>
                <Calendar size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stats.reportsTotal}</Text>
              <Text style={styles.statLabel}>Report Mensili</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.hoursThisWeek.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Ore Settimana</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.hoursThisMonth.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Ore Mese</Text>
            </View>
          </View>

          <View style={styles.earningsCard}>
            <View style={styles.earningsIconContainer}>
              <Euro size={32} color="#ffffff" />
            </View>
            <View style={styles.earningsContent}>
              <Text style={styles.earningsLabel}>Guadagno Mese</Text>
              <Text style={styles.earningsValue}>€{stats.earningsThisMonth.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>by AS</Text>
          </View>
        </ScrollView>
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
    paddingTop: 24,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  earningsCard: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  earningsContent: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#ffffff',
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
