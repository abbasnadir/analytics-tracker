"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/services/api";

interface BackendHealth {
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
}

interface UseBackendHealthResult {
  data: BackendHealth | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useBackendHealth(): UseBackendHealthResult {
  const [data, setData] = useState<BackendHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getHealthStatus();
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [tick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  return { data, isLoading, error, refetch };
}
