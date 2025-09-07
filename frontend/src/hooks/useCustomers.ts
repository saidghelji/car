import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Customer } from '../types/models';

export function useCustomers() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getCustomers()
      .then((res) => { if (mounted) setData(res); })
      .catch((e) => { if (mounted) setError(e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { data, loading, error, refresh: () => api.getCustomers().then(setData) };
}
