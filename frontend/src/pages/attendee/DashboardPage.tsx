import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { dashboard, user as userApi, type DashboardSummary, type Notification } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { c } from '../../lib/theme';

const notifColors: Record<string, { bg: string; color: string; icon: string }> = {
  Success: { bg: '#dcfce7', color: '#15803d', icon: 'check_circle' },
  Info:    { bg: '#dbeafe', color: '#1d4ed8', icon: 'info' },
  Warning: { bg: '#ffedd5', color: '#c2410c', icon: 'priority_high' },
  Error:   { bg: '#fee2e2', color: '#991b1b', icon: 'error' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboard.summary(), userApi.notifications()])
      .then(([s, n]) => { setSummary(s); setNotifications(n); })
      .catch(() => { setSummary(null); setNotifications([]); })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await userApi.markNotificationRead(id);
      setNotifications((list) => list.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setSummary((s) => s ? { ...s, unreadNotifications: Math.max(0, s.unreadNotifications - 1) } : s);
    } catch { /* ignore */ }
  };

  const stats = summary ? [
    { icon: 'event', label: 'Total Registrations', value: String(summary.totalRegistrations).padStart(2, '0'), color: c.primary, bg: c.primaryFixed },
    { icon: 'check_circle', label: 'Confirmed', value: String(summary.confirmedRegistrations).padStart(2, '0'), color: c.secondary, bg: c.secondaryFixed },
    { icon: 'hourglass_top', label: 'Waitlisted', value: String(summary.waitlistedRegistrations).padStart(2, '0'), color: c.tertiary, bg: c.tertiaryFixed },
    { icon: 'notifications', label: 'Unread Alerts', value: String(summary.unreadNotifications).padStart(2, '0'), color: c.primaryContainer, bg: c.surfaceHigh },
  ] : [];

  return (
    <div className="pb-12" style={{ background: c.surface }}>
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ background: `${c.surface}cc`, borderColor: c.outlineVariant }}>
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>University of Central Asia</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ background: c.surfaceContainer, borderColor: c.outlineVariant }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: c.onSurfaceVariant }}>search</span>
              <input className="bg-transparent border-none focus:outline-none text-sm w-40" placeholder="Search events…" style={{ fontFamily: 'Inter', color: c.onSurface }} />
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: c.surfaceHighest }}>
              <span className="material-symbols-outlined" style={{ color: c.primary }}>notifications</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <section className="mb-8">
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Here&apos;s what&apos;s happening across the campus today.</p>
        </section>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-6 animate-pulse" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, height: 140 }}>
              <div className="h-10 rounded-lg mb-4" style={{ background: c.surfaceHigh, width: 48 }} />
              <div className="h-4 rounded mb-2" style={{ background: c.surfaceHigh, width: '60%' }} />
              <div className="h-8 rounded" style={{ background: c.surfaceHigh, width: '40%' }} />
            </div>
          )) : stats.map((s) => (
            <div key={s.label} className="border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-1" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <div className="flex justify-between items-start">
                <span className="p-2 rounded-lg" style={{ background: s.bg, color: s.color }}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{s.label}</p>
                <h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: 48, fontWeight: 700, color: s.color, lineHeight: '56px' }}>{s.value}</h3>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Quick Actions</h3>
              <Link to="/events" className="text-sm hover:underline" style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>View All Events</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: 'explore', label: 'Browse Events', sub: 'Find and register for campus events', to: '/events', color: c.primary },
                { icon: 'event_upcoming', label: 'My Events', sub: 'View and manage your registrations', to: '/my-events', color: c.secondary },
                { icon: 'confirmation_number', label: 'My Tickets', sub: 'Download and view event tickets', to: '/my-events', color: c.tertiary },
                { icon: 'person', label: 'Edit Profile', sub: 'Update your personal information', to: '/profile', color: c.primaryContainer },
              ].map((action) => (
                <Link key={action.label} to={action.to} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, textDecoration: 'none' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${action.color}15` }}>
                    <span className="material-symbols-outlined" style={{ color: action.color }}>{action.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{action.label}</p>
                    <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{action.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Notifications</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: c.error, color: c.onPrimary, fontFamily: 'Inter' }}>
                {notifications.filter((n) => !n.isRead).length}
              </span>
            </div>
            <div className="space-y-3">
              {!loading && notifications.length === 0 && (
                <div className="p-6 border rounded-xl text-center" style={{ borderColor: c.outlineVariant, color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                  <span className="material-symbols-outlined block mx-auto mb-2 text-[32px]" style={{ color: c.outlineVariant }}>notifications_off</span>
                  You&apos;re all caught up.
                </div>
              )}
              {notifications.map((n) => {
                const cfg = notifColors[n.type] ?? notifColors.Info;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="flex gap-4 p-4 rounded-xl border cursor-pointer transition-colors hover:shadow-sm"
                    style={{ background: n.isRead ? c.surfaceLowest : `${cfg.bg}50`, borderColor: n.isRead ? c.outlineVariant : cfg.bg }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <span className="material-symbols-outlined" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{n.title}</p>
                      <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{n.message}</p>
                      <span className="text-[11px] uppercase font-bold mt-1 block" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
