import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing } from '../theme/tokens';

type EventsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Events'>;
};

export const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.getEvents();
      return response.data as Event[];
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return api.rsvpEvent(eventId);
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previousEvents = queryClient.getQueryData(['events']);

      queryClient.setQueryData(['events'], (old: Event[] | undefined) =>
        old?.map((event) =>
          event.id === eventId
            ? {
                ...event,
                isRsvped: !event.isRsvped,
                attendeesCount: event.isRsvped ? event.attendeesCount - 1 : event.attendeesCount + 1,
              }
            : event
        )
      );

      return { previousEvents };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['events'], context?.previousEvents);
    },
  });

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      onRsvp={() => rsvpMutation.mutate(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="calendar-outline"
              title="No events scheduled"
              message="Stay tuned for upcoming events"
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
  list: {
    padding: spacing.base,
  },
});
