import React, { useState, useEffect } from "react"
import { Search, UserPlus, UserMinus, UserCheck, Clock, SlidersHorizontal, BellRing, Check, ShieldCheck, Loader2 } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { cn } from "../lib/utils"
import { Link } from "react-router-dom"
import { api } from "../services/api"

export function Friends() {
  const [searchQuery, setSearchQuery] = useState("")
  const [nudged, setNudged] = useState<number[]>([])
  const [requestSort, setRequestSort] = useState("recent")
  const [statusFilter, setStatusFilter] = useState("All")
  const [friendSort, setFriendSort] = useState("Recent")
  const [friendToRemove, setFriendToRemove] = useState<number | null>(null)
  const [selectedRequests, setSelectedRequests] = useState<number[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [friendsList, setFriendsList] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getFriendsData()
        // Map API data to match component's expected structure
        setFriendsList(data.friends.map(f => ({
          ...f,
          status: f.online ? "online" : "offline"
        })))
        setFriendRequests(data.requests.map(r => ({
          ...r,
          mutualFriends: r.mutual,
          type: r.status,
          timestamp: Date.now() // Mock timestamp
        })))
      } catch (error) {
        console.error("Failed to load friends data", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Simulate real-time status updates
  useEffect(() => {
    if (friendsList.length === 0) return;
    const interval = setInterval(() => {
      setFriendsList(current => current.map(friend => {
        if (Math.random() > 0.8) { // 20% chance to toggle status
          const isOnline = friend.status === "online"
          return { 
            ...friend, 
            status: isOnline ? "offline" : "online", 
            lastActive: isOnline ? "Just now" : "Now" 
          }
        }
        return friend
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [friendsList.length])

  const sortedRequests = [...friendRequests].sort((a, b) => {
    if (requestSort === "mutual") return b.mutualFriends - a.mutualFriends
    if (requestSort === "sent") {
      if (a.type === "sent" && b.type !== "sent") return -1
      if (b.type === "sent" && a.type !== "sent") return 1
      return b.timestamp - a.timestamp
    }
    // recent (received)
    if (a.type === "received" && b.type !== "received") return -1
    if (b.type === "received" && a.type !== "received") return 1
    return b.timestamp - a.timestamp
  })

  const filteredFriends = friendsList.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Online" && friend.status === "online") ||
      (statusFilter === "Offline" && friend.status === "offline") ||
      (statusFilter === "Recently Active" && friend.status === "recently active")
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    if (friendSort === "Name (A-Z)") return a.name.localeCompare(b.name)
    return 0
  })

  const handleNudge = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setNudged([...nudged, id])
    setTimeout(() => {
      setNudged(prev => prev.filter(nId => nId !== id))
    }, 2000)
  }

  const handleRemoveFriend = (id: number) => {
    setFriendsList(prev => prev.filter(f => f.id !== id))
  }

  const toggleRequestSelection = (id: number) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    )
  }

  const handleBulkAccept = () => {
    setFriendRequests(prev => prev.filter(req => !selectedRequests.includes(req.id)))
    setSelectedRequests([])
  }

  const handleBulkDecline = () => {
    setFriendRequests(prev => prev.filter(req => !selectedRequests.includes(req.id)))
    setSelectedRequests([])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight mb-0.5">My <span className="text-accent">Friends</span></h1>
        <p className="text-xs text-text-muted font-medium">Manage your fitness network</p>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <Input 
            className="pl-10 bg-bg-surface border-border-base/50 rounded-full text-sm text-text-base placeholder:text-text-muted font-medium h-11 shadow-sm focus-visible:ring-1 focus-visible:ring-border-base" 
            placeholder="Search friends by name..." 
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
            <Button variant="outline" size="icon" className="rounded-full shrink-0 bg-bg-surface border-border-base/50 h-11 w-11 shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-text-muted" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Friends</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Status</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Online", "Recently Active", "Offline"].map(status => (
                    <button 
                      key={status} 
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${statusFilter === status ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted transition-colors"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {["Recent", "Name (A-Z)", "Mutual Friends"].map(sort => (
                    <button 
                      key={sort} 
                      onClick={() => setFriendSort(sort)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${friendSort === sort ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted transition-colors"}`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full rounded-full h-11 text-sm font-medium mt-2">Apply Filters</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 max-w-md">
            <TabsTrigger value="all">All Friends ({friendsList.length})</TabsTrigger>
            <TabsTrigger value="requests" className="relative flex items-center gap-2">
              Requests
              {friendRequests.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg shadow-sm">
                  {friendRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-2.5 mt-0 max-w-3xl">
            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm">
                  <Link to={`/user/${friend.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                    <div className="relative group cursor-pointer">
                      <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
                        <AvatarImage src={friend.image} />
                        <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      {friend.status === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-bg-surface rounded-full shadow-sm" />
                      )}
                      {friend.status === "recently active" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 border-2 border-bg-surface rounded-full shadow-sm" />
                      )}
                      {friend.status === "offline" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-bg-surface rounded-full shadow-sm" />
                      )}
                      
                      {/* Hover Preview Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="bg-text-base text-bg-base text-xs font-medium px-3 py-2 rounded-xl shadow-xl flex flex-col items-center gap-1">
                          <span className="capitalize">{friend.status}</span>
                          <span className="text-[10px] opacity-80">Last active: {friend.lastActive}</span>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-base rotate-45"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-text-base">{friend.name}</h3>
                        {friend.isPro && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-accent to-blue-500 px-1.5 py-0.5 rounded-full shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5" /> Pro
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {friend.lastActive}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={(e) => handleNudge(e, friend.id)}
                      className={cn(
                        "rounded-full border-transparent h-9 w-9 transition-all",
                        nudged.includes(friend.id) ? "bg-accent/10 text-accent border-accent/50 scale-110" : "text-text-muted hover:text-accent hover:bg-accent/10"
                      )}
                      title="Send a nudge"
                    >
                      <BellRing className={cn("w-4 h-4", nudged.includes(friend.id) && "animate-bounce")} />
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
                          <p className="text-sm text-text-muted">Are you sure you want to remove <strong>{friend.name}</strong> from your friends list?</p>
                        </div>
                        <div className="flex justify-end gap-3">
                          <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-full border-border-base text-text-base">Cancel</Button>
                          </DialogTrigger>
                          <DialogTrigger asChild>
                            <Button variant="destructive" onClick={() => handleRemoveFriend(friend.id)} className="rounded-full bg-red-500 text-white hover:bg-red-600 border-transparent">Remove</Button>
                          </DialogTrigger>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
                <p className="text-text-muted text-[11px] font-medium">No friends found matching "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4 mt-0 max-w-3xl">
            {friendRequests.length > 0 && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-text-muted">Manage Requests</h3>
                  <select 
                    className="bg-bg-surface border border-border-base/50 rounded-full px-3 py-1.5 text-xs font-medium text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
                    value={requestSort}
                    onChange={(e) => setRequestSort(e.target.value)}
                  >
                    <option value="recent">Date Received</option>
                    <option value="sent">Date Sent</option>
                    <option value="mutual">Mutual Friends</option>
                  </select>
                </div>
                
                {selectedRequests.length > 0 && (
                  <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-2xl p-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-medium text-accent">{selectedRequests.length} selected</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleBulkAccept} className="h-8 rounded-full text-xs">Accept All</Button>
                      <Button size="sm" variant="outline" onClick={handleBulkDecline} className="h-8 rounded-full text-xs border-accent/30 text-accent hover:bg-accent/20">Decline All</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2.5">
              {sortedRequests.length > 0 ? (
                sortedRequests.map(request => (
                  <div key={request.id} className="p-4 bg-bg-surface border border-border-base/50 rounded-2xl shadow-sm flex items-center gap-3">
                    {request.type === "received" && (
                      <input 
                        type="checkbox" 
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                        className="w-4 h-4 rounded border-border-base/50 text-accent focus:ring-accent shrink-0 cursor-pointer"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
                          <AvatarImage src={request.image} />
                          <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">{request.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-sm">{request.name}</h3>
                          <p className="text-[11px] text-text-muted font-medium mt-0.5">{request.mutualFriends} mutual friends</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.type === "received" ? (
                          <>
                            <Button className="flex-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 h-9">
                              <UserCheck className="w-3.5 h-3.5" /> Accept
                            </Button>
                            <Button variant="outline" className="flex-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 h-9 border-border-base/50">
                              <UserMinus className="w-3.5 h-3.5" /> Decline
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" disabled className="w-full rounded-full text-[11px] font-medium flex items-center justify-center gap-1.5 h-9 border-accent/50 text-accent bg-accent/5 opacity-100">
                            <Check className="w-3.5 h-3.5" /> Requested
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
                  <p className="text-text-muted text-[11px] font-medium">No pending friend requests</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
