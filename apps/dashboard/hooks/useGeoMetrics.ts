"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, GeoMetricsResponse, ApiError } from "@/services/api";

interface UseGeoMetricsResult {
  data: GeoMetricsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * useGeoMetrics
 * ------------------
 * Fetches geographic metrics data (e.g. users per country).
 * Re-fetches whenever filters change.
 */
export function useGeoMetrics(filters: ApiFilters = {}): UseGeoMetricsResult {
  const [data, setData] = useState<GeoMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getGeoMetrics(filters);
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
