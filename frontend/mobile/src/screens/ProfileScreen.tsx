import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { colors, spacing, radius, typography } from '../theme/tokens';

type ProfileScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Profile'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  const menuItems: MenuItem[] = [
    ...(user.role !== 'ADMIN'
      ? [
          {
            icon: 'briefcase-outline' as const,
            label: 'My Applications',
            onPress: () => navigation.navigate('MyApplications'),
          },
        ]
      : []),
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
  ];

  const adminItems: MenuItem[] =
    user.role === 'ADMIN'
      ? [
          {
            icon: 'stats-chart-outline',
            label: 'Analytics',
            onPress: () => navigation.navigate('Analytics'),
          },
          {
            icon: 'shield-checkmark-outline',
            label: 'Moderation',
            onPress: () => navigation.navigate('Moderation'),
          },
        ]
      : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user.avatar} name={`${user.firstName} ${user.lastName}`} size={80} />
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role}</Text>
          </View>
          {user.department ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.department}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {adminItems.length ? (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <View style={styles.menu}>
            {adminItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={20} color={colors.accent} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title="Log Out" onPress={handleLogout} variant="secondary" />
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
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    marginTop: spacing.base,
  },
  email: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing.xs,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuSection: {
    marginTop: spacing.base,
  },
  sectionTitle: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  menu: {
    backgroundColor: colors.surface,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  actions: {
    padding: spacing.base,
    marginTop: spacing.xl,
  },
});
