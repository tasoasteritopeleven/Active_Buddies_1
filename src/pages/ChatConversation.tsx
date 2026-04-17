import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MoreVertical, Send, Loader2, Phone, Video, Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { api } from "../services/api"
import { cn } from "../lib/utils"

export function ChatConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [chatData, setChatData] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true)
      try {
        const data = await api.getChatConversation(Number(id))
        setChatData(data)
        setMessages(data.messages)
      } catch (error) {
        console.error("Failed to load chat", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isMe) {
      setIsTyping(true)
      const timeout = setTimeout(() => {
        setIsTyping(false)
      }, 2500)
      return () => clearTimeout(timeout)
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !id || isSending) return;
    
    setIsSending(true)
    try {
      const response = await api.sendMessage(Number(id), newMessage)
      setMessages([...messages, response])
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message", error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || !chatData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  const { pal } = chatData

  return (
    <div className="flex flex-col h-full bg-bg-base relative">
      {/* Chat Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-border-base/50 bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/chats")} 
            className="p-2 -ml-2 bg-text-muted/10 rounded-full text-text-base hover:bg-text-muted/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/user/${pal.id}`)}>
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border-base/50">
                <AvatarImage src={pal.image} />
                <AvatarFallback className="bg-bg-surface-hover text-text-muted">{pal.name[0]}</AvatarFallback>
              </Avatar>
              {pal.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent border-2 border-bg-surface rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-sm text-text-base">{pal.name}</h2>
              <p className="text-[11px] text-text-muted font-medium">
                {pal.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-text-muted hover:text-text-base">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-text-muted hover:text-text-base">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-text-muted hover:text-text-base">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const showAvatar = !msg.isMe && (index === 0 || messages[index - 1]?.isMe)
          
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex items-end gap-2 max-w-[85%]",
                msg.isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {!msg.isMe && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && (
                    <Avatar className="w-8 h-8 border border-border-base/50">
                      <AvatarImage src={pal.image} />
                      <AvatarFallback className="bg-bg-surface text-[10px]">{pal.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              
              <div 
                className={cn(
                  "p-3 rounded-2xl text-sm shadow-sm relative group",
                  msg.isMe 
                    ? "bg-accent text-accent-fg rounded-br-sm" 
                    : "bg-bg-surface border border-border-base/50 text-text-base rounded-bl-sm"
                )}
              >
                {msg.text}
                <span 
                  className={cn(
                    "text-[9px] absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                    msg.isMe ? "right-1 text-text-muted" : "left-1 text-text-muted"
                  )}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="flex items-end gap-2 max-w-[85%] mr-auto">
            <div className="w-8 flex-shrink-0">
              <Avatar className="w-8 h-8 border border-border-base/50">
                <AvatarImage src={pal.image} />
                <AvatarFallback className="bg-bg-surface text-[10px]">{pal.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="p-3.5 rounded-2xl text-sm shadow-sm relative bg-bg-surface border border-border-base/50 text-text-base rounded-bl-sm flex gap-1 items-center h-[42px]">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-6" /> {/* Spacing and scroll anchor */}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-bg-surface/90 backdrop-blur-md border-t border-border-base/50 shrink-0 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-end">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 rounded-2xl bg-bg-base border-border-base/50 focus-visible:ring-accent min-h-[44px]"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
            className="rounded-full w-11 h-11 bg-accent hover:bg-accent/90 text-accent-fg shrink-0 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
