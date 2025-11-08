import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, FileText, BarChart, Settings as SettingsIcon } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';

export default function HomeScreen() {
  console.log('[HomeScreen] Component rendering');
  const router = useRouter();
  const appContext = useApp();
  
  console.log('[HomeScreen] AppContext loaded:', appContext ? 'YES' : 'NO');
  console.log('[HomeScreen] isLoading:', appContext?.isLoading);
  
  if (!appContext || appContext.isLoading) {
    console.log('[HomeScreen] Showing loading screen');
    return (
      <>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'R.I.S.O. App Tecnici',
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

  console.log('[HomeScreen] Returning JSX');
  
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      <View style={styles.container}>
        <View style={styles.centeredContent}>
            <Text style={styles.appTitle}>R.I.S.O. App Tecnici</Text>
            <Text style={styles.appSubtitle}>Report Individuali Sincronizzati Online</Text>
            
            <View style={styles.menuGrid}>
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/add-report')}
              >
                <View style={styles.menuIconContainer}>
                  <Plus size={32} color="#ffffff" />
                </View>
                <Text style={styles.menuCardTitle}>Nuovo Report</Text>
                <Text style={styles.menuCardSubtitle}>Inserisci nuovo rapportino</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/today-reports')}
              >
                <View style={styles.menuIconContainer}>
                  <FileText size={32} color="#ffffff" />
                </View>
                <Text style={styles.menuCardTitle}>Report Odierni</Text>
                <Text style={styles.menuCardSubtitle}>Visualizza report di oggi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/statistics')}
              >
                <View style={styles.menuIconContainer}>
                  <BarChart size={32} color="#ffffff" />
                </View>
                <Text style={styles.menuCardTitle}>Statistiche</Text>
                <Text style={styles.menuCardSubtitle}>Ore e guadagni</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <View style={styles.menuIconContainer}>
                  <SettingsIcon size={32} color="#ffffff" />
                </View>
                <Text style={styles.menuCardTitle}>Impostazioni</Text>
                <Text style={styles.menuCardSubtitle}>Configura l&apos;app</Text>
              </TouchableOpacity>
            </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>by &quot;AS&quot;</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centeredContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
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
  appTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
    marginBottom: 48,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  menuCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic' as const,
  },
});
