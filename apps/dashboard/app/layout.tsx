import type { Metadata } from "next";
import React from "react";

import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

/**
 * Dashboard Layout
 * ----------------
 * Shared shell for all /dashboard/* routes.
 * Sidebar + Navbar are pure layout components — no data deps here.
 */
export const metadata: Metadata = {
  title: "MetricFlow Dashboard",
  description: "Live metrics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
