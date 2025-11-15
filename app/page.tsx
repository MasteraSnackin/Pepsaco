import Link from 'next/link';
import { Database, Table, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          PepsaCo Database Viewer
        </h1>
        <p className="text-xl text-gray-600">
          Access and visualize data from WideWorldImporters database
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/tables"
          className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
        >
          <Table className="text-blue-600 mb-4" size={32} />
          <h2 className="text-xl font-semibold mb-2">Browse Tables</h2>
          <p className="text-gray-600 mb-4">
            Explore all database tables and their schemas
          </p>
          <div className="flex items-center text-blue-600">
            <span>View Tables</span>
            <ArrowRight size={16} className="ml-2" />
          </div>
        </Link>

        <Link
          href="/analytics"
          className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
        >
          <BarChart3 className="text-green-600 mb-4" size={32} />
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p className="text-gray-600 mb-4">
            View data visualizations and insights
          </p>
          <div className="flex items-center text-green-600">
            <span>View Analytics</span>
            <ArrowRight size={16} className="ml-2" />
          </div>
        </Link>

        <div className="p-6 bg-white rounded-lg border">
          <Database className="text-purple-600 mb-4" size={32} />
          <h2 className="text-xl font-semibold mb-2">Database Info</h2>
          <p className="text-gray-600 text-sm mb-2">
            <strong>Database:</strong> WideWorldImporters_Base
          </p>
          <p className="text-gray-600 text-sm">
            <strong>Access:</strong> Read-only
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Features
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>✓ Browse all database tables</li>
          <li>✓ View and paginate through data</li>
          <li>✓ Sort columns ascending/descending</li>
          <li>✓ Search and filter records</li>
          <li>✓ Visualize data with charts</li>
        </ul>
      </div>
    </div>
  );
}