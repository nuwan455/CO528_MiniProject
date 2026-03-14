import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Event } from '../types';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type CreateEventScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreateEvent'>;
  route: RouteProp<MainStackParamList, 'CreateEvent'>;
};

type EventFormState = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  bannerUrl: string;
};

const initialEventForm: EventFormState = {
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  bannerUrl: '',
};

const toLocalDateTimeValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toEventForm = (event: Event): EventFormState => ({
  title: event.title,
  description: event.description,
  location: event.location,
  startTime: toLocalDateTimeValue(event.startDate),
  endTime: toLocalDateTimeValue(event.endDate),
  bannerUrl: event.imageUrl ?? '',
});

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation, route }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const editingEventId = route.params?.eventId;
  const isEditing = Boolean(editingEventId);
  const [eventForm, setEventForm] = useState<EventFormState>(initialEventForm);
  const canCreateEvents = user?.role === 'ADMIN';

  const { data: existingEvent, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', editingEventId],
    enabled: isEditing,
    queryFn: async () => {
      const response = await api.getEvent(editingEventId as string);
      return response.data as Event;
    },
  });

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Event' : 'Create Event' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (!existingEvent) {
      return;
    }

    setEventForm(toEventForm(existingEvent));
  }, [existingEvent]);

  const saveEventMutation = useMutation({
    mutationFn: async (payload: EventFormState) => {
      const normalizedPayload = {
        title: payload.title.trim(),
        description: payload.description.trim(),
        location: payload.location.trim(),
        startTime: new Date(payload.startTime.trim()).toISOString(),
        endTime: new Date(payload.endTime.trim()).toISOString(),
        bannerUrl: payload.bannerUrl.trim() || undefined,
      };

      if (isEditing && editingEventId) {
        return api.updateEvent(editingEventId, normalizedPayload);
      }

      return api.createEvent(normalizedPayload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['event', editingEventId] }),
      ]);
      Alert.alert(
        isEditing ? 'Event updated' : 'Event published',
        isEditing ? 'Your event changes are now live.' : 'Your event is now visible in the mobile app.',
      );
      navigation.goBack();
    },
    onError: () => {
      Alert.alert(
        isEditing ? 'Event update failed' : 'Event creation failed',
        isEditing ? 'Unable to update this event right now.' : 'Unable to publish this event right now.',
      );
    },
  });

  const submitEvent = () => {
    const startTime = eventForm.startTime.trim();
    const endTime = eventForm.endTime.trim();
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    if (
      !eventForm.title.trim() ||
      !eventForm.description.trim() ||
      !eventForm.location.trim() ||
      !startTime ||
      !endTime
    ) {
      Alert.alert('Missing details', 'Please complete all event fields before publishing.');
      return;
    }

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      Alert.alert('Invalid date', 'Use a valid date like 2026-04-30T09:00 for start and end time.');
      return;
    }

    if (parsedEnd <= parsedStart) {
      Alert.alert('Invalid schedule', 'The event end time must be after the start time.');
      return;
    }

    saveEventMutation.mutate(eventForm);
  };

  if (!canCreateEvents) {
    return (
      <View style={styles.guard}>
        <Text style={styles.guardTitle}>Event publishing unavailable</Text>
        <Text style={styles.guardText}>Only admins can create events from mobile.</Text>
      </View>
    );
  }

  if (isEditing && isLoadingEvent && !existingEvent) {
    return (
      <View style={styles.guard}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.guardText}>Loading the event details...</Text>
      </View>
    );
  }

  if (isEditing && !isLoadingEvent && !existingEvent) {
    return (
      <View style={styles.guard}>
        <Text style={styles.guardTitle}>Event not found</Text>
        <Text style={styles.guardText}>This event could not be loaded for editing.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isEditing ? 'Edit Department Event' : 'Create Department Event'}
        </Text>
        <TextInput
          label="Event title"
          value={eventForm.title}
          onChangeText={(value) => setEventForm((current) => ({ ...current, title: value }))}
          placeholder="AI Research Showcase"
        />
        <TextInput
          label="Location"
          value={eventForm.location}
          onChangeText={(value) => setEventForm((current) => ({ ...current, location: value }))}
          placeholder="Main Auditorium"
        />
        <TextInput
          label="Start time"
          value={eventForm.startTime}
          onChangeText={(value) => setEventForm((current) => ({ ...current, startTime: value }))}
          placeholder="2026-04-30T09:00"
          autoCapitalize="none"
        />
        <TextInput
          label="End time"
          value={eventForm.endTime}
          onChangeText={(value) => setEventForm((current) => ({ ...current, endTime: value }))}
          placeholder="2026-04-30T12:00"
          autoCapitalize="none"
        />
        <TextInput
          label="Banner image URL"
          value={eventForm.bannerUrl}
          onChangeText={(value) => setEventForm((current) => ({ ...current, bannerUrl: value }))}
          placeholder="https://example.com/banner.jpg"
          autoCapitalize="none"
        />
        <TextInput
          label="Description"
          value={eventForm.description}
          onChangeText={(value) => setEventForm((current) => ({ ...current, description: value }))}
          placeholder="Share the agenda, audience, and what attendees should expect."
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
        <View style={styles.actions}>
          {isEditing ? (
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : null}
          <Button
            title={
              saveEventMutation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Publishing...'
                : isEditing
                  ? 'Save Changes'
                  : 'Publish Event'
            }
            onPress={submitEvent}
            loading={saveEventMutation.isPending}
            style={styles.actionButton}
          />
        </View>
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
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  guard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  guardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  guardText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
});
