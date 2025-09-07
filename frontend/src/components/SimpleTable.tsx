import React from 'react';

export default function SimpleTable<T>({ columns, data }: { columns: string[]; data: T[] }) {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} className="px-4 py-2 text-left border-b">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any) => (
          <tr key={row.id} className="hover:bg-gray-50">
            {columns.map((c) => (
              <td key={c} className="px-4 py-2 border-b">{String(row[c] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
