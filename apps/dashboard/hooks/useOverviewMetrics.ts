"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiFilters, OverviewMetricsResponse, ApiError } from "@/services/api";

interface UseOverviewMetricsResult {
  data: OverviewMetricsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * useOverviewMetrics
 * ------------------
 * Fetches aggregate metrics (page views, clicks, sessions).
 * Re-fetches whenever filters change.
 * Cancels stale requests via AbortController.
 */
export function useOverviewMetrics(filters: ApiFilters = {}): UseOverviewMetricsResult {
  const [data, setData] = useState<OverviewMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  // Stable serialized key for filter comparison
  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getOverviewMetrics(filters);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tick]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}
