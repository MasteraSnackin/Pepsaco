import DataTable from '@/components/DataTable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DataPage({ params }: { params: { table: string } }) {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tables"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Tables
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {params.table}
        </h1>
      </div>
      <DataTable tableName={params.table} />
    </div>
  );
}