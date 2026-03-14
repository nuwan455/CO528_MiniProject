export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  bio?: string;
  avatar?: string;
  department?: string;
  graduationYear?: number;
  skills?: string[];
  headline?: string;
  createdAt?: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  images?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isShared?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  description: string;
  requirements?: string[];
  salary?: string;
  postedBy: User;
  applicationsCount?: number;
  applicationDeadline?: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  job?: Job;
  jobId?: string;
  status: 'applied' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: string;
  resumeUrl?: string;
  coverLetter?: string;
  applicant?: User;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  organizer: User;
  attendeesCount: number;
  isRsvped: boolean;
  imageUrl?: string;
  createdAt?: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  documentUrl?: string;
  lead: User;
  collaborators: Array<{
    id: string;
    roleInProject: string;
    user: User;
  }>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  conversationId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: 'CONVERSATION' | 'JOB' | 'RESEARCH_PROJECT' | 'EVENT' | string;
  relatedUser?: User;
  relatedId?: string;
  createdAt: string;
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

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  department?: string;
  batchYear?: number;
  createdAt: string;
}

export interface AdminReport {
  users: number;
  roleBreakdown: {
    students: number;
    alumni: number;
    admins: number;
  };
  posts: number;
  jobs: number;
  events: number;
  flaggedCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
