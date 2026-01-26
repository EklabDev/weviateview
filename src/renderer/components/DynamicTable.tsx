import React from 'react';

export type ColumnDef = {
  key: string;
  label: string;
  dataType?: string[];
  render?: (value: unknown, row?: TableData) => React.ReactNode;
};

type TableData = Record<string, unknown> & {
  _additional?: {
    id: string;
  };
};

type DynamicTableProps = {
  columns: ColumnDef[];
  data: TableData[];
  loading?: boolean;
  error?: string;
  onSort?: (columnKey: string) => void;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  } | null;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onRowClick?: (row: TableData) => void;
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  data,
  loading = false,
  error,
  onSort,
  sortConfig,
  selectionMode = false,
  selectedIds = new Set(),
  onSelect,
  onRowClick,
}) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getSortIcon = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.dataType?.includes('date')) {
      return null;
    }

    if (sortConfig?.key !== columnKey) {
      return <span>↓</span>; // Show descending arrow as default
    }
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const renderCell = (row: TableData, column: ColumnDef) => {
    const value = row[column.key];
    if (column.render) {
      // Pass both value and row to render function for flexibility
      return column.render(value, row);
    }
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="overflow-x-auto text-gray-900">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectionMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Select
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => onSort?.(column.key)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider ${
                  column.dataType?.includes('date') ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                title={column.dataType ? `Type: ${column.dataType[0]}` : 'unknown'}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => !selectionMode && onRowClick?.(row)}
              className={!selectionMode && onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              {selectionMode && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={row._additional?.id ? selectedIds.has(row._additional.id) : false}
                    onChange={() => row._additional?.id && onSelect?.(row._additional.id)}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
