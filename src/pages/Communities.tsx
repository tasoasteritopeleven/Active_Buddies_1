import React, { useMemo, useState } from "react"
import { Search, Users, Shield, Heart, BookOpen, MapPin, Plus, Loader2 } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useCommunities, useJoinCommunity, type Community } from "../lib/api"

const iconMap: Record<string, any> = {
  Shield,
  BookOpen,
  Heart,
  Users,
  MapPin,
}

/**
 * Member size buckets used for the size filter chips. Backend stores
 * `membersCount` as a plain integer — bucketing happens client-side.
 */
const memberBuckets: Record<string, (n: number) => boolean> = {
  small: (n) => n < 50,
  medium: (n) => n >= 50 && n <= 200,
  large: (n) => n > 200,
}

function bgFromColor(color: string | null): { className: string; style?: React.CSSProperties } {
  // The backend stores a raw color string (e.g. "#22c55e"). We reuse it for
  // both the icon foreground and a translucent background.
  if (color) return { className: "", style: { backgroundColor: `${color}1a` } }
  return { className: "bg-accent/10" }
}

export function Communities() {
  const [searchQuery, setSearchQuery] = useState("")
  const [memberFilter, setMemberFilter] = useState<string | null>(null)

  // Backend search is case-insensitive on name + description.
  const { data, isLoading, error } = useCommunities({ search: searchQuery || undefined })
  const join = useJoinCommunity()

  const filtered = useMemo(() => {
    const items: Community[] = data?.items ?? []
    if (!memberFilter) return items
    const predicate = memberBuckets[memberFilter]
    return predicate ? items.filter((c) => predicate(c.membersCount)) : items
  }, [data, memberFilter])

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
        <p className="text-sm text-red-500">Failed to load communities: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Communities</h1>
            <p className="text-sm text-text-muted font-medium">Find your tribe and belong.</p>
          </div>
          <Button className="rounded-full gap-2 hidden md:flex"><Plus className="w-4 h-4"/> Create Group</Button>
        </header>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <Input 
                className="pl-10 rounded-full border-border-base/50 bg-bg-surface text-sm h-11 shadow-sm" 
                placeholder="Search communities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="rounded-full w-11 h-11 p-0 md:hidden shrink-0"><Plus className="w-5 h-5"/></Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center">
              <span className="text-xs font-medium text-text-muted mr-1">Size:</span>
              {[
                { id: 'small', label: '< 50' },
                { id: 'medium', label: '50 - 200' },
                { id: 'large', label: '> 200' }
              ].map(size => (
                <Button 
                  key={size.id}
                  variant={memberFilter === size.id ? "default" : "outline"} 
                  className="rounded-full whitespace-nowrap h-9 text-xs"
                  onClick={() => setMemberFilter(memberFilter === size.id ? null : size.id)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-text-muted">
            {searchQuery ? `No communities match "${searchQuery}"` : "No communities yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((community) => {
              const IconComponent = iconMap[community.icon ?? ""] || Users
              const joinPending = join.isPending && join.variables === community.id
              return (
                <div
                  key={community.id}
                  className="bg-bg-surface p-6 rounded-2xl border border-border-base/50 shadow-sm flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${bgFromColor(community.color).className}`}
                    style={bgFromColor(community.color).style}
                  >
                    <IconComponent
                      className="w-6 h-6"
                      style={community.color ? { color: community.color } : undefined}
                    />
                  </div>
                  <h3 className="font-semibold text-text-base text-lg mb-2">{community.name}</h3>
                  <p className="text-sm text-text-muted font-medium flex-1 mb-6 leading-relaxed">
                    {community.description ?? ""}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-base/30">
                    <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> {community.membersCount} members
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8 px-4 border-border-base/50 hover:bg-bg-surface-hover"
                      disabled={joinPending}
                      onClick={() => join.mutate(community.id)}
                    >
                      {joinPending ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
