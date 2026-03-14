import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { Notification } from '../types';
import { MainStackParamList } from '../navigation/types';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';
import { useAuthStore } from '../store/authStore';

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Notifications'>;
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  NEW_MESSAGE: 'chatbubble-ellipses-outline',
  NEW_CONVERSATION: 'chatbubbles-outline',
  JOB_APPLICATION: 'briefcase-outline',
  RESEARCH_COLLABORATION: 'flask-outline',
  EVENT: 'calendar-outline',
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.getNotifications();
      return response.data as Notification[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return api.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const visibleNotifications = useMemo(
    () => (notifications || []).filter((notification) => (filter === 'unread' ? !notification.isRead : true)),
    [filter, notifications],
  );

  const unreadCount = (notifications || []).filter((notification) => !notification.isRead).length;

  const openRelatedScreen = (notification: Notification) => {
    switch (notification.relatedEntityType) {
      case 'CONVERSATION':
        if (notification.relatedId) {
          navigation.navigate('Conversation', { conversationId: notification.relatedId });
        }
        return;
      case 'JOB':
        if (notification.relatedId) {
          navigation.navigate('JobDetail', {
            jobId: notification.relatedId,
            focusApplications: user?.role === 'ADMIN',
          });
        }
        return;
      case 'RESEARCH_PROJECT':
        if (notification.relatedId) {
          navigation.navigate('ResearchDetail', { projectId: notification.relatedId });
        }
        return;
      case 'EVENT':
        if (notification.relatedId) {
          navigation.navigate('EventDetail', { eventId: notification.relatedId });
        }
        return;
      default:
        return;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notification, !item.isRead && styles.unread]}
      onPress={async () => {
        try {
          if (!item.isRead) {
            await markReadMutation.mutateAsync(item.id);
          }
          openRelatedScreen(item);
        } catch {
          Alert.alert('Notification update failed', 'Unable to open this notification right now.');
        }
      }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={iconMap[item.type] || 'notifications-outline'} size={18} color={colors.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatDistanceToNow(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount ? `${unreadCount} unread updates across jobs, research, messages, and events.` : "You're all caught up."}
            </Text>
            <View style={styles.filterRow}>
              <Button
                title="All"
                onPress={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                style={styles.filterButton}
              />
              <Button
                title="Unread"
                onPress={() => setFilter('unread')}
                variant={filter === 'unread' ? 'primary' : 'secondary'}
                size="sm"
                style={styles.filterButton}
              />
            </View>
            <Button
              title="Mark all as read"
              onPress={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              variant="secondary"
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={isError ? 'alert-circle-outline' : 'notifications-outline'}
              title={isError ? 'Notifications unavailable' : 'No notifications'}
              message={isError ? 'Pull to retry loading your notifications.' : "You're all caught up"}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.base,
    paddingBottom: 0,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.base,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  filterButton: {
    flex: 1,
  },
  notification: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: colors.surfaceElevated,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentMuted,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.xs,
  },
  time: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
});
