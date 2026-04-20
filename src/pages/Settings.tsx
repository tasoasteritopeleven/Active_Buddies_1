import { useState, useEffect } from "react"
import { ChevronLeft, Bell, Lock, User, Palette, ChevronRight, ShieldCheck, LogOut, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTheme } from "../components/theme-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { api } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    notifyFriendActivity: true,
    notifyChallenges: true,
    notifyCommunity: false,
    dailySummary: true,
    goalReminders: true,
    privateProfile: false,
    allowMessages: true,
    isPro: false,
    proProfession: ""
  })
  
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await api.getSettings()
        setSettings(data)
      } catch (error) {
        console.error("Failed to load settings", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleToggle = async (key: keyof typeof settings) => {
    const oldSettings = settings
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    // In a real app, we might debounce this or save on unmount
    try {
      await api.updateSettings(newSettings)
    } catch (error) {
      console.error("Failed to update settings", error)
      // Revert on failure
      setSettings(oldSettings)
    }
  }

  const handleSavePro = async () => {
    setIsSaving(true)
    try {
      await api.updateSettings(settings)
    } catch (error) {
      console.error("Failed to save pro details", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLogoutOpen(false)
    await logout()
    navigate("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="bg-bg-base min-h-screen pb-32 text-text-base w-full">
      <div className="max-w-2xl mx-auto">
        <header className="px-6 pt-8 pb-4 border-b border-border-base/50 bg-bg-surface flex items-center gap-3 sticky top-0 z-10">
        <Link to="/profile" className="p-2 -ml-2 rounded-full hover:bg-bg-surface-hover text-text-muted hover:text-text-base transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="p-6 space-y-6">
        <section>
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Appearance</h2>
          <div className="bg-bg-surface rounded-2xl border border-border-base/50 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <Palette className="w-4 h-4 text-text-base" />
                </div>
                <span className="text-sm font-medium">Theme</span>
              </div>
              <div className="flex bg-bg-surface-hover rounded-full p-1 border border-border-base/50">
                {["light", "dark", "sport"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t as any)}
                    className={`px-3 py-1 text-[11px] font-medium rounded-full capitalize transition-all ${
                      theme === t ? "bg-bg-surface shadow-sm text-text-base" : "text-text-muted hover:text-text-base"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Account</h2>
          <div className="bg-bg-surface rounded-2xl border border-border-base/50 overflow-hidden shadow-sm">
            <button className="w-full p-4 flex items-center justify-between hover:bg-bg-surface-hover transition-colors border-b border-border-base/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <User className="w-4 h-4 text-text-base" />
                </div>
                <span className="text-sm font-medium">Personal Information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-bg-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <Lock className="w-4 h-4 text-text-base" />
                </div>
                <span className="text-sm font-medium">Password & Security</span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Notifications</h2>
          <div className="bg-bg-surface rounded-2xl border border-border-base/50 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-border-base/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <Bell className="w-4 h-4 text-text-base" />
                </div>
                <div>
                  <span className="text-sm font-medium block">Push Notifications</span>
                  <span className="text-[10px] text-text-muted">Master toggle for all alerts</span>
                </div>
              </div>
              <button 
                onClick={() => handleToggle('notificationsEnabled')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.notificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <div className="p-4 space-y-4 bg-bg-surface-hover/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">Friend Activity</span>
                    <span className="text-[10px] text-text-muted">When pals complete workouts</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('notifyFriendActivity')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.notifyFriendActivity ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.notifyFriendActivity ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">Challenge Updates</span>
                    <span className="text-[10px] text-text-muted">Leaderboard changes & milestones</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('notifyChallenges')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.notifyChallenges ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.notifyChallenges ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">Community Posts</span>
                    <span className="text-[10px] text-text-muted">New discussions in your groups</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('notifyCommunity')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.notifyCommunity ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.notifyCommunity ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">Daily Summaries</span>
                    <span className="text-[10px] text-text-muted">Morning recap of your network</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('dailySummary')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.dailySummary ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.dailySummary ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">Goal Reminders</span>
                    <span className="text-[10px] text-text-muted">Nudges to keep you on track</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('goalReminders')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.goalReminders ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.goalReminders ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Privacy</h2>
          <div className="bg-bg-surface rounded-2xl border border-border-base/50 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-border-base/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <Lock className="w-4 h-4 text-text-base" />
                </div>
                <div>
                  <span className="text-sm font-medium block">Private Profile</span>
                  <span className="text-[10px] text-text-muted">Only friends can see your activity</span>
                </div>
              </div>
              <button 
                onClick={() => handleToggle('privateProfile')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.privateProfile ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.privateProfile ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <User className="w-4 h-4 text-text-base" />
                </div>
                <div>
                  <span className="text-sm font-medium block">Allow Messages</span>
                  <span className="text-[10px] text-text-muted">Receive messages from non-friends</span>
                </div>
              </div>
              <button 
                onClick={() => handleToggle('allowMessages')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.allowMessages ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.allowMessages ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Professional Account</h2>
          <div className="bg-bg-surface rounded-2xl border border-border-base/50 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-border-base/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-surface-hover rounded-full">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-medium block">Pro Status</span>
                  <span className="text-[10px] text-text-muted">Show you are a certified professional</span>
                </div>
              </div>
              <button 
                onClick={() => handleToggle('isPro')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.isPro ? 'bg-accent' : 'bg-bg-surface-hover border border-border-base/50'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-bg-surface absolute top-0.5 transition-transform shadow-sm ${settings.isPro ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {settings.isPro && (
              <div className="p-4 bg-bg-surface-hover/30 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Profession / Certification</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Certified Personal Trainer" 
                    className="w-full h-10 px-3 rounded-xl border border-border-base/50 bg-bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent/50" 
                    value={settings.proProfession}
                    onChange={(e) => setSettings({...settings, proProfession: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleSavePro}
                  disabled={isSaving}
                  className="w-full py-2 text-xs font-medium text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Pro Details
                </button>
              </div>
            )}
          </div>
        </section>

          <div className="pt-4">
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <DialogTrigger asChild>
                <button className="w-full py-3 text-sm font-medium text-red-500 bg-red-500/10 rounded-full hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Out</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-text-muted">Are you sure you want to log out of your account?</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsLogoutOpen(false)} className="rounded-full border-border-base text-text-base">Cancel</Button>
                  <Button variant="destructive" onClick={handleLogout} className="rounded-full bg-red-500 text-white hover:bg-red-600 border-transparent">Log Out</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
