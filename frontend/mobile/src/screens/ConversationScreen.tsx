import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Message } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { colors, spacing } from '../theme/tokens';

type ConversationScreenProps = {
  route: RouteProp<MainStackParamList, 'Conversation'>;
};

export const ConversationScreen: React.FC<ConversationScreenProps> = ({ route }) => {
  const { conversationId } = route.params;
  const [message, setMessage] = useState('');
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await api.getMessages(conversationId);
      return response.data as Message[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.sendMessage(conversationId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isCurrentUser={item.sender.id === user?.id} />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={styles.input}
        />
        <Button title="Send" onPress={handleSend} loading={sendMutation.isPending} size="sm" />
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
    paddingTop: spacing.base,
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
