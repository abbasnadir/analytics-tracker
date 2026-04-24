"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  title?: string;
}

/**
 * Navbar
 * ------
 * Top bar with page title and user context.
 * Presentational only — no data dependencies.
 */
export default function Navbar({ title = "Overview" }: NavbarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
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

        <button className="navbar__btn" type="button" aria-label="Notifications">
          <span className="navbar__btn-icon">◎</span>
          <span className="navbar__badge">3</span>
        </button>

        <div className="navbar__avatar" role="img" aria-label="User account">
          <span>MF</span>
        </div>
      </div>
    </header>
  );
}
