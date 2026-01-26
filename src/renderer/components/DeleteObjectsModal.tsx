import { useEffect, useRef, useState } from 'react';

interface DeleteObjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  selectedCount: number;
}

export function DeleteObjectsModal({
  isOpen,
  onClose,
  onDelete,
  selectedCount,
}: DeleteObjectsModalProps) {
  const [inputValue, setInputValue] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleDelete = () => {
    if (inputValue.toLowerCase() === 'delete') {
      onDelete();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-red-600">DANGER WARNING</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to delete {selectedCount} {selectedCount === 1 ? 'object' : 'objects'}. This
            action cannot be undone.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type &quot;delete&quot; to confirm:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={inputValue.toLowerCase() !== 'delete'}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete {selectedCount} {selectedCount === 1 ? 'Object' : 'Objects'}
          </button>
        </div>
      </div>
    </div>
  );
}
