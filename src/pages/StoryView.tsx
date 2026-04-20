import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { X } from "lucide-react"

export function StoryView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Mock story images/videos based on id
  // In a real app, you would fetch the story data by ID
  const storyInfo = {
    user: "User " + id,
    image: `https://i.pravatar.cc/150?u=${id}`,
    content: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop`, 
    // Random workout stock image
  }

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 2 // approx 5s for 100% (2% per 100ms)
        if (next >= 100) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPaused])

  // Navigate away once progress reaches 100 — kept outside the state updater
  useEffect(() => {
    if (progress >= 100) navigate(-1)
  }, [progress, navigate])

  const handlePointerDown = () => setIsPaused(true)
  const handlePointerUp = () => setIsPaused(false)

  const handleTap = (e: React.MouseEvent) => {
    const threshold = window.innerWidth / 2
    if (e.clientX < threshold) {
      // tapped left (go to previous story logically, but here we'll just restart or mock)
      setProgress(0)
    } else {
      // tapped right (go to next)
      navigate(-1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* Progress bar container */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4">
        <div className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all ease-linear"
            style={{ width: `${progress}%`, transitionDuration: isPaused ? '0ms' : '100ms' }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 z-20 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <img src={storyInfo.image} className="w-8 h-8 rounded-full border border-white/50" alt="" />
          <span className="text-sm font-semibold shadow-black drop-shadow-md">{storyInfo.user}</span>
          <span className="text-white/60 text-xs ml-1 shadow-black drop-shadow-md">2h</span>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 text-white/80 hover:text-white transition-colors">
          <X className="w-6 h-6 shadow-black drop-shadow-md" />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 relative w-full h-full flex items-center justify-center cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleTap}
      >
        <img 
          src={storyInfo.content} 
          alt="Story content" 
          className="w-full h-full object-cover rounded-xl"
        />
        {/* If we had a video, we could use <video autoPlay loop muted className="..." /> */}
      </div>
    </div>
  )
}
