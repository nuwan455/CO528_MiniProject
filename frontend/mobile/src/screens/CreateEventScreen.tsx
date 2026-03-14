import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type CreateEventScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreateEvent'>;
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

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [eventForm, setEventForm] = useState<EventFormState>(initialEventForm);

  const createEventMutation = useMutation({
    mutationFn: async (payload: EventFormState) =>
      api.createEvent({
        title: payload.title.trim(),
        description: payload.description.trim(),
        location: payload.location.trim(),
        startTime: new Date(payload.startTime.trim()).toISOString(),
        endTime: new Date(payload.endTime.trim()).toISOString(),
        bannerUrl: payload.bannerUrl.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Event published', 'Your event is now visible in the mobile app.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Event creation failed', 'Unable to publish this event right now.');
    },
  });

  const submitEvent = () => {
    const startTime = eventForm.startTime.trim();
    const endTime = eventForm.endTime.trim();
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.location.trim() || !startTime || !endTime) {
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

    createEventMutation.mutate(eventForm);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create New Event</Text>
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
        <Button
          title={createEventMutation.isPending ? 'Publishing...' : 'Publish Event'}
          onPress={submitEvent}
          loading={createEventMutation.isPending}
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
});
