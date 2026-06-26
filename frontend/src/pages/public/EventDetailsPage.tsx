import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { events as eventsApi, registrations, type Event } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import StatusBadge from '../../components/ui/StatusBadge';
import { c } from '../../lib/theme';

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setLoading(true);
    eventsApi.get(id!)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!user) { navigate('/login', { state: { from: { pathname: `/events/${id}` } } }); return; }
    setRegistering(true);
    try {
      const reg = await registrations.create(id!);
      if (reg.status === 'Pending') {
        toast.success('Registration submitted — awaiting approval.');
        navigate('/my-events');
      } else if (reg.requiresSeatAssignment) {
        toast.success('Registered! Please choose your seat.');
        navigate(`/seat-selection/${reg.id}`);
      } else {
        toast.success('Registration successful!');
        navigate('/registration-success', { state: { event } });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: c.surface, minHeight: '100vh' }}>
        <div className="max-w-[1280px] mx-auto px-6 py-20 flex justify-center">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}40`, borderTopColor: c.primary }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ background: c.surface, minHeight: '100vh' }}>
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
          <span className="material-symbols-outlined block mx-auto mb-4 text-[56px]" style={{ color: c.outlineVariant }}>event_busy</span>
          <h1 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Event not found</h1>
          <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>This event may have been removed or is no longer available.</p>
          <Link to="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const ev = event;
  const startDate = new Date(ev.startDate);
  const endDate = new Date(ev.endDate);

  return (
    <div style={{ background: c.surface, minHeight: '100vh' }}>
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1" style={{ color: c.onSurfaceVariant }}>
          <Link to="/events" className="text-xs uppercase tracking-wider font-semibold hover:underline" style={{ fontFamily: 'Inter', color: c.onSurfaceVariant, textDecoration: 'none' }}>Events</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Inter', color: c.primary }}>{ev.title.slice(0, 40)}…</span>
        </div>

        <h1 className="mb-8 leading-tight" style={{ fontFamily: 'Hanken Grotesk', fontSize: 40, fontWeight: 700, color: c.primary }}>
          {ev.title}
        </h1>

        {/* Banner */}
        <div className="relative w-full h-[440px] rounded-xl overflow-hidden mb-12 border" style={{ borderColor: c.outlineVariant }}>
          {ev.imageUrl ? (
            <img src={ev.imageUrl} className="w-full h-full object-cover" alt={ev.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: c.surfaceContainer }}>
              <span className="material-symbols-outlined text-[80px]" style={{ color: c.outlineVariant }}>event</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 flex gap-3">
            <span className="px-4 py-1 rounded-full text-sm font-medium border" style={{ background: 'rgba(255,255,255,0.9)', color: c.primary, borderColor: c.outlineVariant, fontFamily: 'Inter' }}>{ev.category}</span>
            <StatusBadge status={ev.status} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Content */}
          <div className="flex-1 space-y-12">
            <section>
              <h2 className="font-semibold mb-4 flex items-center gap-3" style={{ fontFamily: 'Hanken Grotesk', fontSize: 28, color: c.onSurface }}>
                <span className="material-symbols-outlined" style={{ color: c.primary }}>info</span> Event Overview
              </h2>
              <div className="space-y-4 text-lg leading-relaxed whitespace-pre-line" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                {ev.description}
              </div>
            </section>

            {ev.speakers.length > 0 && (
              <section>
                <h2 className="font-semibold mb-6 flex items-center gap-3" style={{ fontFamily: 'Hanken Grotesk', fontSize: 28, color: c.onSurface }}>
                  <span className="material-symbols-outlined" style={{ color: c.primary }}>groups</span> Distinguished Speakers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ev.speakers.map((sp) => (
                    <div key={sp.id} className="p-6 border rounded-xl flex items-center gap-6 hover:shadow-lg transition-all" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
                      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 flex items-center justify-center" style={{ borderColor: c.primaryFixed, background: c.surfaceContainer }}>
                        {sp.imageUrl ? (
                          <img src={sp.imageUrl} className="w-full h-full object-cover" alt={sp.name} />
                        ) : (
                          <span className="material-symbols-outlined text-[36px]" style={{ color: c.outlineVariant }}>person</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>{sp.name}</h4>
                        <p className="text-sm font-medium" style={{ color: c.primary, fontFamily: 'Inter' }}>{sp.role}</p>
                        <p className="text-sm mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{sp.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-24 border rounded-xl shadow-sm overflow-hidden" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <div className="p-6 border-b space-y-4" style={{ borderColor: c.outlineVariant }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-2xl mb-1" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Registration</h3>
                    <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                      {ev.requiresApproval ? 'Requires staff approval' : 'Open to all students & faculty'}
                    </p>
                  </div>
                  <StatusBadge status={ev.seatsLeft > 0 ? 'Open' : 'Cancelled'} />
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { icon: 'event', label: `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, sub: `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, color: c.primary },
                    { icon: 'location_on', label: ev.venue.name, sub: ev.venue.address, color: c.primary },
                    { icon: 'people', label: `${ev.seatsLeft} seats remaining`, sub: `${ev.capacity} total capacity`, color: ev.seatsLeft < 20 ? '#9a3412' : c.primary },
                  ].map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <span className="material-symbols-outlined mt-0.5" style={{ color: info.color }}>{info.icon}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: info.color === '#9a3412' ? '#9a3412' : c.onSurface, fontFamily: 'Inter' }}>{info.label}</p>
                        <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{info.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {ev.seatsLeft > 0 ? (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full py-5 rounded-lg text-xl font-semibold mt-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                    style={{ background: c.primaryContainer, color: c.onPrimary, fontFamily: 'Hanken Grotesk' }}
                  >
                    {registering ? 'Registering…' : 'Register Now'}
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-lg text-center font-semibold mt-2" style={{ background: c.surfaceHigh, color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                    Sold Out
                  </div>
                )}
              </div>

              {ev.seatingMode !== 'None' && (
                <div className="p-4 text-center" style={{ background: c.surfaceLow }}>
                  <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                    <span className="material-symbols-outlined text-[16px] align-middle" style={{ color: c.primary }}>chair</span>
                    {' '}Seating: <strong>{ev.seatingMode}</strong>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
