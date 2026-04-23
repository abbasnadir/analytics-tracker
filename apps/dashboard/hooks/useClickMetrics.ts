"use client";
import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, ClickMetricsResponse, ApiError } from "@/services/api";
interface UseClickMetricsResult {
  data: ClickMetricsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}
export function useClickMetrics(filters: ApiFilters = {}): UseClickMetricsResult {
  const [data, setData] = useState<ClickMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const filtersKey = JSON.stringify(filters);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getClickMetrics(filters);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tick]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, isLoading, error, refetch };
}
