import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Conversation } from '../types';
import { ConversationItem } from '../components/ConversationItem';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing } from '../theme/tokens';

type MessagesScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Messages'>;
};

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      return response.data as Conversation[];
    },
  });

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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages"
              message="Start a conversation with someone"
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
});
