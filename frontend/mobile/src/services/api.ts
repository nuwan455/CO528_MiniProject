import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ApiResponse, Comment, Conversation, Event, Job, JobApplication, Message, Notification, Post, ResearchProject, User } from '../types';

const resolveApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    if (Platform.OS === 'android') {
      return envUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
    return envUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }

  return 'http://localhost:4000/api/v1';
};

const API_BASE_URL = resolveApiBaseUrl();

export const resolveAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) {
    return undefined;
  }

  if (/^(https?:\/\/|blob:|data:)/i.test(assetUrl)) {
    return assetUrl;
  }

  return new URL(assetUrl, API_BASE_URL).toString();
};

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || '',
  };
};

const normalizeUser = (user: any): User => {
  const safeName = user.name || 'Department User';
  const { firstName, lastName } = splitName(safeName);
  return {
    id: user.id,
    email: user.email || '',
    name: safeName,
    firstName,
    lastName,
    role: user.role,
    bio: user.bio,
    avatar: resolveAssetUrl(user.profileImageUrl),
    department: user.department,
    graduationYear: user.batchYear,
    skills: user.skills || [],
    headline: user.headline,
    createdAt: user.createdAt,
  };
};

const normalizePost = (post: any): Post => ({
  id: post.id,
  content: post.content,
  author: normalizeUser(post.author),
  mediaUrl: resolveAssetUrl(post.mediaUrl),
  mediaType: post.mediaType,
  images: post.mediaUrl ? [resolveAssetUrl(post.mediaUrl) as string] : [],
  likesCount: post._count?.likes ?? 0,
  commentsCount: post._count?.comments ?? 0,
  sharesCount: post._count?.shares ?? 0,
  isLiked: post.interactions?.isLiked ?? false,
  isShared: post.interactions?.isShared ?? false,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const normalizeJob = (job: any): Job => ({
  id: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  type: job.type.toLowerCase().replace('_', '-') as Job['type'],
  description: job.description,
  requirements: [],
  postedBy: normalizeUser(job.postedBy),
  applicationDeadline: job.deadline,
  createdAt: job.createdAt,
});

const normalizeEvent = (event: any): Event => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  startDate: event.startTime,
  endDate: event.endTime,
  organizer: normalizeUser(event.createdBy),
  attendeesCount: event._count?.rsvps ?? 0,
  isRsvped: false,
  imageUrl: event.bannerUrl,
  createdAt: event.createdAt,
});

const normalizeResearchProject = (project: any): ResearchProject => ({
  id: project.id,
  title: project.title,
  description: project.description,
  tags: project.tags || [],
  documentUrl: resolveAssetUrl(project.documentUrl),
  lead: normalizeUser(project.owner),
  collaborators:
    project.collaborators?.map((item: any) => ({
      id: item.id,
      roleInProject: item.roleInProject,
      user: normalizeUser(item.user),
    })) ?? [],
  createdAt: project.createdAt,
});

const normalizeMessage = (message: any): Message => ({
  id: message.id,
  content: message.content,
  sender: normalizeUser(message.sender),
  conversationId: message.conversationId,
  createdAt: message.createdAt,
});

const normalizeConversation = (conversation: any): Conversation => ({
  id: conversation.id,
  title: conversation.title,
  participants: conversation.participants.map((participant: any) => normalizeUser(participant.user)),
  lastMessage: conversation.messages?.length ? normalizeMessage(conversation.messages[conversation.messages.length - 1]) : undefined,
  updatedAt: conversation.updatedAt || new Date().toISOString(),
});

const unwrapApiData = <T>(payload: any): T | undefined => {
  if (!payload) return undefined;
  if (payload.data !== undefined) return payload.data as T;
  return payload as T;
};

export class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.client.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
                '/auth/refresh',
                { refreshToken },
              );

              const refreshPayload = unwrapApiData<{ tokens: { accessToken: string; refreshToken: string } }>(response.data.data);
              if (response.data.success && refreshPayload?.tokens) {
                const { accessToken, refreshToken: newRefreshToken } = refreshPayload.tokens;
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            await Promise.all([
              AsyncStorage.removeItem('accessToken'),
              AsyncStorage.removeItem('refreshToken'),
              AsyncStorage.removeItem('user'),
            ]);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<any>>('/auth/login', { email, password });
    const loginPayload = unwrapApiData<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(response.data.data);
    if (loginPayload?.user && loginPayload?.tokens) {
      return {
        ...response.data,
        data: {
          user: normalizeUser(loginPayload.user),
          accessToken: loginPayload.tokens.accessToken,
          refreshToken: loginPayload.tokens.refreshToken,
        },
      };
    }
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/auth/register', data);
    const registerPayload = unwrapApiData<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(response.data.data);
    if (registerPayload?.user && registerPayload?.tokens) {
      return {
        ...response.data,
        data: {
          user: normalizeUser(registerPayload.user),
          accessToken: registerPayload.tokens.accessToken,
          refreshToken: registerPayload.tokens.refreshToken,
        },
      };
    }
    return response.data;
  }

  async logout() {
    const response = await this.client.post<ApiResponse>('/auth/logout');
    return response.data;
  }

  async getMe() {
    const response = await this.client.get<ApiResponse<any>>('/auth/me');
    return {
      ...response.data,
      data: response.data.data ? normalizeUser(response.data.data) : undefined,
    };
  }

  async getUserProfile(userId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/users/${userId}`);
    return {
      ...response.data,
      data: response.data.data ? normalizeUser(response.data.data) : undefined,
    };
  }

  async updateProfile(data: any) {
    const response = await this.client.patch<ApiResponse<any>>('/users/me', data);
    return {
      ...response.data,
      data: response.data.data ? normalizeUser(response.data.data) : undefined,
    };
  }

  async searchUsers(query: string) {
    const response = await this.client.get<ApiResponse<any>>('/users/search', { params: { q: query } });
    return {
      ...response.data,
      data: response.data.data?.items?.map(normalizeUser) ?? [],
    };
  }

  async getPosts(page = 1, limit = 20) {
    const response = await this.client.get<ApiResponse<any>>('/posts', { params: { page, limit } });
    return {
      ...response.data,
      data: response.data.data?.items?.map(normalizePost) ?? [],
    };
  }

  async getPost(postId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/posts/${postId}`);
    return {
      ...response.data,
      data: response.data.data ? normalizePost(response.data.data) : undefined,
    };
  }

  async createPost(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/posts', data);
    return {
      ...response.data,
      data: response.data.data ? normalizePost(response.data.data) : undefined,
    };
  }

  async uploadMedia(file: { uri: string; name: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file as any);

    const response = await this.client.post<ApiResponse<{ mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' }>>(
      '/uploads/media',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  }

  async uploadDocument(file: { uri: string; name: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file as any);

    const response = await this.client.post<ApiResponse<{ documentUrl: string; fileName: string }>>(
      '/uploads/documents',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  }

  async likePost(postId: string) {
    const response = await this.client.post<ApiResponse>(`/posts/${postId}/like`);
    return response.data;
  }

  async unlikePost(postId: string) {
    const response = await this.client.delete<ApiResponse>(`/posts/${postId}/like`);
    return response.data;
  }

  async getComments(postId: string) {
    const response = await this.client.get<ApiResponse<any[]>>(`/posts/${postId}/comments`);
    return {
      ...response.data,
      data: (response.data.data || []).map(
        (comment): Comment => ({
          id: comment.id,
          content: comment.content,
          author: normalizeUser(comment.author),
          createdAt: comment.createdAt,
        }),
      ),
    };
  }

  async addComment(postId: string, content: string) {
    const response = await this.client.post<ApiResponse>(`/posts/${postId}/comments`, { content });
    return response.data;
  }

  async sharePost(postId: string) {
    const response = await this.client.post<ApiResponse>(`/posts/${postId}/share`);
    return response.data;
  }

  async getJobs(filters?: any) {
    const response = await this.client.get<ApiResponse<any>>('/jobs', { params: filters });
    return {
      ...response.data,
      data: response.data.data?.items?.map(normalizeJob) ?? [],
    };
  }

  async getJob(jobId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/jobs/${jobId}`);
    return {
      ...response.data,
      data: response.data.data ? normalizeJob(response.data.data) : undefined,
    };
  }

  async createJob(data: {
    title: string;
    company: string;
    location: string;
    type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
    description: string;
    deadline: string;
  }) {
    const response = await this.client.post<ApiResponse<any>>('/jobs', data);
    return {
      ...response.data,
      data: response.data.data ? normalizeJob(response.data.data) : undefined,
    };
  }

  async applyToJob(jobId: string, data: any) {
    const response = await this.client.post<ApiResponse>(`/jobs/${jobId}/apply`, data);
    return response.data;
  }

  async getMyApplications() {
    const response = await this.client.get<ApiResponse<any[]>>('/jobs/my/applications');
    return {
      ...response.data,
      data: (response.data.data || []).map(
        (application): JobApplication => ({
          id: application.id,
          jobId: application.jobId,
          job: normalizeJob(application.job),
          status: application.status.toLowerCase(),
          appliedAt: application.createdAt,
        }),
      ),
    };
  }

  async getEvents() {
    const response = await this.client.get<ApiResponse<any>>('/events');
    return {
      ...response.data,
      data: response.data.data?.items?.map(normalizeEvent) ?? [],
    };
  }

  async getEvent(eventId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/events/${eventId}`);
    return {
      ...response.data,
      data: response.data.data ? normalizeEvent(response.data.data) : undefined,
    };
  }

  async createEvent(data: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    bannerUrl?: string;
  }) {
    const response = await this.client.post<ApiResponse<any>>('/events', data);
    return {
      ...response.data,
      data: response.data.data ? normalizeEvent(response.data.data) : undefined,
    };
  }

  async rsvpEvent(eventId: string, status = 'GOING') {
    const response = await this.client.post<ApiResponse>(`/events/${eventId}/rsvp`, { status });
    return response.data;
  }

  async getResearchProjects() {
    const response = await this.client.get<ApiResponse<any>>('/research/projects');
    return {
      ...response.data,
      data: response.data.data?.items?.map(normalizeResearchProject) ?? [],
    };
  }

  async getResearchProject(projectId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/research/projects/${projectId}`);
    return {
      ...response.data,
      data: response.data.data ? normalizeResearchProject(response.data.data) : undefined,
    };
  }

  async createResearchProject(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/research/projects', data);
    return {
      ...response.data,
      data: response.data.data ? normalizeResearchProject(response.data.data) : undefined,
    };
  }

  async addResearchCollaborator(projectId: string, data: { userId: string; roleInProject: string }) {
    const response = await this.client.post<ApiResponse<any>>(`/research/projects/${projectId}/collaborators`, data);
    return response.data;
  }

  async getConversations() {
    const response = await this.client.get<ApiResponse<any[]>>('/messages/conversations');
    return {
      ...response.data,
      data: (response.data.data || []).map(normalizeConversation),
    };
  }

  async getConversation(conversationId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/messages/conversations/${conversationId}`);
    return {
      ...response.data,
      data: response.data.data
        ? {
            ...normalizeConversation(response.data.data),
            messages: response.data.data.messages?.map(normalizeMessage) ?? [],
          }
        : undefined,
    };
  }

  async getMessages(conversationId: string) {
    const response = await this.client.get<ApiResponse<any[]>>(`/messages/conversations/${conversationId}/messages`);
    return {
      ...response.data,
      data: (response.data.data || []).map(normalizeMessage),
    };
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await this.client.post<ApiResponse>(`/messages/conversations/${conversationId}/messages`, {
      content,
      messageType: 'TEXT',
    });
    return response.data;
  }

  async createConversation(participantIds: string[]) {
    const response = await this.client.post<ApiResponse>('/messages/conversations', {
      participantIds,
      type: 'DIRECT',
    });
    return response.data;
  }

  async getNotifications() {
    const response = await this.client.get<ApiResponse<any[]>>('/notifications');
    return {
      ...response.data,
      data: (response.data.data || []).map(
        (notification): Notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.body,
          isRead: notification.isRead,
          relatedId: notification.relatedEntityId,
          createdAt: notification.createdAt,
        }),
      ),
    };
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.client.patch<ApiResponse>(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.patch<ApiResponse>('/notifications/read-all');
    return response.data;
  }

  async getAnalyticsOverview() {
    const response = await this.client.get<ApiResponse>('/analytics/overview');
    return response.data;
  }
}

export const api = new ApiService();
