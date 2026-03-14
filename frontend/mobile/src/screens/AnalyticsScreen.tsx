import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';
import { EmptyState } from '../components/EmptyState';
import { colors, radius, spacing, typography } from '../theme/tokens';

type AnalyticsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Analytics'>;
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['analytics-overview'],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await api.getAnalyticsOverview();
      return response.data as AnalyticsOverview;
    },
  });

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="lock-closed-outline"
          title="Analytics unavailable"
          message="Only admin accounts can access department analytics."
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="alert-circle-outline"
          title="Analytics unavailable"
          message="We couldn't load the analytics overview right now."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Department Analytics</Text>
        <Text style={styles.subtitle}>
          Overview of engagement and platform usage across the community.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Users</Text>
          <Text style={styles.metricValue}>
            {isLoading ? '...' : `${overview?.activeUsers ?? 0}`}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Posts</Text>
          <Text style={styles.metricValue}>{isLoading ? '...' : `${overview?.posts ?? 0}`}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Jobs</Text>
          <Text style={styles.metricValue}>{isLoading ? '...' : `${overview?.jobs ?? 0}`}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Applications</Text>
          <Text style={styles.metricValue}>
            {isLoading ? '...' : `${overview?.applications ?? 0}`}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Event RSVPs</Text>
          <Text style={styles.metricValue}>
            {isLoading ? '...' : `${overview?.eventRsvps ?? 0}`}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Active Modules</Text>
        {overview?.mostActiveModules?.length ? (
          overview.mostActiveModules.map((module) => (
            <View key={module.module} style={styles.moduleRow}>
              <Text style={styles.moduleName}>{module.module}</Text>
              <Text style={styles.moduleCount}>{module.count} interactions</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading activity...' : 'No activity metrics available yet.'}
          </Text>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
  },
  grid: {
    gap: spacing.base,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  metricLabel: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  moduleName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  moduleCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
});
