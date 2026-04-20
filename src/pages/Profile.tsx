import { useState, useMemo } from "react"
import { Settings, Award, Activity, Calendar, Flame, Dumbbell, Target, TrendingUp, Moon, Sun, MapPin, Users, Plus, Star, ShieldCheck, Loader2, Filter, ArrowUpDown } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useTheme } from "../components/theme-provider"
import { ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip, Bar, ComposedChart } from "recharts"
import { useMe, useUpdateMe } from "../lib/api"

export function Profile() {
  const { theme, setTheme } = useTheme()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSetGoalOpen, setIsSetGoalOpen] = useState(false)
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false)
  
  const [historySortKey, setHistorySortKey] = useState<"type" | "duration" | "calories" | "date">("date")
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc")
  const [historyFilter, setHistoryFilter] = useState("All")
  const [durationFilter, setDurationFilter] = useState("All")
  const [calorieFilter, setCalorieFilter] = useState("All")

  // Real API hook for user profile
  const { data: me, isLoading } = useMe()

  // Merge real user data with mock enrichment for fields the backend doesn't have yet
  const profile = useMemo(() => {
    if (!me) return null
    return {
      name: [me.firstName, me.lastName].filter(Boolean).join(" ") || "User",
      image: me.avatarUrl,
      bio: me.bio || "No bio yet.",
      location: me.locationCity || "Unknown",
      fitnessLevel: me.fitnessLevel || "Intermediate",
      isPro: me.isVerified,
      // Mock enrichment — to be replaced when backend endpoints exist
      username: `@${(me.firstName ?? "user").toLowerCase()}`,
      joinDate: new Date(me.createdAt).toLocaleDateString("en", { month: "short", year: "numeric" }),
      stats: { workouts: 142, streak: 12, level: "Pro", buddies: 8 },
      activityStreak: [true, true, true, false, true, true, false],
      interests: (me.goals ?? []).join(", ") || "Running, Yoga",
      reliabilityScore: 96,
      reviews: [
        { id: 1, author: "Maria K.", rating: 5, text: "Great workout partner!", date: "2 weeks ago" },
        { id: 2, author: "Nikos P.", rating: 5, text: "Consistent and motivating.", date: "1 month ago" },
      ],
    }
  }, [me])

  const updateMe = useUpdateMe()

  // Local edit form state (decoupled from profile to avoid mutating query cache)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const openEditModal = () => {
    if (!profile) return
    setEditForm({
      image: profile.image ?? "",
      name: profile.name,
      username: profile.username,
      location: profile.location,
      bio: profile.bio,
      interests: profile.interests,
    })
    setIsEditModalOpen(true)
  }

  const [goals, setGoals] = useState([
    { id: 1, title: "Run a Half Marathon", current: 8, target: 13.1, unit: "miles", date: "2026-05-15", desc: "You are consistent! 8 out of 12 weeks of training plan completed.", type: "distance" },
    { id: 2, title: "100 Workouts this Year", current: 45, target: 100, unit: "workouts", date: "2026-12-31", desc: "Almost halfway there. Keep pushing to reach your yearly goal.", type: "workouts" }
  ])
  const [editingGoal, setEditingGoal] = useState<any>(null)

  const rawHistoryData = [
    { id: 1, type: "Morning Run", duration: 45, calories: 420, pb: true, date: "Today", dateVal: "2026-10-16" },
    { id: 2, type: "Yoga Flow", duration: 30, calories: 150, pb: false, date: "Yesterday", dateVal: "2026-10-15" },
    { id: 3, type: "Gym - Upper Body", duration: 75, calories: 550, pb: true, date: "Oct 14", dateVal: "2026-10-14" },
    { id: 4, type: "Cycling", duration: 60, calories: 600, pb: false, date: "Oct 12", dateVal: "2026-10-12" },
  ]

  const handleSortHistory = (key: "type" | "duration" | "calories" | "date") => {
    if (historySortKey === key) {
      setHistorySortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setHistorySortKey(key)
      setHistorySortOrder("desc")
    }
  }

  const filteredAndSortedHistory = [...rawHistoryData]
    .filter(item => historyFilter === "All" || item.type.includes(historyFilter))
    .filter(item => {
      if (durationFilter === "<30") return item.duration < 30
      if (durationFilter === "30-60") return item.duration >= 30 && item.duration <= 60
      if (durationFilter === ">60") return item.duration > 60
      return true
    })
    .filter(item => {
      if (calorieFilter === "<300") return item.calories < 300
      if (calorieFilter === "300-600") return item.calories >= 300 && item.calories <= 600
      if (calorieFilter === ">600") return item.calories > 600
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (historySortKey === "type") comparison = a.type.localeCompare(b.type)
      else if (historySortKey === "duration") comparison = a.duration - b.duration
      else if (historySortKey === "calories") comparison = a.calories - b.calories
      else comparison = new Date(a.dateVal).getTime() - new Date(b.dateVal).getTime()
      
      return historySortOrder === "asc" ? comparison : -comparison
    })

  const progressData = [
    { name: 'Mon', workouts: 1, duration: 45, calories: 420 },
    { name: 'Tue', workouts: 1, duration: 30, calories: 250 },
    { name: 'Wed', workouts: 2, duration: 60, calories: 550 },
    { name: 'Thu', workouts: 0, duration: 0, calories: 0 },
    { name: 'Fri', workouts: 1, duration: 45, calories: 400 },
    { name: 'Sat', workouts: 2, duration: 90, calories: 800 },
    { name: 'Sun', workouts: 1, duration: 30, calories: 200 },
  ]

  const sharedPlans = [
    { id: 1, title: "Marathon Prep - Phase 1", buddies: ["Sarah", "Mike"], progress: 60, weeks: 4, cost: "Free" },
    { id: 2, title: "Core Crusher", buddies: ["Emma"], progress: 20, weeks: 2, cost: "Paid" },
  ]

  const handleSaveProfile = () => {
    const names = (editForm.name ?? "").trim().split(" ")
    updateMe.mutate({
      firstName: names[0] || undefined,
      lastName: names.slice(1).join(" ") || undefined,
      avatarUrl: editForm.image || undefined,
      bio: editForm.bio || undefined,
      locationCity: editForm.location || undefined,
      goals: (editForm.interests ?? "").split(",").map(s => s.trim()).filter(Boolean),
    }, {
      onSuccess: () => setIsEditModalOpen(false),
    })
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <div className="bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
              <div className="flex justify-between items-start mb-5">
          <Avatar className="w-20 h-20 border-2 border-bg-base shadow-sm bg-bg-surface-hover">
            <AvatarImage src={profile.image} />
            <AvatarFallback className="font-semibold text-xl text-text-muted">AJ</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-text-muted hover:text-text-base bg-bg-surface-hover hover:bg-border-base/50 rounded-full transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/settings" className="p-2 text-text-muted hover:text-text-base bg-bg-surface-hover hover:bg-border-base/50 rounded-full transition-colors flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-semibold tracking-tight">{profile.name}</h1>
            {profile.isPro && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-accent to-blue-500 px-2 py-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <p className="text-accent font-medium text-xs mb-2">{profile.username}</p>
          <p className="text-text-muted text-[11px] flex items-center gap-1.5 font-medium mb-2.5">
            <MapPin className="w-3 h-3" /> {profile.location}
          </p>
          <p className="text-text-muted text-xs font-medium leading-relaxed">{profile.bio}</p>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {profile.interests.split(',').map((interest, i) => (
              <span key={i} className="px-2.5 py-0.5 bg-bg-surface-hover text-text-base text-[10px] font-medium rounded-full border border-border-base/50">
                {interest.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-bg-surface rounded-2xl p-4 flex items-center gap-3 border border-border-base/50 shadow-sm overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 opacity-5"><Flame className="w-16 h-16" /></div>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="z-10">
              <div className="text-[11px] text-text-muted font-medium mb-0.5">Streak</div>
              <div className="text-xl font-bold tracking-tight">12 <span className="text-sm font-medium text-text-muted">days</span></div>
            </div>
          </div>
          
          <div className="bg-bg-surface rounded-2xl p-4 flex items-center gap-3 border border-border-base/50 shadow-sm overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 opacity-5"><Dumbbell className="w-16 h-16" /></div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5 text-blue-500" />
            </div>
            <div className="z-10">
              <div className="text-[11px] text-text-muted font-medium mb-0.5">Workouts</div>
              <div className="text-xl font-bold tracking-tight">48</div>
            </div>
          </div>
          
          <div className="bg-bg-surface rounded-2xl p-4 flex items-center gap-3 border border-border-base/50 shadow-sm overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 opacity-5"><Award className="w-16 h-16" /></div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div className="z-10">
              <div className="text-[11px] text-text-muted font-medium mb-0.5">Level</div>
              <div className="text-xl font-bold tracking-tight">24</div>
            </div>
          </div>

          <div className="bg-bg-surface rounded-2xl p-4 flex items-center gap-3 border border-border-base/50 shadow-sm overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 opacity-5"><Target className="w-16 h-16" /></div>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div className="z-10">
              <div className="text-[11px] text-text-muted font-medium mb-0.5">Reliability</div>
              <div className="text-xl font-bold tracking-tight text-green-500">{profile.reliabilityScore}%</div>
            </div>
          </div>
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full rounded-full text-xs font-medium" onClick={openEditModal}>
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Profile Picture URL</label>
                <Input 
                  value={editForm.image ?? ""} 
                  onChange={(e) => setEditForm(prev => ({...prev, image: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Name</label>
                <Input 
                  value={editForm.name ?? ""} 
                  onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Username</label>
                <Input 
                  value={editForm.username ?? ""} 
                  onChange={(e) => setEditForm(prev => ({...prev, username: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Location</label>
                <Input 
                  value={editForm.location ?? ""} 
                  onChange={(e) => setEditForm(prev => ({...prev, location: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Bio</label>
                <textarea 
                  className="w-full p-3 border border-border-base bg-bg-surface text-text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm placeholder:text-text-muted transition-all"
                  rows={3}
                  value={editForm.bio ?? ""}
                  onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">Interests (comma separated)</label>
                <Input 
                  value={editForm.interests ?? ""} 
                  onChange={(e) => setEditForm(prev => ({...prev, interests: e.target.value}))} 
                />
              </div>
              <Button className="w-full mt-4 rounded-full text-xs font-medium" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

              <div className="mt-6">
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Activity Streaks</h3>
                <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm flex justify-between items-center">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-text-muted font-medium">{day}</span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 5 ? 'bg-accent/20 text-accent' : 'bg-bg-surface-hover text-border-base'}`}>
                        {i < 5 && <Flame className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content Tabs */}
          <div className="md:col-span-8 lg:col-span-9">
            <Tabs defaultValue="journey" className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-6">
              <TabsTrigger value="journey">Journey</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          
          <TabsContent value="journey" className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-base text-sm">Recent Activity</h3>
            </div>
            <div className="relative pl-5 border-l border-border-base/50 space-y-6">
              <div className="relative">
                <div className="absolute -left-[29px] bg-bg-surface-hover p-1.5 rounded-full border-2 border-bg-base">
                  <Activity className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] text-accent font-medium mb-1">Today, 8:30 AM</p>
                  <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                    <h4 className="font-medium text-text-base text-sm mb-1.5">Completed Morning Run</h4>
                    <div className="flex gap-3 text-[11px] text-text-muted font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> 45m</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3"/> 420 kcal</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-[29px] bg-bg-surface-hover p-1.5 rounded-full border-2 border-bg-base">
                  <Award className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] text-accent font-medium mb-1">Yesterday, 6:00 PM</p>
                  <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                    <h4 className="font-medium text-text-base text-sm mb-1">Hit 10 Day Streak!</h4>
                    <p className="text-[11px] text-text-muted font-medium">Consistency is key. Keep it going!</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[29px] bg-bg-surface-hover p-1.5 rounded-full border-2 border-bg-base">
                  <Dumbbell className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] text-accent font-medium mb-1">Oct 14, 7:15 AM</p>
                  <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                    <h4 className="font-medium text-text-base text-sm mb-1.5">Gym - Upper Body</h4>
                    <div className="flex gap-3 text-[11px] text-text-muted font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> 1h 15m</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3"/> 550 kcal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[29px] bg-bg-surface-hover p-1.5 rounded-full border-2 border-bg-base">
                  <Activity className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] text-accent font-medium mb-1">Oct 12, 5:30 PM</p>
                  <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                    <h4 className="font-medium text-text-base text-sm mb-1">Joined "Downtown Run Club"</h4>
                    <p className="text-[11px] text-text-muted font-medium">Ready to meet some new running buddies!</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
              <h3 className="font-medium text-text-base text-sm flex items-center gap-1.5 mb-4">
                <Activity className="w-3.5 h-3.5 text-accent" /> Weekly Activity Overview
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={progressData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-base/50" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted" />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted" />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-base)', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--text-base)' }}
                    />
                    <Bar yAxisId="left" dataKey="workouts" name="Workouts" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (min)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm mt-4">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-text-base text-sm flex items-center gap-2 tracking-tight">
                  <Target className="w-4 h-4 text-accent" /> Personal Fitness Goals
                </h3>
                <Dialog open={isSetGoalOpen} onOpenChange={setIsSetGoalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8 font-medium border-border-base/50">
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Set Personal Goal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-muted">Goal Title</label>
                        <Input placeholder="e.g., Run a Half Marathon" className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-muted">Target Metric</label>
                        <select className="w-full p-3 rounded-xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                          <option>Distance (miles)</option>
                          <option>Weight (lbs)</option>
                          <option>Workouts (count)</option>
                          <option>Calories</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-text-muted">Current Value</label>
                          <Input type="number" placeholder="0" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-text-muted">Target Value</label>
                          <Input type="number" placeholder="13.1" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-muted">Target Date</label>
                        <Input type="date" className="rounded-xl" />
                      </div>
                      <Button className="w-full rounded-full h-11 text-sm font-medium mt-2" onClick={() => setIsSetGoalOpen(false)}>Save Goal</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal, i) => {
                  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.id} className="p-4 rounded-xl border border-border-base/30 bg-bg-base/30 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-text-base text-sm leading-tight">{goal.title}</h4>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] bg-bg-surface-hover px-2 py-0.5 rounded text-text-muted font-medium whitespace-nowrap">{goal.date}</span>
                            <Dialog open={editingGoal?.id === goal.id} onOpenChange={(open) => !open && setEditingGoal(null)}>
                              <DialogTrigger asChild>
                                <button onClick={() => setEditingGoal(goal)} className="p-1 text-text-muted hover:text-accent transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit Goal</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4" key={editingGoal?.id}>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-text-muted">Goal Title</label>
                                    <Input defaultValue={editingGoal?.title} className="rounded-xl" onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-text-muted">Current Value</label>
                                      <Input type="number" defaultValue={editingGoal?.current} className="rounded-xl" onChange={(e) => setEditingGoal({...editingGoal, current: Number(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-text-muted">Target Value</label>
                                      <Input type="number" defaultValue={editingGoal?.target} className="rounded-xl" onChange={(e) => setEditingGoal({...editingGoal, target: Number(e.target.value)})} />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-text-muted">Target Date</label>
                                    <Input type="date" defaultValue={editingGoal?.date} className="rounded-xl" onChange={(e) => setEditingGoal({...editingGoal, date: e.target.value})} />
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button variant="outline" className="w-full rounded-full h-11 text-sm font-medium border-red-500/50 text-red-500 hover:bg-red-500/10" 
                                      onClick={() => {
                                        setGoals(prev => prev.filter(g => g.id !== goal.id))
                                        setEditingGoal(null)
                                      }}>
                                      Delete Goal
                                    </Button>
                                    <Button className="w-full rounded-full h-11 text-sm font-medium" 
                                      onClick={() => {
                                        if (!editingGoal) return
                                        setGoals(prev => prev.map(g => g.id === editingGoal.id ? editingGoal : g))
                                        setEditingGoal(null)
                                      }}>
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-muted font-medium mb-3">{goal.desc}</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium text-text-muted"><span className="text-text-base font-semibold">{goal.current}</span> / {goal.target} {goal.unit}</span>
                          <span className="text-xs font-bold text-accent">{percent}%</span>
                        </div>
                        <div className="w-full bg-border-base/40 h-2 rounded-full overflow-hidden">
                          <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
              <h3 className="font-medium text-text-base text-sm flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-accent" /> Transformation
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-bg-surface-hover border border-border-base/50">
                  <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop" alt="Before" className="object-cover w-full h-full opacity-70 grayscale" />
                  <div className="absolute bottom-2 left-2 bg-bg-base/80 backdrop-blur-sm text-text-muted text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Day 1</div>
                </div>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-bg-surface-hover border border-border-base/50">
                  <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop" alt="Current" className="object-cover w-full h-full" />
                  <div className="absolute bottom-2 left-2 bg-accent text-accent-fg text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">Day 90</div>
                </div>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm mt-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
                <h3 className="font-medium text-text-base text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" /> Detailed Workout History
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-text-muted" />
                  <select 
                    className="p-1.5 py-1 text-xs rounded-lg border border-border-base/50 bg-bg-surface text-text-base focus:outline-none focus:ring-1 focus:ring-accent"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                  >
                    <option value="All">All Activities</option>
                    <option value="Run">Run</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Gym">Gym</option>
                    <option value="Cycling">Cycling</option>
                  </select>
                  <select 
                    className="p-1.5 py-1 text-xs rounded-lg border border-border-base/50 bg-bg-surface text-text-base focus:outline-none focus:ring-1 focus:ring-accent"
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                  >
                    <option value="All">All Durations</option>
                    <option value="<30">Under 30 mins</option>
                    <option value="30-60">30 - 60 mins</option>
                    <option value=">60">Over 60 mins</option>
                  </select>
                  <select 
                    className="p-1.5 py-1 text-xs rounded-lg border border-border-base/50 bg-bg-surface text-text-base focus:outline-none focus:ring-1 focus:ring-accent"
                    value={calorieFilter}
                    onChange={(e) => setCalorieFilter(e.target.value)}
                  >
                    <option value="All">All Calories</option>
                    <option value="<300">Under 300 kcal</option>
                    <option value="300-600">300 - 600 kcal</option>
                    <option value=">600">Over 600 kcal</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border-base/50 text-xs text-text-muted">
                      <th className="pb-2 font-medium cursor-pointer hover:text-text-base transition-colors" onClick={() => handleSortHistory("date")}>
                        <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-text-base transition-colors" onClick={() => handleSortHistory("type")}>
                        <div className="flex items-center gap-1">Activity Type <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-text-base transition-colors" onClick={() => handleSortHistory("duration")}>
                        <div className="flex items-center gap-1">Duration <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-text-base transition-colors" onClick={() => handleSortHistory("calories")}>
                        <div className="flex items-center gap-1">Calories <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="pb-2 font-medium">Personal Best</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredAndSortedHistory.length > 0 ? filteredAndSortedHistory.map(workout => (
                      <tr key={workout.id} className="border-b border-border-base/30 last:border-0 hover:bg-bg-surface-hover/30 transition-colors">
                        <td className="py-3 text-text-muted text-xs">
                          {workout.date}
                        </td>
                        <td className="py-3 font-medium">
                          {workout.type}
                        </td>
                        <td className="py-3 text-text-muted">
                          {workout.duration >= 60 ? `${Math.floor(workout.duration/60)}h ${workout.duration%60}m` : `${workout.duration}m`}
                        </td>
                        <td className="py-3 text-text-muted">{workout.calories} kcal</td>
                        <td className="py-3">
                          {workout.pb ? (
                            <span className="text-accent text-[10px] font-bold bg-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">Yes 🏆</span>
                          ) : (
                            <span className="text-text-muted text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-text-muted">
                          No workouts match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-text-base text-sm">Shared Workout Plans</h3>
              <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full text-xs font-medium h-8">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Shared Plan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted">Plan Title</label>
                      <Input placeholder="e.g., 30-Day Core Challenge" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted">Duration (Weeks)</label>
                      <Input type="number" placeholder="4" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted">Invite Buddies</label>
                      <div className="p-3 border border-border-base/50 rounded-xl bg-bg-surface-hover/50 flex gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-bg-surface border border-border-base rounded-full text-[11px] font-medium flex items-center gap-1">
                          Sarah <button className="text-text-muted hover:text-text-base">×</button>
                        </span>
                        <span className="px-2.5 py-1 bg-bg-surface border border-border-base rounded-full text-[11px] font-medium flex items-center gap-1">
                          Mike <button className="text-text-muted hover:text-text-base">×</button>
                        </span>
                        <Input placeholder="Search friends..." className="border-0 bg-transparent h-6 text-xs p-0 focus-visible:ring-0 min-w-[100px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted">Cost</label>
                      <select className="w-full p-3 rounded-xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                        <option>Free</option>
                        <option>Paid (Requires external payment)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted">Description / Rules</label>
                      <textarea 
                        className="w-full p-3 border border-border-base bg-bg-surface text-text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm placeholder:text-text-muted min-h-[80px]"
                        placeholder="What's the goal of this plan?"
                      />
                    </div>
                    <Button className="w-full mt-2 rounded-full text-sm font-medium h-11" onClick={() => setIsCreatePlanOpen(false)}>
                      Create & Share
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedPlans.map(plan => (
                <div key={plan.id} className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-text-base text-sm">{plan.title}</h4>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-medium text-text-muted bg-bg-surface-hover px-2 py-0.5 rounded-full">{plan.weeks} weeks</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${plan.cost === 'Free' ? 'text-green-500 bg-green-500/10' : 'text-accent bg-accent/10'}`}>{plan.cost}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[11px] text-text-muted font-medium">With {plan.buddies.join(", ")}</span>
                  </div>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-[10px] font-medium mb-1.5">
                      <span className="text-text-muted">Plan Progress</span>
                      <span className="text-accent">{plan.progress}%</span>
                    </div>
                    <div className="w-full bg-bg-surface-hover h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full rounded-full" style={{ width: `${plan.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="badges" className="grid grid-cols-2 gap-3">
            <div className="bg-bg-surface p-4 rounded-2xl border border-accent/30 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-medium text-text-base text-sm mb-0.5">10 Day Streak</h4>
              <p className="text-[10px] text-text-muted font-medium">Unlocked yesterday</p>
            </div>
            
            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm flex flex-col items-center text-center opacity-60 grayscale">
              <div className="w-10 h-10 bg-bg-surface-hover rounded-full flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-text-muted" />
              </div>
              <h4 className="font-medium text-text-base text-sm mb-0.5">Early Bird</h4>
              <p className="text-[10px] text-text-muted font-medium">5 morning workouts</p>
            </div>
            
            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm flex flex-col items-center text-center opacity-60 grayscale">
              <div className="w-10 h-10 bg-bg-surface-hover rounded-full flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-text-muted" />
              </div>
              <h4 className="font-medium text-text-base text-sm mb-0.5">Heavy Lifter</h4>
              <p className="text-[10px] text-text-muted font-medium">Log 10 gym sessions</p>
            </div>
            
            <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm flex flex-col items-center text-center opacity-60 grayscale">
              <div className="w-10 h-10 bg-bg-surface-hover rounded-full flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-text-muted" />
              </div>
              <h4 className="font-medium text-text-base text-sm mb-0.5">100 Workouts</h4>
              <p className="text-[10px] text-text-muted font-medium">Century club</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-base text-sm">Buddy Reviews</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-sm">5.0</span>
                <span className="text-xs text-text-muted">({profile.reviews.length} reviews)</span>
              </div>
            </div>
            <div className="space-y-4">
              {profile.reviews.map(review => (
                <div key={review.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-[10px]">{review.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-xs">{review.author}</h4>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-border-base'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted">{review.date}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mt-2">"{review.text}"</p>
                </div>
              ))}
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
