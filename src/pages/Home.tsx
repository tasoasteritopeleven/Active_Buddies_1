import { Flame, CheckCircle2, Trophy, Users, MapPin, Calendar as CalendarIcon, Search, SlidersHorizontal, Heart, MessageSquare, Share2, Plus, Activity, X, Loader2, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { useState, useEffect, useMemo } from "react"
import { api } from "../services/api"
import { useMe, useConnections, useChallenges } from "../lib/api"
import type { Connection, Challenge } from "../lib/api"

import { motion } from "motion/react"
import { useAuth } from "../contexts/AuthContext"

export function Home() {
  const { user } = useAuth()
  const [checkedIn, setCheckedIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isLogWorkoutOpen, setIsLogWorkoutOpen] = useState(false)
  const [buddyCheckedIn, setBuddyCheckedIn] = useState(false)

  // --- Real API hooks (backend-supported) ---
  const { data: me } = useMe()
  const { data: connections } = useConnections()
  const { data: challengesData } = useChallenges({ status: "active", limit: 5 })

  // --- Mock data for features without backend endpoints yet ---
  const [meetups, setMeetups] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMockData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getHomeData()
        setMeetups(data.meetups)
        setFeed(data.feed)
        setStories(data.stories)
      } catch (error) {
        console.error("Failed to load home data", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadMockData()
  }, [])

  // Transform real connections into pal view for the "My Pals" section
  const pals = useMemo(() => {
    if (!connections || !me) return []
    return connections.map((conn: Connection) => {
      const peerId = conn.requesterId === me.id ? conn.addresseeId : conn.requesterId
      return {
        id: peerId,
        name: peerId.slice(0, 8), // Fallback — real app would join user data
        image: `https://i.pravatar.cc/150?u=${peerId}`,
      }
    })
  }, [connections, me])

  // Transform real challenges
  const challenges = useMemo(() => {
    const items = challengesData?.items ?? []
    return items.map((c: Challenge) => {
      const start = new Date(c.startDate).getTime()
      const end = new Date(c.endDate).getTime()
      const now = Date.now()
      const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
      const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100))
      return {
        id: c.id,
        title: c.title,
        participants: c.participantsCount,
        daysLeft,
        progress,
      }
    })
  }, [challengesData])

  const handleCheckIn = async () => {
    await api.checkIn()
    setCheckedIn(true)
  }

  const handleBuddyCheckIn = async () => {
    await api.buddyCheckIn(1) // Assuming buddy ID 1
    setBuddyCheckedIn(true)
  }

  const handleLogWorkout = async () => {
    await api.logWorkout({ type: "Running", duration: 45 })
    setIsLogWorkoutOpen(false)
  }

  const handleCreatePost = async () => {
    await api.createPost({ content: "Just finished a great workout!" })
    setIsCreatePostOpen(false)
  }

  const filteredPals = pals.filter(pal => pal.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredChallenges = challenges.filter(challenge => challenge.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredMeetups = meetups.filter(meetup => meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) || meetup.location.toLowerCase().includes(searchQuery.toLowerCase()))

  const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    const lower = highlight.toLowerCase();
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === lower ? <span key={i} className="bg-accent/30 text-accent rounded-sm px-0.5">{part}</span> : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-lg font-semibold tracking-tight mb-0.5">Good morning, <span className="text-accent">{user?.firstName ?? user?.name ?? "there"}</span></h1>
            <p className="text-xs text-text-muted font-medium">Ready to crush your goals today?</p>
          </div>
        </header>

        {/* Global Search */}
        <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            className="pl-10 pr-10 rounded-full border-border-base/50 bg-bg-surface text-sm text-text-base placeholder:text-text-muted font-medium h-11 shadow-sm focus-visible:ring-1 focus-visible:ring-border-base"
            placeholder="Search challenges, meetups, or pals..."
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
            <button className="w-11 h-11 rounded-full border border-border-base/50 bg-bg-surface flex items-center justify-center text-text-muted hover:text-text-base hover:bg-bg-surface-hover transition-colors shadow-sm shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Activity Type</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Running", "Yoga", "Cycling", "Gym"].map(type => (
                    <button key={type} className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${type === "All" ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {["Anytime", "Today", "This Week", "This Month"].map(range => (
                    <button key={range} className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${range === "Anytime" ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"}`}>
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

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 xl:grid-cols-12 gap-8"
        >
          {/* Main Feed Column */}
          <div className="xl:col-span-8 space-y-8">
            {/* Daily Check-in */}
            <section className="bg-bg-surface rounded-2xl p-4 md:p-5 border border-border-base/50 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center border-2 ${checkedIn ? 'bg-accent/10 border-accent/30' : 'bg-bg-surface-hover border-border-base/50'}`}>
                  <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 ${checkedIn ? 'text-accent' : 'text-text-muted'}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-text-base text-sm md:text-base">Daily Check-in</h2>
                  <p className="text-[11px] md:text-xs text-text-muted mt-0.5 font-medium">{checkedIn ? "Validation Complete" : "Pending Activity"}</p>
                </div>
              </div>
              <Button 
                variant={checkedIn ? "outline" : "default"} 
                onClick={handleCheckIn}
                disabled={checkedIn}
                className="rounded-full text-xs md:text-sm font-medium px-3 md:px-5 h-8 md:h-9 shrink-0 ml-auto"
              >
                {checkedIn ? "Done" : "Check In"}
              </Button>
            </section>

            {/* Stories Section */}
            {!searchQuery && (
              <section className="mb-6">
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex w-max space-x-4 px-1">
                    {stories.map((story) => (
                      <Link key={story.id} to={`/story/${story.id}`} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                        <div className={`relative w-16 h-16 rounded-full p-0.5 ${story.isAdd ? 'border-none' : story.hasUnseen ? 'bg-gradient-to-tr from-accent to-blue-500' : 'bg-border-base'}`}>
                          <div className="w-full h-full bg-bg-base rounded-full p-0.5">
                            <Avatar className="w-full h-full border-none">
                              <AvatarImage src={story.image} />
                              <AvatarFallback>{story.user[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          {story.isAdd && (
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-accent text-accent-fg rounded-full flex items-center justify-center border-2 border-bg-base shadow-sm group-hover:scale-110 transition-transform">
                              <Plus className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-text-muted group-hover:text-text-base transition-colors">
                          {story.user}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </section>
            )}

            {/* Activity Feed */}
            {!searchQuery && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-semibold text-text-base tracking-tight">Friends' Activity</h2>
                  <div className="flex gap-2">
                    <Dialog open={isLogWorkoutOpen} onOpenChange={setIsLogWorkoutOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-medium h-8 border-border-base/50">
                          <Activity className="w-3.5 h-3.5 mr-1.5" /> Log Workout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Log Workout</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-text-muted">Activity Type</label>
                            <select className="w-full p-3 rounded-xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                              <option>Running</option>
                              <option>Cycling</option>
                              <option>Yoga</option>
                              <option>Weightlifting</option>
                              <option>HIIT</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-text-muted">Duration (mins)</label>
                              <Input type="number" placeholder="45" className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-text-muted">Calories</label>
                              <Input type="number" placeholder="350" className="rounded-xl" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-text-muted">Intensity</label>
                            <div className="flex gap-2">
                              {["Low", "Medium", "High"].map(level => (
                                <button key={level} className="flex-1 py-2 rounded-xl border border-border-base/50 text-xs font-medium hover:border-accent hover:text-accent transition-colors">
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="pb" className="rounded border-border-base/50 text-accent focus:ring-accent" />
                            <label htmlFor="pb" className="text-sm font-medium">Personal Best!</label>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-text-muted">Notes</label>
                            <textarea className="w-full p-3 rounded-xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px]" placeholder="How did it feel?"></textarea>
                          </div>
                          <Button className="w-full rounded-full h-11 text-sm font-medium mt-2" onClick={handleLogWorkout}>Save Workout</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full text-xs font-medium h-8">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <textarea 
                            className="w-full p-4 rounded-2xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[120px] resize-none" 
                            placeholder="Share your progress, ask a question, or post a photo..."
                          ></textarea>
                          <div className="flex items-center justify-between">
                            <button className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </button>
                            <Button className="rounded-full px-6" onClick={handleCreatePost}>Post</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-4">
                  {feed.map(item => (
                    <div key={item.id} className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm">
                      <div className="flex items-start gap-4">
                        <Link to={`/user/${item.userId}`}>
                          <Avatar className="w-12 h-12 border border-border-base/50 shadow-sm hover:opacity-80 transition-opacity">
                            <AvatarImage src={item.image} />
                            <AvatarFallback className="bg-bg-surface-hover text-text-muted text-sm font-medium">{item.user[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <p className="text-base text-text-base font-medium">
                            <Link to={`/user/${item.userId}`} className="hover:underline">{item.user}</Link> <span className="text-text-muted font-normal">{item.action}</span>
                          </p>
                          <p className="text-xs text-text-muted mt-1 font-medium">{item.time}</p>
                          <div className="flex gap-6 mt-4">
                            <button className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors">
                              <Heart className="w-4 h-4" />
                              <span className="text-xs font-medium">{item.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-text-muted hover:text-text-base transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-xs font-medium">{item.comments}</span>
                            </button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="flex items-center gap-2 text-text-muted hover:text-text-base transition-colors ml-auto">
                                  <Share2 className="w-4 h-4" />
                                  <span className="text-xs font-medium">Share</span>
                                </button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-xs">
                                <DialogHeader><DialogTitle>Share to...</DialogTitle></DialogHeader>
                                <div className="grid grid-cols-2 gap-3 py-2">
                                  <Button variant="outline" className="flex items-center gap-2 rounded-xl border-border-base/50" onClick={() => {
                                    if(navigator.share) {
                                      navigator.share({title: "ActiveBuddies Activity", text: `Check out this update from ${item.user}!`, url: window.location.href})
                                    }
                                  }}>
                                    Device Share
                                  </Button>
                                  <Button variant="outline" className="flex items-center gap-2 rounded-xl border-border-base/50" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/post/${item.id}`)
                                  }}>
                                    Copy Link
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="xl:col-span-4 space-y-6">
            {/* Accountability Partner */}
            <section className="bg-accent/5 rounded-2xl p-5 border border-accent/20 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h2 className="text-xs font-bold text-accent uppercase tracking-wider">Accountability Partner</h2>
                <Users className="w-4 h-4 text-accent" />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-bg-surface shadow-sm">
                    <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-surface rounded-full shadow-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-base text-sm">Sarah</h3>
                  <p className="text-xs text-text-muted font-medium mt-0.5">Completed workout today</p>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <Button 
                  onClick={handleBuddyCheckIn}
                  variant={buddyCheckedIn ? "outline" : "default"}
                  className={`flex-1 rounded-full text-xs h-8 ${buddyCheckedIn ? 'bg-accent/10 text-accent border-accent/30' : 'bg-accent text-accent-fg hover:bg-accent/90'}`}
                >
                  {buddyCheckedIn ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Checked In</> : "Send Check-in"}
                </Button>
                <Button variant="outline" className="flex-1 rounded-full text-xs h-8 border-accent/30 text-accent hover:bg-accent/10">Message</Button>
              </div>
            </section>

            {/* Streak */}
            <section className="bg-bg-surface rounded-2xl p-5 border border-border-base/50 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-1 relative z-10">
                <h2 className="text-xs font-medium text-text-muted">Current Streak</h2>
                <Flame className="w-4 h-4 text-accent" />
              </div>
              <div className="text-3xl font-semibold tracking-tight mb-0.5 relative z-10 text-text-base">12<span className="text-lg align-top text-accent font-medium">d</span></div>
              <p className="text-text-muted text-[11px] relative z-10 font-medium">Systems Nominal / Keep It Up</p>
            </section>

            {/* My Pals */}
            {filteredPals.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-text-base tracking-tight">My Pals</h2>
                  <Link to="/friends" className="text-[11px] text-text-muted font-medium hover:text-text-base transition-colors">
                    See All
                  </Link>
                </div>
                <ScrollArea className="w-full whitespace-nowrap pb-3">
                  <div className="flex w-max space-x-3">
                    {filteredPals.map((pal) => (
                      <div key={pal.id} className="flex flex-col items-center gap-1.5">
                        <Avatar className="w-14 h-14 border border-border-base/50 shadow-sm">
                          <AvatarImage src={pal.image} />
                          <AvatarFallback className="bg-bg-surface-hover text-text-muted text-xs font-medium">{pal.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-medium text-text-muted">
                          <Highlight text={pal.name} highlight={searchQuery} />
                        </span>
                      </div>
                    ))}
                    <Link to="/discover" className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full border border-dashed border-border-base bg-bg-surface flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors">
                        <span className="text-xl font-light">+</span>
                      </div>
                      <span className="text-[11px] font-medium text-text-muted">Add</span>
                    </Link>
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </section>
            )}

            {/* Upcoming Calendar */}
            <section className="bg-bg-surface rounded-2xl p-5 border border-border-base/50 shadow-sm mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-text-base tracking-tight">Upcoming</h2>
                <CalendarIcon className="w-4 h-4 text-accent" />
              </div>
              <div className="space-y-4">
                {[
                  { title: "Downtown Run Club", time: "Tomorrow, 7:00 AM", type: "meetup" },
                  { title: "Weekend Warrior Hike", time: "Saturday, 8:00 AM", type: "meetup" },
                  { title: "Yoga Flow Challenge Ends", time: "Next Friday", type: "challenge" },
                ].map((event, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-l-2 border-accent pl-3">
                    <p className="text-xs font-semibold">{event.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
                      <Clock className="w-3 h-3" /> {event.time} 
                      <span className="px-1.5 py-[1px] rounded bg-bg-surface-hover/80 uppercase tracking-widest text-[8px] ml-1">{event.type}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 h-8 text-xs rounded-xl font-medium border-border-base/50">View Full Calendar</Button>
            </section>

            {/* Active Challenges */}
            {filteredChallenges.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-text-base tracking-tight">Active Challenges</h2>
                  <Link to="/challenges" className="text-[11px] text-text-muted font-medium hover:text-text-base transition-colors">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]">View All</Button>
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {filteredChallenges.map(challenge => (
                    <div key={challenge.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-bg-surface-hover rounded-full">
                            <Trophy className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-medium text-text-base text-sm">
                              <Highlight text={challenge.title} highlight={searchQuery} />
                            </h3>
                            <p className="text-[11px] text-text-muted mt-0.5">{challenge.participants} Active Users</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {challenge.daysLeft}d left
                        </span>
                      </div>
                      <div className="w-full bg-bg-surface-hover h-1 rounded-full mb-2 overflow-hidden">
                        <div className="bg-accent h-full rounded-full" style={{ width: `${challenge.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-medium">
                        <span className="text-text-muted">Progress</span>
                        <span className="text-text-base">{challenge.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Local Meetups */}
            {filteredMeetups.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-text-base tracking-tight">Local Meetups</h2>
                  <button className="text-[11px] text-text-muted font-medium hover:text-text-base transition-colors">See Map</button>
                </div>
                <div className="space-y-2.5">
                  {filteredMeetups.map(meetup => (
                    <div key={meetup.id} className="bg-bg-surface p-3.5 rounded-2xl border border-border-base/50 flex gap-3 items-center shadow-sm">
                      <div className="flex flex-col items-center justify-center bg-bg-surface-hover rounded-xl px-2.5 py-2 min-w-[60px]">
                        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{meetup.time.split(',')[0]}</span>
                        <span className="text-sm font-semibold text-text-base mt-0.5">{meetup.time.split(' ')[1]}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-text-base text-sm mb-1.5">
                          <Highlight text={meetup.title} highlight={searchQuery} />
                        </h3>
                        <ul className="list-none space-y-1">
                          <li className="flex items-center justify-between text-[11px]">
                            <span className="text-text-muted flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Location</span>
                            <span className="text-text-base font-medium">
                              <Highlight text={meetup.location} highlight={searchQuery} />
                            </span>
                          </li>
                          <li className="flex items-center justify-between text-[11px]">
                            <span className="text-text-muted flex items-center gap-1.5"><Users className="w-3 h-3"/> Status</span>
                            <span className="text-text-base font-medium">{meetup.attendees} Confirmed</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.div>

        {filteredPals.length === 0 && filteredChallenges.length === 0 && filteredMeetups.length === 0 && searchQuery && (
          <div className="text-center py-12 px-4 rounded-2xl border border-border-base bg-bg-surface mt-8">
            <p className="text-text-muted text-sm font-medium">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
