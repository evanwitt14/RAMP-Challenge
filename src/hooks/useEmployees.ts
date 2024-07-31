import { useCallback, useState } from "react";
import { Employee } from "../utils/types";
import { useCustomFetch } from "./useCustomFetch";

export function useEmployees() {
  const { fetchWithCache, loading: fetchLoading } = useCustomFetch();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const response = await fetchWithCache<Employee[]>("employees");
    setEmployees(response);
    setLoading(false);
  }, [fetchWithCache]);

  const invalidateData = useCallback(() => {
    setEmployees(null);
  }, []);

  return {
    data: employees,
    loading: loading || fetchLoading,
    fetchAll,
    invalidateData
  };
}
