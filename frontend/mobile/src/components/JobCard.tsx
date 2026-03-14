import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

const JOB_TYPE_LABELS: Record<Job['type'], string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

const JOB_TYPE_COLORS: Record<Job['type'], string> = {
  'full-time': colors.accent,
  'part-time': colors.success,
  internship: colors.warning,
  contract: colors.textSecondary,
};

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.badge, { backgroundColor: `${JOB_TYPE_COLORS[job.type]}15` }]}>
          <Text style={[styles.badgeText, { color: JOB_TYPE_COLORS[job.type] }]}>
            {JOB_TYPE_LABELS[job.type]}
          </Text>
        </View>
      </View>

      <Text style={styles.company}>{job.company}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.metaText}>{job.location}</Text>
        </View>
        {typeof job.applicationsCount === 'number' ? (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.metaText}>{job.applicationsCount} applications</Text>
          </View>
        ) : null}
        {job.salary && (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.metaText}>{job.salary}</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>Posted {formatDistanceToNow(job.createdAt)}</Text>
        {job.applicationDeadline && (
          <Text style={styles.deadline}>
            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  company: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timestamp: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
  deadline: {
    color: colors.warning,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
});
