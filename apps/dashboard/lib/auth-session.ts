"use client";

export const DASHBOARD_SESSION_KEY = "metricflow_dashboard_session";

export interface StoredDashboardSession {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  timezone: string;
  apiKey: string;
  tenantId: string;
}

export function readStoredSession(): StoredDashboardSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_SESSION_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredDashboardSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredDashboardSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    DASHBOARD_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DASHBOARD_SESSION_KEY);
}
