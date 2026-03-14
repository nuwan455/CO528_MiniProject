import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, TabParamList } from './types';
import { FeedScreen } from '../screens/FeedScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { ResearchListScreen } from '../screens/ResearchListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, spacing, typography } from '../theme/tokens';

const Tab = createBottomTabNavigator<TabParamList>();

const HeaderActions = ({
  onOpenMessages,
  onOpenNotifications,
}: {
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
}) => (
  <View style={styles.headerActions}>
    <TouchableOpacity style={styles.headerButton} onPress={onOpenMessages} activeOpacity={0.75}>
      <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textPrimary} />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.headerButton}
      onPress={onOpenNotifications}
      activeOpacity={0.75}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => {
        const rootNavigation = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

        return {
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: typography.fontSize.xs,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
          },
          headerTintColor: colors.textPrimary,
          headerRight: () => (
            <HeaderActions
              onOpenMessages={() => rootNavigation?.navigate('Messages')}
              onOpenNotifications={() => rootNavigation?.navigate('Notifications')}
            />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Research"
        component={ResearchListScreen}
        options={{
          title: 'Research',
          tabBarIcon: ({ color, size }) => <Ionicons name="flask" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
