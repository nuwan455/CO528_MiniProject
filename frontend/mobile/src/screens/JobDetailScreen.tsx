import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Job } from '../types';
import { Button } from '../components/Button';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

type JobDetailScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'JobDetail'>;
  route: RouteProp<MainStackParamList, 'JobDetail'>;
};

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ route }) => {
  const { jobId } = route.params;
  const [applied, setApplied] = useState(false);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await api.getJob(jobId);
      return response.data as Job;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return api.applyToJob(jobId, {});
    },
    onSuccess: () => {
      setApplied(true);
      Alert.alert('Success', 'Application submitted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit application');
    },
  });

  if (!job) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.company}>{job.company}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{job.type}</Text>
          </View>
          {job.salary && (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{job.salary}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {job.requirements && job.requirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.posted}>Posted {formatDistanceToNow(job.createdAt)}</Text>
        {job.applicationDeadline && (
          <Text style={styles.deadline}>
            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title={applied ? 'Applied' : 'Apply Now'}
          onPress={() => applyMutation.mutate()}
          loading={applyMutation.isPending}
          disabled={applied}
          size="lg"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  company: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.lg,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  meta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  requirementText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  footer: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
  posted: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
  },
  deadline: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  actions: {
    paddingHorizontal: spacing.xl,
  },
});
