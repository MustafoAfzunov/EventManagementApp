import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { events as eventsApi, type Event } from '../../lib/api';
import EventCard from '../../components/ui/EventCard';
import { c } from '../../lib/theme';

const heroImages = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
];

const categories = ['Academic', 'Cultural', 'Technology', 'Sports', 'Workshop', 'Career', 'Research'];

export default function HomePage() {
  const [featured, setFeatured] = useState<Event[]>([]);
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([eventsApi.featured(), eventsApi.upcoming(), eventsApi.list({ page: 1, pageSize: 1 })])
      .then(([f, u, list]) => { setFeatured(f); setUpcoming(u); setTotalEvents(list.total); })
      .catch(() => { /* leave empty states */ })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: 'event', value: String(totalEvents), label: 'Published Events' },
    { icon: 'star', value: String(featured.length), label: 'Featured Events' },
    { icon: 'schedule', value: String(upcoming.length), label: 'Upcoming Soon' },
    { icon: 'category', value: String(categories.length), label: 'Categories' },
  ];

  return (
    <div style={{ background: c.surface }}>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImages[0]}')` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,63,135,0.92) 0%,rgba(0,63,135,0.5) 50%,rgba(0,63,135,0.15) 100%)' }} />
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 pb-20 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Inter' }}>
              UCA Event Portal
            </span>
            <h1 className="text-white mb-6 leading-tight" style={{ fontFamily: 'Hanken Grotesk', fontSize: 56, fontWeight: 700, lineHeight: '64px' }}>
              Discover Campus Life at UCA
            </h1>
            <p className="text-white/90 text-xl mb-8 leading-relaxed" style={{ fontFamily: 'Inter' }}>
              Explore hundreds of academic, cultural, and professional events across all three campuses. Register in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/events" className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all hover:shadow-xl active:scale-95"
                style={{ background: c.onPrimary, color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
                <span className="material-symbols-outlined">explore</span>
                Explore Events
              </Link>
              <Link to="/register" className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.7)', color: 'white', fontFamily: 'Inter', textDecoration: 'none' }}>
                Join the Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
        <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.primaryFixed }}>
                <span className="material-symbols-outlined" style={{ color: c.primary }}>{s.icon}</span>
              </div>
              <div>
                <div className="font-bold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>{s.value}</div>
                <div className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Browse by Category</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/events?category=${cat}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all hover:shadow-sm"
              style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: c.primary }}>label</span>
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Featured Events</h2>
            <p className="text-sm mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Hand-picked highlights from across the campuses</p>
          </div>
          <Link to="/events" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
            View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-xl overflow-hidden" style={{ borderColor: c.outlineVariant }}>
                <div className="h-48 animate-pulse" style={{ background: c.surfaceHigh }} />
                <div className="p-6 space-y-3">
                  <div className="h-5 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '80%' }} />
                  <div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section className="border-t" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
        <div className="max-w-[1280px] mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-2xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Upcoming This Month</h2>
              <p className="text-sm mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Don&apos;t miss out on what&apos;s coming up</p>
            </div>
            <Link to="/events" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
              See all upcoming <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden" style={{ background: c.primary }}>
        <div className="max-w-[1280px] mx-auto px-6 py-20 text-center relative z-10">
          <h2 className="font-bold text-white mb-4" style={{ fontFamily: 'Hanken Grotesk', fontSize: 40 }}>Ready to get involved?</h2>
          <p className="text-white/90 text-xl mb-8 max-w-lg mx-auto" style={{ fontFamily: 'Inter' }}>
            Join thousands of students shaping their academic journey through events and activities.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl active:scale-95"
            style={{ background: c.onPrimary, color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}>
            <span className="material-symbols-outlined">person_add</span>
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
        <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>University of Central Asia</h3>
            <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>© 2024 All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {['Privacy Policy', 'Terms of Service', 'Campus Directory', 'Contact Support'].map((l) => (
              <a key={l} href="#" className="text-xs hover:underline" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
