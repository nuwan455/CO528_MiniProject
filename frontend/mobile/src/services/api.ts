import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, Comment, Conversation, Event, Job, JobApplication, Message, Notification, Post, ResearchProject, User } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:4000/api/v1';

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
    avatar: user.profileImageUrl,
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
  images: post.mediaUrl ? [post.mediaUrl] : [],
  likesCount: post._count?.likes ?? 0,
  commentsCount: post._count?.comments ?? 0,
  sharesCount: post._count?.shares ?? 0,
  isLiked: false,
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
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
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

  async rsvpEvent(eventId: string, status = 'GOING') {
    const response = await this.client.post<ApiResponse>(`/events/${eventId}/rsvp`, { status });
    return response.data;
  }

  async getResearchProjects() {
    const response = await this.client.get<ApiResponse<any>>('/research/projects');
    return {
      ...response.data,
      data:
        response.data.data?.items?.map(
          (project): ResearchProject => ({
            id: project.id,
            title: project.title,
            description: project.description,
            lead: normalizeUser(project.owner),
            collaborators: project.collaborators?.map((item: any) => normalizeUser(item.user)) ?? [],
            createdAt: project.createdAt,
          }),
        ) ?? [],
    };
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
