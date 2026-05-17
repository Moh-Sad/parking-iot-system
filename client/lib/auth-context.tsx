"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiCallError } from "./api";
import {
  clearTokens,
  loadTokens,
  loadUser,
  saveTokens,
  saveUser,
  type Role,
  type StoredUser,
} from "./auth-storage";
import type { LoginResponse } from "./api-types";

interface AuthContextValue {
  user: StoredUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustCompleteProfile: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const homeForRole = (role: Role): string => (role === "ADMIN" ? "/admin" : "/supervisor");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mustCompleteProfile, setMustCompleteProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      setIsLoading(false);
      return;
    }
    const cached = loadUser();
    if (cached) setUser(cached);

    (async () => {
      try {
        const me = await api.get<StoredUser>("/me");
        setUser(me);
        saveUser(me);
      } catch {
        // 401 handled by api.ts (redirects). For other errors, keep cached user.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>("/auth/login", { email, password }, { skipAuth: true });
    saveTokens({ access: result.token, refresh: result.refreshToken });
    saveUser(result.user);
    setUser(result.user);
    setMustCompleteProfile(result.mustCompleteProfile);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const tokens = loadTokens();
    if (tokens) {
      try {
        await api.post("/auth/logout", { refreshToken: tokens.refresh }, { skipRefresh: true });
      } catch {
        // best-effort
      }
    }
    clearTokens();
    setUser(null);
    setMustCompleteProfile(false);
    router.push("/login");
  }, [router]);

  const refreshMe = useCallback(async () => {
    try {
      const me = await api.get<StoredUser>("/me");
      setUser(me);
      saveUser(me);
    } catch (err) {
      if (err instanceof ApiCallError && err.status === 401) {
        clearTokens();
        setUser(null);
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      mustCompleteProfile,
      login,
      logout,
      refreshMe,
    }),
    [user, isLoading, mustCompleteProfile, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { homeForRole };
