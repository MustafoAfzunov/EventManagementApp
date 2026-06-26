import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import {
  adminEvents, adminRegistrations, adminVenues,
  type EventInput, type AdminRegistration, type Venue, type SeatingMode,
} from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { c } from '../../lib/theme';

type Tab = 'details' | 'speakers' | 'registrations';

const emptyEvent: EventInput = {
  title: '', category: 'Academic', description: '', imageUrl: '',
  startDate: '', endDate: '', capacity: 100, venueId: '',
  seatingMode: 'None', requiresApproval: false, isFeatured: false, speakers: [],
};

export default function AdminEventEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [tab, setTab] = useState<Tab>('details');
  const [form, setForm] = useState<EventInput>(emptyEvent);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regs, setRegs] = useState<AdminRegistration[]>([]);
  const [saving, setSaving] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [speakerModal, setSpeakerModal] = useState(false);
  const [speakerForm, setSpeakerForm] = useState({ name: '', title: '', bio: '', imageUrl: '' });

  useEffect(() => {
    adminVenues.list().then(setVenues).catch(() => setVenues([]));
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      adminEvents.get(id)
        .then((ev) => setForm({
          title: ev.title, category: ev.category, description: ev.description, imageUrl: ev.imageUrl,
          startDate: ev.startDate, endDate: ev.endDate, capacity: ev.capacity, venueId: ev.venue.id,
          seatingMode: ev.seatingMode, requiresApproval: ev.requiresApproval, isFeatured: ev.isFeatured,
          speakers: ev.speakers.map((s) => ({ name: s.name, title: s.role, bio: s.bio, imageUrl: s.imageUrl })),
        }))
        .catch(() => toast.error('Failed to load event.'));
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && id && tab === 'registrations') {
      adminEvents.registrations(id).then((r) => setRegs(r.registrations)).catch(() => setRegs([]));
    }
  }, [id, isNew, tab]);

  const setField = <K extends keyof EventInput>(k: K, v: EventInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.venueId) { toast.error('Please select a venue.'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await adminEvents.create(form);
        toast.success('Event created!');
      } else {
        await adminEvents.update(id!, form);
        toast.success('Event updated!');
      }
      navigate('/admin/events');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const addSpeaker = () => {
    if (!speakerForm.name.trim()) { toast.error('Speaker name is required.'); return; }
    setForm((f) => ({ ...f, speakers: [...(f.speakers ?? []), { ...speakerForm }] }));
    setSpeakerForm({ name: '', title: '', bio: '', imageUrl: '' });
    setSpeakerModal(false);
  };

  const removeSpeaker = (idx: number) => {
    setForm((f) => ({ ...f, speakers: (f.speakers ?? []).filter((_, i) => i !== idx) }));
  };

  const handleApprove = async (regId: string) => {
    try {
      await adminRegistrations.approve(regId);
      setRegs((r) => r.map((x) => x.id === regId ? { ...x, status: 'Confirmed' } : x));
      toast.success('Registration approved.');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to approve.');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminRegistrations.reject(rejectModal.id, rejectReason);
      setRegs((r) => r.map((x) => x.id === rejectModal.id ? { ...x, status: 'Rejected' } : x));
      toast.success('Registration rejected.');
      setRejectModal(null);
      setRejectReason('');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to reject.');
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'details', label: 'Event Details', icon: 'edit' },
    { id: 'speakers', label: 'Speakers', icon: 'groups' },
    { id: 'registrations', label: 'Registrations', icon: 'how_to_reg' },
  ];

  const categories = ['Academic', 'Cultural', 'Technology', 'Research', 'Sports', 'Workshop', 'Career'];

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1000px] mx-auto px-6 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/events" className="flex items-center gap-1 text-sm hover:underline" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter', textDecoration: 'none' }}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Events
          </Link>
          <span style={{ color: c.outlineVariant }}>/</span>
          <span className="text-sm font-medium" style={{ color: c.primary, fontFamily: 'Inter' }}>{isNew ? 'New Event' : (form.title || 'Edit Event')}</span>
        </div>

        <h2 className="font-semibold mb-6" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>
          {isNew ? 'Create New Event' : 'Edit Event'}
        </h2>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: c.outlineVariant }}>
          {tabs.filter((t) => !isNew || t.id !== 'registrations').map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all"
              style={{
                borderColor: tab === t.id ? c.primary : 'transparent',
                color: tab === t.id ? c.primary : c.onSurfaceVariant,
                fontFamily: 'Inter', marginBottom: -1,
              }}>
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {tab === 'details' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Event Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Regional Sustainable Development Summit"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Category</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full border rounded-xl px-4 py-3" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}>
                  {categories.map((cat) => <option key={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Venue *</label>
                <select required value={form.venueId} onChange={(e) => setField('venueId', e.target.value)} className="w-full border rounded-xl px-4 py-3" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}>
                  <option value="">— Select a venue —</option>
                  {venues.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Capacity</label>
                <input type="number" min={1} value={form.capacity} onChange={(e) => setField('capacity', Number(e.target.value))}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Image URL</label>
                <input type="url" value={form.imageUrl ?? ''} onChange={(e) => setField('imageUrl', e.target.value)} placeholder="https://…"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Start Date & Time *</label>
                <input type="datetime-local" required value={form.startDate?.slice(0, 16) ?? ''} onChange={(e) => setField('startDate', e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>End Date & Time *</label>
                <input type="datetime-local" required value={form.endDate?.slice(0, 16) ?? ''} onChange={(e) => setField('endDate', e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={5} placeholder="Describe the event…"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none resize-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
              </div>
            </div>

            {/* Seating Mode */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Seating Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {(['None', 'Automatic', 'Manual'] as SeatingMode[]).map((mode) => (
                  <label key={mode} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all" style={{ background: form.seatingMode === mode ? `${c.primary}10` : c.surfaceLowest, borderColor: form.seatingMode === mode ? c.primary : c.outlineVariant }}>
                    <input type="radio" name="seating" checked={form.seatingMode === mode} onChange={() => setField('seatingMode', mode)} style={{ accentColor: c.primary }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{mode}</p>
                      <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {mode === 'None' ? 'General admission' : mode === 'Automatic' ? 'System assigns seats' : 'Attendees pick seats'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-xl" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                <input type="checkbox" id="approval" checked={form.requiresApproval} onChange={(e) => setField('requiresApproval', e.target.checked)} className="w-5 h-5 rounded" style={{ accentColor: c.primary }} />
                <label htmlFor="approval">
                  <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Requires Approval</p>
                  <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Registrations must be manually approved by staff</p>
                </label>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-xl" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                <input type="checkbox" id="featured" checked={form.isFeatured ?? false} onChange={(e) => setField('isFeatured', e.target.checked)} className="w-5 h-5 rounded" style={{ accentColor: c.primary }} />
                <label htmlFor="featured">
                  <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Featured Event</p>
                  <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Highlight this event on the home page</p>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link to="/admin/events" className="px-6 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>Cancel</Link>
              <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                {saving ? 'Saving…' : isNew ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Speakers Tab */}
        {tab === 'speakers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Speakers are saved when you save the event from the Details tab.</p>
              <button onClick={() => setSpeakerModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                <span className="material-symbols-outlined text-[18px]">person_add</span> Add Speaker
              </button>
            </div>
            {(form.speakers ?? []).length === 0 ? (
              <div className="text-center py-16 border rounded-xl border-dashed" style={{ borderColor: c.outlineVariant }}>
                <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: c.outlineVariant }}>groups</span>
                <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No speakers added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(form.speakers ?? []).map((sp, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 border rounded-xl" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: c.surfaceContainer }}>
                      {sp.imageUrl ? <img src={sp.imageUrl} className="w-full h-full object-cover" alt={sp.name} /> : <span className="material-symbols-outlined" style={{ color: c.outlineVariant }}>person</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{sp.name}</p>
                      <p className="text-xs" style={{ color: c.primary, fontFamily: 'Inter' }}>{sp.title}</p>
                    </div>
                    <button onClick={() => removeSpeaker(idx)} className="p-1.5 rounded hover:bg-red-50" style={{ color: c.error }}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {tab === 'registrations' && !isNew && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{regs.length} registration{regs.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <a href={adminEvents.exportRegistrations(id!, 'csv')} className="flex items-center gap-1 px-4 py-2 rounded-lg border text-xs font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined text-[16px]">download</span> CSV
                </a>
                <a href={adminEvents.exportRegistrations(id!, 'pdf')} className="flex items-center gap-1 px-4 py-2 rounded-lg border text-xs font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
                </a>
              </div>
            </div>
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: c.outlineVariant }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: `${c.surfaceLow}80` }}>
                    {['ATTENDEE', 'DATE', 'STATUS', 'SEAT', 'CHECK-IN', 'ACTIONS'].map((h) => (
                      <th key={h} className="px-5 py-4 border-b text-xs font-semibold uppercase tracking-wider" style={{ color: c.onSurfaceVariant, borderColor: c.outlineVariant, fontFamily: 'Inter' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
                  {regs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>No registrations yet.</td>
                    </tr>
                  ) : regs.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{reg.attendeeName}</p>
                        <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{reg.attendeeEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={reg.status} />
                        {reg.status === 'Waitlisted' && reg.waitlistPosition && <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>#{reg.waitlistPosition}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {reg.seatLabel ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {reg.isCheckedIn ? <StatusBadge status="CheckedIn" /> : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {reg.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(reg.id)} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: '#dcfce7', color: '#166534', fontFamily: 'Inter' }}>Approve</button>
                            <button onClick={() => setRejectModal({ id: reg.id })} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: '#fee2e2', color: '#991b1b', fontFamily: 'Inter' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Speaker Modal */}
      <Modal open={speakerModal} onClose={() => setSpeakerModal(false)} title="Add Speaker">
        <div className="space-y-4">
          {[
            { key: 'name' as const, label: 'Name *', placeholder: 'Dr. Jane Doe' },
            { key: 'title' as const, label: 'Title / Role', placeholder: 'Director of Research' },
            { key: 'imageUrl' as const, label: 'Image URL', placeholder: 'https://…' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{f.label}</label>
              <input type="text" value={speakerForm[f.key]} onChange={(e) => setSpeakerForm((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className="w-full border rounded-xl px-4 py-3 focus:outline-none" style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Bio</label>
            <textarea value={speakerForm.bio} onChange={(e) => setSpeakerForm((s) => ({ ...s, bio: e.target.value }))} rows={3}
              className="w-full border rounded-xl px-4 py-3 resize-none focus:outline-none" style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setSpeakerModal(false)} className="px-5 py-2.5 rounded-lg border text-sm" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
            <button type="button" onClick={addSpeaker} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>Add</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Registration">
        <div className="space-y-4">
          <label className="block text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Reason for rejection</label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this registration is being rejected…"
            className="w-full border rounded-xl px-4 py-3 resize-none focus:outline-none" style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRejectModal(null)} className="px-5 py-2.5 rounded-lg border text-sm" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>Cancel</button>
            <button onClick={handleReject} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: c.error, color: c.onPrimary, fontFamily: 'Inter' }}>Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
