import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  console.log('[RootLayoutNav] Rendering Stack (with welcome initial route)');
  return (
    <>
      <StatusBar style="auto" />
      <Stack initialRouteName="welcome" screenOptions={{ headerShown: false, headerBackTitle: "Indietro" }}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-report" options={{ headerShown: true, title: "Aggiungi Report", presentation: "modal" }} />
        <Stack.Screen name="edit-report" options={{ headerShown: true, title: "Modifica Report", presentation: "modal" }} />
        <Stack.Screen name="scan-config" options={{ headerShown: true, title: "Configura Scansione" }} />
        <Stack.Screen name="daily-report" options={{ headerShown: true, title: "Report Giornaliero" }} />
        <Stack.Screen name="view-pdf" options={{ headerShown: true, title: "Visualizza PDF" }} />
        <Stack.Screen name="view-excel" options={{ headerShown: true, title: "Visualizza Excel" }} />
        <Stack.Screen name="today-reports" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={styles.container}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
