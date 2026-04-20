/**
 * Persistent storage for the JWT access + refresh tokens.
 *
 * We keep them in localStorage for now (simple, works across tabs).  When the
 * backend switches to httpOnly refresh-token cookies, only this module needs
 * to be replaced.
 */

const ACCESS_KEY = "activebuddies_access_token";
const REFRESH_KEY = "activebuddies_refresh_token";
const USER_ID_KEY = "activebuddies_user_id";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export function loadTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const userId = localStorage.getItem(USER_ID_KEY);
  if (!accessToken || !refreshToken || !userId) return null;
  return { accessToken, refreshToken, userId };
}

export function saveTokens(tokens: StoredTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  localStorage.setItem(USER_ID_KEY, tokens.userId);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

/** Listen for token changes in other tabs. */
export function subscribeTokens(cb: (tokens: StoredTokens | null) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === ACCESS_KEY || e.key === REFRESH_KEY || e.key === USER_ID_KEY) {
      cb(loadTokens());
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
