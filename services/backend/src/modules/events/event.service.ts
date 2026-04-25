import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { resolveCountryCode } from "../../lib/geo.js";
import { AnalyzerCheckpointModel } from "./analyzer-checkpoint.model.js";
import { EventModel } from "./event.model.js";
import { MetricSummaryModel } from "./metric-summary.model.js";
import type {
  EventBatchPayload,
  EventPayload,
  TimeseriesQuery,
} from "./event.schema.js";
import type { MetricSummaryPayload } from "./metric-summary.schema.js";

type OverviewResponse = {
  tenantId: string;
  totalPageViews: number;
  totalClicks: number;
  uniqueSessions: number;
  uniqueVisitors: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  topPages: Array<{ key: string; count: number }>;
  topElements: Array<{ key: string; count: number }>;
  generatedAt: string;
};

type SessionMetric = {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  pageViews: number;
  clicks: number;
  bounced: boolean;
};

type TimeseriesPoint = {
  ts: string;
  pageViews: number;
  clicks: number;
  sessions: number;
};

type IngestContext = {
  countryCode?: string;
};

function rank(items: Record<string, number>, limit = 5) {
  return Object.entries(items)
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

function buildSessionMetrics(
  events: Array<{ sessionId: string; eventName: string; timestamp: string }>,
) {
  const sessionMap = new Map<
    string,
    {
      firstTs: string;
      lastTs: string;
      pageViews: number;
      clicks: number;
    }
  >();

  for (const event of events) {
    const current =
      sessionMap.get(event.sessionId) ??
      ({
        firstTs: event.timestamp,
        lastTs: event.timestamp,
        pageViews: 0,
        clicks: 0,
      } as const);

    const firstTs =
      current.firstTs < event.timestamp ? current.firstTs : event.timestamp;
    const lastTs =
      current.lastTs > event.timestamp ? current.lastTs : event.timestamp;

    sessionMap.set(event.sessionId, {
      firstTs,
      lastTs,
      pageViews: current.pageViews + (event.eventName === "page_view" ? 1 : 0),
      clicks: current.clicks + (event.eventName === "click" ? 1 : 0),
    });
  }

  const sessions: SessionMetric[] = [];

  for (const [sessionId, value] of sessionMap.entries()) {
    const durationSec = Math.max(
      0,
      Math.round(
        (new Date(value.lastTs).getTime() - new Date(value.firstTs).getTime()) /
          1000,
      ),
    );

    sessions.push({
      sessionId,
      startedAt: value.firstTs,
      endedAt: value.lastTs,
      durationSec,
      pageViews: value.pageViews,
      clicks: value.clicks,
      bounced: value.pageViews <= 1 && value.clicks === 0,
    });
  }

  return sessions.sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );
}

function toBucket(timestamp: string, interval: "hour" | "day") {
  const date = new Date(timestamp);

  if (interval === "day") {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    ).toISOString();
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
    ),
  ).toISOString();
}

function buildTimeseries(
  events: Array<{ timestamp: string; eventName: string; sessionId: string }>,
  interval: "hour" | "day",
) {
  const buckets = new Map<string, TimeseriesPoint>();
  const bucketSessions = new Map<string, Set<string>>();

  for (const event of events) {
    const bucket = toBucket(event.timestamp, interval);
    const point =
      buckets.get(bucket) ??
      ({
        ts: bucket,
        pageViews: 0,
        clicks: 0,
        sessions: 0,
      } as TimeseriesPoint);

    if (event.eventName === "page_view") {
      point.pageViews += 1;
    }

    if (event.eventName === "click") {
      point.clicks += 1;
    }

    const sessionSet = bucketSessions.get(bucket) ?? new Set<string>();
    sessionSet.add(event.sessionId);
    bucketSessions.set(bucket, sessionSet);
    point.sessions = sessionSet.size;
    buckets.set(bucket, point);
  }

  return Array.from(buckets.values()).sort((left, right) =>
    left.ts.localeCompare(right.ts),
  );
}

function resolveVisitorId(event: { visitorId?: string; sessionId: string }) {
  return event.visitorId || event.sessionId;
}

async function getLatestSummary(tenantId: string) {
  return MetricSummaryModel.findOne({ tenantId }).sort({ generatedAt: -1 }).lean();
}

function inferInterval(points: TimeseriesPoint[]): "hour" | "day" {
  if (points.length < 2) {
    return "hour";
  }

  const first = new Date(points[0].ts).getTime();
  const second = new Date(points[1].ts).getTime();
  const hours = Math.round(Math.abs(second - first) / 3_600_000);

  return hours >= 24 ? "day" : "hour";
}

export async function ingestEvent(
  tenantId: string,
  payload: EventPayload,
  context: IngestContext = {},
) {
  const now = new Date().toISOString();

  return EventModel.create({
    ...payload,
    eventId: payload.eventId ?? randomUUID(),
    countryCode: resolveCountryCode(
      context.countryCode ?? payload.countryCode,
      payload.locale,
    ),
    path:
      payload.path ??
      (() => {
        try {
          return new URL(payload.url).pathname;
        } catch {
          return payload.url;
        }
      })(),
    receivedAt: now,
    ingestedAt: now,
    tenantId,
  });
}

export async function ingestBatch(
  tenantId: string,
  payload: EventBatchPayload,
  context: IngestContext = {},
) {
  const now = new Date().toISOString();

  const docs = payload.events.map((event) => ({
    ...event,
    eventId: event.eventId ?? randomUUID(),
    countryCode: resolveCountryCode(
      context.countryCode ?? event.countryCode,
      event.locale,
    ),
    path:
      event.path ??
      (() => {
        try {
          return new URL(event.url).pathname;
        } catch {
          return event.url;
        }
      })(),
    receivedAt: now,
    ingestedAt: now,
    tenantId,
  }));

  let acceptedCount = docs.length;
  let rejectedCount = 0;

  try {
    await EventModel.insertMany(docs, {
      ordered: false,
    });
  } catch (error) {
    const writeErrors =
      typeof error === "object" && error && "writeErrors" in error
        ? ((error as { writeErrors?: unknown[] }).writeErrors ?? [])
        : [];

    rejectedCount = writeErrors.length;
    acceptedCount = Math.max(0, docs.length - rejectedCount);
  }

  return {
    acceptedCount,
    rejectedCount,
  };
}

export async function getEventsForAnalysis(
  tenantId: string,
  start: string,
  end: string,
) {
  return EventModel.find({
    tenantId,
    timestamp: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ timestamp: 1 })
    .limit(env.MAX_ANALYZER_EVENTS)
    .select(
      "schemaVersion apiKey scriptId sessionId visitorId eventId eventName timestamp url path referrer userAgent viewport screen tzOffsetMin locale countryCode properties element receivedAt ingestedAt -_id",
    )
    .lean();
}

export async function saveMetricSummary(
  tenantId: string,
  payload: MetricSummaryPayload,
) {
  return MetricSummaryModel.findOneAndUpdate(
    {
      tenantId,
      rangeStart: payload.rangeStart,
      rangeEnd: payload.rangeEnd,
    },
    {
      $set: {
        tenantId,
        ...payload,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
}

export async function getOverview(tenantId: string): Promise<OverviewResponse> {
  const latestSummary = await getLatestSummary(tenantId);

  if (latestSummary) {
    return {
      tenantId,
      totalPageViews: latestSummary.totalPageViews,
      totalClicks: latestSummary.totalClicks,
      uniqueSessions: latestSummary.uniqueSessions ?? 0,
      uniqueVisitors: latestSummary.uniqueVisitors ?? latestSummary.uniqueSessions ?? 0,
      avgSessionDurationSec: latestSummary.avgSessionDurationSec ?? 0,
      bounceRate: latestSummary.bounceRate ?? 0,
      topPages: latestSummary.topPages,
      topElements: latestSummary.topElements,
      generatedAt: latestSummary.generatedAt,
    };
  }

  const events = await EventModel.find({ tenantId }).lean();
  const topPages: Record<string, number> = {};
  const topElements: Record<string, number> = {};
  let totalPageViews = 0;
  let totalClicks = 0;
  const sessionIds = new Set<string>();
  const visitorIds = new Set<string>();

  for (const event of events) {
    sessionIds.add(event.sessionId);
    visitorIds.add(resolveVisitorId(event));

    if (event.eventName === "page_view") {
      totalPageViews += 1;
      topPages[event.url] = (topPages[event.url] ?? 0) + 1;
    }

    if (event.eventName === "click") {
      totalClicks += 1;
      const elementKey =
        event.element?.id ||
        event.element?.text ||
        event.element?.tagName ||
        "unknown";
      topElements[elementKey] = (topElements[elementKey] ?? 0) + 1;
    }
  }

  return {
    tenantId,
    totalPageViews,
    totalClicks,
    uniqueSessions: sessionIds.size,
    uniqueVisitors: visitorIds.size,
    avgSessionDurationSec: 0,
    bounceRate: 0,
    topPages: rank(topPages),
    topElements: rank(topElements),
    generatedAt: new Date().toISOString(),
  };
}

export async function getOverviewForRange(
  tenantId: string,
  start: string,
  end: string,
): Promise<OverviewResponse> {
  const summary = await MetricSummaryModel.findOne({
    tenantId,
    rangeStart: start,
    rangeEnd: end,
  }).lean();

  if (summary) {
    return {
      tenantId,
      totalPageViews: summary.totalPageViews,
      totalClicks: summary.totalClicks,
      uniqueSessions: summary.uniqueSessions ?? 0,
      uniqueVisitors: summary.uniqueVisitors ?? summary.uniqueSessions ?? 0,
      avgSessionDurationSec: summary.avgSessionDurationSec ?? 0,
      bounceRate: summary.bounceRate ?? 0,
      topPages: summary.topPages,
      topElements: summary.topElements,
      generatedAt: summary.generatedAt,
    };
  }

  const events = await EventModel.find({
    tenantId,
    timestamp: {
      $gte: start,
      $lte: end,
    },
  }).lean();

  const topPages: Record<string, number> = {};
  const topElements: Record<string, number> = {};
  let totalPageViews = 0;
  let totalClicks = 0;
  const sessionIds = new Set<string>();
  const visitorIds = new Set<string>();

  for (const event of events) {
    sessionIds.add(event.sessionId);
    visitorIds.add(resolveVisitorId(event));

    if (event.eventName === "page_view") {
      totalPageViews += 1;
      topPages[event.url] = (topPages[event.url] ?? 0) + 1;
    }

    if (event.eventName === "click") {
      totalClicks += 1;
      const elementKey =
        event.element?.id ||
        event.element?.text ||
        event.element?.tagName ||
        "unknown";
      topElements[elementKey] = (topElements[elementKey] ?? 0) + 1;
    }
  }

  const sessions = buildSessionMetrics(
    events.map((event) => ({
      sessionId: event.sessionId,
      eventName: event.eventName,
      timestamp: event.timestamp,
    })),
  );

  const totalSessions = sessions.length;
  const avgSessionDurationSec =
    totalSessions === 0
      ? 0
      : Number(
          (
            sessions.reduce((sum, session) => sum + session.durationSec, 0) /
            totalSessions
          ).toFixed(2),
        );
  const bounceRate =
    totalSessions === 0
      ? 0
      : Number(
          (
            sessions.filter((session) => session.bounced).length / totalSessions
          ).toFixed(4),
        );

  return {
    tenantId,
    totalPageViews,
    totalClicks,
    uniqueSessions: sessionIds.size,
    uniqueVisitors: visitorIds.size,
    avgSessionDurationSec,
    bounceRate,
    topPages: rank(topPages),
    topElements: rank(topElements),
    generatedAt: new Date().toISOString(),
  };
}

export async function getRankedPages(
  tenantId: string,
  start?: string,
  end?: string,
  limit = 5,
) {
  if (!start || !end) {
    const summary = await getLatestSummary(tenantId);

    return (summary?.topPages ?? []).slice(0, limit);
  }

  const rows = await EventModel.aggregate<
    Array<{ key: string; count: number }>
  >([
    {
      $match: {
        tenantId,
        eventName: "page_view",
        timestamp: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$url",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        key: "$_id",
        count: 1,
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  return rows;
}

export async function getRankedElements(
  tenantId: string,
  start?: string,
  end?: string,
  limit = 5,
) {
  if (!start || !end) {
    const summary = await getLatestSummary(tenantId);

    return (summary?.topElements ?? []).slice(0, limit);
  }

  const events = await EventModel.find({
    tenantId,
    eventName: "click",
    timestamp: { $gte: start, $lte: end },
  })
    .select("element -_id")
    .lean();

  const counter: Record<string, number> = {};

  for (const event of events) {
    const key =
      event.element?.id ||
      event.element?.text ||
      event.element?.tagName ||
      "unknown";
    counter[key] = (counter[key] ?? 0) + 1;
  }

  return Object.entries(counter)
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export async function getGeoMetrics(
  tenantId: string,
  start?: string,
  end?: string,
  limit = 10,
) {
  if (!start || !end) {
    const summary = await getLatestSummary(tenantId);

    return {
      tenantId,
      rangeStart: start,
      rangeEnd: end,
      items: (summary?.geoBreakdown ?? []).slice(0, limit),
      totalUniqueVisitors: summary?.uniqueVisitors ?? summary?.uniqueSessions ?? 0,
      generatedAt: summary?.generatedAt ?? new Date().toISOString(),
    };
  }

  const events = await EventModel.find({
    tenantId,
    timestamp: { $gte: start, $lte: end },
  })
    .select("locale countryCode visitorId sessionId -_id")
    .lean();

  const geoCounter = new Map<string, Set<string>>();
  const uniqueVisitors = new Set<string>();

  for (const event of events) {
    const countryCode = resolveCountryCode(event.countryCode, event.locale);
    const visitorId = resolveVisitorId(event);

    uniqueVisitors.add(visitorId);

    if (!countryCode) {
      continue;
    }

    const visitors = geoCounter.get(countryCode) ?? new Set<string>();
    visitors.add(visitorId);
    geoCounter.set(countryCode, visitors);
  }

  const items = Array.from(geoCounter.entries())
    .map(([key, visitors]) => ({ key, count: visitors.size }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);

  return {
    tenantId,
    rangeStart: start,
    rangeEnd: end,
    items,
    totalUniqueVisitors: uniqueVisitors.size,
    generatedAt: new Date().toISOString(),
  };
}

export async function getSessionMetrics(
  tenantId: string,
  start: string,
  end: string,
) {
  const events = await EventModel.find({
    tenantId,
    timestamp: { $gte: start, $lte: end },
  })
    .sort({ timestamp: 1 })
    .select("sessionId eventName timestamp -_id")
    .lean();

  const sessions = buildSessionMetrics(events);
  const totalSessions = sessions.length;
  const avgSessionDurationSec =
    totalSessions === 0
      ? 0
      : Number(
          (
            sessions.reduce((sum, session) => sum + session.durationSec, 0) /
            totalSessions
          ).toFixed(2),
        );
  const bounceRate =
    totalSessions === 0
      ? 0
      : Number(
          (
            sessions.filter((session) => session.bounced).length / totalSessions
          ).toFixed(4),
        );

  return {
    tenantId,
    rangeStart: start,
    rangeEnd: end,
    totalSessions,
    avgSessionDurationSec,
    bounceRate,
    sessions,
    generatedAt: new Date().toISOString(),
  };
}

export async function getTimeseries(tenantId: string, query: TimeseriesQuery) {
  if (!query.start || !query.end || !query.interval) {
    const summary = await getLatestSummary(tenantId);
    const points = summary?.timeseries ?? [];

    return {
      tenantId,
      interval: inferInterval(points),
      rangeStart: summary?.rangeStart,
      rangeEnd: summary?.rangeEnd,
      points,
      generatedAt: summary?.generatedAt ?? new Date().toISOString(),
    };
  }

  const match: {
    tenantId: string;
    timestamp: { $gte: string; $lte: string };
    eventName?: string;
  } = {
    tenantId,
    timestamp: {
      $gte: query.start,
      $lte: query.end,
    },
  };

  if (query.eventName) {
    match.eventName = query.eventName;
  }

  const events = await EventModel.find(match)
    .select("timestamp eventName sessionId -_id")
    .sort({ timestamp: 1 })
    .lean();

  const points = buildTimeseries(events, query.interval);

  return {
    tenantId,
    interval: query.interval,
    rangeStart: query.start,
    rangeEnd: query.end,
    points,
    generatedAt: new Date().toISOString(),
  };
}

export async function getCheckpoint(tenantId: string) {
  const checkpoint = await AnalyzerCheckpointModel.findOne({ tenantId }).lean();

  if (checkpoint) {
    return {
      tenantId,
      lastProcessedAt: checkpoint.lastProcessedAt,
      updatedAt: checkpoint.updatedAt,
    };
  }

  const fallback = new Date(0).toISOString();
  return {
    tenantId,
    lastProcessedAt: fallback,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateCheckpoint(
  tenantId: string,
  lastProcessedAt: string,
) {
  const updatedAt = new Date().toISOString();

  const checkpoint = await AnalyzerCheckpointModel.findOneAndUpdate(
    { tenantId },
    {
      $set: {
        tenantId,
        lastProcessedAt,
        updatedAt,
      },
    },
    {
      new: true,
      upsert: true,
    },
  ).lean();

  return {
    tenantId,
    lastProcessedAt: checkpoint?.lastProcessedAt ?? lastProcessedAt,
    updatedAt: checkpoint?.updatedAt ?? updatedAt,
  };
}
