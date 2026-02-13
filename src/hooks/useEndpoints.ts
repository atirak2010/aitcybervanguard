import { useQuery } from "@tanstack/react-query";
import { db } from "@/db/csocDatabase";
import type { Endpoint } from "@/types/endpoints";

export function useEndpoints() {
  return useQuery<Endpoint[]>({
    queryKey: ["endpoints"],
    queryFn: async () => {
      const count = await db.endpoints.count();
      if (count === 0) return [];
      return db.endpoints.toArray();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
