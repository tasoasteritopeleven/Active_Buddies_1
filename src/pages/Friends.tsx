import React, { useMemo, useState } from "react"
import {
  Search,
  UserPlus,
  UserMinus,
  UserCheck,
  SlidersHorizontal,
  BellRing,
  Check,
  Loader2,
} from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { cn } from "../lib/utils"
import { Link } from "react-router-dom"

import {
  useAcceptRequest,
  useConnections,
  useDeclineRequest,
  useIncomingRequests,
  useMe,
  useOutgoingRequests,
  useRemoveConnection,
  useUser,
  type Connection,
  type PublicUser,
} from "../lib/api"

/**
 * Given an ACCEPTED / PENDING connection row and the current user id,
 * return the id of the *other* participant.
 */
function otherUserId(conn: Connection, meId: string): string {
  return conn.requesterId === meId ? conn.addresseeId : conn.requesterId
}

function displayName(u: Pick<PublicUser, "firstName" | "lastName" | "email">): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
  return full || u.email.split("@")[0]
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function FriendRow({
  connection,
  meId,
  nudged,
  onNudge,
  onRemove,
  removePending,
}: {
  connection: Connection
  meId: string
  nudged: boolean
  onNudge: (e: React.MouseEvent) => void
  onRemove: () => void
  removePending: boolean
}) {
  const peerId = otherUserId(connection, meId)
  const { data: peer, isLoading } = useUser(peerId)

  if (isLoading || !peer) {
    return (
      <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-full bg-bg-surface-hover animate-pulse" />
        <div className="h-4 w-32 bg-bg-surface-hover rounded animate-pulse" />
      </div>
    )
  }

  const name = displayName(peer)

  return (
    <div className="flex items-center justify-between p-3 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm">
      <Link
        to={`/user/${peer.id}`}
        className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
      >
        <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
          <AvatarImage src={peer.avatarUrl ?? `https://i.pravatar.cc/150?u=${peer.id}`} />
          <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">
            {name[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm text-text-base">{name}</h3>
          <p className="text-[11px] text-text-muted font-medium mt-0.5">
            {peer.locationCity ?? peer.fitnessLevel ?? "Connected"}
          </p>
        </div>
      </Link>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onNudge}
          className={cn(
            "rounded-full border-transparent h-9 w-9 transition-all",
            nudged
              ? "bg-accent/10 text-accent border-accent/50 scale-110"
              : "text-text-muted hover:text-accent hover:bg-accent/10",
          )}
          title="Send a nudge"
        >
          <BellRing className={cn("w-4 h-4", nudged && "animate-bounce")} />
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-transparent text-text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 h-9 w-9"
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove Friend</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-text-muted">
                Remove <strong>{name}</strong> from your friends?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full border-border-base text-text-base">
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={removePending}
                  onClick={onRemove}
                  className="rounded-full bg-red-500 text-white hover:bg-red-600 border-transparent"
                >
                  {removePending ? "Removing..." : "Remove"}
                </Button>
              </DialogTrigger>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function RequestRow({
  connection,
  direction,
  onAccept,
  onDecline,
  acceptPending,
  declinePending,
}: {
  connection: Connection
  direction: "incoming" | "outgoing"
  onAccept: () => void
  onDecline: () => void
  acceptPending: boolean
  declinePending: boolean
}) {
  const peerId = direction === "incoming" ? connection.requesterId : connection.addresseeId
  const { data: peer, isLoading } = useUser(peerId)

  if (isLoading || !peer) {
    return (
      <div className="p-4 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm">
        <div className="h-12 bg-bg-surface-hover rounded animate-pulse" />
      </div>
    )
  }

  const name = displayName(peer)

  return (
    <div className="p-4 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
          <AvatarImage src={peer.avatarUrl ?? `https://i.pravatar.cc/150?u=${peer.id}`} />
          <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">
            {name[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">{name}</h3>
          {connection.matchScore !== null && (
            <p className="text-[11px] text-text-muted font-medium mt-0.5">
              {connection.matchScore}% match
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {direction === "incoming" ? (
          <>
            <Button
              onClick={onAccept}
              disabled={acceptPending || declinePending}
              className="flex-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 h-9"
            >
              <UserCheck className="w-3.5 h-3.5" /> {acceptPending ? "Accepting..." : "Accept"}
            </Button>
            <Button
              variant="outline"
              onClick={onDecline}
              disabled={acceptPending || declinePending}
              className="flex-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 h-9 border-border-base/50"
            >
              <UserMinus className="w-3.5 h-3.5" /> {declinePending ? "Declining..." : "Decline"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            disabled
            className="w-full rounded-full text-[11px] font-medium flex items-center justify-center gap-1.5 h-9 border-accent/50 text-accent bg-accent/5"
          >
            <Check className="w-3.5 h-3.5" /> Requested
          </Button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export function Friends() {
  const [searchQuery, setSearchQuery] = useState("")
  const [friendSort, setFriendSort] = useState<"Recent" | "Name">("Recent")
  const [nudged, setNudged] = useState<Set<string>>(new Set())

  const me = useMe()
  const connections = useConnections()
  const incoming = useIncomingRequests()
  const outgoing = useOutgoingRequests()

  const accept = useAcceptRequest()
  const decline = useDeclineRequest()
  const remove = useRemoveConnection()

  const meId = me.data?.id ?? null

  const filteredConnections = useMemo(() => {
    const list = connections.data ?? []
    const q = searchQuery.trim().toLowerCase()
    // We can't filter by name without fetching each peer — name filter is
    // applied in the FriendRow sub-component would require lifting state up.
    // For now, search only narrows by connection id / match score text.
    const base = q
      ? list.filter(
          (c) => c.message?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
        )
      : list
    return [...base].sort((a, b) =>
      friendSort === "Recent"
        ? new Date(b.respondedAt ?? b.createdAt).getTime() -
          new Date(a.respondedAt ?? a.createdAt).getTime()
        : 0,
    )
  }, [connections.data, searchQuery, friendSort])

  const incomingList = incoming.data ?? []
  const outgoingList = outgoing.data ?? []
  const totalRequests = incomingList.length + outgoingList.length

  const isLoading = me.isLoading || connections.isLoading
  const error = me.error ?? connections.error ?? incoming.error ?? outgoing.error

  const handleNudge = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    setNudged((prev) => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    // Purely client-side feedback — no nudge endpoint on the backend yet.
    setTimeout(() => {
      setNudged((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !meId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <p className="text-sm text-red-500">Failed to load friends: {error?.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight mb-0.5">
            My <span className="text-accent">Friends</span>
          </h1>
          <p className="text-xs text-text-muted font-medium">Manage your fitness network</p>
        </header>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <Input
              className="pl-10 bg-bg-surface border-border-base/50 rounded-full text-sm text-text-base placeholder:text-text-muted font-medium h-11 shadow-sm focus-visible:ring-1 focus-visible:ring-border-base"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to="/discover">
            <Button className="rounded-full h-11 px-5 shadow-sm font-medium bg-accent text-accent-fg hover:bg-accent/90 shrink-0 hidden sm:flex">
              <UserPlus className="w-4 h-4 mr-2" /> Add Friends
            </Button>
            <Button className="rounded-full h-11 w-11 p-0 shadow-sm font-medium bg-accent text-accent-fg hover:bg-accent/90 shrink-0 sm:hidden flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </Button>
          </Link>
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
                <DialogTitle>Sort Friends</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {(["Recent", "Name"] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setFriendSort(sort)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                        friendSort === sort
                          ? "bg-text-base text-bg-base border-text-base"
                          : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 max-w-md">
            <TabsTrigger value="all">All Friends ({filteredConnections.length})</TabsTrigger>
            <TabsTrigger value="requests" className="relative flex items-center gap-2">
              Requests
              {totalRequests > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg shadow-sm">
                  {totalRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2.5 mt-0 max-w-3xl">
            {filteredConnections.length > 0 ? (
              filteredConnections.map((conn) => {
                const peerId = otherUserId(conn, meId)
                const removePending = remove.isPending && remove.variables === peerId
                return (
                  <React.Fragment key={conn.id}>
                    <FriendRow
                      connection={conn}
                      meId={meId}
                      nudged={nudged.has(peerId)}
                      onNudge={(e) => handleNudge(e, peerId)}
                      onRemove={() => remove.mutate(peerId)}
                      removePending={removePending}
                    />
                  </React.Fragment>
                )
              })
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
                <p className="text-text-muted text-[11px] font-medium">
                  {searchQuery ? `No friends match "${searchQuery}"` : "No friends yet — start discovering!"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-0 max-w-3xl">
            {incomingList.length === 0 && outgoingList.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
                <p className="text-text-muted text-[11px] font-medium">No pending friend requests</p>
              </div>
            ) : (
              <>
                {incomingList.length > 0 && (
                  <section className="space-y-2.5">
                    <h3 className="text-sm font-medium text-text-muted">
                      Received ({incomingList.length})
                    </h3>
                    {incomingList.map((req) => (
                      <React.Fragment key={req.id}>
                        <RequestRow
                          connection={req}
                          direction="incoming"
                          acceptPending={accept.isPending && accept.variables === req.id}
                          declinePending={decline.isPending && decline.variables === req.id}
                          onAccept={() => accept.mutate(req.id)}
                          onDecline={() => decline.mutate(req.id)}
                        />
                      </React.Fragment>
                    ))}
                  </section>
                )}
                {outgoingList.length > 0 && (
                  <section className="space-y-2.5">
                    <h3 className="text-sm font-medium text-text-muted">
                      Sent ({outgoingList.length})
                    </h3>
                    {outgoingList.map((req) => (
                      <React.Fragment key={req.id}>
                        <RequestRow
                          connection={req}
                          direction="outgoing"
                          acceptPending={false}
                          declinePending={false}
                          onAccept={() => {}}
                          onDecline={() => {}}
                        />
                      </React.Fragment>
                    ))}
                  </section>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
