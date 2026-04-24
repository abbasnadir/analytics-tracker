"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

interface DashboardNavbarProps {
  title?: string;
}

export default function DashboardNavbar({ title = "Overview" }: DashboardNavbarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, initials, fullName, logout } = useUser();

  const routeTitle =
    pathname === "/dashboard"
      ? "Overview"
      : pathname
          .split("/")
          .filter(Boolean)
          .pop()
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()) ?? title;

  const currentTitle = title === "Overview" ? routeTitle : title;
  const now = new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const notificationSummary = user.apiKey
    ? "Live alert feed not wired yet"
    : "Connect workspace to enable dashboard data";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="navbar" role="banner">
      <div className="navbar__left">
        <h1 className="navbar__title">{currentTitle}</h1>
        <span className="navbar__breadcrumb">MetricFlow / {currentTitle}</span>
      </div>

      <div className="navbar__right">
        <span className="navbar__timestamp">{now}</span>

        <div className="navbar__menu-group" ref={notificationsRef}>
          <button
            className={`navbar__btn ${isNotificationsOpen ? "navbar__btn--active" : ""}`}
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setIsNotificationsOpen((open) => !open);
              setIsProfileOpen(false);
            }}
          >
            <span className="navbar__btn-icon">◎</span>
            <span className="navbar__badge">!</span>
          </button>

          {isNotificationsOpen && (
            <div className="navbar__popover" role="dialog" aria-label="Notifications">
              <div className="navbar__popover-header">
                <h2 className="navbar__popover-title">Notifications</h2>
                <span className="navbar__popover-meta">Integration status</span>
              </div>

              <ul className="navbar__notification-list" role="list">
                <li className="navbar__notification-item">
                  <span className="navbar__notification-dot" />
                  <div>
                    <p className="navbar__notification-title">Notifications not connected yet</p>
                    <p className="navbar__notification-text">{notificationSummary}</p>
                  </div>
                </li>
                <li className="navbar__notification-item">
                  <span className="navbar__notification-dot" />
                  <div>
                    <p className="navbar__notification-title">Current workspace</p>
                    <p className="navbar__notification-text">{fullName}</p>
                  </div>
                </li>
                <li className="navbar__notification-item">
                  <span className="navbar__notification-dot" />
                  <div>
                    <p className="navbar__notification-title">Route in focus</p>
                    <p className="navbar__notification-text">{currentTitle}</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="navbar__menu-group" ref={profileRef}>
          <button
            className={`navbar__avatar navbar__avatar-btn ${isProfileOpen ? "navbar__avatar-btn--active" : ""}`}
            type="button"
            aria-label="User account"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            onClick={() => {
              setIsProfileOpen((open) => !open);
              setIsNotificationsOpen(false);
            }}
          >
            <span>{initials}</span>
          </button>

          {isProfileOpen && (
            <div className="navbar__popover navbar__popover--profile" role="menu" aria-label="Account menu">
              <div className="navbar__profile-header">
                <div className="navbar__avatar navbar__avatar--large" aria-hidden="true">
                  <span>{initials}</span>
                </div>
                <div>
                  <p className="navbar__profile-name">{fullName}</p>
                  <p className="navbar__profile-email">{user.email}</p>
                </div>
              </div>

              <div className="navbar__menu-links">
                <Link
                  className="navbar__menu-link"
                  href="/dashboard/settings/profile"
                  role="menuitem"
                  onClick={() => setIsProfileOpen(false)}
                >
                  👤 Profile
                </Link>
                <Link
                  className="navbar__menu-link"
                  href="/dashboard/settings"
                  role="menuitem"
                  onClick={() => setIsProfileOpen(false)}
                >
                  💬 Support
                </Link>
                <button
                  className="navbar__menu-link navbar__menu-link--button navbar__menu-link--logout"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    router.push("/login");
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
