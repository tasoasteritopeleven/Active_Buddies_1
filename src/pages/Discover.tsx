import { useMemo, useState } from "react"
import { Search as SearchIcon, SearchX, SlidersHorizontal, MapPin, Clock, Target, UserPlus, Check, ShieldCheck, Loader2, Users } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Link } from "react-router-dom"
import { useMatchSuggestions, useSendConnectionRequest, type MatchSuggestion } from "../lib/api"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Star } from "lucide-react"

/**
 * Flattened shape used by the UI. The backend returns `MatchSuggestion` —
 * we adapt it here so the rest of the render code doesn't need to know about
 * nullable fields or the firstName/lastName split.
 */
interface PalView {
  id: string
  name: string
  image: string
  isPro: boolean
  matchScore: number
  goals: string
  schedule: string
  location: string
  fitnessLevel: string | null
  sharedGoals: string[]
}

function toPalView(s: MatchSuggestion): PalView {
  const name =
    [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
    s.email.split("@")[0]
  return {
    id: s.userId,
    name,
    image: s.avatarUrl ?? `https://i.pravatar.cc/150?u=${s.userId}`,
    isPro: false,
    matchScore: s.matchScore,
    goals: s.goals.length > 0 ? s.goals.join(", ") : "Not set",
    // Presence + schedule are not in the backend yet — placeholders for now.
    schedule: s.fitnessLevel ?? "Flexible",
    location: s.locationCity ?? "—",
    fitnessLevel: s.fitnessLevel,
    sharedGoals: s.sharedGoals,
  }
}

export function Discover() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState("Best Match")

  const { data, isLoading, error } = useMatchSuggestions(50, 0)
  const connect = useSendConnectionRequest()
  // Local optimistic map: userId -> has-been-requested (until query refetch).
  const [requested, setRequested] = useState<Set<string>>(new Set())

  const pals = useMemo<PalView[]>(() => (data ?? []).map(toPalView), [data])

  const filteredPals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const out = q
      ? pals.filter(
          (p) => p.name.toLowerCase().includes(q) || p.goals.toLowerCase().includes(q),
        )
      : pals
    return [...out].sort((a, b) => {
      if (sortOption === "Same Goals") return b.sharedGoals.length - a.sharedGoals.length
      // Nearby / Same Schedule have no backend equivalents yet — fall back to match score.
      return b.matchScore - a.matchScore
    })
  }, [pals, searchQuery, sortOption])

  const [connectingId, setConnectingId] = useState<string | null>(null)

  const handleConnect = (id: string) => {
    if (requested.has(id) || connect.isPending) return
    setConnectingId(id)
    connect.mutate(
      { userId: id },
      {
        onSuccess: () => {
          setRequested((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
          })
          setConnectingId(null)
        },
        onError: () => {
          setConnectingId(null)
        },
      },
    )
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
        <p className="text-sm text-red-500">Failed to load suggestions: {error.message}</p>
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
              <div className="py-6 text-center text-sm text-text-muted">
                Activity, distance &amp; accountability filters are coming soon.
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
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-base text-base tracking-tight">
                            {pal.name}
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
                      variant={requested.has(pal.id) ? "outline" : "default"}
                      disabled={requested.has(pal.id) || connectingId === pal.id}
                      className={`flex-1 rounded-full text-xs font-medium h-10 transition-all ${requested.has(pal.id) ? 'border-accent/50 text-accent bg-accent/10' : ''}`}
                    >
                      {requested.has(pal.id) ? (
                        <><Check className="w-4 h-4 mr-2" /> Requested</>
                      ) : (
                        <><UserPlus className="w-4 h-4 mr-2" /> Connect</>
                      )}
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
