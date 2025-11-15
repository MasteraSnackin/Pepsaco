import TableBrowser from '@/components/TableBrowser';

export default function TablesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Database Tables
      </h1>
      <TableBrowser />
    </div>
  );
}