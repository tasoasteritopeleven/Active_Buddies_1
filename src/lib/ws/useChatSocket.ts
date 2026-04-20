/**
 * React hooks for the shared chat WebSocket.
 *
 * - `useChatSocketGlobal()` wires the singleton chat socket into the
 *   TanStack Query cache so *any* mounted screen sees live updates (new
 *   message list invalidations, per-conversation message appends). Mount
 *   this once from a top-level component (e.g. `Layout`).
 *
 * - `useChatRoom(conversationId)` joins / leaves a conversation room and
 *   exposes the current typing-indicator state for that conversation.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { qk } from "../api/hooks";
import type { Message } from "../api/types";
import { getChatSocket, type ChatSocket, type WsMessageNew, type WsTypingEvent } from "./socket";

function upsertMessage(list: Message[] | undefined, incoming: WsMessageNew): Message[] {
  if (!list) return [incoming];
  // Avoid duplicates when the sender already optimistically-appended via
  // `useSendMessage` and also receives the WS echo.
  if (list.some((m) => m.id === incoming.id)) return list;
  return [...list, incoming];
}

/**
 * Install the global chat-socket listeners.  Returns `true` once the socket
 * has connected at least once (mainly for debugging / future status UI).
 *
 * Safe to mount multiple times — the underlying socket is a singleton and
 * the listeners are attached/cleaned per effect instance.
 */
export function useChatSocketGlobal(): { connected: boolean } {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: ChatSocket | null = getChatSocket();
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onMessage = (payload: WsMessageNew) => {
      qc.setQueryData<Message[]>(qk.chat.messages(payload.conversationId), (prev) =>
        upsertMessage(prev, payload),
      );
      qc.invalidateQueries({ queryKey: qk.chat.conversations });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onMessage);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onMessage);
    };
  }, [qc]);

  return { connected };
}

/**
 * Per-screen hook: joins a conversation room and surfaces live typing
 * indicators. Call from the `ChatConversation` page.
 */
export function useChatRoom(conversationId: string | undefined): {
  typingUserIds: string[];
  sendTyping: (isTyping: boolean) => void;
} {
  const [typingMap, setTypingMap] = useState<Record<string, number>>({});
  // Use a ref so the `sendTyping` callback never re-creates.
  const socketRef = useRef<ChatSocket | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getChatSocket();
    if (!socket) return;
    socketRef.current = socket;

    const doJoin = () => socket.emit("conversation:join", { conversationId });

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    const onTyping = (payload: WsTypingEvent) => {
      if (payload.conversationId !== conversationId) return;
      setTypingMap((prev) => {
        const next = { ...prev };
        if (payload.isTyping) {
          next[payload.userId] = Date.now();
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    };
    socket.on("conversation:typing", onTyping);

    return () => {
      socket.off("conversation:typing", onTyping);
      if (socket.connected) {
        socket.emit("conversation:leave", { conversationId });
      }
    };
  }, [conversationId]);

  // Auto-expire typing entries after 3s of silence — matches typical UX and
  // protects against missed `isTyping=false` events.
  useEffect(() => {
    if (Object.keys(typingMap).length === 0) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        const next: Record<string, number> = {};
        for (const uid of Object.keys(prev)) {
          const ts = prev[uid];
          if (now - ts < 3_000) next[uid] = ts;
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [typingMap]);

  const typingUserIds = useMemo(() => Object.keys(typingMap), [typingMap]);

  const sendTyping = (isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !conversationId || !socket.connected) return;
    socket.emit("conversation:typing", { conversationId, isTyping });
  };

  return { typingUserIds, sendTyping };
}
