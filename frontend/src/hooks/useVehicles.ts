import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Vehicle } from '../types/models';

export function useVehicles() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getVehicles()
      .then((res) => { if (mounted) setData(res); })
      .catch((e) => { if (mounted) setError(e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { data, loading, error, refresh: () => api.getVehicles().then(setData) };
}
