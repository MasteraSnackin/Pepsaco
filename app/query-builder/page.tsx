'use client';

import { useState } from 'react';
import { Play, Save, BookOpen, Sparkles } from 'lucide-react';

interface QueryResult {
  success: boolean;
  results?: any[];
  rowCount?: number;
  error?: string;
}

const SAMPLE_QUERIES = [
  {
    name: 'Top 10 Customers by Revenue',
    description: 'Find the highest revenue generating customers',
    query: `SELECT TOP 10
  c.CustomerName,
  SUM(ol.Quantity * ol.UnitPrice) as TotalRevenue,
  COUNT(DISTINCT o.OrderID) as OrderCount
FROM Sales.Customers c
JOIN Sales.Orders o ON c.CustomerID = o.CustomerID
JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
GROUP BY c.CustomerName
ORDER BY TotalRevenue DESC`,
  },
  {
    name: 'Low Stock Items',
    description: 'Items that need reordering',
    query: `SELECT 
  si.StockItemName,
  sih.QuantityOnHand,
  sih.ReorderLevel,
  (sih.ReorderLevel - sih.QuantityOnHand) as Shortage
FROM Warehouse.StockItems si
JOIN Warehouse.StockItemHoldings sih ON si.StockItemID = sih.StockItemID
WHERE sih.QuantityOnHand < sih.ReorderLevel
ORDER BY Shortage DESC`,
  },
  {
    name: 'Temperature Violations',
    description: 'Recent cold room temperature violations',
    query: `SELECT TOP 20
  ColdRoomSensorNumber,
  Temperature,
  RecordedWhen,
  CASE 
    WHEN Temperature < 2.0 THEN 'Too Cold'
    WHEN Temperature > 4.0 THEN 'Too Warm'
  END as ViolationType
FROM Warehouse.ColdRoomTemperatures_Archive
WHERE Temperature < 2.0 OR Temperature > 4.0
ORDER BY RecordedWhen DESC`,
  },
  {
    name: 'Monthly Sales Trend',
    description: 'Sales performance by month',
    query: `SELECT 
  FORMAT(o.OrderDate, 'yyyy-MM') as Month,
  COUNT(DISTINCT o.OrderID) as Orders,
  SUM(ol.Quantity * ol.UnitPrice) as Revenue
FROM Sales.Orders o
JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
WHERE o.OrderDate >= DATEADD(MONTH, -12, GETDATE())
GROUP BY FORMAT(o.OrderDate, 'yyyy-MM')
ORDER BY Month`,
  },
  {
    name: 'Product Performance',
    description: 'Best selling products',
    query: `SELECT TOP 20
  si.StockItemName,
  SUM(ol.Quantity) as TotalQuantitySold,
  SUM(ol.Quantity * ol.UnitPrice) as TotalRevenue,
  COUNT(DISTINCT ol.OrderID) as OrderCount
FROM Warehouse.StockItems si
JOIN Sales.OrderLines ol ON si.StockItemID = ol.StockItemID
GROUP BY si.StockItemName
ORDER BY TotalRevenue DESC`,
  },
  {
    name: 'Customer Purchase Frequency',
    description: 'How often customers place orders',
    query: `SELECT 
  c.CustomerName,
  COUNT(o.OrderID) as TotalOrders,
  MIN(o.OrderDate) as FirstOrder,
  MAX(o.OrderDate) as LastOrder,
  DATEDIFF(DAY, MIN(o.OrderDate), MAX(o.OrderDate)) as DaysBetweenFirstAndLast
FROM Sales.Customers c
JOIN Sales.Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerName
HAVING COUNT(o.OrderID) > 5
ORDER BY TotalOrders DESC`,
  },
];

const QUERY_TIPS = [
  'Always use SELECT for read-only queries',
  'Use TOP N to limit results for better performance',
  'Include schema names (e.g., Sales.Orders)',
  'Use JOINs to combine data from multiple tables',
  'Add WHERE clauses to filter data',
  'Use GROUP BY for aggregations',
  'ORDER BY to sort results',
];

export default function QueryBuilder() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState<Array<{name: string; query: string}>>([]);

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({ success: false, error: 'Please enter a query' });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/custom-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error executing query:', error);
      setResult({
        success: false,
        error: 'Failed to execute query. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setResult(null);
  };

  const saveQuery = () => {
    const name = prompt('Enter a name for this query:');
    if (name && query.trim()) {
      setSavedQueries([...savedQueries, { name, query }]);
      alert('Query saved successfully!');
    }
  };

  const loadSavedQuery = (savedQuery: string) => {
    setQuery(savedQuery);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Custom Query Builder</h1>
        <p className="text-gray-600 mt-2">
          Write and execute custom SQL queries against the database (SELECT only)
        </p>
      </div>

      {/* Query Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex items-start">
          <Sparkles className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-blue-800 mb-2">Query Tips:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              {QUERY_TIPS.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sample Queries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BookOpen className="text-gray-600 mr-2" size={20} />
          <h2 className="text-xl font-semibold">Sample Queries</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_QUERIES.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSampleQuery(sample.query)}
              className="text-left p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{sample.name}</h3>
              <p className="text-sm text-gray-600">{sample.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Queries */}
      {savedQueries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Queries</h2>
          <div className="space-y-2">
            {savedQueries.map((saved, index) => (
              <button
                key={index}
                onClick={() => loadSavedQuery(saved.query)}
                className="w-full text-left p-3 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{saved.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Editor */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">SQL Query</h2>
          <div className="flex gap-2">
            <button
              onClick={saveQuery}
              disabled={!query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Save Query
            </button>
            <button
              onClick={executeQuery}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query here... (SELECT statements only)"
          className="w-full h-64 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          spellCheck={false}
        />

        <div className="mt-2 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> Only SELECT queries are allowed. INSERT, UPDATE, DELETE, and other
            modification operations are blocked for safety.
          </p>
        </div>
      </div>

      {/* Query Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Query Results</h2>

          {result.success ? (
            <>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  ✓ Query executed successfully. Returned {result.rowCount} row(s).
                </p>
              </div>

              {result.results && result.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(result.results[0]).map((column) => (
                          <th
                            key={column}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.results.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((value: any, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                              {value === null
                                ? 'NULL'
                                : typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">Query returned no results.</p>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-700 mt-2">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Query Help */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Tables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Application Schema</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cities</li>
              <li>• Countries</li>
              <li>• StateProvinces</li>
              <li>• People</li>
              <li>• DeliveryMethods</li>
              <li>• PaymentMethods</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sales Schema</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Orders</li>
              <li>• OrderLines</li>
              <li>• Invoices</li>
              <li>• InvoiceLines</li>
              <li>• Customers</li>
              <li>• CustomerTransactions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Purchasing Schema</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PurchaseOrders</li>
              <li>• PurchaseOrderLines</li>
              <li>• Suppliers</li>
              <li>• SupplierTransactions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Warehouse Schema</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• StockItems</li>
              <li>• StockItemHoldings</li>
              <li>• StockItemTransactions</li>
              <li>• ColdRoomTemperatures_Archive</li>
              <li>• VehicleTemperatures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}