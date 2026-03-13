import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Post, Comment } from '../types';
import { PostCard } from '../components/PostCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { colors, spacing, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

type PostDetailScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'PostDetail'>;
  route: RouteProp<MainStackParamList, 'PostDetail'>;
};

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ route }) => {
  const { postId } = route.params;
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await api.getPost(postId);
      return response.data as Post;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.getComments(postId);
      return response.data as Comment[];
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.addComment(postId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setComment('');
    },
  });

  const handleComment = () => {
    if (comment.trim()) {
      commentMutation.mutate(comment);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.comment}>
      <Avatar uri={item.author.avatar} name={`${item.author.firstName} ${item.author.lastName}`} size={32} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>
            {item.author.firstName} {item.author.lastName}
          </Text>
          <Text style={styles.commentTime}>{formatDistanceToNow(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  if (!post) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ListHeaderComponent={
          <View style={styles.postContainer}>
            <PostCard post={post} onPress={() => {}} onLike={() => {}} onComment={() => {}} onShare={() => {}} />
          </View>
        }
        data={comments || []}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Write a comment..."
          style={styles.input}
        />
        <Button title="Post" onPress={handleComment} loading={commentMutation.isPending} size="sm" />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  postContainer: {
    padding: spacing.base,
  },
  comment: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  commentTime: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginBottom: 0,
  },
});
