import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { Target, Activity, MapPin, Calendar, Camera, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "../lib/utils";

export function Onboarding() {
  const [step, setStep] = useState(1);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 7) setStep(step + 1);
    else {
      completeOnboarding();
      navigate("/");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const [goals, setGoals] = useState<string[]>([]);
  const toggleGoal = (goal: string) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const [activities, setActivities] = useState<string[]>([]);
  const toggleActivity = (activity: string) => {
    setActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]);
  };

  const currentStepLabel = () => {
    switch(step) {
      case 1: return "Welcome";
      case 2: return "Your Goals";
      case 3: return "Activities";
      case 4: return "Fitness Level";
      case 5: return "Schedule";
      case 6: return "Location";
      case 7: return "Profile";
      default: return "";
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-bg-base overflow-hidden">
      {/* Progress Bar Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border-base/50 shrink-0">
        {step > 1 ? (
          <button onClick={handleBack} className="p-2 -ml-2 text-text-muted hover:text-text-base transition-colors rounded-full hover:bg-bg-surface">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : <div className="w-9" />}
        <div className="flex-1 max-w-sm mx-4">
          <div className="h-2 bg-bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(step / 7) * 100}%` }} />
          </div>
          <p className="text-center text-[10px] font-semibold text-text-muted uppercase tracking-widest mt-2">{currentStepLabel()} ({step}/7)</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full px-4 py-8 relative">
        <div className="max-w-md mx-auto w-full pb-24">
          
          {step === 1 && (
            <div className="space-y-6 text-center mt-12 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-accent" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-text-base">Let's build your fitness profile</h1>
              <p className="text-text-muted font-medium max-w-sm mx-auto">
                We'll ask a few quick questions to match you with the perfect workout pals and communities.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">What are your main goals?</h2>
                <p className="text-sm text-text-muted font-medium">Select all that apply.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Lose weight", "Build muscle", "Stay active", 
                  "Find a fitness community", "Train for an event", "Improve mental health"
                ].map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "p-4 flex items-center justify-between text-left rounded-2xl border-2 transition-all font-medium",
                      goals.includes(goal) ? "border-accent bg-accent/5 text-text-base shadow-sm" : "border-border-base/50 bg-bg-surface text-text-muted hover:border-accent/40"
                    )}
                  >
                    {goal}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      goals.includes(goal) ? "border-accent bg-accent" : "border-text-muted"
                    )}>
                      {goals.includes(goal) && <div className="w-2 h-2 bg-text-base rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">How do you like to move?</h2>
                <p className="text-sm text-text-muted font-medium">Choose your favorite activities.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Gym", icon: <Activity className="w-5 h-5" /> },
                  { name: "Running", icon: <Activity className="w-5 h-5" /> },
                  { name: "Walking", icon: <Activity className="w-5 h-5" /> },
                  { name: "Yoga", icon: <Activity className="w-5 h-5" /> },
                  { name: "Home Workout", icon: <Activity className="w-5 h-5" /> },
                  { name: "Cycling", icon: <Activity className="w-5 h-5" /> },
                  { name: "Swimming", icon: <Activity className="w-5 h-5" /> },
                  { name: "Sports", icon: <Activity className="w-5 h-5" /> },
                  { name: "Hiking", icon: <Activity className="w-5 h-5" /> },
                  { name: "Dance", icon: <Activity className="w-5 h-5" /> }
                ].map(act => (
                  <button
                    key={act.name}
                    onClick={() => toggleActivity(act.name)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 h-28 rounded-2xl border-2 transition-all gap-2 font-medium text-sm",
                      activities.includes(act.name) ? "border-accent bg-accent/5 text-accent shadow-sm" : "border-border-base/50 bg-bg-surface text-text-muted hover:border-accent/40"
                    )}
                  >
                    {act.icon}
                    {act.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">What's your current fitness level?</h2>
                <p className="text-sm text-text-muted font-medium">We'll match you with pals at a similar stage.</p>
              </div>
              <div className="space-y-3">
                {[
                  { level: "Beginner", desc: "Just starting out or getting back into it." },
                  { level: "Intermediate", desc: "I work out somewhat regularly." },
                  { level: "Advanced", desc: "Fitness is a core part of my lifestyle." }
                ].map((l, i) => (
                  <label key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-border-base/50 bg-bg-surface cursor-pointer hover:border-accent/40 transition-colors">
                    <input type="radio" name="level" className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
                    <div>
                      <h3 className="font-semibold text-text-base">{l.level}</h3>
                      <p className="text-xs text-text-muted font-medium mt-1">{l.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">When do you usually work out?</h2>
                <p className="text-sm text-text-muted font-medium">Matches are based on schedule overlap.</p>
              </div>
              <div className="space-y-4">
                {["Weekdays", "Weekends"].map(dayType => (
                  <div key={dayType} className="space-y-2">
                    <h4 className="text-sm font-semibold text-text-base">{dayType}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {["Morning", "Afternoon", "Evening"].map(time => (
                        <button key={time} className="py-2.5 rounded-xl border border-border-base/50 bg-bg-surface text-xs font-medium text-text-muted hover:border-accent/50 focus:bg-accent/10 focus:border-accent focus:text-accent transition-colors">
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Local or Remote?</h2>
                <p className="text-sm text-text-muted font-medium">Where do you want to connect?</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border-base/50 bg-bg-surface cursor-pointer hover:border-accent/40 transition-colors focus-within:border-accent focus-within:bg-accent/5">
                  <input type="radio" name="location_pref" className="mt-1" defaultChecked />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-5 h-5 text-accent" />
                      <h3 className="font-semibold text-text-base text-lg">Local Only</h3>
                    </div>
                    <p className="text-sm text-text-muted font-medium">I want pals I can meet in person at nearby gyms, parks, or groups.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border-base/50 bg-bg-surface cursor-pointer hover:border-accent/40 transition-colors focus-within:border-accent focus-within:bg-accent/5">
                  <input type="radio" name="location_pref" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-5 h-5 text-accent" />
                      <h3 className="font-semibold text-text-base text-lg">Remote Only</h3>
                    </div>
                    <p className="text-sm text-text-muted font-medium">I just want digital accountability. Location doesn't matter.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border-base/50 bg-bg-surface cursor-pointer hover:border-accent/40 transition-colors focus-within:border-accent focus-within:bg-accent/5">
                  <input type="radio" name="location_pref" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-5 h-5 text-accent" />
                      <h3 className="font-semibold text-text-base text-lg">Both</h3>
                    </div>
                    <p className="text-sm text-text-muted font-medium">I'm open to local meetups and remote cheerleaders.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Put a face to the name</h2>
                <p className="text-sm text-text-muted font-medium">Profiles with photos get 3x more pal requests.</p>
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-border-base flex flex-col items-center justify-center text-text-muted bg-bg-surface hover:border-accent hover:text-accent transition-colors cursor-pointer group relative overflow-hidden">
                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Upload Photo</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-base">Short Bio</label>
                <textarea 
                  className="w-full min-h-[100px] p-4 bg-bg-surface border border-border-base/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none placeholder:text-text-muted shadow-sm" 
                  placeholder="E.g., Getting back into running! Looking for an accountability buddy for early morning jogs. Let's motivate each other!"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent">
        <div className="max-w-md mx-auto">
          <Button onClick={handleNext} className="w-full h-14 rounded-full font-semibold text-base shadow-sm">
            {step === 7 ? "Find your first fitness pal!" : "Continue"}
            {step < 7 && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
