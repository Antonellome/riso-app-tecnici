import { Tabs } from "expo-router";
import { Home, Settings, FileText, Search, Bell } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
  console.log('[TabLayout] Component rendering');
  const appContext = useApp();
  
  const unreadCount = appContext?.getUnreadNotificationsCount() || 0;
  console.log('[TabLayout] Unread count:', unreadCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarItemStyle: {
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Home color={focused ? '#ffffff' : '#2563eb'} size={size} />
            </View>
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <FileText color={focused ? '#ffffff' : '#2563eb'} size={size} />
            </View>
          ),
          tabBarLabel: "Report",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Search color={focused ? '#ffffff' : '#2563eb'} size={size} />
            </View>
          ),
          tabBarLabel: "Cerca",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Bell color={focused ? '#ffffff' : '#2563eb'} size={size} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarLabel: "Notifiche",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Settings color={focused ? '#ffffff' : '#2563eb'} size={size} />
            </View>
          ),
          tabBarLabel: "Impostazioni",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#2563eb',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700' as const,
  },
});
