'use client';

import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Thermometer, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ColdChainData {
  summary: {
    totalReadings: number;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
    violations: number;
  };
  recentReadings: Array<{
    ColdRoomSensorNumber: number;
    Temperature: number;
    RecordedWhen: string;
  }>;
  violations: Array<{
    ColdRoomSensorNumber: number;
    Temperature: number;
    RecordedWhen: string;
    violationType: string;
  }>;
  bySensor: Array<{
    ColdRoomSensorNumber: number;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
    readingCount: number;
    violations: number;
  }>;
  hourlyTrend: Array<{
    hour: number;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
  }>;
  vehicleTemperatures: Array<{
    VehicleRegistration: string;
    Temperature: number;
    RecordedWhen: string;
    isViolation: number;
  }>;
}

export default function ColdChainMonitoring() {
  const [data, setData] = useState<ColdChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchColdChainData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchColdChainData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchColdChainData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/cold-chain');
      if (!response.ok) {
        throw new Error('Failed to fetch cold chain data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching cold chain data:', error);
      setError('Failed to load cold chain data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatTemp = (value: number) => {
    return `${value.toFixed(1)}°C`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cold chain data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchColdChainData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Hourly Temperature Trend Chart
  const hourlyTrendData = {
    labels: data.hourlyTrend.map(item => `${item.hour}:00`),
    datasets: [
      {
        label: 'Average Temperature',
        data: data.hourlyTrend.map(item => item.avgTemp),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Min Temperature',
        data: data.hourlyTrend.map(item => item.minTemp),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        borderDash: [5, 5],
      },
      {
        label: 'Max Temperature',
        data: data.hourlyTrend.map(item => item.maxTemp),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };

  // Temperature by Sensor Chart
  const bySensorData = {
    labels: data.bySensor.map(s => `Sensor ${s.ColdRoomSensorNumber}`),
    datasets: [
      {
        label: 'Average Temperature',
        data: data.bySensor.map(s => s.avgTemp),
        backgroundColor: data.bySensor.map(s => 
          s.violations > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)'
        ),
      },
    ],
  };

  const violationRate = data.summary.totalReadings > 0 
    ? ((data.summary.violations / data.summary.totalReadings) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cold Chain Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchColdChainData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Temperature</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTemp(data.summary.avgTemp)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <Thermometer className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Readings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.totalReadings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Violations</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumber(data.summary.violations)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{violationRate}% of readings</p>
            </div>
            <AlertTriangle className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temp Range</p>
              <p className="text-lg font-bold text-gray-900">
                {formatTemp(data.summary.minTemp)} - {formatTemp(data.summary.maxTemp)}
              </p>
              <p className="text-xs text-green-600 mt-1">Target: 2°C - 4°C</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Violation Alert */}
      {data.violations.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <p className="text-red-800 font-semibold">
              {data.violations.length} temperature violations detected in recent readings
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Temperature Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">24-Hour Temperature Trend</h2>
          <Line
            data={hourlyTrendData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.dataset.label}: ${formatTemp(context.parsed.y ?? 0)}`,
                  },
                },
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Temperature (°C)',
                  },
                  ticks: {
                    callback: (value) => `${value}°C`,
                  },
                },
              },
            }}
          />
        </div>

        {/* Temperature by Sensor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Average Temperature by Sensor (24h)</h2>
          <Bar
            data={bySensorData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `Avg Temp: ${formatTemp(context.parsed.y ?? 0)}`,
                  },
                },
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Temperature (°C)',
                  },
                  ticks: {
                    callback: (value) => `${value}°C`,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Sensor Status Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sensor Status (Last 24 Hours)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sensor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Avg Temp
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Min Temp
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Max Temp
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Readings
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Violations
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.bySensor.map((sensor) => (
                <tr key={sensor.ColdRoomSensorNumber} className={sensor.violations > 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Sensor {sensor.ColdRoomSensorNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatTemp(sensor.avgTemp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatTemp(sensor.minTemp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatTemp(sensor.maxTemp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatNumber(sensor.readingCount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 text-right font-semibold">
                    {formatNumber(sensor.violations)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sensor.violations > 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Alert
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Violations Table */}
      {data.violations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Temperature Violations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sensor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Temperature
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Violation Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.violations.slice(0, 20).map((violation, index) => (
                  <tr key={index} className="bg-red-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Sensor {violation.ColdRoomSensorNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(violation.RecordedWhen).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-semibold">
                      {formatTemp(violation.Temperature)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        violation.violationType === 'Too Cold' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {violation.violationType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Temperatures */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Vehicle Temperatures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Temperature
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.vehicleTemperatures.slice(0, 20).map((vehicle, index) => (
                <tr key={index} className={vehicle.isViolation ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {vehicle.VehicleRegistration}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(vehicle.RecordedWhen).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    vehicle.isViolation ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatTemp(vehicle.Temperature)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {vehicle.isViolation ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Violation
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Normal
                      </span>
                    )}
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