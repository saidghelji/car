import React from 'react';
import SimpleTable from '../components/SimpleTable';
import { useVehicles } from '../hooks/useVehicles';

export default function VehiclesList() {
  const { data, loading } = useVehicles();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Vehicles</h2>
      <SimpleTable columns={[ 'licensePlate', 'brand', 'model', 'statut' ]} data={data} />
    </div>
  );
}
