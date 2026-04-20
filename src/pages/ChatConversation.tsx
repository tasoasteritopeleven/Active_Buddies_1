import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Info,
  Loader2,
  Phone,
  Send,
  Video,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { cn } from "../lib/utils"

import {
  useConversations,
  useMarkConversationRead,
  useMe,
  useMessages,
  useSendMessage,
  type ConversationSummary,
  type Message,
} from "../lib/api"
import { useChatRoom } from "../lib/ws"

/** Peer info (for DIRECT) derived from the conversation summary. */
interface PeerInfo {
  id: string | null
  name: string
  image: string
  title: string
}

function peerFromConversation(
  conv: ConversationSummary | undefined,
  meId: string,
): PeerInfo {
  if (!conv) return { id: null, name: "Loading...", image: "", title: "" }

  const isDirect = conv.type === "DIRECT"
  const others = conv.participants.filter((p) => p.userId !== meId)
  const peer = others[0]?.user

  if (isDirect && peer) {
    const name =
      [peer.firstName, peer.lastName].filter(Boolean).join(" ").trim() || "Unknown"
    return {
      id: peer.id,
      name,
      image: peer.avatarUrl ?? `https://i.pravatar.cc/150?u=${peer.id}`,
      title: "Direct message",
    }
  }

  return {
    id: null,
    name: conv.name ?? `Group (${conv.participants.length})`,
    image: `https://i.pravatar.cc/150?u=${conv.id}`,
    title: `${conv.participants.length} participants`,
  }
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function ChatConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const me = useMe()
  const conversations = useConversations()
  const messagesQuery = useMessages(id)
  const sendMessage = useSendMessage(id ?? "")
  const markRead = useMarkConversationRead(id ?? "")
  const { typingUserIds, sendTyping } = useChatRoom(id)

  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<number | null>(null)

  const conversation = useMemo(
    () => conversations.data?.find((c) => c.id === id),
    [conversations.data, id],
  )
  const peer = useMemo(
    () => peerFromConversation(conversation, me.data?.id ?? ""),
    [conversation, me.data?.id],
  )

  const messages: Message[] = messagesQuery.data ?? []
  const isLoading = me.isLoading || messagesQuery.isLoading || conversations.isLoading

  // Auto-scroll to the latest message / typing indicator.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, typingUserIds.length])

  // Mark conversation as read when it opens or when new messages arrive.
  useEffect(() => {
    if (!id) return
    markRead.mutate()
    // We intentionally run only on id change or count change — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, messages.length])

  const stopTyping = () => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }
    sendTyping(false)
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    if (!id) return
    if (value.length === 0) {
      stopTyping()
      return
    }
    // Debounced "still typing" pulse — send once per 2s.
    if (typingTimerRef.current === null) {
      sendTyping(true)
    } else {
      window.clearTimeout(typingTimerRef.current)
    }
    typingTimerRef.current = window.setTimeout(() => {
      sendTyping(false)
      typingTimerRef.current = null
    }, 2_000)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !id || sendMessage.isPending) return
    stopTyping()
    try {
      await sendMessage.mutateAsync({ content: text })
      setNewMessage("")
    } catch {
      // Error surfaces via sendMessage.error — keep the typed content so the
      // user can retry.
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] bg-bg-base text-text-base">
        <p className="text-sm text-text-muted">Conversation not found.</p>
      </div>
    )
  }

  const meId = me.data?.id ?? ""
  const someoneElseTyping = typingUserIds.some((uid) => uid !== meId)

  return (
    <div className="flex flex-col h-full bg-bg-base relative">
      {/* Chat Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-border-base/50 bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chats")}
            className="p-2 -ml-2 bg-text-muted/10 rounded-full text-text-base hover:bg-text-muted/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className={cn(
              "flex items-center gap-3",
              peer.id ? "cursor-pointer" : "",
            )}
            onClick={() => peer.id && navigate(`/user/${peer.id}`)}
          >
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border-base/50">
                <AvatarImage src={peer.image} />
                <AvatarFallback className="bg-bg-surface-hover text-text-muted">
                  {peer.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="font-semibold text-sm text-text-base">{peer.name}</h2>
              <p className="text-[11px] text-text-muted font-medium">
                {someoneElseTyping ? "Typing..." : peer.title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full text-text-muted hover:text-text-base"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full text-text-muted hover:text-text-base"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full text-text-muted hover:text-text-base"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-text-muted text-xs py-8">
            No messages yet — say hi!
          </div>
        )}
        {messages.map((msg, index) => {
          const isMe = msg.senderId === meId
          const showAvatar = !isMe && (index === 0 || messages[index - 1]?.senderId === meId)

          return (
            <React.Fragment key={msg.id}>
              <div
                className={cn(
                  "flex items-end gap-2 max-w-[85%]",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && (
                      <Avatar className="w-8 h-8 border border-border-base/50">
                        <AvatarImage src={peer.image} />
                        <AvatarFallback className="bg-bg-surface text-[10px]">
                          {peer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm relative group",
                    isMe
                      ? "bg-accent text-accent-fg rounded-br-sm"
                      : "bg-bg-surface border border-border-base/50 text-text-base rounded-bl-sm",
                  )}
                >
                  {msg.content}
                  <span
                    className={cn(
                      "text-[9px] absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                      isMe ? "right-1 text-text-muted" : "left-1 text-text-muted",
                    )}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          )
        })}
        {someoneElseTyping && (
          <div className="flex items-end gap-2 max-w-[85%] mr-auto">
            <div className="w-8 flex-shrink-0">
              <Avatar className="w-8 h-8 border border-border-base/50">
                <AvatarImage src={peer.image} />
                <AvatarFallback className="bg-bg-surface text-[10px]">
                  {peer.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="p-3.5 rounded-2xl text-sm shadow-sm relative bg-bg-surface border border-border-base/50 text-text-base rounded-bl-sm flex gap-1 items-center h-[42px]">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-bg-surface/90 backdrop-blur-md border-t border-border-base/50 shrink-0 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-end">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl bg-bg-base border-border-base/50 focus-visible:ring-accent min-h-[44px]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="rounded-full w-11 h-11 bg-accent hover:bg-accent/90 text-accent-fg shrink-0 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
        {sendMessage.error && (
          <p className="text-[10px] text-red-500 text-center mt-2">
            Failed to send: {sendMessage.error.message}
          </p>
        )}
      </div>
    </div>
  )
}
