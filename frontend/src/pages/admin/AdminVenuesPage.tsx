import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminVenues, type Venue } from '../../lib/api';
import Modal from '../../components/ui/Modal';
import { c } from '../../lib/theme';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'edit' | 'seats'; venue?: Venue } | null>(null);
  const [form, setForm] = useState<Partial<Venue>>({});
  const [seatsForm, setSeatsForm] = useState({ section: 'Main', rows: 'A,B,C,D,E,F,G', seatsPerRow: 12 });
  const [saving, setSaving] = useState(false);

  const refresh = () => adminVenues.list().then(setVenues).catch(() => setVenues([]));

  useEffect(() => {
    adminVenues.list()
      .then(setVenues)
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm({}); setModal({ mode: 'edit' }); };
  const openEdit = (v: Venue) => { setForm(v); setModal({ mode: 'edit', venue: v }); };
  const openSeats = (v: Venue) => { setModal({ mode: 'seats', venue: v }); };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal?.venue) {
        await adminVenues.update(modal.venue.id, form);
        setVenues((vs) => vs.map((v) => v.id === modal.venue!.id ? { ...v, ...form } : v));
        toast.success('Venue updated.');
      } else {
        const created = await adminVenues.create(form);
        setVenues((vs) => [...vs, created]);
        toast.success('Venue created.');
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save venue.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminVenues.createSeats(modal!.venue!.id, {
        section: seatsForm.section,
        rows: seatsForm.rows.split(',').map((r) => r.trim()).filter(Boolean),
        seatsPerRow: seatsForm.seatsPerRow,
      });
      toast.success('Seats created successfully!');
      setModal(null);
      await refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create seats.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Venues</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Manage campus venues and seating configurations.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-sm" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontSize: 14 }}>
            <span className="material-symbols-outlined">add</span> Add Venue
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: c.surfaceHigh }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {venues.map((v) => (
              <div key={v.id} className="border rounded-xl p-6 flex flex-col gap-4 hover:shadow-md transition-all" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.primaryFixed }}>
                    <span className="material-symbols-outlined" style={{ color: c.primary }}>location_on</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: c.primary }}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => openSeats(v)} className="p-1.5 rounded hover:bg-blue-50" style={{ color: c.secondary }} title="Manage Seats">
                      <span className="material-symbols-outlined text-[18px]">chair</span>
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>{v.name}</h3>
                  <p className="text-sm mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{v.address}</p>
                  {(v.city || v.country) && <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{[v.city, v.country].filter(Boolean).join(', ')}</p>}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: c.outlineVariant }}>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: c.primary }}>chair</span>
                    <span className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{(v.seatCount ?? 0).toLocaleString()} seats</span>
                  </span>
                  <span className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{v.eventCount ?? 0} events</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Venue Edit Modal */}
      <Modal open={modal?.mode === 'edit'} onClose={() => setModal(null)} title={modal?.venue ? 'Edit Venue' : 'Create Venue'}>
        <form onSubmit={handleSaveVenue} className="space-y-4">
          {[
            { key: 'name', label: 'Venue Name', placeholder: 'e.g. Main Auditorium' },
            { key: 'address', label: 'Address', placeholder: 'Building, Street' },
            { key: 'city', label: 'City', placeholder: 'e.g. Naryn' },
            { key: 'country', label: 'Country', placeholder: 'e.g. Kyrgyzstan' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{f.label}</label>
              <input type="text" required value={String(form[f.key as keyof Venue] ?? '')} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 rounded-lg border text-sm" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
              {saving ? 'Saving…' : modal?.venue ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Seat Creation Modal */}
      <Modal open={modal?.mode === 'seats'} onClose={() => setModal(null)} title={`Manage Seats — ${modal?.venue?.name}`}>
        <form onSubmit={handleCreateSeats} className="space-y-4">
          <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
            Bulk-create seats by specifying row labels and seats per row. Existing seats will not be overwritten.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Section</label>
            <input type="text" value={seatsForm.section} onChange={(e) => setSeatsForm((s) => ({ ...s, section: e.target.value }))}
              placeholder="Main" className="w-full border rounded-xl px-4 py-3 focus:outline-none"
              style={{ background: c.surface, borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Row Labels (comma-separated)</label>
            <input type="text" value={seatsForm.rows} onChange={(e) => setSeatsForm((s) => ({ ...s, rows: e.target.value }))}
              placeholder="A,B,C,D,E,F" className="w-full border rounded-xl px-4 py-3 focus:outline-none font-mono text-sm"
              style={{ background: c.surface, borderColor: c.outlineVariant, color: c.onSurface }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Seats per Row</label>
            <input type="number" min={1} max={50} value={seatsForm.seatsPerRow} onChange={(e) => setSeatsForm((s) => ({ ...s, seatsPerRow: Number(e.target.value) }))}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
          </div>
          <div className="p-3 rounded-xl" style={{ background: c.primaryFixed }}>
            <p className="text-xs font-medium" style={{ color: c.primary, fontFamily: 'Inter' }}>
              Preview: {seatsForm.rows.split(',').length} rows × {seatsForm.seatsPerRow} seats = {seatsForm.rows.split(',').length * seatsForm.seatsPerRow} total seats
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 rounded-lg border text-sm" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
              {saving ? 'Creating…' : 'Create Seats'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
