import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Conversation, User } from '../types';
import { ConversationItem } from '../components/ConversationItem';
import { EmptyState } from '../components/EmptyState';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type MessagesScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Messages'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
};

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      return response.data as Conversation[];
    },
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.searchUsers(query.trim());
        const users = (response.data as User[]).filter((candidate) => candidate.id !== user?.id);
        setResults(users);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      currentUserId={user?.id || ''}
      onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Start a conversation</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search users by name or email"
            />
            {results.length ? (
              <View style={styles.results}>
                {results.map((candidate) => (
                  <TouchableOpacity
                    key={candidate.id}
                    style={styles.resultRow}
                    activeOpacity={0.8}
                    disabled={isCreatingConversation}
                    onPress={async () => {
                      setIsCreatingConversation(true);
                      try {
                        const response = await api.createConversation([candidate.id]);
                        const conversationId = (response.data as any)?.id;
                        await refetch();
                        if (conversationId) {
                          navigation.navigate('Conversation', { conversationId });
                        }
                        setQuery('');
                        setResults([]);
                      } finally {
                        setIsCreatingConversation(false);
                      }
                    }}
                  >
                    <Text style={styles.resultName}>
                      {candidate.firstName} {candidate.lastName}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {candidate.email} | {candidate.role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages"
              message="Search for a user and start a conversation"
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
  header: {
    padding: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  results: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  resultRow: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
});
