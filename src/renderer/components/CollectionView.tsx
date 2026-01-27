import { useState, useEffect, useCallback, useRef } from 'react';
import { DynamicTable, ColumnDef } from './DynamicTable';
import { CollectionData, getCollectionData, deleteObjects, initializeWeaviate } from '../lib/weaviate';
import { DeleteObjectsModal } from './DeleteObjectsModal';
import { CreateObjectModal } from './CreateObjectModal';
import { EditObjectModal } from './EditObjectModal';

interface CollectionViewProps {
  collectionName: string;
  properties: Array<{
    name: string;
    dataType: string[];
    description?: string;
  }>;
  onBack: () => void;
}

export function CollectionView({ collectionName, properties, onBack }: CollectionViewProps) {
  const [data, setData] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ property: string; order: 'asc' | 'desc' } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const OBJECTS_PER_PAGE = 250;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setLoading(true);
        setData([]);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      try {
        await initializeWeaviate();
        const currentOffset = loadMore ? offset : 0;
        const newData = await getCollectionData(
          collectionName,
          properties,
          sortConfig || undefined,
          OBJECTS_PER_PAGE,
          currentOffset,
        );

        setData((prevData) => (loadMore ? [...prevData, ...newData] : newData));
        setOffset(currentOffset + newData.length);
        setCanLoadMore(newData.length === OBJECTS_PER_PAGE);
        setError(null);
      } catch (err) {
        console.error('Error in CollectionView:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [collectionName, sortConfig, offset, properties],
  );

  useEffect(() => {
    fetchData(false);
  }, [sortConfig]);

  const handleLoadMore = () => {
    fetchData(true);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteClick = () => {
    if (selectionMode) {
      if (selectedIds.size > 0) {
        setDeleteModalOpen(true);
      } else {
        setSelectionMode(false);
      }
    } else {
      setSelectionMode(true);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await initializeWeaviate();
      await deleteObjects(collectionName, Array.from(selectedIds));
      setDeleteModalOpen(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      console.error('Error deleting objects:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete objects');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">{error}</p>
        <button onClick={onBack} className="mt-2 text-blue-600 hover:text-blue-800">
          ← Back to Collections
        </button>
      </div>
    );
  }

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const columns: ColumnDef[] = properties.map((prop) => ({
    key: prop.name,
    label: prop.name,
    dataType: prop.dataType,
    render: (value: unknown) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
    },
  }));

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.dataType?.includes('date')) return;

    setSortConfig((current) => {
      if (current?.property === columnKey) {
        if (current.order === 'desc') {
          return { property: columnKey, order: 'asc' };
        }
        return null;
      }
      return { property: columnKey, order: 'desc' };
    });
  };

  const handleRowClick = (row: CollectionData) => {
    const id = (row._additional as { id?: string })?.id;
    if (id) {
      setEditingObjectId(id);
      setEditModalOpen(true);
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    setData([]);
    fetchData(false);
  };

  return (
    <div className="space-y-4 text-gray-900">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800">
          ← Back to Collections
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
            title="Refresh objects list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            + Create Object
          </button>
          <button
            onClick={handleDeleteClick}
            className={`px-4 py-2 rounded-md ${
              selectionMode && selectedIds.size > 0
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {selectionMode ? `Delete (${selectedIds.size})` : 'Delete'}
          </button>
          {selectionMode && (
            <button
              onClick={handleCancelSelection}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div ref={topRef}></div>

      <DynamicTable
        columns={columns}
        data={data}
        loading={loading}
        error={error || undefined}
        onSort={handleSort}
        sortConfig={
          sortConfig
            ? {
                key: sortConfig.property,
                direction: sortConfig.order,
              }
            : null
        }
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onRowClick={handleRowClick}
      />

      <div ref={bottomRef}></div>

      {canLoadMore && (
        <div className="flex justify-center gap-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
          <button
            onClick={scrollToTop}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ↑ Top
          </button>
        </div>
      )}

      <DeleteObjectsModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteConfirm}
        selectedCount={selectedIds.size}
      />

      <CreateObjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={async () => {
          await fetchData();
        }}
        collectionName={collectionName}
        properties={properties}
      />

      {editingObjectId && (
        <EditObjectModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingObjectId(null);
          }}
          onSuccess={async () => {
            await fetchData();
          }}
          collectionName={collectionName}
          objectId={editingObjectId}
          properties={properties}
        />
      )}
    </div>
  );
}
