import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUser : styles.otherUser]}>
      <View style={[styles.bubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
        <Text style={[styles.content, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isCurrentUser && styles.currentUserTimestamp]}>
        {formatDistanceToNow(message.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  currentUser: {
    alignItems: 'flex-end',
  },
  otherUser: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  currentUserBubble: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radius.xs,
  },
  otherUserBubble: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: radius.xs,
  },
  content: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  currentUserText: {
    color: colors.textPrimary,
  },
  otherUserText: {
    color: colors.textPrimary,
  },
  timestamp: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  currentUserTimestamp: {
    textAlign: 'right',
  },
});
