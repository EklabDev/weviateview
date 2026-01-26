import { useState, useEffect } from 'react';
import { updateObject, getObjectById, initializeWeaviate } from '../lib/weaviate';

interface EditObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collectionName: string;
  objectId: string;
  properties: Array<{
    name: string;
    dataType?: string[];
    description?: string;
  }>;
}

export function EditObjectModal({
  isOpen,
  onClose,
  onSuccess,
  collectionName,
  objectId,
  properties,
}: EditObjectModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && objectId) {
      loadObjectData();
    }
  }, [isOpen, objectId]);

  const loadObjectData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      await initializeWeaviate();
      const data = await getObjectById(collectionName, objectId);
      if (data) {
        setFormData(data);
      } else {
        setError('Object not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load object');
    } finally {
      setLoadingData(false);
    }
  };

  const handleFieldChange = (propertyName: string, value: unknown) => {
    setFormData({ ...formData, [propertyName]: value });
  };

  const handleArrayItemChange = (propertyName: string, index: number, value: string) => {
    const array = (formData[propertyName] as string[]) || [];
    const updated = [...array];
    updated[index] = value;
    setFormData({ ...formData, [propertyName]: updated });
  };

  const addArrayItem = (propertyName: string) => {
    const array = (formData[propertyName] as string[]) || [];
    setFormData({ ...formData, [propertyName]: [...array, ''] });
  };

  const removeArrayItem = (propertyName: string, index: number) => {
    const array = (formData[propertyName] as string[]) || [];
    setFormData({ ...formData, [propertyName]: array.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await initializeWeaviate();
      await updateObject(collectionName, objectId, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update object');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderField = (prop: { name: string; dataType?: string[]; description?: string }) => {
    const dataType = prop.dataType?.[0] || 'string';
    const isArray = dataType.includes('[]');
    const baseType = isArray ? dataType.replace('[]', '') : dataType;

    if (isArray) {
      const array = (formData[prop.name] as string[]) || [];
      return (
        <div key={prop.name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {prop.name} {prop.description && <span className="text-gray-600">({prop.description})</span>}
            <span className="text-gray-600 ml-2">[{baseType}[]]</span>
          </label>
          <div className="space-y-2">
            {array.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type={baseType === 'number' || baseType === 'int' ? 'number' : 'text'}
                  value={item}
                  onChange={(e) => handleArrayItemChange(prop.name, index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(prop.name, index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem(prop.name)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>
        </div>
      );
    }

    switch (baseType) {
      case 'boolean':
        return (
          <div key={prop.name}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(formData[prop.name] as boolean) || false}
                onChange={(e) => handleFieldChange(prop.name, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {prop.name} {prop.description && <span className="text-gray-600">({prop.description})</span>}
              </span>
            </label>
          </div>
        );
      case 'int':
      case 'number':
        return (
          <div key={prop.name}>
            <label className="block text-sm font-medium text-gray-700">
              {prop.name} {prop.description && <span className="text-gray-600">({prop.description})</span>}
              <span className="text-gray-600 ml-2">[{baseType}]</span>
            </label>
            <input
              type="number"
              value={(formData[prop.name] as number) || 0}
              onChange={(e) => handleFieldChange(prop.name, baseType === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'date':
        const dateValue = formData[prop.name] as string;
        // Convert ISO date string to datetime-local format if needed
        let formattedDate = '';
        if (dateValue) {
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().slice(0, 16); // Format for datetime-local
            } else {
              formattedDate = dateValue;
            }
          } catch {
            formattedDate = dateValue;
          }
        }
        return (
          <div key={prop.name}>
            <label className="block text-sm font-medium text-gray-700">
              {prop.name} {prop.description && <span className="text-gray-600">({prop.description})</span>}
              <span className="text-gray-600 ml-2">[date]</span>
            </label>
            <input
              type="datetime-local"
              value={formattedDate}
              onChange={(e) => handleFieldChange(prop.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      default:
        return (
          <div key={prop.name}>
            <label className="block text-sm font-medium text-gray-700">
              {prop.name} {prop.description && <span className="text-gray-600">({prop.description})</span>}
              <span className="text-gray-600 ml-2">[{baseType}]</span>
            </label>
            <input
              type="text"
              value={(formData[prop.name] as string) || ''}
              onChange={(e) => handleFieldChange(prop.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Object in {collectionName}</h2>

        {loadingData ? (
          <div className="text-center py-8">Loading object data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {properties.map((prop) => renderField(prop))}

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
                {loading ? 'Updating...' : 'Update Object'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
