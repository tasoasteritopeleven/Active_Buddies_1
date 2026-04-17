import { useState, useEffect } from "react"
import { Search as SearchIcon, SearchX, SlidersHorizontal, MapPin, Clock, Target, UserPlus, Check, ShieldCheck, Loader2, Users } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Link } from "react-router-dom"
import { api } from "../services/api"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Star } from "lucide-react"

export function Discover() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activityFilter, setActivityFilter] = useState("All")
  const [distanceFilter, setDistanceFilter] = useState("Any")
  const [accountabilityFilter, setAccountabilityFilter] = useState("Any")
  const [sortOption, setSortOption] = useState("Best Match")
  const [requested, setRequested] = useState<number[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [allPals, setAllPals] = useState<any[]>([])

  // Mock current user profile for matching
  const currentUser = {
    activity: "Running",
    schedule: "Mornings",
    style: "Strict",
    goals: "Marathon training"
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const pals = await api.getDiscoverPals()
        
        // Calculate match scores
        const palsWithScores = pals.map(pal => {
          let score = 50; // Base score
          if (pal.activity === currentUser.activity) score += 20;
          if (pal.schedule === currentUser.schedule) score += 15;
          if (pal.style === currentUser.style) score += 10;
          if (pal.distance <= 3) score += 5;
          if (pal.goals.toLowerCase().includes("marathon") && currentUser.goals.toLowerCase().includes("marathon")) score += 10;
          
          return { ...pal, matchScore: Math.min(score, 100) };
        })
        
        setAllPals(palsWithScores)
      } catch (error) {
        console.error("Failed to load discover pals", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Simulate real-time status updates
  useEffect(() => {
    if (allPals.length === 0) return;
    const interval = setInterval(() => {
      setAllPals(currentPals => currentPals.map(pal => {
        if (Math.random() > 0.8) { // 20% chance to toggle status
          return { ...pal, online: !pal.online, lastActive: pal.online ? "Just now" : "Now" }
        }
        return pal
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [allPals.length])

  const filteredPals = allPals.filter(pal => {
    const matchesSearch = pal.name.toLowerCase().includes(searchQuery.toLowerCase()) || pal.goals.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesActivity = activityFilter === "All" || pal.activity === activityFilter
    const matchesDistance = distanceFilter === "Any" || 
      (distanceFilter === "< 1 mile" && pal.distance < 1) ||
      (distanceFilter === "< 5 miles" && pal.distance < 5) ||
      (distanceFilter === "< 10 miles" && pal.distance < 10)
    const matchesStyle = accountabilityFilter === "Any" || pal.style === accountabilityFilter
    
    return matchesSearch && matchesActivity && matchesDistance && matchesStyle
  }).sort((a, b) => {
    if (sortOption === "Best Match") return b.matchScore - a.matchScore;
    if (sortOption === "Nearby") return a.distance - b.distance;
    if (sortOption === "Same Schedule") return a.schedule === currentUser.schedule ? -1 : 1;
    if (sortOption === "Same Goals") return b.matchScore - a.matchScore; // Simplified
    return 0;
  })

  const handleConnect = async (id: number) => {
    if (requested.includes(id)) {
      // Logic to cancel request could go here
      setRequested(requested.filter(r => r !== id))
    } else {
      await api.sendConnectionRequest(id)
      setRequested([...requested, id])
    }
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
          <h1 className="text-2xl font-bold tracking-tight mb-1">Discover <span className="text-accent">Pals</span></h1>
          <p className="text-sm text-text-muted font-medium">Find your perfect workout partner</p>
        </header>

        <div className="flex gap-2.5">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <Input 
              className="pl-10 bg-bg-surface border-border-base/50 rounded-full text-sm text-text-base placeholder:text-text-muted font-medium h-11 shadow-sm focus-visible:ring-1 focus-visible:ring-border-base" 
              placeholder="Search by name or goals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shrink-0 bg-bg-surface border-border-base/50 h-11 w-11 shadow-sm">
                <SlidersHorizontal className="w-4 h-4 text-text-muted" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">Activity Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Running", "Yoga", "Cycling", "Gym"].map(type => (
                      <button 
                        key={type} 
                        onClick={() => setActivityFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${activityFilter === type ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">Distance</label>
                  <div className="flex flex-wrap gap-2">
                    {["Any", "< 1 mile", "< 5 miles", "< 10 miles"].map(range => (
                      <button 
                        key={range} 
                        onClick={() => setDistanceFilter(range)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${distanceFilter === range ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">Accountability Style</label>
                  <div className="flex flex-wrap gap-2">
                    {["Any", "Gentle", "Structured", "Strict", "Competitive"].map(style => (
                      <button 
                        key={style} 
                        onClick={() => setAccountabilityFilter(style)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${accountabilityFilter === style ? "bg-text-base text-bg-base border-text-base" : "bg-bg-surface border-border-base/50 text-text-muted hover:border-text-muted"}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full rounded-full h-11 text-sm font-medium mt-4">Apply Filters</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="pals" className="w-full mt-6">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-bg-surface border border-border-base/50 h-10 p-1 rounded-full flex gap-1">
              <TabsTrigger value="pals" className="rounded-full text-xs px-4">Workout Pals</TabsTrigger>
              <TabsTrigger value="coaches" className="rounded-full text-xs px-4">Certified Coaches</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {["Best Match", "Nearby", "Same Schedule", "Same Goals"].map((filter) => (
                <button 
                  key={filter} 
                  onClick={() => setSortOption(filter)}
                  className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-full transition-colors ${sortOption === filter ? 'bg-text-base text-bg-base' : 'bg-bg-surface text-text-muted hover:text-text-base hover:bg-bg-surface-hover border border-border-base/50'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <TabsContent value="pals" className="space-y-3">
            {filteredPals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredPals.map((pal) => (
                <div key={pal.id} className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-border-base/30">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border border-border-base/50 shadow-sm">
                          <AvatarImage src={pal.image} />
                          <AvatarFallback className="bg-bg-surface-hover text-text-muted font-medium text-sm">{pal.name[0]}</AvatarFallback>
                        </Avatar>
                        {pal.online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent border-2 border-bg-surface rounded-full shadow-sm" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-base text-base tracking-tight flex items-center gap-2">
                            {pal.name}
                            {!pal.online && <span className="text-xs text-text-muted font-normal">{pal.lastActive}</span>}
                          </h3>
                          {pal.isPro && (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-accent to-blue-500 px-1.5 py-0.5 rounded-full shadow-sm">
                              <ShieldCheck className="w-2.5 h-2.5" /> Pro
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-accent text-xs font-medium mt-1">
                          <Target className="w-3.5 h-3.5" /> {pal.matchScore}% Match
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="list-none space-y-3 mb-6 flex-1">
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-2"><Target className="w-4 h-4" /> Goals</span>
                      <span className="text-text-base font-medium truncate max-w-[150px] text-right">{pal.goals}</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</span>
                      <span className="text-text-base font-medium">{pal.schedule}</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-text-muted flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                      <span className="text-text-base font-medium">{pal.location}</span>
                    </li>
                  </ul>

                  <div className="flex gap-3 mt-auto">
                    <Button 
                      onClick={() => handleConnect(pal.id)}
                      variant={requested.includes(pal.id) ? "outline" : "default"}
                      className={`flex-1 rounded-full text-xs font-medium h-10 transition-all ${requested.includes(pal.id) ? 'border-accent/50 text-accent bg-accent/10' : ''}`}
                    >
                      {requested.includes(pal.id) ? <><Check className="w-4 h-4 mr-2" /> Requested</> : <><UserPlus className="w-4 h-4 mr-2" /> Connect</>}
                    </Button>
                    <Link to={`/user/${pal.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-full text-xs font-medium h-10 border-border-base/50">View Profile</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-border-base/50 bg-bg-surface shadow-sm mt-8">
              <div className="bg-bg-surface-hover w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-base font-semibold text-text-base tracking-tight mb-2">No pals found</h3>
              <p className="text-text-muted text-sm font-medium mb-6">We couldn't find anyone matching your search.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-full text-sm font-medium h-10 px-6 border-border-base/50">
                Clear Search
              </Button>
            </div>
          )}
          </TabsContent>

          <TabsContent value="coaches" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mt-4">
              {[
                { id: "c1", name: "Marcus Johnson", type: "Strength & Conditioning", rating: 4.9, activeUsers: 24, image: "https://i.pravatar.cc/150?u=coach1" },
                { id: "c2", name: "Dr. Elena Smith", type: "Physical Therapy & Yoga", rating: 5.0, activeUsers: 14, image: "https://i.pravatar.cc/150?u=coach2" },
                { id: "c3", name: "Jake Williams", type: "Marathon Prep", rating: 4.8, activeUsers: 30, image: "https://i.pravatar.cc/150?u=coach3" }
              ].map((coach) => (
                <div key={coach.id} className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col h-full group">
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-border-base/30">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border border-border-base/50 shadow-sm">
                        <AvatarImage src={coach.image} />
                        <AvatarFallback>{coach.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-text-base text-sm tracking-tight flex items-center gap-1.5">{coach.name} <span className="text-[10px] bg-accent/10 text-accent px-1.5 rounded-full uppercase tracking-wider font-bold">Pro</span></h3>
                        <p className="text-[11px] font-medium text-text-muted mt-0.5">{coach.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto mb-5 border border-border-base/30 bg-bg-base/50 rounded-xl p-3">
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-text-muted"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Rating</span>
                      <span className="text-xs font-semibold text-text-base">{coach.rating} / 5.0</span>
                    </span>
                    <span className="flex flex-col gap-0.5 text-right">
                      <span className="flex items-center justify-end gap-1 text-[11px] text-text-muted"><Users className="w-3 h-3" /> Active</span>
                      <span className="text-xs font-semibold text-text-base">{coach.activeUsers} Trainees</span>
                    </span>
                  </div>
                  <Link to={`/user/${coach.id.replace('c', '')}`}>
                    <Button className="w-full rounded-xl h-10 text-xs font-medium  transition-colors mt-auto">
                      View Profile & Programs
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
