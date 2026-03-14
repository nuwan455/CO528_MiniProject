import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Event } from '../types';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/tokens';
import { formatDistanceToNow } from '../utils/date';

type EventDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'EventDetail'>;
  navigation: NativeStackNavigationProp<MainStackParamList, 'EventDetail'>;
};

export const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [isRsvped, setIsRsvped] = useState(false);
  const canManageEvent = user?.role === 'ADMIN';

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.getEvent(eventId);
      return response.data as Event;
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => api.rsvpEvent(eventId),
    onSuccess: async () => {
      setIsRsvped(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert('RSVP saved', 'Your RSVP has been recorded.');
    },
    onError: () => {
      Alert.alert('RSVP failed', 'Unable to save your RSVP right now.');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => api.deleteEvent(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      Alert.alert('Event deleted', 'The event has been removed.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Delete failed', 'Unable to delete this event right now.');
    },
  });

  const confirmDeleteEvent = () => {
    Alert.alert(
      'Delete event?',
      'This will permanently remove the event and its RSVP activity from the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEventMutation.mutate(),
        },
      ],
    );
  };

  if (!event) {
    return null;
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const rsvpLabel =
    user?.role === 'ADMIN'
      ? isRsvped || event.isRsvped
        ? 'RSVP Updated'
        : 'Admin RSVP Optional'
      : isRsvped || event.isRsvped
        ? 'RSVP Updated'
        : 'RSVP Now';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={styles.image} /> : null}

      <View style={styles.section}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.organizer}>
          Hosted by {event.organizer.firstName} {event.organizer.lastName}
        </Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          <Text style={styles.metaText}>{startDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.metaText}>
            {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} -{' '}
            {endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={18} color={colors.accent} />
          <Text style={styles.metaText}>{event.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={18} color={colors.accent} />
          <Text style={styles.metaText}>{event.attendeesCount} responses</Text>
        </View>
        <Text style={styles.metaHint}>
          Created {formatDistanceToNow(event.createdAt || event.startDate)}
        </Text>
      </View>

      {canManageEvent ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Event</Text>
          <Text style={styles.sectionDescription}>
            Update the event details or remove it from the department schedule.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Edit Event"
              onPress={() => navigation.navigate('CreateEvent', { eventId })}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title={deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
              onPress={confirmDeleteEvent}
              loading={deleteEventMutation.isPending}
              disabled={deleteEventMutation.isPending}
              style={[styles.actionButton, styles.deleteButton]}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Button
          title={rsvpLabel}
          onPress={() => rsvpMutation.mutate()}
          loading={rsvpMutation.isPending}
          variant={isRsvped || event.isRsvped ? 'secondary' : 'primary'}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceElevated,
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  organizer: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginTop: spacing.base,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.base,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  metaHint: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
});
