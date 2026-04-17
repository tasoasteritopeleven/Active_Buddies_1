import { Outlet, Link, useLocation } from "react-router-dom"
import { Home, Search, MessageCircle, User, Plus, Image as ImageIcon, Moon, Sun, Palette, Users, Trophy, BookOpen, Info, Bell, Calendar, UserPlus } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useTheme } from "./theme-provider"
import { api } from "../services/api"
import { motion, AnimatePresence } from "motion/react"

export function Layout() {
  const location = useLocation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.getHomeData()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error("Failed to load notifications", error)
      }
    }
    loadNotifications()
    const intervalId = setInterval(loadNotifications, 10000)
    return () => clearInterval(intervalId)
  }, [])

  const desktopNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: Users, label: "Communities", path: "/communities" },
    { icon: Trophy, label: "Challenges", path: "/challenges" },
    { icon: BookOpen, label: "Experts", path: "/experts" },
    { icon: MessageCircle, label: "Chats", path: "/chats" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Info, label: "About Us", path: "/about" },
  ]

  const mobileNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: Users, label: "Communities", path: "/communities" },
    { icon: User, label: "Profile", path: "/profile" },
  ]

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("sport")
    else setTheme("light")
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-bg-base overflow-hidden text-text-base relative">
        {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border-base/50 bg-bg-surface/50 p-6 backdrop-blur-xl z-40">
        <div className="mb-8 px-2 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">Active<span className="text-accent">Buddies</span></h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative p-2 text-text-muted hover:text-text-base transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-bg-surface">{notifications.length}</span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">No new notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 rounded-2xl border border-border-base bg-bg-surface flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          {notif.type === "friend_request" && notif.userImage && (
                            <Avatar className="w-10 h-10 border border-border-base/50">
                              <AvatarImage src={notif.userImage} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          )}
                          {notif.type === "challenge" && (
                            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                              <Trophy className="w-5 h-5" />
                            </div>
                          )}
                          {notif.type === "meetup" && (
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                              <Calendar className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-0.5 text-text-base leading-tight">{notif.message}</p>
                          <p className="text-[11px] font-medium text-text-muted">{notif.time}</p>
                          {notif.type === "friend_request" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1 rounded-full text-xs font-semibold h-8 bg-accent text-accent-fg hover:bg-accent/90">Accept</Button>
                              <Button size="sm" variant="outline" className="flex-1 rounded-full text-xs font-medium h-8 border-border-base/50">Decline</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <button 
              onClick={cycleTheme}
              className="p-2 bg-bg-surface border border-border-base/50 rounded-full shadow-sm text-text-muted hover:text-text-base transition-colors"
            >
              {theme === "light" ? <Sun className="w-4 h-4" /> : theme === "dark" ? <Moon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {desktopNavItems.map(item => (
            <Tooltip key={item.path} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link 
                  to={item.path} 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm", 
                    location.pathname === item.path ? "bg-bg-surface-hover text-text-base" : "text-text-muted hover:text-text-base hover:bg-bg-surface-hover/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="md:inline hidden lg:inline">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={16} className="hidden md:block lg:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-full h-12 gap-2 mt-4 shadow-sm font-medium">
              <Plus className="w-5 h-5" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="workout" className="w-full mt-2">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="workout">Workout</TabsTrigger>
                <TabsTrigger value="post">Post</TabsTrigger>
              </TabsList>
              
              <TabsContent value="workout" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {["Gym", "Run", "Walk", "Yoga"].map((activity) => (
                    <Button key={activity} variant="outline" className="h-14 flex flex-col gap-1 font-medium rounded-2xl border-border-base/50">
                      {activity}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Duration (min)</label>
                    <Input type="number" placeholder="45" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Calories</label>
                    <Input type="number" placeholder="350" className="rounded-xl h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Intensity</label>
                  <div className="flex gap-2">
                    {["Low", "Medium", "High", "Max"].map(level => (
                      <button key={level} className="flex-1 py-2 rounded-xl border border-border-base/50 text-xs font-medium hover:border-accent hover:text-accent transition-colors">
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="personalBestDesktop" className="rounded border-border-base/50 text-accent focus:ring-accent" />
                  <label htmlFor="personalBestDesktop" className="text-xs font-medium text-text-base">This was a Personal Best! 🏆</label>
                </div>
                <textarea 
                  className="w-full min-h-[80px] p-4 border border-border-base/50 bg-bg-surface text-sm text-text-base rounded-2xl focus:outline-none focus:ring-1 focus:ring-border-base placeholder:text-text-muted resize-none shadow-sm"
                  placeholder="Add detailed notes about your workout..."
                />
                <Button className="w-full rounded-full h-11 text-sm font-medium" onClick={() => setIsCreateModalOpen(false)}>Save Workout</Button>
              </TabsContent>

              <TabsContent value="post" className="space-y-4">
                <textarea 
                  className="w-full min-h-[120px] p-4 border border-border-base/50 bg-bg-surface text-sm text-text-base rounded-2xl focus:outline-none focus:ring-1 focus:ring-border-base placeholder:text-text-muted resize-none shadow-sm"
                  placeholder="Share your fitness journey, tips, or ask a question..."
                />
                <div className="flex justify-between items-center">
                  <button className="p-2 text-text-muted hover:text-accent bg-bg-surface-hover rounded-full transition-colors border border-border-base/50">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <Button className="rounded-full h-10 px-6 text-sm font-medium" onClick={() => setIsCreateModalOpen(false)}>Post</Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center p-4 bg-bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-border-base/50 shrink-0">
          <h1 className="text-xl font-bold tracking-tight">Active<span className="text-accent">Buddies</span></h1>
          <div className="flex items-center gap-2">
            <Link to="/chats" className="relative p-2 text-text-muted hover:text-text-base transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-bg-surface"></span>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative p-2 text-text-muted hover:text-text-base transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-bg-surface">{notifications.length}</span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto w-[90vw] rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">No new notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 rounded-2xl border border-border-base bg-bg-surface flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          {notif.type === "friend_request" && notif.userImage && (
                            <Avatar className="w-10 h-10 border border-border-base/50">
                              <AvatarImage src={notif.userImage} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          )}
                          {notif.type === "challenge" && (
                            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                              <Trophy className="w-5 h-5" />
                            </div>
                          )}
                          {notif.type === "meetup" && (
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                              <Calendar className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-0.5 text-text-base leading-tight">{notif.message}</p>
                          <p className="text-[11px] font-medium text-text-muted">{notif.time}</p>
                          {notif.type === "friend_request" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1 rounded-full text-xs font-semibold h-8 bg-accent text-accent-fg hover:bg-accent/90">Accept</Button>
                              <Button size="sm" variant="outline" className="flex-1 rounded-full text-xs font-medium h-8 border-border-base/50">Decline</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <button 
              onClick={cycleTheme}
              className="p-2 text-text-muted hover:text-text-base transition-colors"
            >
              {theme === "light" ? <Sun className="w-5 h-5" /> : theme === "dark" ? <Moon className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 w-full">
          <div className="w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-gradient-to-t from-bg-base via-bg-base to-transparent pt-10 pb-4 px-6 z-50">
        <nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-base/40 rounded-full px-5 py-2.5 flex justify-between items-center shadow-sm">
          {mobileNavItems.slice(0, 2).map((item) => (
            <Tooltip key={item.path} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors",
                    location.pathname === item.path ? "text-text-base" : "text-text-muted hover:text-text-base"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
             </TooltipTrigger>
             <TooltipContent side="top" sideOffset={16}>
               {item.label}
             </TooltipContent>
            </Tooltip>
          ))}

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <button className="bg-text-base text-bg-base p-2.5 rounded-full shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-text-base focus:ring-offset-2 focus:ring-offset-bg-base">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="workout" className="w-full mt-2">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="workout">Workout</TabsTrigger>
                  <TabsTrigger value="post">Post</TabsTrigger>
                </TabsList>
                
                <TabsContent value="workout" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted">Activity Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Gym", "Run", "Walk", "Yoga"].map((activity) => (
                        <Button key={activity} variant="outline" className="h-10 flex flex-col gap-1 text-xs font-medium rounded-xl border-border-base/50">
                          {activity}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted">Duration (min)</label>
                      <Input type="number" placeholder="45" className="rounded-xl h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted">Calories</label>
                      <Input type="number" placeholder="350" className="rounded-xl h-10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Intensity</label>
                    <div className="flex gap-2">
                      {["Low", "Medium", "High", "Max"].map(level => (
                        <button key={level} className="flex-1 py-2 rounded-xl border border-border-base/50 text-xs font-medium hover:border-accent hover:text-accent transition-colors">
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="personalBestMobile" className="rounded border-border-base/50 text-accent focus:ring-accent" />
                    <label htmlFor="personalBestMobile" className="text-xs font-medium text-text-base">This was a Personal Best! 🏆</label>
                  </div>
                  <textarea 
                    className="w-full min-h-[80px] p-4 border border-border-base/50 bg-bg-surface text-sm text-text-base rounded-2xl focus:outline-none focus:ring-1 focus:ring-border-base placeholder:text-text-muted resize-none shadow-sm"
                    placeholder="Add detailed notes about your workout..."
                  />
                  <Button className="w-full rounded-full h-11 text-sm font-medium" onClick={() => setIsCreateModalOpen(false)}>Save Workout</Button>
                </TabsContent>

                <TabsContent value="post" className="space-y-4">
                  <textarea 
                    className="w-full min-h-[120px] p-4 border border-border-base/50 bg-bg-surface text-sm text-text-base rounded-2xl focus:outline-none focus:ring-1 focus:ring-border-base placeholder:text-text-muted resize-none shadow-sm"
                    placeholder="Share your fitness journey, tips, or ask a question..."
                  />
                  <div className="flex justify-between items-center">
                    <button className="p-2 text-text-muted hover:text-accent bg-bg-surface-hover rounded-full transition-colors border border-border-base/50">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <Button className="rounded-full h-10 px-6 text-sm font-medium" onClick={() => setIsCreateModalOpen(false)}>Post</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {mobileNavItems.slice(2, 4).map((item) => (
            <Tooltip key={item.path} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors",
                    location.pathname === item.path ? "text-text-base" : "text-text-muted hover:text-text-base"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
             </TooltipTrigger>
             <TooltipContent side="top" sideOffset={16}>
               {item.label}
             </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </div>
    </div>
    </TooltipProvider>
  )
}
