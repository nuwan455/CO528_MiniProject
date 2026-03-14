import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../theme/tokens';

type SelectedMedia = {
  uri: string;
  name: string;
  type: string;
  kind: 'image' | 'video';
};

type CreatePostScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreatePost'>;
};

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ nextContent, media }: { nextContent: string; media: SelectedMedia | null }) => {
      let uploadedMedia: { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' } | undefined;

      if (media) {
        const uploadResponse = await api.uploadMedia({
          uri: media.uri,
          name: media.name,
          type: media.type,
        });
        uploadedMedia = uploadResponse.data;
      }

      return api.createPost({
        content: nextContent,
        mediaUrl: uploadedMedia?.mediaUrl,
        mediaType: uploadedMedia?.mediaType ?? 'NONE',
        visibility: 'PUBLIC',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create post');
    },
  });

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    setSelectedMedia({
      uri: asset.uri,
      name: asset.fileName || `post-media.${isVideo ? 'mp4' : 'jpg'}`,
      type: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      kind: isVideo ? 'video' : 'image',
    });
  };

  const handleSubmit = () => {
    const nextContent = content.trim();
    if (!nextContent && !selectedMedia) {
      Alert.alert('Error', 'Please add text or attach an image/video');
      return;
    }
    createMutation.mutate({ nextContent, media: selectedMedia });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's happening in the department?"
            multiline
            numberOfLines={8}
            style={styles.input}
          />

          <TouchableOpacity style={styles.mediaPicker} onPress={handlePickMedia} activeOpacity={0.85}>
            <Ionicons name="images-outline" size={20} color={colors.accent} />
            <Text style={styles.mediaPickerText}>
              {selectedMedia ? 'Change image or video' : 'Attach image or video'}
            </Text>
          </TouchableOpacity>

          {selectedMedia ? (
            <View style={styles.mediaPreview}>
              <View style={styles.mediaHeader}>
                <View>
                  <Text style={styles.mediaTitle}>{selectedMedia.name}</Text>
                  <Text style={styles.mediaSubtitle}>
                    {selectedMedia.kind === 'video' ? 'Video attachment' : 'Image attachment'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMedia(null)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedMedia.kind === 'image' ? (
                <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.videoPreview}>
                  <View style={styles.videoPreviewIcon}>
                    <Ionicons name="play" size={22} color={colors.textPrimary} />
                  </View>
                  <View style={styles.videoPreviewText}>
                    <Text style={styles.videoPreviewTitle}>Video ready to upload</Text>
                    <Text style={styles.videoPreviewSubtitle}>It will open externally from the feed on mobile.</Text>
                  </View>
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
            />
            <Button
              title="Post"
              onPress={handleSubmit}
              loading={createMutation.isPending}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  input: {
    flex: 1,
    textAlignVertical: 'top',
  },
  mediaPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  mediaPickerText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  mediaPreview: {
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.base,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  mediaTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  mediaSubtitle: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.base,
  },
  videoPreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    flex: 1,
  },
  videoPreviewTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  videoPreviewSubtitle: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
});
