import { EventModel } from "./event.model.js";
import { MetricSummaryModel } from "./metric-summary.model.js";
import type { EventPayload } from "./event.schema.js";
import type { MetricSummaryPayload } from "./metric-summary.schema.js";

type OverviewResponse = {
  tenantId: string;
  totalPageViews: number;
  totalClicks: number;
  topPages: Array<{ key: string; count: number }>;
  topElements: Array<{ key: string; count: number }>;
  generatedAt: string;
};

function rank(items: Record<string, number>) {
  return Object.entries(items)
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

export async function ingestEvent(tenantId: string, payload: EventPayload) {
  return EventModel.create({
    ...payload,
    tenantId
  });
}

export async function getEventsForAnalysis(tenantId: string, start: string, end: string) {
  return EventModel.find({
    tenantId,
    timestamp: {
      $gte: start,
      $lte: end
    }
  })
    .sort({ timestamp: 1 })
    .select("sessionId eventName timestamp url userAgent properties element -_id")
    .lean();
}

export async function saveMetricSummary(tenantId: string, payload: MetricSummaryPayload) {
  return MetricSummaryModel.findOneAndUpdate(
    {
      tenantId,
      rangeStart: payload.rangeStart,
      rangeEnd: payload.rangeEnd
    },
    {
      $set: {
        tenantId,
        ...payload
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}

export async function getOverview(tenantId: string): Promise<OverviewResponse> {
  const latestSummary = await MetricSummaryModel.findOne({ tenantId }).sort({ generatedAt: -1 }).lean();

  if (latestSummary) {
    return {
      tenantId,
      totalPageViews: latestSummary.totalPageViews,
      totalClicks: latestSummary.totalClicks,
      topPages: latestSummary.topPages,
      topElements: latestSummary.topElements,
      generatedAt: latestSummary.generatedAt
    };
  }

  const events = await EventModel.find({ tenantId }).lean();
  const topPages: Record<string, number> = {};
  const topElements: Record<string, number> = {};
  let totalPageViews = 0;
  let totalClicks = 0;

  for (const event of events) {
    if (event.eventName === "page_view") {
      totalPageViews += 1;
      topPages[event.url] = (topPages[event.url] ?? 0) + 1;
    }

    if (event.eventName === "click") {
      totalClicks += 1;
      const elementKey = event.element?.id || event.element?.text || event.element?.tagName || "unknown";
      topElements[elementKey] = (topElements[elementKey] ?? 0) + 1;
    }
  }

  return {
    tenantId,
    totalPageViews,
    totalClicks,
    topPages: rank(topPages),
    topElements: rank(topElements),
    generatedAt: new Date().toISOString()
  };
}
