/**
 * MetricFlow API Service
 * ----------------------
 * Central abstraction layer for all backend communication.
 * All components MUST use this service — never fetch/axios directly.
 *
 * To integrate with a different backend, only this file needs to change.
 */

// In development, defaults to "" (same-origin) so requests hit the local
// Next.js mock routes at /api/v1/*.  In production, set the env var to
// point at the real MetricFlow backend (e.g. "http://backend:4000/api/v1").
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiFilters {
  from?: string;    // ISO date string
  to?: string;      // ISO date string
  eventType?: string;
  [key: string]: string | undefined; // extensible for future filters
}

export interface OverviewMetric {
  label: string;
  value: number;
  delta: number;   // percentage change vs prior period
  trend: "up" | "down" | "flat";
}

export interface OverviewMetricsResponse {
  pageViews: OverviewMetric;
  clicks: OverviewMetric;
  sessions: OverviewMetric;
  [key: string]: OverviewMetric; // supports future metrics
}

export interface TopPage {
  path: string;
  views: number;
  avgDuration: number; // seconds
}

export interface TopPagesResponse {
  pages: TopPage[];
}

export interface ClickDataPoint {
  label: string;
  count: number;
  percentage: number;
}

export interface ClickMetricsResponse {
  distribution: ClickDataPoint[];
  total: number;
}

export interface TrendDataPoint {
  timestamp: string; // ISO date string
  pageViews: number;
  clicks: number;
  sessions: number;
  [key: string]: string | number; // supports future trend series
}

export interface TrendsResponse {
  series: TrendDataPoint[];
  granularity: "hour" | "day" | "week" | "month";
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
}

async function request<T>(
  endpoint: string,
  filters: ApiFilters = {},
  options: RequestOptions = {}
): Promise<T> {
  // Build the full URL — handles both relative (/api/v1) and absolute
  // (http://backend:4000/api/v1) base URLs.
  const fullPath = `${API_BASE_URL}${endpoint}`;

  const params = new URLSearchParams();
  // Append filters as query params — only defined values
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  const urlString = queryString ? `${fullPath}?${queryString}` : fullPath;

  const response = await fetch(urlString, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API error: ${response.statusText}`,
      status: response.status,
    };
    try {
      const data = await response.json();
      error.message = data.message || error.message;
      error.code = data.code;
    } catch {
      // Ignore JSON parse errors on error responses
    }
    throw error;
  }

  return response.json() as Promise<T>;
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const api = {
  /**
   * GET /metrics/overview
   * Returns aggregate metrics: page views, clicks, sessions.
   */
  getOverviewMetrics: (filters: ApiFilters = {}): Promise<OverviewMetricsResponse> =>
    request<OverviewMetricsResponse>("/metrics/overview", filters),  // GET /api/v1/metrics/overview

  /**
   * GET /metrics/top-pages
   * Returns most-visited pages with view counts and avg session duration.
   */
  getTopPages: (filters: ApiFilters = {}): Promise<TopPagesResponse> =>
    request<TopPagesResponse>("/metrics/top-pages", filters),  // GET /api/v1/metrics/top-pages

  /**
   * GET /metrics/clicks
   * Returns click event distribution across element types.
   */
  getClickMetrics: (filters: ApiFilters = {}): Promise<ClickMetricsResponse> =>
    request<ClickMetricsResponse>("/metrics/clicks", filters),  // GET /api/v1/metrics/clicks

  /**
   * GET /metrics/trends
   * Returns time-series data for charting metric trends.
   */
  getTrends: (filters: ApiFilters = {}): Promise<TrendsResponse> =>
    request<TrendsResponse>("/metrics/trends", filters),  // GET /api/v1/metrics/trends
} as const;

export default api;
