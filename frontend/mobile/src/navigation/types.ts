import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  PostDetail: { postId: string };
  JobDetail: { jobId: string; focusApplications?: boolean };
  EventDetail: { eventId: string };
  CreateJob: { jobId?: string } | undefined;
  CreateEvent: { eventId?: string } | undefined;
  Messages: undefined;
  Conversation: { conversationId: string };
  CreatePost: undefined;
  EditProfile: undefined;
  UserProfile: { userId: string };
  MyApplications: undefined;
  ResearchList: undefined;
  ResearchDetail: { projectId: string };
  Notifications: undefined;
  Analytics: undefined;
  Moderation: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Jobs: undefined;
  Events: undefined;
  Research: undefined;
  Profile: undefined;
};
