import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ConversationScreen } from '../screens/ConversationScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { colors, typography } from '../theme/tokens';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: typography.fontSize.lg,
          fontWeight: '600',
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
};
