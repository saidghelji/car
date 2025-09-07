import React from 'react';
import SimpleTable from '../components/SimpleTable';
import { useContracts } from '../hooks/useContracts';

export default function ContractsList() {
  const { data, loading } = useContracts();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Contracts</h2>
      <SimpleTable columns={[ 'contractNumber', 'contractDate', 'status' ]} data={data} />
    </div>
  );
}
