'use client';

import { useState, useEffect } from 'react';

interface Insight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation?: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }
      
      setInsights(data.insights || []);
      setSummary(data.summary || '');
    } catch (error: any) {
      console.error('Failed to fetch insights:', error);
      setError(error.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-900';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating AI insights...</p>
          <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Insights</h3>
              <p className="text-red-700 mb-4">{error}</p>
              {error.includes('Gemini API key') && (
                <div className="bg-white p-4 rounded border border-red-200 mt-4">
                  <p className="font-medium text-red-900 mb-2">Setup Required:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                    <li>Get an API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                    <li>Add to <code className="bg-red-100 px-1 rounded">.env.local</code>: <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY=your-key</code></li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              )}
              <button
                onClick={fetchInsights}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI-Powered Insights
        </h1>
        <p className="text-gray-600">
          Automated analysis and recommendations from your data
        </p>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 mb-8 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            📊 Executive Summary
          </h2>
          <div className="text-gray-700 whitespace-pre-line leading-relaxed">
            {summary}
          </div>
        </div>
      )}

      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border-l-4 p-6 rounded-lg shadow-sm ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{getSeverityIcon(insight.severity)}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                  <p className="mb-3 opacity-90">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="mt-4 pt-4 border-t border-current opacity-75">
                      <p className="font-medium mb-1">💡 Recommendation:</p>
                      <p>{insight.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <p className="text-gray-600">No insights available at this time.</p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '🔄 Generating...' : '🔄 Refresh Insights'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Insights are generated using AI analysis of your latest data
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cost: ~$0.05 per generation
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About AI Insights</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Insights are generated from your latest database metrics</li>
          <li>• Analysis includes sales, inventory, and cold chain data</li>
          <li>• Recommendations are based on industry best practices</li>
          <li>• Refresh insights to get updated analysis</li>
        </ul>
      </div>
    </div>
  );
}