import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useRealTimeData<T>(
  queryKey: string[],
  enabled = true,
  intervalMs = 5000
) {
  const queryClient = useQueryClient();
  
  const query = useQuery<T>({
    queryKey,
    enabled,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [queryClient, queryKey, intervalMs, enabled]);

  return query;
}

export function useRealTimeThreats(enabled = true) {
  return useRealTimeData(["/api/threats"], enabled);
}

export function useRealTimeStats(enabled = true) {
  return useRealTimeData(["/api/dashboard/stats"], enabled);
}

export function useRealTimeActions(enabled = true) {
  return useRealTimeData(["/api/actions"], enabled);
}
