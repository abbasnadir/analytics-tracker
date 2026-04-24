"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",           label: "Overview",    icon: "◈" },
  { href: "/dashboard/events",    label: "Events",      icon: "⬡" },
  { href: "/dashboard/pages",     label: "Pages",       icon: "▤" },
  { href: "/dashboard/retention", label: "Retention",   icon: "↻"  },
];

/**
 * Sidebar
 * -------
 * Navigation shell. Route-driven active state.
 * No coupling to data layer.
 */
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar__brand">
        <span className="sidebar__logo">◈</span>
        <span className="sidebar__brand-name">
          Metric<span>Flow</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <p className="sidebar__nav-label">Analytics</p>
        <ul role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  <span className="sidebar__link-label">{item.label}</span>
                  {isActive && <span className="sidebar__link-indicator" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__status">
          <span className="sidebar__status-dot sidebar__status-dot--live" />
          <span>Live · SDK v2.4</span>
        </div>
      </div>
    </aside>
  );
}
