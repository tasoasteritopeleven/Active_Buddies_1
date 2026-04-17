import React, { useState, useEffect } from "react"
import { Search, MessageSquareOff, BellRing, Users, SlidersHorizontal, X, Loader2, Smile } from "lucide-react"
import { Input } from "../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { cn } from "../lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { Button } from "../components/ui/button"
import { useNavigate } from "react-router-dom"
import { api } from "../services/api"

export function Chats() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [filterDate, setFilterDate] = useState("Anytime")
  const [nudged, setNudged] = useState<number[]>([])
  const [reactions, setReactions] = useState<Record<number, string>>({})
  
  const [isLoading, setIsLoading] = useState(true)
  const [allChats, setAllChats] = useState<any[]>([])
  const [groupChats, setGroupChats] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getChats()
        setAllChats(data.direct)
        setGroupChats(data.groups)
      } catch (error) {
        console.error("Failed to load chats", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleNudge = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await api.sendNudge(id)
    setNudged([...nudged, id])
    setTimeout(() => {
      setNudged(prev => prev.filter(nId => nId !== id))
    }, 2000)
  }

  const navigate = useNavigate()

  const handleReact = (e: React.MouseEvent, id: number, emoji: string) => {
    e.stopPropagation()
    setReactions(prev => ({ ...prev, [id]: emoji }))
  }

  const renderChatList = (chats: any[]) => {
    const isToday = (timeStr: string) => timeStr.includes("AM") || timeStr.includes("PM") || timeStr.includes("ago") || timeStr.toLowerCase().includes("today");
    const isLast7Days = (timeStr: string) => {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Yesterday"]
      return isToday(timeStr) || days.some(d => timeStr.includes(d))
    };

    const filtered = chats.filter(chat => {
      const matchSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || chat.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = 
        filterType === "All" ? true :
        filterType === "Unread" ? chat.unread :
        filterType === "Online Pals" ? chat.online : true;

      const matchDate =
        filterDate === "Anytime" ? true :
        filterDate === "Today" ? isToday(chat.time) :
        filterDate === "Last 7 Days" ? isLast7Days(chat.time) : true;

      return matchSearch && matchType && matchDate;
    })

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm">
          <div className="bg-bg-surface-hover w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquareOff className="w-6 h-6 text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-base tracking-tight mb-1">No messages found</h3>
          <p className="text-text-muted text-[11px] font-medium">
            {searchQuery ? "Try a different search term." : "Start a conversation with your fitness pals!"}
          </p>
        </div>
      )
    }

    return filtered.map((chat) => (
      <div 
        key={chat.id} 
        onClick={() => navigate(`/chats/${chat.id}`)}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors border rounded-2xl shadow-sm",
          chat.unread ? "bg-bg-surface-hover border-accent/30" : "bg-bg-surface border-border-base/50 hover:border-text-muted/30"
        )}
      >
        <div className="relative">
          <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm">
            <AvatarImage src={chat.image} />
            <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">{chat.name[0]}</AvatarFallback>
          </Avatar>
          {chat.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-bg-surface rounded-full shadow-sm" />
          )}
          {chat.type === "group" && (
            <div className="absolute -bottom-1 -right-1 bg-bg-surface-hover rounded-full p-0.5 shadow-sm border border-border-base/50">
              <Users className="w-2.5 h-2.5 text-text-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3 className={cn("font-medium text-sm truncate", chat.unread ? "text-text-base" : "text-text-muted")}>
              {chat.name}
            </h3>
            <span className={cn("text-[10px] font-medium whitespace-nowrap ml-2", chat.unread ? "text-accent" : "text-text-muted")}>
              {chat.time}
            </span>
          </div>
          <p className={cn("text-[11px] truncate", chat.unread ? "text-text-base font-medium" : "text-text-muted")}>
            {chat.message}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {chat.unread && (
            <div className="w-2 h-2 bg-accent rounded-full shadow-sm" />
          )}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-full transition-all border bg-bg-surface-hover text-text-muted border-transparent hover:border-accent/50 hover:text-accent"
                  title="React to latest message"
                >
                  {reactions[chat.id] ? (
                    <span className="text-[14px] leading-none">{reactions[chat.id]}</span>
                  ) : (
                    <Smile className="w-3.5 h-3.5" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end" onClick={e => e.stopPropagation()}>
                <div className="flex gap-1">
                  {["👍", "❤️", "🔥", "😂", "💪"].map(emoji => (
                    <button 
                      key={emoji} 
                      className="hover:bg-bg-surface-hover rounded-full p-1 text-lg transition-colors cursor-pointer"
                      onClick={(e) => handleReact(e, chat.id, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {chat.type === "direct" && !chat.unread && (
              <button 
                onClick={(e) => handleNudge(e, chat.id)}
                className={cn(
                  "p-1.5 rounded-full transition-all border",
                  nudged.includes(chat.id) ? "bg-accent/10 text-accent border-accent/50" : "bg-bg-surface-hover text-text-muted border-transparent hover:border-accent/50 hover:text-accent"
                )}
                title="Send a nudge"
              >
                <BellRing className={cn("w-3.5 h-3.5", nudged.includes(chat.id) && "animate-bounce")} />
              </button>
            )}
          </div>
        </div>
      </div>
    ))
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
            <Button variant="outline" size="icon" className="rounded-full shrink-0 bg-bg-surface border-border-base/50 h-11 w-11 shadow-sm">
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
                  {["All", "Unread", "Online Pals"].map(filter => (
                    <button 
                      key={filter} 
                      onClick={() => setFilterType(filter)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${filterType === filter ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted transition-colors"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Date</label>
                <div className="flex flex-wrap gap-2">
                  {["Anytime", "Today", "Last 7 Days"].map(range => (
                    <button 
                      key={range} 
                      onClick={() => setFilterDate(range)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${filterDate === range ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted transition-colors"}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full rounded-full h-11 text-sm font-medium mt-2">Apply Filters</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 max-w-md">
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="space-y-3 mt-0 max-w-3xl">
            {renderChatList(allChats)}
          </TabsContent>
          
          <TabsContent value="groups" className="space-y-3 mt-0 max-w-3xl">
            {renderChatList(groupChats)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
