import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { user as userApi, registrations as regApi, type Registration } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { c } from '../../lib/theme';

export default function MyEventsPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    userApi.registrations()
      .then(setRegs)
      .catch(() => setRegs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setCancelling(id);
    try {
      await regApi.cancel(id);
      setRegs((r) => r.map((x) => x.id === id ? { ...x, status: 'Cancelled' } : x));
      toast.success('Registration cancelled.');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to cancel.');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = regs.filter((r) =>
    !search || r.event.title.toLowerCase().includes(search.toLowerCase()) || r.event.venue.name.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = regs.find((r) => r.status === 'Confirmed' && new Date(r.event.startDate) > new Date());

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <nav className="flex items-center gap-2 mb-2" style={{ color: c.onSurfaceVariant }}>
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Inter' }}>Dashboard</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: c.primary, fontFamily: 'Inter' }}>My Events</span>
            </nav>
            <h2 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>My Registered Events</h2>
            <p className="mt-1 max-w-xl" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
              View and manage your upcoming university events, download tickets, and track attendance.
            </p>
          </div>
          <Link to="/events" className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-sm transition-all hover:opacity-90 active:scale-95" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontSize: 14, textDecoration: 'none' }}>
            <span className="material-symbols-outlined">add</span> Explore Events
          </Link>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="border rounded-xl p-6 flex flex-col gap-2" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
            <span className="text-xs font-semibold uppercase" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Total Registered</span>
            <div className="flex items-end justify-between">
              <span className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>{regs.length}</span>
              <span className="material-symbols-outlined" style={{ color: c.primaryContainer }}>event_available</span>
            </div>
          </div>
          <div className="border rounded-xl p-6 flex flex-col gap-2" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
            <span className="text-xs font-semibold uppercase" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Upcoming</span>
            <div className="flex items-end justify-between">
              <span className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.secondary }}>{regs.filter((r) => r.status === 'Confirmed' && new Date(r.event.startDate) > new Date()).length}</span>
              <span className="material-symbols-outlined" style={{ color: c.secondaryContainer }}>schedule</span>
            </div>
          </div>
          {upcoming && (
            <div className="md:col-span-2 rounded-xl relative overflow-hidden flex items-center justify-between p-6" style={{ background: c.primaryContainer, color: c.onPrimary }}>
              <div className="relative z-10">
                <h4 className="font-semibold text-xl mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>Next: {upcoming.event.title}</h4>
                <p className="text-sm opacity-90" style={{ fontFamily: 'Inter' }}>
                  {new Date(upcoming.event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} • {upcoming.event.venue.name}
                </p>
              </div>
              <span className="material-symbols-outlined text-[80px] opacity-10 absolute right-[-10px] top-[-10px]">school</span>
              {upcoming.requiresSeating && !upcoming.hasSeat && (
                <Link to={`/seat-selection/${upcoming.id}`} className="relative z-10 px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap" style={{ background: c.surfaceLowest, color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
                  Pick Seat
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-xl shadow-sm overflow-hidden" style={{ background: c.surface, borderColor: c.outlineVariant }}>
          <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: c.outlineVariant }}>
            <div className="relative flex-grow max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>search</span>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event by name or venue…"
                className="w-full border rounded-lg pl-10 pr-6 py-2 text-sm focus:outline-none"
                style={{ background: c.surface, borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: `${c.surfaceLow}80` }}>
                  {['EVENT NAME', 'DATE & TIME', 'VENUE', 'STATUS', 'ACTIONS'].map((h, i) => (
                    <th key={h} className="px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider" style={{ color: c.onSurfaceVariant, borderColor: c.outlineVariant, fontFamily: 'Inter', textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: c.outlineVariant }}>
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                      <span className="material-symbols-outlined block mx-auto mb-2 text-[40px]" style={{ color: c.outlineVariant }}>event_busy</span>
                      No registered events found.
                    </td>
                  </tr>
                ) : filtered.map((reg) => {
                  const ev = reg.event;
                  const dateStr = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = `${new Date(ev.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                  return (
                    <tr key={reg.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{ev.title}</p>
                        <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{ev.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{dateStr}</p>
                        <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{timeStr}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{ev.venue.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={reg.status} />
                        {reg.seatLabel && <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Seat {reg.seatLabel}</p>}
                        {reg.status === 'Waitlisted' && reg.waitlistPosition && <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Position #{reg.waitlistPosition}</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link to={`/events/${ev.id}`} className="px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition-colors" style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>View</Link>
                          {reg.ticketId && (
                            <Link to={`/ticket/${reg.ticketId}`} className="p-1.5 rounded transition-all" title="View Ticket" style={{ background: c.surfaceHigh, color: c.primary, textDecoration: 'none' }}>
                              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                            </Link>
                          )}
                          {reg.requiresSeating && reg.status === 'Confirmed' && !reg.hasSeat && (
                            <Link to={`/seat-selection/${reg.id}`} className="px-3 py-1.5 rounded text-xs font-semibold transition-colors" style={{ background: c.surfaceHigh, color: c.secondary, fontFamily: 'Inter', textDecoration: 'none' }}>Pick Seat</Link>
                          )}
                          {reg.status !== 'Cancelled' && reg.status !== 'Rejected' && (
                            <button onClick={() => handleCancel(reg.id)} disabled={cancelling === reg.id}
                              className="px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                              style={{ color: c.error, fontFamily: 'Inter' }}>
                              {cancelling === reg.id ? '…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t" style={{ background: `${c.surfaceLow}50`, borderColor: c.outlineVariant }}>
            <span className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Showing {filtered.length} of {regs.length} registered events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
