import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Facture } from '../types/models';

export function useFactures() {
  const [data, setData] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getFactures()
      .then((res) => { if (mounted) setData(res); })
      .catch((e) => { if (mounted) setError(e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { data, loading, error, refresh: () => api.getFactures().then(setData) };
}
