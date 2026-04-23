"use client";

import React, { useState, useCallback } from "react";
import { ApiFilters } from "@/services/api";

interface EventTypeOption {
  value: string;
  label: string;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: "",          label: "All Events"   },
  { value: "pageview",  label: "Page Views"   },
  { value: "click",     label: "Clicks"       },
  { value: "session",   label: "Sessions"     },
  { value: "conversion",label: "Conversions"  },
];

const DATE_PRESETS = [
  { label: "24h",  from: () => daysAgo(1)  },
  { label: "7d",   from: () => daysAgo(7)  },
  { label: "30d",  from: () => daysAgo(30) },
  { label: "90d",  from: () => daysAgo(90) },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

interface FilterBarProps {
  /** Called whenever any filter changes */
  onFiltersChange: (filters: ApiFilters) => void;
  isLoading?: boolean;
}

/**
 * FilterBar
 * ---------
 * Reusable filter panel. Emits an ApiFilters object upward — no direct API calls.
 * Decoupled from all hooks and services: it only communicates via onFiltersChange.
 */
export default function FilterBar({ onFiltersChange, isLoading }: FilterBarProps) {
  const [from, setFrom]            = useState<string>(daysAgo(7));
  const [to, setTo]                = useState<string>(today());
  const [eventType, setEventType]  = useState<string>("");
  const [activePreset, setPreset]  = useState<string>("7d");

  const emit = useCallback(
    (newFrom: string, newTo: string, newEventType: string) => {
      onFiltersChange({
        from: newFrom || undefined,
        to: newTo || undefined,
        eventType: newEventType || undefined,
      });
    },
    [onFiltersChange]
  );

  function applyPreset(preset: (typeof DATE_PRESETS)[0]) {
    const f = preset.from();
    const t = today();
    setFrom(f);
    setTo(t);
    setPreset(preset.label);
    emit(f, t, eventType);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFrom(e.target.value);
    setPreset("");
    emit(e.target.value, to, eventType);
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTo(e.target.value);
    setPreset("");
    emit(from, e.target.value, eventType);
  }

  function handleEventTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEventType(e.target.value);
    emit(from, to, e.target.value);
  }

  return (
    <div className="filter-bar" role="search" aria-label="Dashboard filters">
      {/* Date Presets */}
      <div className="filter-bar__group">
        <label className="filter-bar__label">Range</label>
        <div className="filter-bar__presets">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`filter-bar__preset ${activePreset === preset.label ? "filter-bar__preset--active" : ""}`}
              onClick={() => applyPreset(preset)}
              disabled={isLoading}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date inputs */}
      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="filter-from">From</label>
        <input
          id="filter-from"
          className="filter-bar__input"
          type="date"
          value={from}
          max={to}
          onChange={handleFromChange}
          disabled={isLoading}
        />
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="filter-to">To</label>
        <input
          id="filter-to"
          className="filter-bar__input"
          type="date"
          value={to}
          min={from}
          max={today()}
          onChange={handleToChange}
          disabled={isLoading}
        />
      </div>

      {/* Event type select */}
      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="filter-event-type">Event</label>
        <select
          id="filter-event-type"
          className="filter-bar__select"
          value={eventType}
          onChange={handleEventTypeChange}
          disabled={isLoading}
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="filter-bar__spinner" aria-label="Loading" role="status">
          <span className="spinner" />
        </div>
      )}
    </div>
  );
}
