"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError, ApiFilters, SessionMetricsResponse } from "@/services/api";

interface UseSessionMetricsResult {
  data: SessionMetricsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useSessionMetrics(filters: ApiFilters = {}): UseSessionMetricsResult {
  const [data, setData] = useState<SessionMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getSessionMetrics(filters);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  return { data, isLoading, error, refetch };
}
