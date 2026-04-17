import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string) => void;
  signup: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock session
    const storedUser = localStorage.getItem("activebuddies_user");
    const storedOnboarded = localStorage.getItem("activebuddies_onboarded");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedOnboarded === "true") {
      setIsOnboarded(true);
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    const mockUser = { id: "123", email, name: email.split("@")[0] };
    setUser(mockUser);
    localStorage.setItem("activebuddies_user", JSON.stringify(mockUser));
  };

  const signup = (email: string, name: string) => {
    const mockUser = { id: "123", email, name };
    setUser(mockUser);
    setIsOnboarded(false);
    localStorage.setItem("activebuddies_user", JSON.stringify(mockUser));
    localStorage.setItem("activebuddies_onboarded", "false");
  };

  const logout = () => {
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem("activebuddies_user");
    localStorage.removeItem("activebuddies_onboarded");
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem("activebuddies_onboarded", "true");
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-bg-base text-text-base">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isOnboarded, login, signup, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
