/**
 * Socket.IO client wrapper for the Active Buddies realtime chat gateway.
 *
 * The backend exposes a `/ws/chat` namespace that requires a JWT access token
 * provided via `auth.token` on the initial handshake.  This module maintains
 * a *singleton* `Socket` per access token so multiple components can share
 * the same connection without opening parallel sockets.
 */

import { io, type Socket } from "socket.io-client";

import { loadTokens } from "../api/tokens";

const WS_BASE_URL =
  (import.meta.env.VITE_WS_BASE_URL as string | undefined) ?? "http://localhost:4000";

// ---- Server → client event payloads --------------------------------------

export interface WsMessageNew {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface WsTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatClientToServerEvents {
  "conversation:join": (payload: { conversationId: string }) => void;
  "conversation:leave": (payload: { conversationId: string }) => void;
  "conversation:typing": (payload: { conversationId: string; isTyping: boolean }) => void;
}

export interface ChatServerToClientEvents {
  "message:new": (payload: WsMessageNew) => void;
  "conversation:typing": (payload: WsTypingEvent) => void;
}

export type ChatSocket = Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

// ---- Singleton management ------------------------------------------------

let socket: ChatSocket | null = null;
let currentToken: string | null = null;

/**
 * Get (or lazily create) the shared chat socket. Returns `null` if the user
 * has no access token. Re-creates the socket if the token has changed
 * (e.g. after login as a different user).
 */
export function getChatSocket(): ChatSocket | null {
  const tokens = loadTokens();
  if (!tokens) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }

  if (socket && currentToken === tokens.accessToken) {
    return socket;
  }

  // Token changed — tear down the old socket before re-connecting.
  if (socket) {
    socket.disconnect();
  }

  socket = io(`${WS_BASE_URL}/ws/chat`, {
    transports: ["websocket"],
    auth: { token: tokens.accessToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  }) as ChatSocket;

  currentToken = tokens.accessToken;
  return socket;
}

/** Disconnect and forget the shared socket. Call on logout. */
export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export { WS_BASE_URL };
