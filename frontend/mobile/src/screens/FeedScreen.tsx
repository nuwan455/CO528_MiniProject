import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing } from '../theme/tokens';

type FeedScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Feed'>;
};

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.getPosts();
      return response.data as Post[];
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      return isLiked ? api.unlikePost(postId) : api.likePost(postId);
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old: Post[] | undefined) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !isLiked,
                likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
              }
            : post
        )
      );

      return { previousPosts };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts);
    },
  });

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      onLike={() => likeMutation.mutate({ postId: item.id, isLiked: item.isLiked })}
      onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
      onShare={() => {}}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="newspaper-outline"
              title="No posts yet"
              message="Be the first to share something with the community"
            />
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
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
    paddingBottom: spacing['4xl'],
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
