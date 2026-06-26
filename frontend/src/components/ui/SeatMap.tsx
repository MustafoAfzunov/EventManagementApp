import type { Seat } from '../../lib/api';
import { c } from '../../lib/theme';

interface Props {
  seats: Seat[];
  selectedId?: string;
  onSelect?: (seat: Seat) => void;
  readOnly?: boolean;
}

const seatColors: Record<Seat['status'] | 'Selected', { bg: string; border: string; text: string; cursor: string }> = {
  Available: { bg: c.surfaceLowest, border: c.primary, text: c.primary, cursor: 'pointer' },
  Held:      { bg: '#fef9c3', border: '#ca8a04', text: '#ca8a04', cursor: 'not-allowed' },
  Assigned:  { bg: c.surfaceHigh, border: c.outlineVariant, text: c.onSurfaceVariant, cursor: 'not-allowed' },
  Selected:  { bg: c.primary, border: c.primary, text: c.onPrimary, cursor: 'pointer' },
};

export default function SeatMap({ seats, selectedId, onSelect, readOnly }: Props) {
  // Group by row
  const rows = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const sortedRows = Object.keys(rows).sort();

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: 'Available', bg: c.surfaceLowest, border: c.primary, text: c.primary },
          { label: 'Selected', bg: c.primary, border: c.primary, text: c.onPrimary },
          { label: 'Held', bg: '#fef9c3', border: '#ca8a04', text: '#ca8a04' },
          { label: 'Taken', bg: c.surfaceHigh, border: c.outlineVariant, text: c.onSurfaceVariant },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2" style={{ background: l.bg, borderColor: l.border }} />
            <span className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Stage indicator */}
      <div className="w-full mb-8 py-2 rounded-lg text-center text-xs font-bold uppercase tracking-widest border-2" style={{ background: c.surfaceContainer, borderColor: c.outlineVariant, color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
        STAGE / SCREEN
      </div>

      {/* Seat grid */}
      <div className="space-y-2 overflow-x-auto">
        {sortedRows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-6 text-xs font-bold text-center shrink-0" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{row}</span>
            <div className="flex gap-1.5 flex-wrap">
              {rows[row].sort((a, b) => a.number - b.number).map((seat) => {
                const isSelected = seat.id === selectedId;
                const colorKey: keyof typeof seatColors = isSelected ? 'Selected' : seat.status;
                const cfg = seatColors[colorKey];
                const canSelect = !readOnly && seat.status === 'Available' && onSelect;
                return (
                  <button
                    key={seat.id}
                    onClick={() => canSelect && onSelect(seat)}
                    disabled={!canSelect}
                    className="w-9 h-9 rounded-lg text-xs font-bold border-2 transition-all"
                    title={`Row ${seat.row}, Seat ${seat.number} — ${seat.status}`}
                    style={{
                      background: cfg.bg,
                      borderColor: cfg.border,
                      color: cfg.text,
                      cursor: cfg.cursor,
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {seats.length === 0 && (
        <div className="text-center py-12" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          No seat data available.
        </div>
      )}
    </div>
  );
}
