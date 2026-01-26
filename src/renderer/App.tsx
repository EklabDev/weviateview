import { useState, useEffect } from 'react';
import { CollectionsList } from './components/CollectionsList';
import { CollectionView } from './components/CollectionView';
import { SearchView } from './components/SearchView';
import { SettingsModal } from './components/SettingsModal';
import { CollectionInfo, getCollections, initializeWeaviate } from './lib/weaviate';
import { getSettings } from './lib/settings';

type View = 'collections' | 'collection' | 'search';
type Tab = 'collections' | 'search';

export function App() {
  const [view, setView] = useState<View>('collections');
  const [activeTab, setActiveTab] = useState<Tab>('collections');
  const [selectedCollection, setSelectedCollection] = useState<CollectionInfo | null>(null);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const settings = await getSettings();
      if (settings.weaviateUrl) {
        setHasConnection(true);
        await initializeWeaviate();
        await loadCollections();
      } else {
        setHasConnection(false);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check connection');
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      await initializeWeaviate();
      const data = await getCollections();
      setCollections(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionClick = (collectionName: string) => {
    const collection = collections.find((c) => c.name === collectionName);
    if (collection) {
      setSelectedCollection(collection);
      setView('collection');
      setActiveTab('collections');
    }
  };

  const handleBack = () => {
    setView('collections');
    setActiveTab('collections');
    setSelectedCollection(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'collections') {
      setView('collections');
      setSelectedCollection(null);
    } else if (tab === 'search') {
      setView('search');
    }
  };

  const handleSettingsSave = () => {
    setSettingsOpen(false);
    checkConnection();
  };

  if (!hasConnection) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Weaviate Collections Explorer</h1>
            <p className="text-gray-600 mb-6">
              Please configure your Weaviate connection to get started.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Configure Connection
            </button>
          </div>
        </div>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Weaviate Collections Explorer</h1>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Settings
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => handleTabChange('collections')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'collections'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => handleTabChange('search')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadCollections}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Retry
            </button>
          </div>
        )}

        {view === 'search' && <SearchView />}

        {view === 'collections' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading collections...</div>
              </div>
            ) : (
              <CollectionsList
                collections={collections}
                onDeleteSuccess={loadCollections}
                onCollectionClick={handleCollectionClick}
              />
            )}
          </>
        )}

        {view === 'collection' && selectedCollection && (
          <CollectionView
            collectionName={selectedCollection.name}
            properties={selectedCollection.properties}
            onBack={handleBack}
          />
        )}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
}
