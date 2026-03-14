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
  updatedAt?: string;
  mediaUrl?: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  visibility: 'PUBLIC' | 'DEPARTMENT_ONLY' | 'ALUMNI_ONLY';
  author: Pick<WebUser, 'id' | 'name' | 'role' | 'headline' | 'profileImageUrl'>;
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
  interactions: {
    isLiked: boolean;
    isShared: boolean;
  };
}

export function normalizePostRecord(post: any): PostRecord {
  return {
    id: post?.id ?? "",
    content: post?.content ?? "",
    createdAt: post?.createdAt ?? new Date().toISOString(),
    updatedAt: post?.updatedAt,
    mediaUrl: post?.mediaUrl ?? null,
    mediaType: post?.mediaType ?? "NONE",
    visibility: post?.visibility ?? "PUBLIC",
    author: {
      id: post?.author?.id ?? "",
      name: post?.author?.name ?? "Unknown User",
      role: post?.author?.role ?? "STUDENT",
      headline: post?.author?.headline ?? null,
      profileImageUrl: post?.author?.profileImageUrl ?? null,
    },
    _count: {
      likes: post?._count?.likes ?? 0,
      comments: post?._count?.comments ?? 0,
      shares: post?._count?.shares ?? 0,
    },
    interactions: {
      isLiked: post?.interactions?.isLiked ?? false,
      isShared: post?.interactions?.isShared ?? false,
    },
  };
}

export interface PostCommentRecord {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<WebUser, 'id' | 'name' | 'role' | 'headline' | 'profileImageUrl'>;
}

export interface UploadedMediaRecord {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

export interface UploadedDocumentRecord {
  documentUrl: string;
  fileName: string;
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

export interface JobApplicationRecord {
  id: string;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  status: "APPLIED" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  applicant: Pick<WebUser, "id" | "name" | "email" | "role" | "headline" | "profileImageUrl"> & {
    department?: string | null;
    batchYear?: number | null;
  };
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ALUMNI" | "ADMIN";
  department?: string | null;
  batchYear?: number | null;
  createdAt: string;
}

export interface AdminReportRecord {
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
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
}

export interface ConversationParticipantRecord {
  id: string;
  user: Pick<WebUser, 'id' | 'name' | 'email' | 'role' | 'headline' | 'profileImageUrl'>;
}

export interface MessageRecord {
  id: string;
  content: string;
  createdAt: string;
  sender: Pick<WebUser, 'id' | 'name' | 'role' | 'profileImageUrl'>;
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
  documentUrl?: string | null;
  owner: Pick<WebUser, 'id' | 'name' | 'role' | 'headline' | 'profileImageUrl'>;
  collaborators: Array<{
    id: string;
    roleInProject: string;
    user: Pick<WebUser, 'id' | 'name' | 'email' | 'role' | 'headline' | 'profileImageUrl'>;
  }>;
}
