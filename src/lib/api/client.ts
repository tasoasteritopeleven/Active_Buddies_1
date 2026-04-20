/**
 * Typed fetch wrapper for the Active Buddies backend.
 *
 * Responsibilities:
 *  - Prefix every request with `VITE_API_BASE_URL`.
 *  - Serialize JSON bodies and parse JSON responses.
 *  - Inject `Authorization: Bearer <accessToken>` when logged in.
 *  - On HTTP 401, attempt a *single* token refresh, then retry the request.
 *  - Unwrap the `{ success, data }` envelope from `TransformInterceptor`.
 *  - Throw a rich `ApiError` with status + backend error code for UI code to
 *    surface user-friendly messages.
 */

import { clearTokens, loadTokens, saveTokens, type StoredTokens } from "./tokens";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000/api";

// ---- Types ----------------------------------------------------------------

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: ApiErrorBody;

  constructor(status: number, message: string, details?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = details?.error;
    this.details = details;
  }
}

export interface RequestOptions {
  /** HTTP method (default GET). */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body — will be stringified. */
  body?: unknown;
  /** Query-string parameters (string/number/boolean/string[]). */
  query?: Record<string, string | number | boolean | string[] | undefined | null>;
  /** Extra headers to merge into the request. */
  headers?: Record<string, string>;
  /** Skip the auto-attached `Authorization` header (useful for login/refresh). */
  skipAuth?: boolean;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

// ---- Singleton refresh coordination --------------------------------------
// A *single* in-flight refresh promise prevents a thundering-herd of refresh
// calls when many requests fire in parallel and all get 401s.
let refreshInFlight: Promise<StoredTokens | null> | null = null;

async function runRefresh(): Promise<StoredTokens | null> {
  const current = loadTokens();
  if (!current) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const envelope = (await res.json()) as ApiEnvelope<{
      id: string;
      accessToken: string;
      refreshToken: string;
    }>;
    const { id, accessToken, refreshToken } = envelope.data;
    const next: StoredTokens = { userId: id, accessToken, refreshToken };
    saveTokens(next);
    return next;
  } catch {
    clearTokens();
    return null;
  }
}

function refreshTokens(): Promise<StoredTokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ---- Request builder ------------------------------------------------------

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!query) return `${base}${cleanPath}`;

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) usp.append(k, String(item));
    } else {
      usp.set(k, String(v));
    }
  }
  const qs = usp.toString();
  return qs ? `${base}${cleanPath}?${qs}` : `${base}${cleanPath}`;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    body = undefined;
  }
  const msg = Array.isArray(body?.message)
    ? body!.message.join(", ")
    : body?.message ?? res.statusText ?? `HTTP ${res.status}`;
  return new ApiError(res.status, msg, body);
}

async function doFetch<T>(path: string, opts: RequestOptions): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers ?? {}) };

  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (!opts.skipAuth) {
    const tokens = loadTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) throw await parseError(res);

  // TransformInterceptor may or may not be applied (health routes skip it for
  // primitives). Accept both shapes.
  const json = (await res.json()) as ApiEnvelope<T> | T;
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await doFetch<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !opts.skipAuth) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        return doFetch<T>(path, opts);
      }
    }
    throw err;
  }
}

// ---- Convenience helpers --------------------------------------------------

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

export { API_BASE_URL };
