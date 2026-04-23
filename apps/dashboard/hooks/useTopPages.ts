"use client";
import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, TopPagesResponse, ApiError } from "@/services/api";
interface UseTopPagesResult {
  data: TopPagesResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}
export function useTopPages(filters: ApiFilters = {}): UseTopPagesResult {
  const [data, setData] = useState<TopPagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const filtersKey = JSON.stringify(filters);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getTopPages(filters);
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
