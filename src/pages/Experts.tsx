import { useState, useEffect } from "react"
import { BookOpen, Video, MessageSquare, PlayCircle, Star, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { api } from "../services/api"

export function Experts() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const expertsData = await api.getExpertsData()
        setData(expertsData)
      } catch (error) {
        console.error("Failed to load experts data", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Expert <span className="text-accent">Knowledge</span></h1>
          <p className="text-sm text-text-muted font-medium">Learn from certified professionals, read articles, and join live Q&A sessions.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles Section */}
          <section className="col-span-1 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent" /> Featured Articles</h2>
              <Button variant="outline" size="sm" className="rounded-full text-xs">View All</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.articles.map((article: any) => (
                <div key={article.id} className="bg-bg-surface border border-border-base/50 rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-colors cursor-pointer group">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-full mb-3 inline-block">{article.category}</span>
                  <h3 className="font-semibold text-text-base mb-2 group-hover:text-accent transition-colors">{article.title}</h3>
                  <div className="flex items-center justify-between mt-4 text-xs text-text-muted font-medium">
                    <span>{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-lg font-bold flex items-center gap-2"><Video className="w-5 h-5 text-accent" /> Video Masterclasses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.videos.map((video: any) => (
                <div key={video.id} className="bg-bg-surface border border-border-base/50 rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                  <div className="relative h-40 overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">{video.duration}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{video.title}</h3>
                    <p className="text-xs text-text-muted font-medium flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {video.expert}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live Q&A Section */}
          <section className="col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-accent/20 to-bg-surface border border-accent/30 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-2 relative z-10"><MessageSquare className="w-5 h-5 text-accent" /> Live Q&A Sessions</h2>
              <p className="text-xs text-text-muted font-medium mb-6 relative z-10">Ask questions directly to our panel of certified trainers and nutritionists.</p>
              
              <div className="space-y-4 relative z-10">
                {data.liveSessions.map((session: any) => (
                  <div key={session.id} className="bg-bg-surface border border-border-base/50 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${session.bg} flex items-center justify-center ${session.color} font-bold`}>
                        {session.initials}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{session.title}</h4>
                        <p className="text-[11px] text-text-muted">{session.expert}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-base/50">
                      <span className={`text-xs font-bold ${session.isToday ? 'text-accent' : 'text-text-muted'}`}>{session.time}</span>
                      <Button variant={session.isToday ? "default" : "outline"} size="sm" className="rounded-full h-8 text-xs">Remind Me</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
