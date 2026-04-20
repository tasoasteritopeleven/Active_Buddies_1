import React, { useMemo, useState } from "react"
import {
  Search,
  MessageSquareOff,
  Users,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react"
import { Input } from "../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { cn } from "../lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { useNavigate } from "react-router-dom"

import { useConversations, useMe, type ConversationSummary } from "../lib/api"

/** Flattened display row — derived from `ConversationSummary` + current user id. */
interface ChatRow {
  id: string
  name: string
  image: string
  message: string
  time: string
  unread: boolean
  type: "direct" | "group"
  participantCount: number
}

function formatTime(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }
  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 2) return "Yesterday"
  if (diff < 7) return date.toLocaleDateString(undefined, { weekday: "short" })
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function toChatRow(conv: ConversationSummary, meId: string): ChatRow {
  const isDirect = conv.type === "DIRECT"
  // For direct chats, the "other" participant names the conversation.
  const others = conv.participants.filter((p) => p.userId !== meId)
  const peer = others[0]?.user
  const peerName = peer
    ? [peer.firstName, peer.lastName].filter(Boolean).join(" ").trim() || "Unknown"
    : "Unknown"
  const name = isDirect ? peerName : conv.name ?? `Group (${conv.participants.length})`

  const image = isDirect
    ? peer?.avatarUrl ?? `https://i.pravatar.cc/150?u=${peer?.id ?? conv.id}`
    : `https://i.pravatar.cc/150?u=${conv.id}`

  const myLastRead = conv.participants.find((p) => p.userId === meId)?.lastReadAt
  const unread = Boolean(
    conv.lastMessage &&
      conv.lastMessage.senderId !== meId &&
      (!myLastRead || new Date(conv.lastMessage.createdAt) > new Date(myLastRead)),
  )

  return {
    id: conv.id,
    name,
    image,
    message: conv.lastMessage?.content ?? "No messages yet",
    time: formatTime(conv.lastMessageAt),
    unread,
    type: isDirect ? "direct" : "group",
    participantCount: conv.participants.length,
  }
}

export function Chats() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"All" | "Unread">("All")

  const me = useMe()
  const conversations = useConversations()

  const rows = useMemo<ChatRow[]>(() => {
    if (!me.data || !conversations.data) return []
    return conversations.data.map((c) => toChatRow(c, me.data!.id))
  }, [me.data, conversations.data])

  const direct = useMemo(() => rows.filter((r) => r.type === "direct"), [rows])
  const groups = useMemo(() => rows.filter((r) => r.type === "group"), [rows])

  const isLoading = me.isLoading || conversations.isLoading
  const error = me.error ?? conversations.error

  const applyFilters = (list: ChatRow[]): ChatRow[] => {
    const q = searchQuery.trim().toLowerCase()
    return list.filter((chat) => {
      const matchSearch =
        !q ||
        chat.name.toLowerCase().includes(q) ||
        chat.message.toLowerCase().includes(q)
      const matchType = filterType === "All" ? true : chat.unread
      return matchSearch && matchType
    })
  }

  const renderChatList = (list: ChatRow[]) => {
    const filtered = applyFilters(list)
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
          <div className="bg-bg-surface-hover w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquareOff className="w-6 h-6 text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-base tracking-tight mb-1">
            No conversations
          </h3>
          <p className="text-text-muted text-[11px] font-medium">
            {searchQuery ? "Try a different search term." : "Start a conversation with your pals!"}
          </p>
        </div>
      )
    }

    return filtered.map((chat) => (
      <React.Fragment key={chat.id}>
        <div
          onClick={() => navigate(`/chats/${chat.id}`)}
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer transition-colors border rounded-2xl shadow-sm",
            chat.unread
              ? "bg-bg-surface-hover border-accent/30"
              : "bg-bg-surface border-border-base/50 hover:border-text-muted/30",
          )}
        >
          <div className="relative">
            <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
              <AvatarImage src={chat.image} />
              <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">
                {chat.name[0]}
              </AvatarFallback>
            </Avatar>
            {chat.type === "group" && (
              <div className="absolute -bottom-1 -right-1 bg-bg-surface-hover rounded-full p-0.5 shadow-sm border border-border-base/50">
                <Users className="w-2.5 h-2.5 text-text-muted" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
              <h3
                className={cn(
                  "font-medium text-sm truncate",
                  chat.unread ? "text-text-base" : "text-text-muted",
                )}
              >
                {chat.name}
              </h3>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap ml-2",
                  chat.unread ? "text-accent" : "text-text-muted",
                )}
              >
                {chat.time}
              </span>
            </div>
            <p
              className={cn(
                "text-[11px] truncate",
                chat.unread ? "text-text-base font-medium" : "text-text-muted",
              )}
            >
              {chat.message}
            </p>
          </div>
          {chat.unread && (
            <div className="w-2 h-2 bg-accent rounded-full shadow-sm shrink-0" />
          )}
        </div>
      </React.Fragment>
    ))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <p className="text-sm text-red-500">Failed to load conversations: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight mb-0.5">Messages</h1>
          <p className="text-xs text-text-muted font-medium">Stay connected with your pals</p>
        </header>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <Input
              className="pl-10 pr-10 bg-bg-surface border-border-base/50 rounded-full text-sm text-text-base placeholder:text-text-muted font-medium h-11 shadow-sm focus-visible:ring-1 focus-visible:ring-border-base"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0 bg-bg-surface border-border-base/50 h-11 w-11 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-text-muted" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Filter Messages</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">Show</label>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "Unread"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                          filterType === f
                            ? "bg-text-base text-bg-base border-text-base"
                            : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 max-w-md">
            <TabsTrigger value="direct">Direct ({direct.length})</TabsTrigger>
            <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-3 mt-0 max-w-3xl">
            {renderChatList(direct)}
          </TabsContent>

          <TabsContent value="groups" className="space-y-3 mt-0 max-w-3xl">
            {renderChatList(groups)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
