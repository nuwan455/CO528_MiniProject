import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { CreateJobScreen } from '../screens/CreateJobScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ConversationScreen } from '../screens/ConversationScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ResearchListScreen } from '../screens/ResearchListScreen';
import { ResearchDetailScreen } from '../screens/ResearchDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ModerationScreen } from '../screens/ModerationScreen';
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
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen
        name="CreateJob"
        component={CreateJobScreen}
        options={({ route }) => ({ title: route.params?.jobId ? 'Edit Job' : 'Create Job' })}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={({ route }) => ({ title: route.params?.eventId ? 'Edit Event' : 'Create Event' })}
      />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ title: 'My Applications' }} />
      <Stack.Screen name="ResearchList" component={ResearchListScreen} options={{ title: 'Research Projects' }} />
      <Stack.Screen name="ResearchDetail" component={ResearchDetailScreen} options={{ title: 'Project Details' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="Moderation" component={ModerationScreen} options={{ title: 'Moderation' }} />
    </Stack.Navigator>
  );
};
