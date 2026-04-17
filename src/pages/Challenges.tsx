import { useState, useEffect } from "react"
import { Search, Trophy, Flame, Target, Users, Plus, Medal, Loader2 } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { api } from "../services/api"

export function Challenges() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [challenges, setChallenges] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getChallenges()
        setChallenges(data)
      } catch (error) {
        console.error("Failed to load challenges", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Challenges</h1>
            <p className="text-sm text-text-muted font-medium">Compete, earn badges, and push your limits.</p>
          </div>
          <Button className="rounded-full gap-2 hidden md:flex"><Plus className="w-4 h-4"/> New Challenge</Button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Active Challenges</h2>
              <Button className="rounded-full w-10 h-10 p-0 md:hidden shrink-0"><Plus className="w-5 h-5"/></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {challenges.map(challenge => (
                <div key={challenge.id} className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent/10 rounded-2xl">
                        <Trophy className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-base">{challenge.title}</h3>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">{challenge.type} • {challenge.participants} joined</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-medium text-text-muted">Progress</span>
                    <span className="text-[11px] font-bold text-accent">{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-bg-surface-hover h-2 rounded-full mb-3 overflow-hidden">
                    <div className="bg-accent h-full rounded-full transition-all duration-1000" style={{ width: `${challenge.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-text-muted flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500"/> {challenge.daysLeft} days left</span>
                    <span className="text-accent flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full"><Medal className="w-3.5 h-3.5"/> Rank #{challenge.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">Global Leaderboard</h2>
            <div className="bg-bg-surface rounded-2xl border border-border-base/50 shadow-sm p-5 space-y-5">
              {[1, 2, 3, 4, 5, 6, 7].map((rank) => (
                <div key={rank} className="flex items-center gap-4">
                  <span className={`text-sm font-bold w-5 text-center ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-600' : 'text-text-muted'}`}>
                    {rank}
                  </span>
                  <Avatar className="w-10 h-10 border border-border-base/50 shadow-sm">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${rank + 20}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">User {rank}</h4>
                    <p className="text-[10px] text-text-muted font-medium">Level {30 - rank}</p>
                  </div>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">{1000 - rank * 50} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
