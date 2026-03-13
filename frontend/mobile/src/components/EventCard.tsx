import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { colors, spacing, radius, typography } from '../theme/tokens';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRsvp: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, onRsvp }) => {
  const startDate = new Date(event.startDate);
  const monthDay = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {event.imageUrl && <Image source={{ uri: event.imageUrl }} style={styles.image} />}

      <View style={styles.content}>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{monthDay}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.attendees}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.attendeesText}>{event.attendeesCount} attending</Text>
            </View>

            <TouchableOpacity
              style={[styles.rsvpButton, event.isRsvped && styles.rsvpedButton]}
              onPress={(e) => {
                e.stopPropagation();
                onRsvp();
              }}
            >
              <Text style={[styles.rsvpText, event.isRsvped && styles.rsvpedText]}>
                {event.isRsvped ? 'RSVPed' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceElevated,
  },
  content: {
    padding: spacing.base,
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateBox: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.sm,
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  meta: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attendeesText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  rsvpButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
  },
  rsvpedButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  rsvpText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  rsvpedText: {
    color: colors.accent,
  },
});
