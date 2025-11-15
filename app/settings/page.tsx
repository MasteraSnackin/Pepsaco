'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.geminiApiKey) {
        setSavedKey(maskApiKey(data.geminiApiKey));
        setGeminiApiKey('');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const handleSave = async () => {
    if (!geminiApiKey.trim()) {
      setMessage('Please enter an API key');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('API key saved successfully! Restart the server for changes to take effect.');
        setMessageType('success');
        setSavedKey(maskApiKey(geminiApiKey));
        setGeminiApiKey('');
      } else {
        setMessage(data.error || 'Failed to save API key');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to save API key');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/test');
      const data = await response.json();

      if (response.ok) {
        setMessage('✅ API key is valid and working!');
        setMessageType('success');
      } else {
        setMessage(data.error || 'API key test failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to test API key');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Settings</h1>
        <p className="text-gray-600">Configure your application settings</p>
      </div>

      {/* API Key Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🔑 Google Gemini API Key
        </h2>

        <div className="space-y-4">
          {/* Current Key Status */}
          {savedKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Current API Key</p>
                  <p className="text-sm text-green-700 font-mono mt-1">{savedKey}</p>
                </div>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Key'}
                </button>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {savedKey ? 'Update API Key' : 'Enter API Key'}
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading || !geminiApiKey.trim()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : 'Save API Key'}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📖 How to Get Your API Key</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>
            Visit{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Google AI Studio
            </a>
          </li>
          <li>Sign in with your Google account</li>
          <li>Click "Create API Key" or "Get API Key"</li>
          <li>Copy the generated key</li>
          <li>Paste it in the field above and click "Save API Key"</li>
          <li>Restart the development server for changes to take effect</li>
        </ol>
      </div>

      {/* Features Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">✨ AI Features Enabled</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Natural language to SQL query generation
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Query explanation and optimization
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Automated business insights
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Executive summaries
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Smart alerts and anomaly detection
          </li>
        </ul>
      </div>

      {/* Cost Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-3">💰 Pricing Information</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>Free Tier:</strong> 60 requests per minute
          </p>
          <p>
            <strong>Estimated Cost:</strong> ~$12-15/month for moderate usage
          </p>
          <p>
            <strong>Cost per Feature:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Query generation: ~$0.005 per query</li>
            <li>Daily insights: ~$0.75/month</li>
            <li>Hourly alerts: ~$11/month</li>
          </ul>
          <p className="mt-2">
            Monitor your usage at{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}