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
import * as DocumentPicker from 'expo-document-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  navigation: NativeStackNavigationProp<MainStackParamList, 'ResearchDetail'>;
};

type SelectedDocument = {
  uri: string;
  name: string;
  type: string;
};

export const ResearchDetailScreen: React.FC<ResearchDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('Collaborator');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [document, setDocument] = useState<SelectedDocument | null>(null);

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

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project) {
        throw new Error('Project not found');
      }

      let uploadedDocument: { documentUrl?: string } | undefined;
      if (document) {
        const uploadResponse = await api.uploadDocument(document);
        uploadedDocument = uploadResponse.data;
      }

      return api.updateResearchProject(projectId, {
        title: title.trim(),
        description: description.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        documentUrl: uploadedDocument?.documentUrl ?? project.documentUrl,
      });
    },
    onSuccess: async () => {
      setIsEditing(false);
      setDocument(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['research-project', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['research-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert('Project updated', 'Your research project changes are now live.');
    },
    onError: () => {
      Alert.alert('Update failed', 'Unable to update this research project right now.');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => api.deleteResearchProject(projectId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['research-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['research-project', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert('Project deleted', 'The research project has been removed.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Delete failed', 'Unable to delete this research project right now.');
    },
  });

  const startEditing = () => {
    if (!project) {
      return;
    }

    setTitle(project.title);
    setDescription(project.description);
    setTags(project.tags.join(', '));
    setDocument(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDocument(null);
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/*', 'text/*', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setDocument({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
    });
  };

  const handleSaveProject = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing details', 'Project title and description are required.');
      return;
    }

    updateProjectMutation.mutate();
  };

  const confirmDeleteProject = () => {
    Alert.alert(
      'Delete research project?',
      'This will permanently remove the project and its collaborator setup from the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProjectMutation.mutate(),
        },
      ],
    );
  };

  if (!project) {
    return null;
  }

  const canManage = Boolean(user && (project.lead.id === user.id || user.role === 'ADMIN'));

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
          <Button
            title="Open Document"
            onPress={() => Linking.openURL(project.documentUrl as string)}
          />
        ) : (
          <Text style={styles.emptyText}>No shared document yet.</Text>
        )}
      </View>

      {canManage ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Project</Text>
          <Text style={styles.helperText}>
            Update the project details, share a new document, or remove the collaboration space.
          </Text>
          <View style={styles.actions}>
            <Button
              title={isEditing ? 'Cancel Edit' : 'Edit Project'}
              onPress={isEditing ? cancelEditing : startEditing}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title={deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
              onPress={confirmDeleteProject}
              loading={deleteProjectMutation.isPending}
              disabled={deleteProjectMutation.isPending}
              style={[styles.actionButton, styles.deleteButton]}
            />
          </View>
        </View>
      ) : null}

      {canManage && isEditing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Research Project</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Project title" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the project scope and collaboration goals"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          <TextInput value={tags} onChangeText={setTags} placeholder="Tags, comma separated" />

          <TouchableOpacity
            style={styles.documentPicker}
            onPress={handlePickDocument}
            activeOpacity={0.85}
          >
            <Text style={styles.documentPickerText}>
              {document
                ? `Document: ${document.name}`
                : project.documentUrl
                  ? 'Replace shared document'
                  : 'Attach research document'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={cancelEditing}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title={updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
              onPress={handleSaveProject}
              loading={updateProjectMutation.isPending}
              style={styles.actionButton}
            />
          </View>
        </View>
      ) : null}

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
                  {collaborator.roleInProject} - {collaborator.user.email}
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
                  {candidate.email} - {candidate.role}
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
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.base,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
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
