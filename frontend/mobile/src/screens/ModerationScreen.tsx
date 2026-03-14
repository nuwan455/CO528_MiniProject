import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { AdminReport, AdminUserSummary } from '../types';
import { EmptyState } from '../components/EmptyState';
import { colors, radius, spacing, typography } from '../theme/tokens';

type ModerationScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Moderation'>;
};

export const ModerationScreen: React.FC<ModerationScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    enabled: isAdmin,
    queryFn: async () => {
      const [reportsResponse, usersResponse] = await Promise.all([
        api.getAdminReports(),
        api.getAdminUsers(),
      ]);

      return {
        reports: reportsResponse.data as AdminReport,
        users: usersResponse.data as AdminUserSummary[],
      };
    },
  });

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="shield-outline"
          title="Moderation unavailable"
          message="Only admin accounts can access moderation controls."
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="alert-circle-outline"
          title="Moderation unavailable"
          message="We couldn't load the moderation dashboard right now."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Moderation</Text>
        <Text style={styles.subtitle}>
          Review platform totals and keep an eye on recent account activity.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Platform Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Users</Text>
            <Text style={styles.summaryValue}>{isLoading ? '...' : data?.reports.users ?? 0}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Posts</Text>
            <Text style={styles.summaryValue}>{isLoading ? '...' : data?.reports.posts ?? 0}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jobs</Text>
            <Text style={styles.summaryValue}>{isLoading ? '...' : data?.reports.jobs ?? 0}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Events</Text>
            <Text style={styles.summaryValue}>{isLoading ? '...' : data?.reports.events ?? 0}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Flagged</Text>
            <Text style={styles.summaryValue}>
              {isLoading ? '...' : data?.reports.flaggedCount ?? 0}
            </Text>
          </View>
        </View>
        <Text style={styles.breakdown}>
          {isLoading
            ? 'Loading role breakdown...'
            : `${data?.reports.roleBreakdown.students ?? 0} students, ${
                data?.reports.roleBreakdown.alumni ?? 0
              } alumni, ${data?.reports.roleBreakdown.admins ?? 0} admins`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Users</Text>
        {data?.users?.length ? (
          data.users.slice(0, 10).map((adminUser) => (
            <View key={adminUser.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{adminUser.name}</Text>
                <Text style={styles.userMeta}>
                  {adminUser.email}
                  {adminUser.department ? ` - ${adminUser.department}` : ''}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{adminUser.role}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading users...' : 'No user records are available right now.'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Review</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
          >
            <Text style={styles.quickLinkTitle}>Feed</Text>
            <Text style={styles.quickLinkText}>Review latest posts and interactions.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs' })}
          >
            <Text style={styles.quickLinkTitle}>Jobs</Text>
            <Text style={styles.quickLinkText}>Check published opportunities and applications.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Events' })}
          >
            <Text style={styles.quickLinkTitle}>Events</Text>
            <Text style={styles.quickLinkText}>Review department events and RSVP activity.</Text>
          </TouchableOpacity>
        </View>
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  section: {
    marginTop: spacing.base,
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
  summaryGrid: {
    gap: spacing.base,
  },
  summaryItem: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  breakdown: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.base,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  userMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  roleBadgeText: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  quickLinks: {
    gap: spacing.sm,
  },
  quickLink: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.base,
  },
  quickLinkTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  quickLinkText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});
