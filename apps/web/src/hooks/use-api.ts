import { useState, useEffect } from 'react';

export function useApi<T>(fetcher: () => Promise<{data: T}>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (mounted) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, deps);

  return { data, loading, error };
}
