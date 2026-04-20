import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { Activity } from "lucide-react";

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || submitting) return;
    setSubmitting(true);
    clearError();
    try {
      // Split "First Last" into first + last (last is optional)
      const trimmed = name.trim();
      const spaceIdx = trimmed.indexOf(" ");
      const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const lastName = spaceIdx === -1 ? undefined : trimmed.slice(spaceIdx + 1).trim() || undefined;
      await signup(email, password, firstName, lastName);
      navigate("/onboarding");
    } catch {
      // error message already surfaced by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm space-y-8 p-8 bg-bg-surface border border-border-base/50 rounded-3xl shadow-sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-base">Join ActiveBuddies</h2>
          <p className="text-sm text-text-muted mt-2">Your fitness journey starts here</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">Full Name</label>
            <Input 
              type="text" 
              placeholder="Alex Johnson" 
              className="rounded-xl h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">Email address</label>
            <Input 
              type="email" 
              placeholder="you@example.com" 
              className="rounded-xl h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="rounded-xl h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 text-center" role="alert">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-11 rounded-full font-medium"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
