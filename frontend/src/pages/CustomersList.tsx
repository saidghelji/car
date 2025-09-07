import React from 'react';
import SimpleTable from '../components/SimpleTable';
import { useCustomers } from '../hooks/useCustomers';

export default function CustomersList() {
  const { data, loading } = useCustomers();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customers</h2>
      <SimpleTable columns={[ 'nomFr', 'prenomFr', 'email', 'status' ]} data={data} />
    </div>
  );
}
