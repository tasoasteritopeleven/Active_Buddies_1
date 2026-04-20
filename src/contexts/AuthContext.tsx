import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  authApi,
  usersApi,
  ApiError,
  clearTokens,
  loadTokens,
  saveTokens,
  type PublicUser,
} from "../lib/api";
import { disconnectChatSocket } from "../lib/ws";

const ONBOARDED_KEY = "activebuddies_onboarded";

/**
 * The shape consumed by the rest of the UI.  `user.name` is preserved from the
 * original mock context so existing pages keep compiling.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  profile: PublicUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(profile: PublicUser): AuthUser {
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email.split("@")[0];
  return {
    id: profile.id,
    email: profile.email,
    name,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl,
    profile,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem(ONBOARDED_KEY) === "true",
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const profile = await usersApi.me();
      const mapped = toAuthUser(profile);
      setUser(mapped);
      // A user counts as onboarded once they have a bio OR at least one goal
      // OR the flag was explicitly set during onboarding.
      const hasProfileData = Boolean(profile.bio) || profile.goals.length > 0;
      if (hasProfileData && localStorage.getItem(ONBOARDED_KEY) !== "true") {
        localStorage.setItem(ONBOARDED_KEY, "true");
        setIsOnboarded(true);
      }
      return mapped;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        setUser(null);
      }
      return null;
    }
  }, []);

  // Bootstrap: if we already have tokens in localStorage, try to hydrate
  // the user. Anything else (missing tokens, refresh-fail) logs us out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = loadTokens();
      if (!tokens) {
        setLoading(false);
        return;
      }
      await loadMe();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setError(null);
      try {
        const tokens = await authApi.login({ email, password });
        saveTokens({
          userId: tokens.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        await loadMe();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      }
    },
    [loadMe],
  );

  const signup = useCallback(
    async (email: string, password: string, firstName: string, lastName?: string): Promise<void> => {
      setError(null);
      try {
        const tokens = await authApi.register({ email, password, firstName, lastName });
        saveTokens({
          userId: tokens.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        localStorage.setItem(ONBOARDED_KEY, "false");
        setIsOnboarded(false);
        await loadMe();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Sign-up failed";
        setError(message);
        throw err;
      }
    },
    [loadMe],
  );

  const logout = useCallback(async (): Promise<void> => {
    const tokens = loadTokens();
    if (tokens) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch {
        // Revoking server-side failures shouldn't block local cleanup.
      }
    }
    disconnectChatSocket();
    clearTokens();
    localStorage.removeItem(ONBOARDED_KEY);
    queryClient.clear();
    setUser(null);
    setIsOnboarded(false);
    setError(null);
  }, [queryClient]);

  const completeOnboarding = useCallback((): void => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setIsOnboarded(true);
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    await loadMe();
  }, [loadMe]);

  const clearError = useCallback((): void => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isOnboarded,
      loading,
      error,
      login,
      signup,
      logout,
      completeOnboarding,
      refreshProfile,
      clearError,
    }),
    [user, isOnboarded, loading, error, login, signup, logout, completeOnboarding, refreshProfile, clearError],
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-base text-text-base">
        Loading...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
