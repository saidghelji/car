import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Contract } from '../types/models';

export function useContracts() {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getContracts()
      .then((res) => { if (mounted) setData(res); })
      .catch((e) => { if (mounted) setError(e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { data, loading, error, refresh: () => api.getContracts().then(setData) };
}
