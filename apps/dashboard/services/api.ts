import { readStoredSession } from "@/lib/auth-session";

const API_BASE_URL = "/api/v1";

export interface ApiFilters {
  from?: string;
  to?: string;
  eventType?: string;
  [key: string]: string | undefined;
}

export interface OverviewMetric {
  label: string;
  value: number;
  delta?: number;
  trend?: "up" | "down" | "flat";
  contextLabel?: string;
}

export interface OverviewMetricsResponse {
  pageViews: OverviewMetric;
  clicks: OverviewMetric;
  sessions: OverviewMetric;
  uniqueVisitors?: OverviewMetric;
  generatedAt?: string;
}

export interface TopPage {
  path: string;
  views: number;
  avgDuration?: number;
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
  timestamp: string;
  pageViews: number;
  clicks: number;
  sessions: number;
  [key: string]: string | number;
}

export interface TrendsResponse {
  series: TrendDataPoint[];
  granularity: "hour" | "day" | "week" | "month";
}

export interface GeoDataPoint {
  id: string;
  name: string;
  value: number;
}

export interface GeoMetricsResponse {
  data: GeoDataPoint[];
  totalUniqueVisitors: number;
}

export interface SessionMetric {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  pageViews: number;
  clicks: number;
  bounced: boolean;
}

export interface SessionMetricsResponse {
  totalSessions: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  sessions: SessionMetric[];
  generatedAt?: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

type BackendOverviewResponse = {
  tenantId: string;
  totalPageViews: number;
  totalClicks: number;
  uniqueSessions: number;
  uniqueVisitors?: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  topPages: Array<{ key: string; count: number }>;
  topElements: Array<{ key: string; count: number }>;
  generatedAt: string;
};

type BackendRankedMetricsResponse = {
  tenantId: string;
  items: Array<{ key: string; count: number }>;
  generatedAt: string;
};

type BackendTimeseriesResponse = {
  tenantId: string;
  interval: "hour" | "day";
  points: Array<{
    ts: string;
    pageViews: number;
    clicks: number;
    sessions: number;
  }>;
  generatedAt: string;
};

type BackendGeoResponse = {
  tenantId: string;
  items: Array<{ key: string; count: number }>;
  totalUniqueVisitors?: number;
  generatedAt: string;
};

type BackendHealthResponse = {
  status: string;
  service: string;
  serverTime: string;
  requestId: string;
  tenantId?: string;
  db?: {
    connected: boolean;
    latencyMs: number;
  };
  uptimeSec?: number;
};

type BackendSessionMetricsResponse = {
  tenantId: string;
  rangeStart?: string;
  rangeEnd?: string;
  totalSessions: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  sessions: SessionMetric[];
  generatedAt: string;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  apiKey?: string;
}

interface BackendRange {
  start?: string;
  end?: string;
  [key: string]: string | undefined;
}

function buildApiError(
  message: string,
  status?: number,
  code?: string,
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

function getApiKey(overrideApiKey?: string) {
  if (overrideApiKey) {
    return overrideApiKey;
  }

  return readStoredSession()?.apiKey;
}

async function request<T>(
  endpoint: string,
  filters: Record<string, string | undefined> = {},
  options: RequestOptions = {},
): Promise<T> {
  const apiKey = getApiKey(options.apiKey);

  if (!apiKey) {
    throw buildApiError("Sign in with a valid API key first.");
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  const url = `${API_BASE_URL}${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = `API error: ${response.statusText}`;
    let code: string | undefined;

    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
      };
      message = payload.message || payload.error || message;
      code = payload.code;
    } catch {
      // Ignore non-JSON failures.
    }

    throw buildApiError(message, response.status, code);
  }

  return response.json() as Promise<T>;
}

function toStartOfDay(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toEndOfDay(dateValue: string) {
  return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

function buildRange(filters: ApiFilters): BackendRange {
  if (!filters.from || !filters.to) {
    return {};
  }

  return {
    start: toStartOfDay(filters.from),
    end: toEndOfDay(filters.to),
  };
}

function normalizePath(input: string) {
  if (!input) {
    return "/";
  }

  try {
    return new URL(input).pathname || "/";
  } catch {
    return input;
  }
}

function countryCodeToName(code: string) {
  const normalized = code.toUpperCase();
  const overrides: Record<string, string> = {
    US: "United States of America",
    GB: "United Kingdom",
  };

  if (overrides[normalized]) {
    return overrides[normalized];
  }

  try {
    const formatter = new Intl.DisplayNames(["en"], { type: "region" });
    return formatter.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

function buildTrend(delta: number): "up" | "down" | "flat" {
  if (delta > 0.05) {
    return "up";
  }

  if (delta < -0.05) {
    return "down";
  }

  return "flat";
}

function percentageDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function shiftRange(range: BackendRange) {
  if (!range.start || !range.end) {
    return {};
  }

  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  const durationMs = Math.max(endMs - startMs, 1);
  const previousEndMs = startMs - 1;
  const previousStartMs = previousEndMs - durationMs;

  return {
    start: new Date(previousStartMs).toISOString(),
    end: new Date(previousEndMs).toISOString(),
  };
}

function mapOverviewMetric(label: string, current: number, previous: number): OverviewMetric {
  const delta = percentageDelta(current, previous);

  return {
    label,
    value: current,
    delta,
    trend: buildTrend(delta),
  };
}

function resolveGranularity(filters: ApiFilters, interval: "hour" | "day", pointsCount: number) {
  if (!filters.from || !filters.to) {
    return interval === "hour" ? "hour" : "day";
  }

  const spanMs =
    new Date(toEndOfDay(filters.to)).getTime() -
    new Date(toStartOfDay(filters.from)).getTime();
  const spanDays = Math.max(1, Math.ceil(spanMs / 86_400_000));

  if (interval === "hour") {
    return "hour";
  }

  if (spanDays > 90 && pointsCount > 0) {
    return "month";
  }

  if (spanDays > 31 && pointsCount > 0) {
    return "week";
  }

  return "day";
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function aggregateTrends(
  series: TrendDataPoint[],
  granularity: "hour" | "day" | "week" | "month",
) {
  if (granularity === "hour" || granularity === "day") {
    return series;
  }

  const buckets = new Map<string, TrendDataPoint>();

  for (const point of series) {
    const timestamp = new Date(point.timestamp);
    const bucketDate =
      granularity === "week"
        ? startOfWeek(timestamp)
        : new Date(timestamp.getFullYear(), timestamp.getMonth(), 1);
    const bucketKey = bucketDate.toISOString();
    const current = buckets.get(bucketKey) ?? {
      timestamp: bucketKey,
      pageViews: 0,
      clicks: 0,
      sessions: 0,
    };

    current.pageViews += point.pageViews;
    current.clicks += point.clicks;
    current.sessions += point.sessions;
    buckets.set(bucketKey, current);
  }

  return Array.from(buckets.values()).sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
}

export async function validateApiKey(apiKey: string) {
  return request<BackendHealthResponse>(
    "/metrics/health/ping",
    {},
    { apiKey, cache: "no-store" },
  );
}

export const api = {
  async getOverviewMetrics(filters: ApiFilters = {}): Promise<OverviewMetricsResponse> {
    const range = buildRange(filters);
    const currentPromise = request<BackendOverviewResponse>(
      "/metrics/overview",
      range,
    );

    const previousPromise =
      range.start && range.end
        ? request<BackendOverviewResponse>(
            "/metrics/overview",
            shiftRange(range),
          )
        : Promise.resolve<BackendOverviewResponse | null>(null);

    const [current, previous] = await Promise.all([currentPromise, previousPromise]);

    return {
      pageViews: mapOverviewMetric(
        "Page Views",
        current.totalPageViews,
        previous?.totalPageViews ?? current.totalPageViews,
      ),
      clicks: mapOverviewMetric(
        "Clicks",
        current.totalClicks,
        previous?.totalClicks ?? current.totalClicks,
      ),
      sessions: mapOverviewMetric(
        "Sessions",
        current.uniqueSessions,
        previous?.uniqueSessions ?? current.uniqueSessions,
      ),
      uniqueVisitors: mapOverviewMetric(
        "Unique Visitors",
        current.uniqueVisitors ?? current.uniqueSessions,
        previous?.uniqueVisitors ?? previous?.uniqueSessions ?? current.uniqueSessions,
      ),
      generatedAt: current.generatedAt,
    };
  },

  async getTopPages(filters: ApiFilters = {}): Promise<TopPagesResponse> {
    const range = buildRange(filters);
    const response = await request<BackendRankedMetricsResponse>(
      "/metrics/top-pages",
      range,
    );

    return {
      pages: response.items.map((item) => ({
        path: normalizePath(item.key),
        views: item.count,
      })),
    };
  },

  async getClickMetrics(filters: ApiFilters = {}): Promise<ClickMetricsResponse> {
    const range = buildRange(filters);
    const response = await request<BackendRankedMetricsResponse>(
      "/metrics/top-elements",
      range,
    );
    const total = response.items.reduce((sum, item) => sum + item.count, 0);

    return {
      distribution: response.items.map((item) => ({
        label: item.key,
        count: item.count,
        percentage:
          total === 0 ? 0 : Number(((item.count / total) * 100).toFixed(1)),
      })),
      total,
    };
  },

  async getTrends(filters: ApiFilters = {}): Promise<TrendsResponse> {
    const range = buildRange(filters);
    const interval =
      range.start && range.end
        ? Math.ceil(
            (new Date(range.end).getTime() - new Date(range.start).getTime()) /
              86_400_000,
          ) <= 2
          ? "hour"
          : "day"
        : undefined;

    const response = await request<BackendTimeseriesResponse>(
      "/metrics/timeseries",
      {
        ...range,
        interval,
      },
    );

    const granularity = resolveGranularity(
      filters,
      response.interval,
      response.points.length,
    );

    const series = response.points.map((point) => ({
      timestamp: point.ts,
      pageViews: point.pageViews,
      clicks: point.clicks,
      sessions: point.sessions,
    }));

    return {
      series: aggregateTrends(series, granularity),
      granularity,
    };
  },

  async getGeoMetrics(filters: ApiFilters = {}): Promise<GeoMetricsResponse> {
    const range = buildRange(filters);
    const response = await request<BackendGeoResponse>("/metrics/geo", range);

    return {
      data: response.items.map((item) => ({
        id: item.key,
        name: countryCodeToName(item.key),
        value: item.count,
      })),
      totalUniqueVisitors: response.totalUniqueVisitors ?? 0,
    };
  },

  async getSessionMetrics(filters: ApiFilters = {}): Promise<SessionMetricsResponse> {
    const range = buildRange(filters);

    if (!range.start || !range.end) {
      throw buildApiError("Choose a valid date range to load session metrics.");
    }

    const response = await request<BackendSessionMetricsResponse>(
      "/metrics/sessions",
      range,
    );

    return {
      totalSessions: response.totalSessions,
      avgSessionDurationSec: response.avgSessionDurationSec,
      bounceRate: response.bounceRate,
      sessions: response.sessions,
      generatedAt: response.generatedAt,
    };
  },

  async getHealthStatus(): Promise<BackendHealthResponse> {
    return request<BackendHealthResponse>(
      "/metrics/health/ping",
      {},
      { cache: "no-store" },
    );
  },
} as const;

export default api;
