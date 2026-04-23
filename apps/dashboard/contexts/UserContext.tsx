"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  timezone: string;
}

const DEFAULT_USER: UserData = {
  firstName: "MetricFlow",
  lastName: "Admin",
  email: "ops@metricflow.local",
  mobile: "+1 (555) 024-8900",
  role: "Workspace Owner",
  timezone: "Asia/Kolkata (UTC+05:30)",
};

const STORAGE_KEY = "metricflow_user";
const ACCOUNTS_KEY = "metricflow_accounts";

interface UserContextValue {
  user: UserData;
  setUser: (data: UserData) => void;
  updateUser: (partial: Partial<UserData>) => void;
  registerAccount: (data: UserData) => void;
  lookupAccount: (email: string) => UserData | null;
  initials: string;
  fullName: string;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserData>(DEFAULT_USER);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserData;
        setUserState(parsed);
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist active user to localStorage on change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user, hydrated]);

  const setUser = useCallback((data: UserData) => {
    setUserState(data);
  }, []);

  const updateUser = useCallback((partial: Partial<UserData>) => {
    setUserState((prev) => {
      const updated = { ...prev, ...partial };
      // Also update the account in the registry
      try {
        const raw = localStorage.getItem(ACCOUNTS_KEY);
        const accounts: Record<string, UserData> = raw ? JSON.parse(raw) : {};
        accounts[updated.email.toLowerCase()] = updated;
        // If email changed, also store under new email
        if (prev.email !== updated.email) {
          accounts[prev.email.toLowerCase()] = updated;
        }
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Save an account to the registry (called on sign-up)
  const registerAccount = useCallback((data: UserData) => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      const accounts: Record<string, UserData> = raw ? JSON.parse(raw) : {};
      accounts[data.email.toLowerCase()] = data;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }, []);

  // Look up a registered account by email (called on sign-in)
  const lookupAccount = useCallback((email: string): UserData | null => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) return null;
      const accounts: Record<string, UserData> = JSON.parse(raw);
      return accounts[email.toLowerCase()] ?? null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserState(DEFAULT_USER);
  }, []);

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <UserContext.Provider
      value={{ user, setUser, updateUser, registerAccount, lookupAccount, initials, fullName, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
