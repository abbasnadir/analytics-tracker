"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearStoredSession,
  readStoredSession,
  type StoredDashboardSession,
  writeStoredSession,
} from "@/lib/auth-session";

export interface UserData extends StoredDashboardSession {}

const EMPTY_USER: UserData = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  role: "Workspace Member",
  timezone: "",
  apiKey: "",
  tenantId: "",
};

interface UserContextValue {
  user: UserData;
  setUser: (data: UserData) => void;
  updateUser: (partial: Partial<UserData>) => void;
  login: (data: UserData) => void;
  logout: () => void;
  initials: string;
  fullName: string;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserData>(EMPTY_USER);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSession();

    if (stored) {
      setUserState(stored);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (user.apiKey) {
      writeStoredSession(user);
      return;
    }

    clearStoredSession();
  }, [isHydrated, user]);

  const setUser = useCallback((data: UserData) => {
    setUserState(data);
  }, []);

  const updateUser = useCallback((partial: Partial<UserData>) => {
    setUserState((previous) => ({ ...previous, ...partial }));
  }, []);

  const login = useCallback((data: UserData) => {
    setUserState(data);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUserState(EMPTY_USER);
  }, []);

  const initials = useMemo(() => {
    const first = user.firstName[0] ?? "";
    const last = user.lastName[0] ?? "";
    const fallback = user.tenantId[0] ?? "M";

    return `${first}${last || fallback}`.toUpperCase();
  }, [user.firstName, user.lastName, user.tenantId]);

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  const value = useMemo(
    () => ({
      user,
      setUser,
      updateUser,
      login,
      logout,
      initials,
      fullName: fullName || user.tenantId || "MetricFlow Workspace",
      isAuthenticated: Boolean(user.apiKey),
      isHydrated,
    }),
    [
      fullName,
      initials,
      isHydrated,
      login,
      logout,
      setUser,
      updateUser,
      user,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return ctx;
}
