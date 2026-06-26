import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { events as eventsApi, registrations as regApi, user as userApi, type Seat } from '../../lib/api';
import SeatMap from '../../components/ui/SeatMap';
import { c } from '../../lib/theme';

export default function SeatSelectionPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userApi.registrations()
      .then((regs) => {
        const reg = regs.find((r) => r.id === registrationId);
        if (!reg) throw new Error('Registration not found');
        return eventsApi.seats(reg.event.id);
      })
      .then((s) => { if (!cancelled) setSeats(s); })
      .catch((err) => {
        if (!cancelled) {
          setSeats([]);
          toast.error((err as Error).message || 'Could not load seats.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [registrationId]);

  const handleConfirm = async () => {
    if (!selected) { toast.error('Please select a seat.'); return; }
    setConfirming(true);
    try {
      await regApi.selectSeat(registrationId!, selected.id);
      toast.success(`Seat ${selected.row}${selected.number} confirmed!`);
      navigate('/my-events');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to select seat.');
    } finally {
      setConfirming(false);
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const seat = await regApi.autoSeat(registrationId!);
      toast.success(`Auto-assigned seat ${seat.row}${seat.number}!`);
      navigate('/my-events');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Auto-assign failed.');
    } finally {
      setAutoAssigning(false);
    }
  };

  const availableCount = seats.filter((s) => s.status === 'Available').length;

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-sm hover:underline" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to My Events
        </button>

        <h2 className="font-semibold mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Select Your Seat</h2>
        <p className="mb-8" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          {availableCount} seats available. Click a seat to select it, or use auto-assign.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2 border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}40`, borderTopColor: c.primary }} />
              </div>
            ) : (
              <SeatMap
                seats={seats}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected seat card */}
            <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <h3 className="font-semibold text-xl mb-4" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Your Selection</h3>
              {selected ? (
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: c.primary }}>
                    <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Hanken Grotesk' }}>
                      {selected.row}{selected.number}
                    </span>
                  </div>
                  <p className="font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Row {selected.row}, Seat {selected.number}</p>
                  <button onClick={() => setSelected(null)} className="text-xs mt-2 hover:underline" style={{ color: c.error, fontFamily: 'Inter' }}>Clear selection</button>
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: c.onSurfaceVariant }}>
                  <span className="material-symbols-outlined block text-[40px] mb-2" style={{ color: c.outlineVariant }}>chair</span>
                  <p className="text-sm" style={{ fontFamily: 'Inter' }}>No seat selected yet</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={!selected || confirming}
                className="w-full mt-4 py-4 rounded-lg font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}
              >
                {confirming ? 'Confirming…' : 'Confirm Seat'}
              </button>
            </div>

            <div className="border rounded-xl p-4" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
              <p className="text-sm font-medium mb-2" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Don&apos;t want to choose?</p>
              <button
                onClick={handleAutoAssign}
                disabled={autoAssigning}
                className="w-full py-3 rounded-lg text-sm font-medium border transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ borderColor: c.primary, color: c.primary, fontFamily: 'Inter' }}
              >
                {autoAssigning ? 'Assigning…' : '✨ Auto-Assign Best Seat'}
              </button>
            </div>

            <div className="border rounded-xl p-4" style={{ background: c.surfaceContainer, borderColor: c.outlineVariant }}>
              <p className="text-xs font-bold mb-1" style={{ color: c.primary, fontFamily: 'Inter' }}>📋 Seat Summary</p>
              <div className="space-y-1">
                {[
                  { label: 'Available', count: seats.filter((s) => s.status === 'Available').length, color: '#166534' },
                  { label: 'Held', count: seats.filter((s) => s.status === 'Held').length, color: '#9a3412' },
                  { label: 'Taken', count: seats.filter((s) => s.status === 'Assigned').length, color: c.onSurfaceVariant },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs" style={{ fontFamily: 'Inter' }}>
                    <span style={{ color: c.onSurfaceVariant }}>{item.label}</span>
                    <span className="font-semibold" style={{ color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
