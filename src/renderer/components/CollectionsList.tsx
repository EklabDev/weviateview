import { CollectionInfo, deleteCollection, initializeWeaviate } from '../lib/weaviate';
import { useState } from 'react';
import { DeleteModal } from './DeleteModal';
import { CreateCollectionModal } from './CreateCollectionModal';

type SortMethod = 'name' | 'count';
type SortDirection = 'asc' | 'desc';

interface CollectionsListProps {
  collections: CollectionInfo[];
  onDeleteSuccess: () => Promise<void>;
  onCollectionClick: (collectionName: string) => void;
}

export function CollectionsList({
  collections,
  onDeleteSuccess,
  onCollectionClick,
}: CollectionsListProps) {
  const [sortMethod, setSortMethod] = useState<SortMethod>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const toggleSort = (method: SortMethod) => {
    if (method === sortMethod) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortMethod(method);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (collectionName: string) => {
    setSelectedCollection(collectionName);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCollection) return;

    try {
      await deleteCollection(selectedCollection);
      setDeleteModalOpen(false);
      await onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete collection');
    }
  };

  const sortedCollections = [...collections].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortMethod === 'name') {
      return multiplier * a.name.localeCompare(b.name);
    } else {
      return multiplier * (b.count - a.count);
    }
  });

  return (
    <div className="space-y-4 text-gray-900">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
        <button
          onClick={() => toggleSort('name')}
          className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
            sortMethod === 'name'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          Name{' '}
          {sortMethod === 'name' && (
            <span>{sortDirection === 'asc' ? '↓' : '↑'}</span>
          )}
        </button>
        <button
          onClick={() => toggleSort('count')}
          className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg ${
            sortMethod === 'count'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          Objects{' '}
          {sortMethod === 'count' && (
            <span>{sortDirection === 'asc' ? '↓' : '↑'}</span>
          )}
        </button>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + Create Collection
        </button>
      </div>

      <div className="grid gap-4">
        {sortedCollections.map((collection) => (
          <div
            key={collection.name}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => onCollectionClick(collection.name)}
                >
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                )}
                <p className="text-sm text-gray-700 mt-1">
                  {formatNumber(collection.count)} {collection.count === 1 ? 'object' : 'objects'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onCollectionClick(collection.name)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Objects
                </button>
                <button
                  onClick={() => handleDeleteClick(collection.name)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-700">Properties: </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {collection.properties.map((prop: { name: string; description?: string; dataType?: string[] }) => (
                  <span
                    key={prop.name}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    title={prop.description || prop.name}
                  >
                    {prop.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCollection && (
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
          collectionName={selectedCollection}
        />
      )}

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={onDeleteSuccess}
      />
    </div>
  );
}
