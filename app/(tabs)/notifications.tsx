import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Bell, Trash2, AlertCircle, Info, AlertTriangle, Calendar, Settings } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const {
    notifications,
    markNotificationAsRead,
    deleteNotification,
    settings,
  } = useApp();

  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(
    new Set()
  );

  const notificationsByDate = useMemo(() => {
    const grouped: Record<string, Notification[]> = {};

    notifications.forEach((notification) => {
      const date = notification.date || new Date(notification.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(notification);
    });

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => b.timestamp - a.timestamp);
    });

    return Object.entries(grouped).sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [notifications]);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notification.id)) {
      newExpanded.delete(notification.id);
    } else {
      newExpanded.add(notification.id);
    }
    setExpandedNotifications(newExpanded);
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert('Conferma', 'Eliminare questa notifica?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteNotification(id);
          const newExpanded = new Set(expandedNotifications);
          newExpanded.delete(id);
          setExpandedNotifications(newExpanded);
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayStr) {
      return 'Oggi';
    } else if (dateOnly === yesterdayStr) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (notification: Notification) => {
    const iconSize = 20;
    const iconColor = notification.read ? '#9ca3af' : getNotificationColor(notification);

    switch (notification.type) {
      case 'alert':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'config':
        return <Settings size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.type === 'config') return '#10b981';
    if (notification.priority === 'high') return '#ef4444';
    if (notification.priority === 'normal') return '#f59e0b';
    return '#3b82f6';
  };

  if (notifications.length === 0) {
    return (
      <>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Notifiche',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' as const },
        }} />
        <View style={styles.wrapper}>
          <View style={styles.container}>
            <View style={styles.emptyState}>
              <Bell size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Nessuna notifica</Text>
              <Text style={styles.emptyText}>
                {settings.sync?.enabled
                  ? 'Le notifiche appariranno qui'
                  : 'Le notifiche aziendali appariranno qui'}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Notifiche',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
          {notificationsByDate.map(([date, dayNotifications]) => (
            <View key={date} style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{dayNotifications.length}</Text>
                </View>
              </View>

              {dayNotifications.map((notification) => {
                const isExpanded = expandedNotifications.has(notification.id);
                const color = getNotificationColor(notification);

                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.notificationCardUnread,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.notificationIndicator,
                        { backgroundColor: notification.read ? '#e5e7eb' : color },
                      ]}
                    />

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <View style={styles.notificationIconContainer}>
                          {getNotificationIcon(notification)}
                        </View>
                        <View style={styles.notificationHeaderText}>
                          <Text
                            style={[
                              styles.notificationTitle,
                              !notification.read && styles.notificationTitleUnread,
                            ]}
                            numberOfLines={isExpanded ? undefined : 1}
                          >
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatTime(notification.timestamp)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteNotification(notification.id)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={[
                          styles.notificationMessage,
                          !notification.read && styles.notificationMessageUnread,
                        ]}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {notification.message}
                      </Text>

                      {!notification.read && (
                        <View style={styles.unreadDot}>
                          <View style={[styles.unreadDotInner, { backgroundColor: color }]} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
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
  emptyState: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  content: {
    padding: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationCardUnread: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIndicator: {
    width: 4,
  },
  notificationContent: {
    flex: 1,
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: '600' as const,
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  notificationMessageUnread: {
    color: '#374151',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  unreadDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
