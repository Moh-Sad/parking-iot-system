const ACCESS_KEY = "parking_iot_access";
const REFRESH_KEY = "parking_iot_refresh";
const USER_KEY = "parking_iot_user";

export type Role = "ADMIN" | "SUPERVISOR";

export interface StoredUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  roleLevel: number;
  region: string | null;
  uid: string;
  avatarUrl: string | null;
}

interface Tokens {
  access: string;
  refresh: string;
}

const safeStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function loadTokens(): Tokens | null {
  const s = safeStorage();
  if (!s) return null;
  const access = s.getItem(ACCESS_KEY);
  const refresh = s.getItem(REFRESH_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function saveTokens(tokens: Tokens): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(ACCESS_KEY, tokens.access);
  s.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens(): void {
  const s = safeStorage();
  if (!s) return;
  s.removeItem(ACCESS_KEY);
  s.removeItem(REFRESH_KEY);
  s.removeItem(USER_KEY);
}

export function loadUser(): StoredUser | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function saveUser(user: StoredUser): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(USER_KEY, JSON.stringify(user));
}
