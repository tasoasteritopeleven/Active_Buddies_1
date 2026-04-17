import { useState, useEffect } from "react"
import { Search, Users, Shield, Heart, BookOpen, MapPin, Plus, MessageSquare, Loader2, Filter } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { api } from "../services/api"

const iconMap: Record<string, any> = {
  Shield: Shield,
  BookOpen: BookOpen,
  Heart: Heart,
  Users: Users,
  MapPin: MapPin,
}

export function Communities() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [memberFilter, setMemberFilter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [communities, setCommunities] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getCommunities()
        setCommunities(data)
      } catch (error) {
        console.error("Failed to load communities", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType ? c.type === filterType : true;
    
    let matchesMembers = true;
    if (memberFilter === 'small') matchesMembers = c.members < 50;
    if (memberFilter === 'medium') matchesMembers = c.members >= 50 && c.members <= 200;
    if (memberFilter === 'large') matchesMembers = c.members > 200;

    return matchesSearch && matchesFilter && matchesMembers;
  })

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
              <span className="text-xs font-medium text-text-muted mr-1">Type:</span>
              {['Training', 'Nutrition', 'Recovery', 'Social'].map(type => (
                <Button 
                  key={type}
                  variant={filterType === type ? "default" : "outline"} 
                  className="rounded-full whitespace-nowrap h-9 text-xs"
                  onClick={() => setFilterType(filterType === type ? null : type)}
                >
                  {type}
                </Button>
              ))}
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filtered.map(community => {
            const IconComponent = iconMap[community.icon] || Users;
            return (
              <div key={community.id} className="bg-bg-surface p-6 rounded-2xl border border-border-base/50 shadow-sm flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-md">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${community.bg}`}>
                  <IconComponent className={`w-6 h-6 ${community.color}`} />
                </div>
                <h3 className="font-semibold text-text-base text-lg mb-2">{community.name}</h3>
                <p className="text-sm text-text-muted font-medium flex-1 mb-6 leading-relaxed">{community.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-base/30">
                  <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {community.members} members
                  </span>
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-4 border-border-base/50 hover:bg-bg-surface-hover">Join</Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
