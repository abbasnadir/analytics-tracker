/**
 * MetricFlow Formatters
 * ---------------------
 * Pure utility functions for displaying metric values.
 * No business logic — purely presentational.
 */

/**
 * Format large numbers with K/M suffix.
 * e.g. 142500 → "142.5K"
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

/**
 * Format a delta percentage with sign.
 * e.g. 12.5 → "+12.5%"   -3.2 → "-3.2%"
 */
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

/**
 * Format a duration in seconds to human-readable.
 * e.g. 125 → "2m 5s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Format an ISO timestamp for chart axis labels.
 * Adapts to granularity.
 */
export function formatTimestamp(
  iso: string,
  granularity: "hour" | "day" | "week" | "month" = "day"
): string {
  const date = new Date(iso);
  switch (granularity) {
    case "hour":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    case "day":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "week":
      return `W${getISOWeek(date)}`;
    case "month":
      return date.toLocaleDateString([], { month: "short", year: "2-digit" });
  }
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
