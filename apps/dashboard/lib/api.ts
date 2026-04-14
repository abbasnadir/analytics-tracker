type RankedMetric = {
  key: string;
  count: number;
};

type OverviewResponse = {
  tenantId: string;
  totalPageViews: number;
  totalClicks: number;
  topPages: RankedMetric[];
  topElements: RankedMetric[];
  generatedAt: string;
};

const fallback: OverviewResponse = {
  tenantId: "mf_demo_key",
  totalPageViews: 0,
  totalClicks: 0,
  topPages: [],
  topElements: [],
  generatedAt: new Date().toISOString()
};

export async function getOverview(): Promise<OverviewResponse> {
  const baseUrl = process.env.METRICFLOW_API_URL ?? "http://localhost:4000";
  const apiKey = process.env.METRICFLOW_API_KEY ?? "mf_demo_key";

  try {
    const response = await fetch(`${baseUrl}/api/v1/metrics/overview`, {
      cache: "no-store",
      headers: {
        "x-api-key": apiKey
      }
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as OverviewResponse;
  } catch {
    return fallback;
  }
}
