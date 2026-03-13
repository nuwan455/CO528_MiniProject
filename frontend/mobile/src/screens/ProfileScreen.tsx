import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { colors, spacing, radius, typography } from '../theme/tokens';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Profile'>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  const menuItems = [
    { icon: 'briefcase-outline', label: 'My Applications', screen: 'MyApplications' as const },
    { icon: 'flask-outline', label: 'Research Projects', screen: 'ResearchList' as const },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' as const },
    { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' as const },
  ];

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
          {user.department && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.department}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

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
  menu: {
    marginTop: spacing.base,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: colors.surface,
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
