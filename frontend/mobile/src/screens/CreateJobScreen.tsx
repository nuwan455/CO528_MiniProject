import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Job } from '../types';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type CreateJobScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreateJob'>;
  route: RouteProp<MainStackParamList, 'CreateJob'>;
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

const toLocalDateTimeValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toJobForm = (job: Job): JobFormState => ({
  title: job.title,
  company: job.company,
  location: job.location,
  type:
    job.type === 'full-time'
      ? 'FULL_TIME'
      : job.type === 'part-time'
        ? 'PART_TIME'
        : job.type === 'internship'
          ? 'INTERNSHIP'
          : 'CONTRACT',
  description: job.description,
  deadline: job.applicationDeadline ? toLocalDateTimeValue(job.applicationDeadline) : '',
});

export const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ navigation, route }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const editingJobId = route.params?.jobId;
  const isEditing = Boolean(editingJobId);
  const [jobForm, setJobForm] = useState<JobFormState>(initialJobForm);
  const canPostJobs = user?.role === 'ADMIN';

  const { data: existingJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ['job', editingJobId],
    enabled: isEditing,
    queryFn: async () => {
      const response = await api.getJob(editingJobId as string);
      return response.data as Job;
    },
  });

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Job' : 'Create Job' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (!existingJob) {
      return;
    }

    setJobForm(toJobForm(existingJob));
  }, [existingJob]);

  const saveJobMutation = useMutation({
    mutationFn: async (payload: JobFormState) => {
      if (isEditing && editingJobId) {
        return api.updateJob(editingJobId, payload);
      }
      return api.createJob(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['job', editingJobId] }),
      ]);
      Alert.alert(
        isEditing ? 'Opportunity updated' : 'Opportunity posted',
        isEditing ? 'Your job listing changes are now live.' : 'The department job listing is now live.',
      );
      navigation.goBack();
    },
    onError: () => {
      Alert.alert(
        isEditing ? 'Update failed' : 'Posting failed',
        isEditing
          ? 'Unable to update this opportunity right now.'
          : 'Unable to publish this opportunity right now.',
      );
    },
  });

  const submitJob = () => {
    const trimmedDeadline = jobForm.deadline.trim();
    const parsedDeadline = new Date(trimmedDeadline);

    if (
      !jobForm.title.trim() ||
      !jobForm.company.trim() ||
      !jobForm.location.trim() ||
      !jobForm.description.trim() ||
      !trimmedDeadline
    ) {
      Alert.alert('Missing details', 'Please complete all job post fields before submitting.');
      return;
    }

    if (Number.isNaN(parsedDeadline.getTime())) {
      Alert.alert('Invalid deadline', 'Use a valid date like 2026-04-30 or 2026-04-30T17:00.');
      return;
    }

    saveJobMutation.mutate({
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
        <Text style={styles.guardText}>Only admins can create job or internship posts from mobile.</Text>
      </View>
    );
  }

  if (isEditing && isLoadingJob && !existingJob) {
    return (
      <View style={styles.guard}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.guardText}>Loading the job details...</Text>
      </View>
    );
  }

  if (isEditing && !isLoadingJob && !existingJob) {
    return (
      <View style={styles.guard}>
        <Text style={styles.guardTitle}>Job not found</Text>
        <Text style={styles.guardText}>This opportunity could not be loaded for editing.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isEditing ? 'Edit Department Opportunity' : 'Publish Department Opportunity'}
        </Text>
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
                <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>
                  {option.label}
                </Text>
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

        <View style={styles.actions}>
          {isEditing ? (
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : null}
          <Button
            title={
              saveJobMutation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Posting...'
                : isEditing
                  ? 'Save Changes'
                  : 'Post Opportunity'
            }
            onPress={submitJob}
            loading={saveJobMutation.isPending}
            style={styles.actionButton}
          />
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  guard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.sm,
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
