import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { adminEvents, type Event } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { c } from '../../lib/theme';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminEvents.list({ page: '1', pageSize: '100' })
      .then((r) => setEvents(r.items))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const doAction = async (action: 'publish' | 'unpublish' | 'cancel' | 'delete', ev: Event) => {
    setActionPending(ev.id + action);
    try {
      if (action === 'delete') {
        await adminEvents.delete(ev.id);
        setEvents((es) => es.filter((e) => e.id !== ev.id));
        toast.success('Event deleted.');
        setDeleteTarget(null);
      } else {
        await (action === 'publish' ? adminEvents.publish : action === 'unpublish' ? adminEvents.unpublish : adminEvents.cancel)(ev.id);
        const newStatus = action === 'publish' ? 'Published' : action === 'unpublish' ? 'Draft' : 'Cancelled';
        setEvents((es) => es.map((e) => e.id === ev.id ? { ...e, status: newStatus as Event['status'] } : e));
        toast.success(`Event ${action}ed.`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || `Failed to ${action} event.`);
    } finally {
      setActionPending(null);
    }
  };

  const filtered = events.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Event Management</h2>
            <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Create, edit, and manage all campus events.</p>
          </div>
          <Link to="/admin/events/new" className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-sm transition-all hover:opacity-90" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontSize: 14, textDecoration: 'none' }}>
            <span className="material-symbols-outlined">add</span> Create Event
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.onSurfaceVariant }}>search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…"
            className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
        </div>

        {/* Table */}
        <div className="border rounded-xl shadow-sm overflow-hidden" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: `${c.surfaceLow}80` }}>
                  {['EVENT', 'CATEGORY', 'DATE', 'VENUE', 'CAPACITY', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} className="px-5 py-4 border-b text-xs font-semibold uppercase tracking-wider" style={{ color: c.onSurfaceVariant, borderColor: c.outlineVariant, fontFamily: 'Inter' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                      <span className="material-symbols-outlined block mx-auto mb-2 text-[40px]" style={{ color: c.outlineVariant }}>event_busy</span>
                      No events found.
                    </td>
                  </tr>
                ) : filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 max-w-[240px]">
                      <p className="text-sm font-medium truncate" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{ev.title}</p>
                      {ev.requiresApproval && <span className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Requires approval</span>}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{ev.category}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{ev.venue.name}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>
                      {ev.capacity - ev.seatsLeft}/{ev.capacity}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={ev.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link to={`/admin/events/${ev.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Edit" style={{ color: c.primary, textDecoration: 'none' }}>
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        {ev.status === 'Draft' && (
                          <button onClick={() => doAction('publish', ev)} disabled={actionPending === ev.id + 'publish'} className="p-1.5 rounded hover:bg-green-50 transition-colors" title="Publish" style={{ color: '#166534' }}>
                            <span className="material-symbols-outlined text-[18px]">publish</span>
                          </button>
                        )}
                        {ev.status === 'Published' && (
                          <>
                            <button onClick={() => doAction('unpublish', ev)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Unpublish" style={{ color: c.onSurfaceVariant }}>
                              <span className="material-symbols-outlined text-[18px]">unpublished</span>
                            </button>
                            <button onClick={() => doAction('cancel', ev)} className="p-1.5 rounded hover:bg-orange-50 transition-colors" title="Cancel" style={{ color: '#9a3412' }}>
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          </>
                        )}
                        <button onClick={() => setDeleteTarget(ev)} className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Delete" style={{ color: c.error }}>
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        <Link to={`/admin/events/${ev.id}/registrations`} className="p-1.5 rounded hover:bg-blue-50 transition-colors" title="Registrations" style={{ color: c.secondary, textDecoration: 'none' }}>
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event">
        <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          Are you sure you want to permanently delete <strong style={{ color: c.onSurface }}>{deleteTarget?.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}>
            Cancel
          </button>
          <button onClick={() => deleteTarget && doAction('delete', deleteTarget)} disabled={!!actionPending}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: c.error, color: c.onPrimary, fontFamily: 'Inter' }}>
            {actionPending ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
