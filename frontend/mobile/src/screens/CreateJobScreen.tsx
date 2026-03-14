import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type CreateJobScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreateJob'>;
};

type JobFormState = {
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
  description: string;
  deadline: string;
};

const initialJobForm: JobFormState = {
  title: '',
  company: '',
  location: '',
  type: 'FULL_TIME',
  description: '',
  deadline: '',
};

const jobTypeOptions: Array<{ label: string; value: JobFormState['type'] }> = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Contract', value: 'CONTRACT' },
];

export const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [jobForm, setJobForm] = useState<JobFormState>(initialJobForm);
  const canPostJobs = user?.role === 'ADMIN' || user?.role === 'ALUMNI';
  const isAdmin = user?.role === 'ADMIN';

  const createJobMutation = useMutation({
    mutationFn: async (payload: JobFormState) => api.createJob(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Opportunity posted', isAdmin ? 'The department job listing is now live.' : 'Your opportunity is now live.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Posting failed', 'Unable to publish this opportunity right now.');
    },
  });

  const submitJob = () => {
    const trimmedDeadline = jobForm.deadline.trim();
    const parsedDeadline = new Date(trimmedDeadline);

    if (!jobForm.title.trim() || !jobForm.company.trim() || !jobForm.location.trim() || !jobForm.description.trim() || !trimmedDeadline) {
      Alert.alert('Missing details', 'Please complete all job post fields before submitting.');
      return;
    }

    if (Number.isNaN(parsedDeadline.getTime())) {
      Alert.alert('Invalid deadline', 'Use a valid date like 2026-04-30 or 2026-04-30T17:00.');
      return;
    }

    createJobMutation.mutate({
      ...jobForm,
      title: jobForm.title.trim(),
      company: jobForm.company.trim(),
      location: jobForm.location.trim(),
      description: jobForm.description.trim(),
      deadline: parsedDeadline.toISOString(),
    });
  };

  if (!canPostJobs) {
    return (
      <View style={styles.guard}>
        <Text style={styles.guardTitle}>Job posting unavailable</Text>
        <Text style={styles.guardText}>Only alumni and admins can create job or internship posts from mobile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{isAdmin ? 'Publish Department Opportunity' : 'Share an Alumni Opportunity'}</Text>
        <TextInput
          label="Job title"
          value={jobForm.title}
          onChangeText={(value) => setJobForm((current) => ({ ...current, title: value }))}
          placeholder="Software Engineering Intern"
        />
        <TextInput
          label="Company or organization"
          value={jobForm.company}
          onChangeText={(value) => setJobForm((current) => ({ ...current, company: value }))}
          placeholder="DECP Department"
        />
        <TextInput
          label="Location"
          value={jobForm.location}
          onChangeText={(value) => setJobForm((current) => ({ ...current, location: value }))}
          placeholder="Colombo or Remote"
        />

        <Text style={styles.fieldLabel}>Job type</Text>
        <View style={styles.typeRow}>
          {jobTypeOptions.map((option) => {
            const selected = jobForm.type === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.typeChip, selected && styles.typeChipActive]}
                activeOpacity={0.8}
                onPress={() => setJobForm((current) => ({ ...current, type: option.value }))}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          label="Application deadline"
          value={jobForm.deadline}
          onChangeText={(value) => setJobForm((current) => ({ ...current, deadline: value }))}
          placeholder="2026-04-30 or 2026-04-30T17:00"
          autoCapitalize="none"
        />
        <TextInput
          label="Description"
          value={jobForm.description}
          onChangeText={(value) => setJobForm((current) => ({ ...current, description: value }))}
          placeholder="Describe the role, expectations, and who should apply."
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />

        <Button
          title={createJobMutation.isPending ? 'Posting...' : 'Post Opportunity'}
          onPress={submitJob}
          loading={createJobMutation.isPending}
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
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  typeChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  guard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  guardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  guardText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
});
