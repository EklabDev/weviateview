import { useState, useEffect } from 'react';
import { getSettings, saveSettings, Settings } from '../lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({ weaviateUrl: '', apiKey: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings);
      setError(null);
      setSuccess(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSuccess(null);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      let formattedUrl = settings.weaviateUrl;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `http://${formattedUrl}`;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const response = await fetch(`${formattedUrl}/v1/schema`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText} (Status: ${response.status})`);
      }

      // Connection successful
      setSuccess('Connection successful! Successfully connected to Weaviate.');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Weaviate');
      setSuccess(null);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Format URL properly
      let formattedUrl = settings.weaviateUrl;
      if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `http://${formattedUrl}`;
      }

      await saveSettings({
        ...settings,
        weaviateUrl: formattedUrl,
      });

      // Reinitialize Weaviate connection
      const { initializeWeaviate } = await import('../lib/weaviate');
      await initializeWeaviate();

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Weaviate Connection Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="weaviateUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Weaviate URL
            </label>
            <input
              id="weaviateUrl"
              type="text"
              value={settings.weaviateUrl}
              onChange={(e) => {
                setSettings({ ...settings, weaviateUrl: e.target.value });
                setError(null);
                setSuccess(null);
              }}
              placeholder="http://localhost:8080"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key (optional)
            </label>
            <input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => {
                setSettings({ ...settings, apiKey: e.target.value });
                setError(null);
                setSuccess(null);
              }}
              placeholder="Enter API key if required"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={testConnection}
              disabled={testing || !settings.weaviateUrl}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !settings.weaviateUrl}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
