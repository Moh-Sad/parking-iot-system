import { clearTokens, loadTokens, saveTokens } from "./auth-storage";
import type { ApiEnvelope, RefreshResponse } from "./api-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiCallError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiCallError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  // If true, do NOT attach Authorization header (e.g. for /auth/login)
  skipAuth?: boolean;
  // If true, do NOT attempt silent refresh on 401
  skipRefresh?: boolean;
  // If true, return Response as-is (for file downloads)
  raw?: boolean;
  // If false, return the full envelope (e.g. { data, meta } or { data, stats }).
  // Default true: unwrap { data: T } and return just T.
  unwrap?: boolean;
}

let refreshInflight: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (refreshInflight) return refreshInflight;
  refreshInflight = (async () => {
    try {
      const tokens = loadTokens();
      if (!tokens) return null;
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const json = (await res.json()) as ApiEnvelope<RefreshResponse>;
      saveTokens({ access: json.data.token, refresh: json.data.refreshToken });
      return json.data.token;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

function buildHeaders(init: RequestOptions, accessToken: string | null): Headers {
  const headers = new Headers(init.headers ?? {});
  if (init.body !== undefined && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !init.skipAuth && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

async function apiFetch<T = unknown>(path: string, init: RequestOptions = {}): Promise<T> {
  const tokens = loadTokens();
  const accessToken = tokens?.access ?? null;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = buildHeaders(init, token);
    const body =
      init.body === undefined
        ? undefined
        : init.body instanceof FormData
          ? init.body
          : JSON.stringify(init.body);
    return fetch(`${API_URL}${path}`, { ...init, headers, body });
  };

  let res = await doFetch(accessToken);

  if (res.status === 401 && !init.skipAuth && !init.skipRefresh) {
    const newToken = await attemptRefresh();
    if (newToken) {
      res = await doFetch(newToken);
    }
    if (res.status === 401) {
      clearTokens();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
  }

  if (init.raw) {
    return res as unknown as T;
  }

  const text = await res.text();
  const payload = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const err = payload as { error?: { code?: string; message?: string; details?: unknown } } | undefined;
    throw new ApiCallError(
      res.status,
      err?.error?.code ?? "REQUEST_FAILED",
      err?.error?.message ?? res.statusText ?? "Request failed",
      err?.error?.details,
    );
  }

  if (payload === undefined) return undefined as T;

  const shouldUnwrap = init.unwrap !== false;
  if (shouldUnwrap) {
    const env = payload as { data?: T };
    if (env && typeof env === "object" && "data" in env) return env.data as T;
  }
  return payload as T;
}

// POST/PATCH default to {} so endpoints with `z.object({...}).optional` fields
// still receive a valid (empty) body when the caller has nothing to send.
const withDefaultBody = (body: unknown): unknown => (body === undefined ? {} : body);

export const api = {
  get: <T = unknown>(path: string, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "POST", body: withDefaultBody(body) }),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "PATCH", body: withDefaultBody(body) }),
  delete: <T = unknown>(path: string, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "DELETE" }),
  raw: (path: string, init?: RequestOptions) =>
    apiFetch<Response>(path, { ...init, raw: true }),
};

export type ApiClient = typeof api;
