import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Conversation } from '../types';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from '../utils/date';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  onPress,
}) => {
  const otherParticipant = conversation.participants.find((p) => p.id !== currentUserId);

  if (!otherParticipant) return null;

  const participantName = `${otherParticipant.firstName} ${otherParticipant.lastName}`;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar uri={otherParticipant.avatar} name={participantName} size={48} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{participantName}</Text>
          {conversation.lastMessage && (
            <Text style={styles.timestamp}>
              {formatDistanceToNow(conversation.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        {conversation.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.lastMessage.sender.id === currentUserId && 'You: '}
            {conversation.lastMessage.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
});
