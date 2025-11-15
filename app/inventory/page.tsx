'use client';

import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface InventoryData {
  summary: {
    totalItems: number;
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  lowStockItems: Array<{
    StockItemName: string;
    QuantityOnHand: number;
    ReorderLevel: number;
    shortage: number;
  }>;
  recentMovements: Array<{
    StockItemName: string;
    TransactionOccurredWhen: string;
    Quantity: number;
    TransactionTypeName: string;
    value: number;
  }>;
  stockByCategory: Array<{
    category: string;
    itemCount: number;
    totalStock: number;
    totalValue: number;
  }>;
  topMovingItems: Array<{
    StockItemName: string;
    transactionCount: number;
    totalMovement: number;
  }>;
}

export default function InventoryManagement() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'No data available'}</p>
        <button
          onClick={fetchInventoryData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Stock by Category Chart
  const stockByCategoryData = {
    labels: data.stockByCategory.map(c => c.category),
    datasets: [
      {
        label: 'Total Value',
        data: data.stockByCategory.map(c => c.totalValue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };

  // Top Moving Items Chart
  const topMovingItemsData = {
    labels: data.topMovingItems.map(item => item.StockItemName),
    datasets: [
      {
        data: data.topMovingItems.map(item => item.transactionCount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <button
          onClick={fetchInventoryData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.totalItems)}
              </p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.totalStock)}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(data.summary.lowStockItems)}
              </p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumber(data.summary.outOfStockItems)}
              </p>
            </div>
            <AlertTriangle className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-orange-500 mr-2" size={20} />
            <p className="text-orange-800 font-semibold">
              {data.lowStockItems.length} items need reordering
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stock Value by Category</h2>
          <Bar
            data={stockByCategoryData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `Value: ${formatCurrency(context.parsed.y)}`,
                  },
                },
              },
              scales: {
                y: {
                  ticks: {
                    callback: (value) => formatCurrency(Number(value)),
                  },
                },
              },
            }}
          />
        </div>

        {/* Top Moving Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Moving Items (Last 3 Months)</h2>
          <Doughnut
            data={topMovingItemsData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12,
                    font: {
                      size: 10,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.parsed;
                      return `${label}: ${value} transactions`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Items Requiring Reorder</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  On Hand
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Reorder Level
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Shortage
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.lowStockItems.map((item, index) => (
                <tr key={index} className={item.QuantityOnHand === 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.StockItemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatNumber(item.QuantityOnHand)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatNumber(item.ReorderLevel)}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 text-right font-semibold">
                    {formatNumber(item.shortage)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.QuantityOnHand === 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Low Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Stock Movements</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentMovements.slice(0, 20).map((movement, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {movement.StockItemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(movement.TransactionOccurredWhen).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {movement.TransactionTypeName}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    movement.Quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.Quantity > 0 ? '+' : ''}{formatNumber(movement.Quantity)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(Math.abs(movement.value))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}