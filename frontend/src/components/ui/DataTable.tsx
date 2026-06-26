import { c } from '../../lib/theme';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, data, keyExtractor, loading, emptyMessage = 'No data found.' }: Props<T>) {
  return (
    <div className="border rounded-xl shadow-sm overflow-hidden" style={{ background: c.surface, borderColor: c.outlineVariant }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ background: `${c.surfaceLow}80` }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider"
                  style={{ color: c.onSurfaceVariant, borderColor: c.outlineVariant, fontFamily: 'Inter', textAlign: col.align ?? 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                  <span className="material-symbols-outlined block mx-auto mb-2 text-[40px]" style={{ color: c.outlineVariant }}>inbox</span>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={keyExtractor(row)} className="transition-colors hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4" style={{ fontFamily: 'Inter', textAlign: col.align ?? 'left' }}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
