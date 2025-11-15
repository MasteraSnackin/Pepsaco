'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Table as TableIcon } from 'lucide-react';

interface Table {
  name: string;
  schema: string;
  rowCount: number;
}

export default function TableBrowser() {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredTables(
        tables.filter(table =>
          table.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredTables(tables);
    }
  }, [search, tables]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await response.json();
      setTables(data.tables);
      setFilteredTables(data.tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to load tables. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchTables}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredTables.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {search ? `No tables found matching "${search}"` : 'No tables available'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map((table) => (
            <Link
              key={`${table.schema}.${table.name}`}
              href={`/data/${encodeURIComponent(table.schema)}.${encodeURIComponent(table.name)}`}
              className="block p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <TableIcon className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {table.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Schema: {table.schema}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rows: {table.rowCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}