import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { ResearchProject } from '../types';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { EmptyState } from '../components/EmptyState';
import { colors, radius, spacing, typography } from '../theme/tokens';

type ResearchListScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'ResearchList'>;
};

type SelectedDocument = {
  uri: string;
  name: string;
  type: string;
};

export const ResearchListScreen: React.FC<ResearchListScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [document, setDocument] = useState<SelectedDocument | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['research-projects'],
    queryFn: async () => {
      const response = await api.getResearchProjects();
      return response.data as ResearchProject[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let uploadedDocument: { documentUrl: string } | undefined;

      if (document) {
        const uploadResponse = await api.uploadDocument(document);
        uploadedDocument = uploadResponse.data;
      }

      return api.createResearchProject({
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        documentUrl: uploadedDocument?.documentUrl,
      });
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setTags('');
      setDocument(null);
      queryClient.invalidateQueries({ queryKey: ['research-projects'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create research project');
    },
  });

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

  const handleCreateProject = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Project title and description are required');
      return;
    }

    createMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Research Collaboration</Text>
            <Text style={styles.subtitle}>Create projects, share documents, and invite collaborators.</Text>

            <View style={styles.form}>
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

              <TouchableOpacity style={styles.documentPicker} onPress={handlePickDocument} activeOpacity={0.85}>
                <Text style={styles.documentPickerText}>
                  {document ? `Document: ${document.name}` : 'Attach research document'}
                </Text>
              </TouchableOpacity>

              <Button title="Create Project" onPress={handleCreateProject} loading={createMutation.isPending} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => navigation.navigate('ResearchDetail', { projectId: item.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectLead}>Lead: {item.lead.firstName} {item.lead.lastName}</Text>
            <Text style={styles.projectDescription} numberOfLines={3}>
              {item.description}
            </Text>
            <Text style={styles.projectMeta}>
              {item.collaborators.length} collaborators · {item.tags.join(', ') || 'No tags yet'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="flask-outline"
              title="No research projects yet"
              message="Create the first project and invite collaborators to start working together."
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
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
  projectCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  projectTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  projectLead: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  projectDescription: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  projectMeta: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
});
