import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { JobApplication } from '../types';
import { EmptyState } from '../components/EmptyState';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

type MyApplicationsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'MyApplications'>;
};

const statusColors: Record<JobApplication['status'], string> = {
  applied: colors.accent,
  reviewing: colors.warning,
  accepted: colors.success,
  rejected: colors.danger,
};

export const MyApplicationsScreen: React.FC<MyApplicationsScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const canViewApplications = user?.role !== 'ADMIN';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-applications'],
    enabled: canViewApplications,
    queryFn: async () => {
      const response = await api.getMyApplications();
      return response.data as JobApplication[];
    },
  });

  if (!canViewApplications) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="briefcase-outline"
          title="Applications unavailable"
          message="Admin accounts do not submit job or internship applications."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={data || []}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          disabled={!item.job?.id}
          onPress={() => {
            if (item.job?.id) {
              navigation.navigate('JobDetail', { jobId: item.job.id });
            }
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.title}>{item.job?.title || 'Opportunity'}</Text>
              <Text style={styles.company}>{item.job?.company || 'Department listing'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}20` }]}>
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {item.job?.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.job.location}</Text>
            </View>
          ) : null}

          {item.job?.applicationDeadline ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                Deadline: {new Date(item.job.applicationDeadline).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          <Text style={styles.appliedAt}>Applied {formatDistanceToNow(item.appliedAt)}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={isError ? 'alert-circle-outline' : 'briefcase-outline'}
            title={isError ? 'Applications unavailable' : 'No applications yet'}
            message={
              isError
                ? 'Pull to refresh and try loading your submitted applications again.'
                : 'When you apply for a job or internship, it will appear here.'
            }
          />
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  cardInfo: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  company: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  appliedAt: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.base,
  },
});
