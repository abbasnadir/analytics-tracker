"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsTab {
  href: string;
  label: string;
  icon: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  { href: "/dashboard/settings/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/settings",         label: "General", icon: "⊙" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="settings">
      <div className="settings__header">
        <h2 className="settings__title">Settings</h2>
        <p className="settings__subtitle">Manage your account, preferences, and workspace configuration</p>
      </div>

      <nav className="settings__tabs" aria-label="Settings navigation">
        {SETTINGS_TABS.map((tab) => {
          const isActive =
            tab.href === "/dashboard/settings"
              ? pathname === "/dashboard/settings"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`settings__tab ${isActive ? "settings__tab--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="settings__tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="settings__body">{children}</div>
    </div>
  );
}
