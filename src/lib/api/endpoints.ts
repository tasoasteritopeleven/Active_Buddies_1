/**
 * Typed endpoint helpers — one function per REST route.
 *
 * Each function is a thin wrapper around `http.*` that enforces the correct
 * path and return type.  Consume these from React components via hooks in
 * `src/lib/api/hooks.ts` (TanStack Query) or call directly for mutations.
 */

import { http } from "./client";
import type {
  AuthTokens,
  Challenge,
  Community,
  Connection,
  ConversationSummary,
  MatchSuggestion,
  Message,
  NotificationsPage,
  Paginated,
  PublicUser,
  UpdateUserInput,
} from "./types";

// ---- Auth -----------------------------------------------------------------

export const authApi = {
  register: (body: { email: string; password: string; firstName?: string; lastName?: string }) =>
    http.post<AuthTokens>("/auth/register", body, { skipAuth: true }),

  login: (body: { email: string; password: string }) =>
    http.post<AuthTokens>("/auth/login", body, { skipAuth: true }),

  logout: (refreshToken: string) =>
    http.post<void>("/auth/logout", { refreshToken }),

  logoutAll: () => http.post<void>("/auth/logout-all"),
};

// ---- Users ----------------------------------------------------------------

export const usersApi = {
  me: () => http.get<PublicUser>("/users/me"),
  updateMe: (body: UpdateUserInput) => http.put<PublicUser>("/users/me", body),
  getById: (id: string) => http.get<PublicUser>(`/users/${id}`),
  search: (q: string, limit = 20, offset = 0) =>
    http.get<Paginated<PublicUser>>("/users/search", { query: { q, limit, offset } }),
  discover: (filters: {
    limit?: number;
    offset?: number;
    fitnessLevel?: string;
    city?: string;
    goals?: string[];
  } = {}) =>
    http.get<Paginated<PublicUser>>("/users/discover", { query: filters }),
};

// ---- Matching -------------------------------------------------------------

export const matchingApi = {
  suggestions: (limit = 20, offset = 0) =>
    http.get<MatchSuggestion[]>("/matching/suggestions", { query: { limit, offset } }),
  sendRequest: (userId: string, message?: string) =>
    http.post<Connection>(`/matching/request/${userId}`, { message }),
  incoming: () => http.get<Connection[]>("/matching/requests/incoming"),
  outgoing: () => http.get<Connection[]>("/matching/requests/outgoing"),
  accept: (requestId: string) =>
    http.post<Connection>(`/matching/requests/${requestId}/accept`),
  decline: (requestId: string) =>
    http.post<void>(`/matching/requests/${requestId}/decline`),
  connections: () => http.get<Connection[]>("/matching/connections"),
  removeConnection: (userId: string) =>
    http.delete<void>(`/matching/connections/${userId}`),
};

// ---- Chat -----------------------------------------------------------------

export const chatApi = {
  listConversations: () => http.get<ConversationSummary[]>("/chat/conversations"),
  createConversation: (body: { participantIds: string[]; type?: "DIRECT" | "GROUP"; name?: string }) =>
    http.post<ConversationSummary>("/chat/conversations", body),
  listMessages: (conversationId: string, limit = 50, offset = 0) =>
    http.get<Message[]>(`/chat/conversations/${conversationId}/messages`, {
      query: { limit, offset },
    }),
  sendMessage: (conversationId: string, body: { content: string; type?: "TEXT" | "IMAGE" }) =>
    http.post<Message>(`/chat/conversations/${conversationId}/messages`, body),
  markRead: (conversationId: string) =>
    http.post<void>(`/chat/conversations/${conversationId}/read`),
};

// ---- Challenges -----------------------------------------------------------

export const challengesApi = {
  list: (params: { status?: "active" | "completed" | "all"; limit?: number; offset?: number } = {}) =>
    http.get<Paginated<Challenge>>("/challenges", { query: params }),
  create: (body: {
    title: string;
    description?: string;
    challengeType?: Challenge["challengeType"];
    startDate: string;
    endDate: string;
    targetValue?: number;
  }) => http.post<Challenge>("/challenges", body),
  getById: (id: string) => http.get<Challenge>(`/challenges/${id}`),
  join: (id: string) => http.post<unknown>(`/challenges/${id}/join`),
  leave: (id: string) => http.post<void>(`/challenges/${id}/leave`),
  updateProgress: (id: string, progress: number) =>
    http.post<unknown>(`/challenges/${id}/progress`, { progress }),
  leaderboard: (id: string) => http.get<unknown[]>(`/challenges/${id}/leaderboard`),
};

// ---- Communities ----------------------------------------------------------

export const communitiesApi = {
  list: (params: { search?: string; limit?: number; offset?: number } = {}) =>
    http.get<Paginated<Community>>("/communities", { query: params }),
  create: (body: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    bannerUrl?: string;
    isPublic?: boolean;
  }) => http.post<Community>("/communities", body),
  getById: (id: string) => http.get<Community>(`/communities/${id}`),
  join: (id: string) => http.post<unknown>(`/communities/${id}/join`),
  leave: (id: string) => http.post<void>(`/communities/${id}/leave`),
  members: (id: string) => http.get<unknown[]>(`/communities/${id}/members`),
};

// ---- Notifications --------------------------------------------------------

export const notificationsApi = {
  list: (params: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) =>
    http.get<NotificationsPage>("/notifications", { query: params }),
  markRead: (id: string) => http.post<void>(`/notifications/${id}/read`),
  markAllRead: () => http.post<{ updated: number }>("/notifications/read-all"),
};

// ---- Health ---------------------------------------------------------------

export const healthApi = {
  live: () => http.get<{ status: string; timestamp: string }>("/health"),
  ready: () =>
    http.get<{
      status: "ok" | "degraded";
      db: "up" | "down";
      redis: "up" | "down";
      timestamp: string;
    }>("/health/ready"),
};

export const api = {
  auth: authApi,
  users: usersApi,
  matching: matchingApi,
  chat: chatApi,
  challenges: challengesApi,
  communities: communitiesApi,
  notifications: notificationsApi,
  health: healthApi,
};
