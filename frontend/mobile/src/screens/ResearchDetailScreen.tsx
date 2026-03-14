import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { ResearchProject, User } from '../types';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

type ResearchDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'ResearchDetail'>;
};

export const ResearchDetailScreen: React.FC<ResearchDetailScreenProps> = ({ route }) => {
  const { projectId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('Collaborator');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['research-project', projectId],
    queryFn: async () => {
      const response = await api.getResearchProject(projectId);
      return response.data as ResearchProject;
    },
  });

  useEffect(() => {
    if (!inviteQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.searchUsers(inviteQuery);
        const users = (response.data as User[]).filter((candidate) => candidate.id !== user?.id);
        setResults(users);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inviteQuery, user?.id]);

  const inviteMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      return api.addResearchCollaborator(projectId, {
        userId: candidateId,
        roleInProject: inviteRole.trim() || 'Collaborator',
      });
    },
    onSuccess: () => {
      setInviteQuery('');
      setResults([]);
      queryClient.invalidateQueries({ queryKey: ['research-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['research-projects'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to invite collaborator');
    },
  });

  if (!project) {
    return null;
  }

  const canManage = project.lead.id === user?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.lead}>
          Lead: {project.lead.firstName} {project.lead.lastName}
        </Text>
        <Text style={styles.description}>{project.description}</Text>
        <Text style={styles.tags}>{project.tags.join(', ') || 'No tags added yet'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shared Document</Text>
        {project.documentUrl ? (
          <Button title="Open Document" onPress={() => Linking.openURL(project.documentUrl as string)} />
        ) : (
          <Text style={styles.emptyText}>No shared document yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collaborators</Text>
        {project.collaborators.length ? (
          project.collaborators.map((collaborator) => (
            <View key={collaborator.id} style={styles.collaboratorRow}>
              <Avatar
                uri={collaborator.user.avatar}
                name={`${collaborator.user.firstName} ${collaborator.user.lastName}`}
                size={40}
              />
              <View style={styles.collaboratorInfo}>
                <Text style={styles.collaboratorName}>
                  {collaborator.user.firstName} {collaborator.user.lastName}
                </Text>
                <Text style={styles.collaboratorRole}>
                  {collaborator.roleInProject} · {collaborator.user.email}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No collaborators invited yet.</Text>
        )}
      </View>

      {canManage ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Collaborators</Text>
          <TextInput
            value={inviteQuery}
            onChangeText={setInviteQuery}
            placeholder="Search users by name or email"
          />
          <TextInput
            value={inviteRole}
            onChangeText={setInviteRole}
            placeholder="Role in project"
          />

          {isSearching ? <Text style={styles.emptyText}>Searching users...</Text> : null}

          {results.map((candidate) => (
            <View key={candidate.id} style={styles.resultRow}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>
                  {candidate.firstName} {candidate.lastName}
                </Text>
                <Text style={styles.resultMeta}>
                  {candidate.email} · {candidate.role}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => inviteMutation.mutate(candidate.id)}
                disabled={inviteMutation.isPending}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
          ))}
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
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  lead: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  tags: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.base,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  collaboratorRole: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  resultMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  inviteButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  inviteButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
