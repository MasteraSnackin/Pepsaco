'use client';

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
}

export default function AnalyticsPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      const data = await response.json();
      setTables(data.tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTables = tables.length;
  const totalRows = tables.reduce((sum, table) => sum + table.rowCount, 0);
  const topTables = [...tables].sort((a, b) => b.rowCount - a.rowCount).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Database Analytics
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Tables</h3>
            <BarChart3 className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTables}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Rows</h3>
            <BarChart3 className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalRows.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Avg Rows/Table</h3>
            <BarChart3 className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalTables > 0 ? Math.round(totalRows / totalTables).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Top 10 Tables by Row Count
        </h2>
        <div className="space-y-3">
          {topTables.map((table, index) => {
            const maxRows = topTables[0]?.rowCount || 1;
            const percentage = (table.rowCount / maxRows) * 100;
            
            return (
              <div key={`${table.schema}.${table.name}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {index + 1}. {table.name}
                  </span>
                  <span className="text-gray-500">
                    {table.rowCount.toLocaleString()} rows
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}