import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Award, Activity, Calendar, Flame, Dumbbell, Target, TrendingUp, MapPin, Clock, UserPlus, Check, ShieldCheck, Star, AlertTriangle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { api } from "../services/api"

export function PalProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requested, setRequested] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [pal, setPal] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true)
      try {
        const data = await api.getPalProfile(Number(id))
        setPal(data)
      } catch (error) {
        console.error("Failed to load pal profile", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleConnect = async () => {
    if (!pal) return;
    if (!requested) {
      await api.sendConnectionRequest(pal.id)
    }
    setRequested(!requested)
  }

  if (isLoading || !pal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="bg-bg-base min-h-screen pb-32 text-text-base">
      <header className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-bg-surface-hover rounded-full text-text-muted hover:text-text-base transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Profile</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 -mr-2 bg-bg-surface-hover rounded-full text-text-muted hover:text-text-base transition-colors flex items-center outline-none">
            <MoreVertical className="w-5 h-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer">
              <AlertTriangle className="w-4 h-4 mr-2" /> Report User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="p-6 pt-2">
        <div className="flex items-start justify-between mb-6">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-bg-surface shadow-sm">
              <AvatarImage src={pal.image} />
              <AvatarFallback className="bg-bg-surface-hover text-text-muted text-xl font-medium">{pal.name[0]}</AvatarFallback>
            </Avatar>
            {pal.online && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-accent border-2 border-bg-base rounded-full shadow-sm" />
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                // Mock nudge action
                const btn = e.currentTarget;
                btn.classList.add('bg-accent/10', 'text-accent', 'border-accent/50');
                btn.querySelector('svg')?.classList.add('animate-bounce');
                setTimeout(() => {
                  btn.classList.remove('bg-accent/10', 'text-accent', 'border-accent/50');
                  btn.querySelector('svg')?.classList.remove('animate-bounce');
                }, 2000);
              }}
              className="rounded-full border-transparent h-9 w-9 transition-all bg-bg-surface-hover text-text-muted hover:text-accent hover:bg-accent/10"
              title="Send a nudge"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </Button>
            <Button 
              onClick={handleConnect}
              variant={requested ? "outline" : "default"}
              className={`rounded-full h-9 px-5 text-xs font-medium transition-all ${requested ? 'border-accent/50 text-accent bg-accent/10' : ''}`}
            >
              {requested ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Requested</> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Connect</>}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-text-base flex items-center gap-2">
              {pal.name}
            </h2>
            {pal.isPro && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-accent to-blue-500 px-2 py-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted font-medium mb-3">{pal.username}</p>
          <p className="text-sm text-text-base leading-relaxed mb-4">{pal.bio}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base/50 text-[11px] font-medium text-text-muted">
              <MapPin className="w-3 h-3" /> {pal.location}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base/50 text-[11px] font-medium text-text-muted">
              <Clock className="w-3 h-3" /> {pal.schedule}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base/50 text-[11px] font-medium text-text-muted">
              <Target className="w-3 h-3" /> {pal.goals}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-bg-surface p-3 rounded-2xl border border-border-base/50 text-center shadow-sm">
            <Activity className="w-4 h-4 text-accent mx-auto mb-1.5" />
            <div className="text-lg font-bold text-text-base">{pal.stats.workouts}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Workouts</div>
          </div>
          <div className="bg-bg-surface p-3 rounded-2xl border border-border-base/50 text-center shadow-sm">
            <Flame className="w-4 h-4 text-accent mx-auto mb-1.5" />
            <div className="text-lg font-bold text-text-base">{pal.stats.streak}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Streak</div>
          </div>
          <div className="bg-bg-surface p-3 rounded-2xl border border-border-base/50 text-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1.5" />
            <div className="text-lg font-bold text-text-base">{pal.stats.level}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Level</div>
          </div>
          <div className="bg-bg-surface p-3 rounded-2xl border border-border-base/50 text-center shadow-sm">
            <Star className="w-4 h-4 text-green-500 mx-auto mb-1.5" />
            <div className="text-lg font-bold text-green-500">{pal.reliabilityScore}%</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Reliability</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Recent Activity Streaks</h3>
          <div className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm flex justify-between items-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-text-muted font-medium">{day}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 4 ? 'bg-accent/20 text-accent' : 'bg-bg-surface-hover text-border-base'}`}>
                  {i < 4 && <Flame className="w-3.5 h-3.5" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Buddy Reviews</h3>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-xs">5.0</span>
            </div>
          </div>
          <div className="space-y-3">
            {pal.reviews.map(review => (
              <div key={review.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base/50 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-[10px]">{review.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-xs">{review.author}</h4>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-border-base'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-text-muted">{review.date}</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mt-1.5">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
