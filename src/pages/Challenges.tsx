import { Trophy, Flame, Users, Plus, Medal, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { useChallenges, useJoinChallenge, type Challenge } from "../lib/api"

/** Whole days remaining until the challenge end date (floored, never negative). */
function daysLeft(endDate: string): number {
  const diffMs = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Simple progress approximation: elapsed-time / total-time of the challenge
 * window. When the backend ships per-participant progress + target this can
 * swap to the user's real progress percentage.
 */
function timeProgress(challenge: Challenge): number {
  const start = new Date(challenge.startDate).getTime()
  const end = new Date(challenge.endDate).getTime()
  if (end <= start) return 0
  const pct = ((Date.now() - start) / (end - start)) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export function Challenges() {
  const { data, isLoading, error } = useChallenges({ status: "active" })
  const join = useJoinChallenge()

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
        <p className="text-sm text-red-500">Failed to load challenges: {error.message}</p>
      </div>
    )
  }

  const challenges: Challenge[] = data?.items ?? []

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
            {challenges.length === 0 ? (
              <div className="text-center py-16 text-sm text-text-muted">
                No active challenges yet — create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {challenges.map((challenge) => {
                  const progress = timeProgress(challenge)
                  const joinPending = join.isPending && join.variables === challenge.id
                  return (
                    <div
                      key={challenge.id}
                      className="bg-bg-surface p-5 rounded-2xl border border-border-base/50 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-accent/10 rounded-2xl">
                            <Trophy className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-base">{challenge.title}</h3>
                            <p className="text-xs text-text-muted mt-0.5 font-medium">
                              {challenge.challengeType ?? "CUSTOM"} • {challenge.participantsCount} joined
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs h-8 px-3"
                          disabled={joinPending}
                          onClick={() => join.mutate(challenge.id)}
                        >
                          {joinPending ? "Joining..." : "Join"}
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-medium text-text-muted">Progress</span>
                        <span className="text-[11px] font-bold text-accent">{progress}%</span>
                      </div>
                      <div className="w-full bg-bg-surface-hover h-2 rounded-full mb-3 overflow-hidden">
                        <div
                          className="bg-accent h-full rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-text-muted flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-500" /> {daysLeft(challenge.endDate)} days left
                        </span>
                        {challenge.targetValue !== null && (
                          <span className="text-accent flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full">
                            <Medal className="w-3.5 h-3.5" /> Goal {challenge.targetValue}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
