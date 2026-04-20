/**
 * TanStack Query hooks for every backend domain.
 *
 * Query key convention:
 *    qk.<domain>.<operation>(args) → readable, stable, invalidation-friendly.
 *
 * Mutations automatically invalidate the relevant list queries so the UI
 * refreshes without extra plumbing at the call site.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  challengesApi,
  chatApi,
  communitiesApi,
  matchingApi,
  notificationsApi,
  usersApi,
} from "./endpoints";
import type {
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

// ---- Query keys -----------------------------------------------------------

export const qk = {
  users: {
    me: ["users", "me"] as const,
    byId: (id: string) => ["users", "byId", id] as const,
    search: (q: string, limit: number, offset: number) =>
      ["users", "search", q, limit, offset] as const,
    discover: (filters: Record<string, unknown>) => ["users", "discover", filters] as const,
  },
  matching: {
    suggestions: (limit: number, offset: number) =>
      ["matching", "suggestions", limit, offset] as const,
    incoming: ["matching", "incoming"] as const,
    outgoing: ["matching", "outgoing"] as const,
    connections: ["matching", "connections"] as const,
  },
  chat: {
    conversations: ["chat", "conversations"] as const,
    messages: (conversationId: string) => ["chat", "messages", conversationId] as const,
  },
  challenges: {
    list: (filters: Record<string, unknown>) => ["challenges", "list", filters] as const,
    byId: (id: string) => ["challenges", "byId", id] as const,
    leaderboard: (id: string) => ["challenges", "leaderboard", id] as const,
  },
  communities: {
    list: (filters: Record<string, unknown>) => ["communities", "list", filters] as const,
    byId: (id: string) => ["communities", "byId", id] as const,
    members: (id: string) => ["communities", "members", id] as const,
  },
  notifications: {
    list: (filters: Record<string, unknown>) => ["notifications", "list", filters] as const,
  },
} as const;

// ---- Users ----------------------------------------------------------------

export function useMe(options?: Partial<UseQueryOptions<PublicUser>>) {
  return useQuery<PublicUser>({
    queryKey: qk.users.me,
    queryFn: () => usersApi.me(),
    ...options,
  });
}

export function useUser(id: string | undefined) {
  return useQuery<PublicUser>({
    queryKey: qk.users.byId(id ?? ""),
    queryFn: () => usersApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useDiscoverUsers(filters: {
  limit?: number;
  offset?: number;
  fitnessLevel?: string;
  city?: string;
  goals?: string[];
} = {}) {
  return useQuery<Paginated<PublicUser>>({
    queryKey: qk.users.discover(filters),
    queryFn: () => usersApi.discover(filters),
  });
}

export function useSearchUsers(q: string, limit = 20, offset = 0) {
  return useQuery<Paginated<PublicUser>>({
    queryKey: qk.users.search(q, limit, offset),
    queryFn: () => usersApi.search(q, limit, offset),
    enabled: q.trim().length > 0,
  });
}

export function useUpdateMe(options?: UseMutationOptions<PublicUser, Error, UpdateUserInput>) {
  const qc = useQueryClient();
  return useMutation<PublicUser, Error, UpdateUserInput>({
    mutationFn: (input) => usersApi.updateMe(input),
    onSuccess: (user) => {
      qc.setQueryData(qk.users.me, user);
    },
    ...options,
  });
}

// ---- Matching -------------------------------------------------------------

export function useMatchSuggestions(limit = 20, offset = 0) {
  return useQuery<MatchSuggestion[]>({
    queryKey: qk.matching.suggestions(limit, offset),
    queryFn: () => matchingApi.suggestions(limit, offset),
  });
}

export function useIncomingRequests() {
  return useQuery<Connection[]>({
    queryKey: qk.matching.incoming,
    queryFn: () => matchingApi.incoming(),
  });
}

export function useOutgoingRequests() {
  return useQuery<Connection[]>({
    queryKey: qk.matching.outgoing,
    queryFn: () => matchingApi.outgoing(),
  });
}

export function useConnections() {
  return useQuery<Connection[]>({
    queryKey: qk.matching.connections,
    queryFn: () => matchingApi.connections(),
  });
}

export function useSendConnectionRequest() {
  const qc = useQueryClient();
  return useMutation<Connection, Error, { userId: string; message?: string }>({
    mutationFn: ({ userId, message }) => matchingApi.sendRequest(userId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matching.outgoing });
      qc.invalidateQueries({ queryKey: ["matching", "suggestions"] });
    },
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation<Connection, Error, string>({
    mutationFn: (requestId) => matchingApi.accept(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matching.incoming });
      qc.invalidateQueries({ queryKey: qk.matching.connections });
    },
  });
}

export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (requestId) => matchingApi.decline(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matching.incoming });
    },
  });
}

export function useRemoveConnection() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (userId) => matchingApi.removeConnection(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matching.connections });
    },
  });
}

// ---- Chat -----------------------------------------------------------------

export function useConversations() {
  return useQuery<ConversationSummary[]>({
    queryKey: qk.chat.conversations,
    queryFn: () => chatApi.listConversations(),
  });
}

export function useMessages(conversationId: string | undefined, limit = 50, offset = 0) {
  return useQuery<Message[]>({
    queryKey: qk.chat.messages(conversationId ?? ""),
    queryFn: () => chatApi.listMessages(conversationId as string, limit, offset),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation<Message, Error, { content: string; type?: "TEXT" | "IMAGE" }>({
    mutationFn: (body) => chatApi.sendMessage(conversationId, body),
    onSuccess: (message) => {
      qc.setQueryData<Message[]>(qk.chat.messages(conversationId), (prev) =>
        prev ? [...prev, message] : [message],
      );
      qc.invalidateQueries({ queryKey: qk.chat.conversations });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => chatApi.markRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chat.conversations });
    },
  });
}

// ---- Challenges -----------------------------------------------------------

export function useChallenges(filters: { status?: "active" | "completed" | "all"; limit?: number; offset?: number } = {}) {
  return useQuery<Paginated<Challenge>>({
    queryKey: qk.challenges.list(filters),
    queryFn: () => challengesApi.list(filters),
  });
}

export function useChallenge(id: string | undefined) {
  return useQuery<Challenge>({
    queryKey: qk.challenges.byId(id ?? ""),
    queryFn: () => challengesApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => challengesApi.join(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: qk.challenges.byId(id) });
    },
  });
}

export function useLeaveChallenge() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => challengesApi.leave(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: qk.challenges.byId(id) });
    },
  });
}

// ---- Communities ----------------------------------------------------------

export function useCommunities(filters: { search?: string; limit?: number; offset?: number } = {}) {
  return useQuery<Paginated<Community>>({
    queryKey: qk.communities.list(filters),
    queryFn: () => communitiesApi.list(filters),
  });
}

export function useCommunity(id: string | undefined) {
  return useQuery<Community>({
    queryKey: qk.communities.byId(id ?? ""),
    queryFn: () => communitiesApi.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useJoinCommunity() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => communitiesApi.join(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: qk.communities.byId(id) });
    },
  });
}

export function useLeaveCommunity() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => communitiesApi.leave(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: qk.communities.byId(id) });
    },
  });
}

// ---- Notifications --------------------------------------------------------

export function useNotifications(filters: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) {
  return useQuery<NotificationsPage>({
    queryKey: qk.notifications.list(filters),
    queryFn: () => notificationsApi.list(filters),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<{ updated: number }, Error, void>({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
