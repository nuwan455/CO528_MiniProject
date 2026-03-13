export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface WebUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  department?: string | null;
  batchYear?: number | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  skills?: string[];
  headline?: string | null;
}

export interface PostRecord {
  id: string;
  content: string;
  createdAt: string;
  mediaUrl?: string | null;
  visibility: 'PUBLIC' | 'DEPARTMENT_ONLY' | 'ALUMNI_ONLY';
  author: Pick<WebUser, 'id' | 'name' | 'role' | 'headline'>;
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
  description: string;
  deadline: string;
  createdAt: string;
  postedBy: Pick<WebUser, 'id' | 'name' | 'role'>;
  _count: {
    applications: number;
  };
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  bannerUrl?: string | null;
  createdBy: Pick<WebUser, 'id' | 'name' | 'role'>;
  _count: {
    rsvps: number;
  };
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationParticipantRecord {
  id: string;
  user: Pick<WebUser, 'id' | 'name' | 'email' | 'role'>;
}

export interface MessageRecord {
  id: string;
  content: string;
  createdAt: string;
  sender: Pick<WebUser, 'id' | 'name' | 'role'>;
}

export interface ConversationRecord {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title?: string | null;
  participants: ConversationParticipantRecord[];
  messages?: MessageRecord[];
  _count: {
    messages: number;
  };
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AnalyticsOverview {
  activeUsers: number;
  posts: number;
  jobs: number;
  applications: number;
  eventRsvps: number;
  mostActiveModules: Array<{
    module: string;
    count: number;
  }>;
}

export interface ResearchProjectRecord {
  id: string;
  title: string;
  description: string;
  tags: string[];
  owner: Pick<WebUser, 'id' | 'name' | 'role'>;
  collaborators: Array<{
    id: string;
    roleInProject: string;
    user: Pick<WebUser, 'id' | 'name' | 'email' | 'role'>;
  }>;
}
