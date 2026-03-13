import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from '../utils/date';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.header}>
        <Avatar uri={post.author.avatar} name={`${post.author.firstName} ${post.author.lastName}`} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>
            {post.author.firstName} {post.author.lastName}
          </Text>
          <Text style={styles.timestamp}>{formatDistanceToNow(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.images && post.images.length > 0 && (
        <Image source={{ uri: post.images[0] }} style={styles.image} />
      )}

      <View style={styles.stats}>
        <Text style={styles.statText}>{post.likesCount} likes</Text>
        <Text style={styles.statText}>{post.commentsCount} comments</Text>
        <Text style={styles.statText}>{post.sharesCount} shares</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={onLike}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? colors.danger : colors.textSecondary}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  content: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statText: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  likedText: {
    color: colors.danger,
  },
});
