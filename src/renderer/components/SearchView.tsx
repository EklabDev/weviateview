import { useState, useEffect } from 'react';
import { DynamicTable, ColumnDef } from './DynamicTable';
import { CollectionInfo, searchCollections, SearchType, initializeWeaviate, getCollections } from '../lib/weaviate';
import { CollectionData } from '../lib/weaviate';

export function SearchView() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('bm25');
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      const collection = collections.find(c => c.name === selectedCollection);
      if (collection) {
        setSelectedProperties(new Set(collection.properties.map(p => p.name)));
      }
    }
  }, [selectedCollection, collections]);

  const loadCollections = async () => {
    try {
      await initializeWeaviate();
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedCollection) {
      setError('Please enter a search query and select a collection');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      await initializeWeaviate();
      const properties = selectedProperties.size > 0 ? Array.from(selectedProperties) : undefined;
      const searchResults = await searchCollections({
        query: searchQuery,
        collectionName: selectedCollection,
        searchType,
        limit,
        properties,
      });
      console.log('Search results:', searchResults);
      // Ensure all results have the expected structure
      const normalizedResults = searchResults.map((result) => {
        if (!result || typeof result !== 'object') {
          return { _additional: { id: '', score: 0 } };
        }
        return {
          ...result,
          _additional: result._additional || { id: '', score: 0 },
        };
      });
      setResults(normalizedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const toggleProperty = (propertyName: string) => {
    setSelectedProperties(prev => {
      const next = new Set(prev);
      if (next.has(propertyName)) {
        next.delete(propertyName);
      } else {
        next.add(propertyName);
      }
      return next;
    });
  };

  const selectedCollectionInfo = collections.find(c => c.name === selectedCollection);

  const columns: ColumnDef[] = selectedCollectionInfo
    ? selectedCollectionInfo.properties.map((prop) => ({
        key: prop.name,
        label: prop.name,
        dataType: prop.dataType,
        render: (value: unknown) => {
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value);
        },
      }))
    : [];

  // Add score column if available
  if (results.length > 0) {
    const firstResult = results[0];
    const additional = firstResult?._additional as { score?: number; id?: string } | undefined;
    if (additional?.score !== undefined) {
      columns.unshift({
        key: '_score',
        label: 'Score',
        render: (_value: unknown, row?: CollectionData) => {
          if (!row || !row._additional) return '';
          const score = (row._additional as { score?: number })?.score;
          return score !== undefined ? score : '';
        },
      });
    }
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 ">Search Weaviate Collections</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection *
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a collection...</option>
              {collections.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} ({collection.count} objects)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query *
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as SearchType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bm25">BM25 (Keyword Search)</option>
                <option value="vector">Vector Search</option>
                <option value="hybrid">Hybrid (BM25 + Vector)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Results Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {selectedCollectionInfo && selectedCollectionInfo.properties.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Properties (optional - leave all selected to search all)
              </label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md bg-gray-50 max-h-40 overflow-y-auto">
                {selectedCollectionInfo.properties.map((prop) => (
                  <label
                    key={prop.name}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProperties.has(prop.name)}
                      onChange={() => toggleProperty(prop.name)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900">
                      {prop.name}
                      {prop.dataType && (
                        <span className="text-gray-600 ml-1">
                          [{prop.dataType[0]}]
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim() || !selectedCollection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">
            Search Results ({results.length})
          </h3>
          <DynamicTable
            columns={columns}
            data={results}
            loading={false}
          />
        </div>
      )}

      {!loading && results.length === 0 && searchQuery && selectedCollection && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No results found. Try adjusting your search query or search type.
        </div>
      )}
    </div>
  );
}
