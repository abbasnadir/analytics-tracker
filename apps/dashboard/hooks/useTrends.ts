"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, TrendsResponse, ApiError } from "@/services/api";

interface UseTrendsResult {
  data: TrendsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * useTrends
 * ---------
 * Fetches time-series trend data for the line chart.
 * Automatically adapts to the granularity returned by the backend.
 */
export function useTrends(filters: ApiFilters = {}): UseTrendsResult {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getTrends(filters);
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
