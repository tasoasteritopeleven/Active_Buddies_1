/**
 * Shared type definitions mirroring the backend DTOs / Prisma models.
 * Keep this file in sync with `backend/src/**` and `backend/prisma/schema.prisma`.
 */

export type UserRole = "USER" | "MODERATOR" | "ADMIN";
export type ConnectionStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
export type ConversationType = "DIRECT" | "GROUP";
export type MessageType = "TEXT" | "IMAGE" | "SYSTEM";
export type ChallengeType = "STREAK" | "DISTANCE" | "REPS" | "TIME" | "CUSTOM";
export type CommunityMemberRole = "MEMBER" | "MODERATOR" | "ADMIN";
export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "MESSAGE"
  | "CHALLENGE_INVITE"
  | "CHALLENGE_COMPLETE"
  | "COMMUNITY_INVITE"
  | "SYSTEM";

export interface AuthTokens {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  fitnessLevel: string | null;
  goals: string[];
  locationCity: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  fitnessLevel?: string;
  goals?: string[];
  locationLat?: number;
  locationLng?: number;
  locationCity?: string;
}

export interface MatchSuggestion {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  fitnessLevel: string | null;
  goals: string[];
  locationCity: string | null;
  matchScore: number;
  sharedGoals: string[];
}

export interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ConnectionStatus;
  message: string | null;
  matchScore: number | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipantSummary {
  id: string;
  userId: string;
  isAdmin: boolean;
  lastReadAt: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  participants: ConversationParticipantSummary[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    type: MessageType;
  } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challengeType: ChallengeType | null;
  startDate: string;
  endDate: string;
  targetValue: number | null;
  participantsCount: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  _count?: { participants: number };
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  membersCount: number;
  createdById: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface NotificationsPage {
  items: NotificationItem[];
  total: number;
  unread: number;
}
