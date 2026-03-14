import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Job, JobApplication } from '../types';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

type JobDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'JobDetail'>;
  navigation: NativeStackNavigationProp<MainStackParamList, 'JobDetail'>;
};

type SelectedDocument = {
  uri: string;
  name: string;
  type: string;
};

const statusColorMap: Record<JobApplication['status'], string> = {
  applied: colors.accent,
  reviewing: colors.warning,
  accepted: colors.success,
  rejected: colors.danger,
};

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ route, navigation }) => {
  const { jobId, focusApplications } = route.params;
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView | null>(null);
  const applicationsSectionY = useRef(0);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const canApply = Boolean(user && user.role !== 'ADMIN');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [resumeFile, setResumeFile] = useState<SelectedDocument | null>(null);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await api.getJob(jobId);
      return response.data as Job;
    },
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['my-applications'],
    enabled: canApply,
    queryFn: async () => {
      const response = await api.getMyApplications();
      return response.data as JobApplication[];
    },
  });

  const {
    data: jobApplications = [],
    isLoading: isLoadingApplications,
  } = useQuery({
    queryKey: ['job-applications', jobId],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await api.getJobApplications(jobId);
      return response.data as JobApplication[];
    },
  });

  const existingApplication = useMemo(
    () => myApplications.find((application) => application.jobId === jobId),
    [jobId, myApplications],
  );

  useEffect(() => {
    if (!focusApplications || !isAdmin || !jobApplications.length) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: applicationsSectionY.current, animated: true });
    }, 250);

    return () => clearTimeout(timer);
  }, [focusApplications, isAdmin, jobApplications.length]);

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setResumeFile({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
    });
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!resumeFile) {
        throw new Error('Please attach your CV before applying.');
      }

      if (!applicationNote.trim()) {
        throw new Error('Please add a short description for your application.');
      }

      const uploadResponse = await api.uploadDocument(resumeFile);
      return api.applyToJob(jobId, {
        resumeUrl: uploadResponse.data?.documentUrl,
        coverLetter: applicationNote.trim(),
      });
    },
    onSuccess: async () => {
      setShowApplyForm(false);
      setApplicationNote('');
      setResumeFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-applications'] }),
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert(
        'Application submitted',
        'Your CV and short description were submitted successfully.',
      );
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      Alert.alert('Application failed', message);
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => api.deleteJob(jobId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert('Job deleted', 'The opportunity has been removed.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Delete failed', 'Unable to delete this opportunity right now.');
    },
  });

  const confirmDeleteJob = () => {
    Alert.alert(
      'Delete job posting?',
      'This will permanently remove the opportunity and its submitted applications from the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteJobMutation.mutate(),
        },
      ],
    );
  };

  if (!job) {
    return null;
  }

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
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
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{job.applicationsCount ?? 0} applications</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.posted}>Posted {formatDistanceToNow(job.createdAt)}</Text>
        {job.applicationDeadline ? (
          <Text style={styles.deadline}>
            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {isAdmin ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Opportunity</Text>
          <Text style={styles.sectionDescription}>
            Edit the listing details or remove this opportunity from the department feed.
          </Text>
          <View style={styles.managementActions}>
            <Button
              title="Edit Job"
              onPress={() => navigation.navigate('CreateJob', { jobId })}
              variant="secondary"
              style={styles.managementButton}
            />
            <Button
              title={deleteJobMutation.isPending ? 'Deleting...' : 'Delete Job'}
              onPress={confirmDeleteJob}
              loading={deleteJobMutation.isPending}
              disabled={deleteJobMutation.isPending}
              style={[styles.managementButton, styles.deleteButton]}
            />
          </View>
        </View>
      ) : null}

      {canApply ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply to this job</Text>
          {existingApplication ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Application submitted</Text>
              <Text style={styles.successText}>
                Your application is already on file for this opportunity.
              </Text>
            </View>
          ) : (
            <>
              <Button
                title={showApplyForm ? 'Hide Application Form' : 'Apply Now'}
                onPress={() => setShowApplyForm((current) => !current)}
                variant={showApplyForm ? 'secondary' : 'primary'}
              />

              {showApplyForm ? (
                <View style={styles.applyForm}>
                  <TouchableOpacity
                    style={styles.documentPicker}
                    onPress={pickResume}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.documentPickerText}>
                      {resumeFile ? `CV: ${resumeFile.name}` : 'Attach CV / Resume'}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    label="Short Description"
                    value={applicationNote}
                    onChangeText={setApplicationNote}
                    placeholder="Briefly describe your skills, experience, and why you are a good fit."
                    multiline
                    numberOfLines={5}
                    style={styles.textArea}
                  />

                  <Button
                    title={applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    onPress={() => applyMutation.mutate()}
                    loading={applyMutation.isPending}
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {isAdmin ? (
        <View
          style={styles.section}
          onLayout={(event) => {
            applicationsSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Submitted Applications</Text>
          {isLoadingApplications ? (
            <Text style={styles.emptyText}>Loading applications...</Text>
          ) : jobApplications.length ? (
            jobApplications.map((application) => (
              <View key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationLead}>
                    <Text style={styles.applicationName}>
                      {application.applicant?.firstName} {application.applicant?.lastName}
                    </Text>
                    <Text style={styles.applicationMeta}>
                      {application.applicant?.email || 'No email available'}
                    </Text>
                    {application.applicant?.department ? (
                      <Text style={styles.applicationMeta}>
                        {application.applicant.department}
                        {application.applicant.graduationYear
                          ? ` - ${application.applicant.graduationYear}`
                          : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColorMap[application.status]}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColorMap[application.status] },
                      ]}
                    >
                      {application.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {application.applicant?.headline ? (
                  <Text style={styles.headline}>{application.applicant.headline}</Text>
                ) : null}

                <View style={styles.noteCard}>
                  <Text style={styles.noteLabel}>Short Description</Text>
                  <Text style={styles.noteText}>
                    {application.coverLetter?.trim() || 'No short description was provided.'}
                  </Text>
                </View>

                <View style={styles.applicationActions}>
                  <Text style={styles.appliedAt}>
                    Submitted {formatDistanceToNow(application.appliedAt)}
                  </Text>
                  {application.resumeUrl ? (
                    <Button
                      title="Open CV"
                      onPress={() => Linking.openURL(application.resumeUrl as string)}
                      variant="secondary"
                      size="sm"
                    />
                  ) : (
                    <Text style={styles.emptyText}>No CV uploaded</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No applications have been submitted for this job yet.
            </Text>
          )}
        </View>
      ) : null}
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
    textTransform: 'capitalize',
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
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.base,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
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
  managementActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  managementButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  applyForm: {
    marginTop: spacing.base,
  },
  documentPicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  documentPickerText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  successCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
    padding: spacing.base,
  },
  successTitle: {
    color: colors.success,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  applicationCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  applicationLead: {
    flex: 1,
  },
  applicationName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  applicationMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  headline: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.base,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
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
  noteCard: {
    marginTop: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.base,
  },
  noteLabel: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginTop: spacing.sm,
  },
  applicationActions: {
    marginTop: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  appliedAt: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
});
