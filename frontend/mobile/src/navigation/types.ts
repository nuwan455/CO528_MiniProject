export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  PostDetail: { postId: string };
  JobDetail: { jobId: string };
  EventDetail: { eventId: string };
  CreateJob: undefined;
  CreateEvent: undefined;
  Conversation: { conversationId: string };
  CreatePost: undefined;
  EditProfile: undefined;
  UserProfile: { userId: string };
  MyApplications: undefined;
  ResearchList: undefined;
  ResearchDetail: { projectId: string };
  Notifications: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Jobs: undefined;
  Events: undefined;
  Messages: undefined;
  Profile: undefined;
};
