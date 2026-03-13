import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { colors, spacing } from '../theme/tokens';

type CreatePostScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreatePost'>;
};

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.createPost({ content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create post');
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }
    createMutation.mutate(content);
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
            placeholder="What's on your mind?"
            multiline
            numberOfLines={8}
            style={styles.input}
          />

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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
});
