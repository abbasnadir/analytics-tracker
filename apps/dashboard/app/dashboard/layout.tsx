import React from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="app-shell__main">
          <DashboardNavbar title="Overview" />
          <main className="app-shell__content" id="main-content">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
