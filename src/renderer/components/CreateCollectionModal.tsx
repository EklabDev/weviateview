import { useState, useEffect } from 'react';
import { createCollection, CreateCollectionSchema } from '../lib/weaviate';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DATA_TYPES = [
  'string',
  'text',
  'int',
  'number',
  'boolean',
  'date',
  'string[]',
  'text[]',
  'int[]',
  'number[]',
  'boolean[]',
  'date[]',
];

export function CreateCollectionModal({ isOpen, onClose, onSuccess }: CreateCollectionModalProps) {
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [properties, setProperties] = useState<Array<{ name: string; dataType: string[]; description: string }>>([
    { name: '', dataType: ['string'], description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCollectionName('');
      setDescription('');
      setProperties([{ name: '', dataType: ['string'], description: '' }]);
      setError(null);
    }
  }, [isOpen]);

  const addProperty = () => {
    setProperties([...properties, { name: '', dataType: ['string'], description: '' }]);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, field: 'name' | 'dataType' | 'description', value: string | string[]) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!collectionName.trim()) {
        throw new Error('Collection name is required');
      }

      const validProperties = properties
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          dataType: p.dataType,
          description: p.description.trim() || undefined,
        }));

      if (validProperties.length === 0) {
        throw new Error('At least one property is required');
      }

      // Ensure collection name starts with uppercase
      const className = collectionName.trim();
      const formattedClassName = className.charAt(0).toUpperCase() + className.slice(1);

      const schema: CreateCollectionSchema = {
        class: formattedClassName,
        description: description.trim() || undefined,
        properties: validProperties,
      };

      await createCollection(schema);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Collection</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name *
            </label>
            <input
              id="collectionName"
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="MyCollection"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Properties *</label>
              <button
                type="button"
                onClick={addProperty}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Property
              </button>
            </div>

            <div className="space-y-3">
              {properties.map((prop, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={prop.name}
                      onChange={(e) => updateProperty(index, 'name', e.target.value)}
                      placeholder="Property name"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={prop.dataType[0] || 'string'}
                      onChange={(e) => updateProperty(index, 'dataType', [e.target.value])}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={prop.description}
                      onChange={(e) => updateProperty(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  {properties.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
