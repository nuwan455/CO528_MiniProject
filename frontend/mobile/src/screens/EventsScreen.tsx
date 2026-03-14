import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { api } from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/tokens';

type EventsScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Events'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
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
            : event,
        ),
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
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Department Events</Text>
            <Text style={styles.subtitle}>Explore upcoming activities or publish a new event.</Text>
            <Button title="Add Event" onPress={() => navigation.navigate('CreateEvent')} />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="calendar-outline"
              title="No events scheduled"
              message="Create one above or stay tuned for upcoming events"
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
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
});
