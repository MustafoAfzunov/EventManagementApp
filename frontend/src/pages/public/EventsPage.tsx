import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { events as eventsApi, type Event } from '../../lib/api';
import EventCard from '../../components/ui/EventCard';
import { c } from '../../lib/theme';

const categories = ['All', 'Academic', 'Cultural', 'Technology', 'Research', 'Sports', 'Workshop', 'Career'];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [evts, setEvts] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, pageSize };
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;

    eventsApi.list(params)
      .then((res) => { setEvts(res.items); setTotal(res.total); })
      .catch(() => { setEvts([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [search, category, page]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get('q') as string;
    setSearch(q);
    setPage(1);
    setSearchParams(q ? { search: q } : {});
  };

  return (
    <div style={{ background: c.surface, minHeight: '100vh' }}>
      {/* Page header */}
      <div className="border-b" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
        <div className="max-w-[1280px] mx-auto px-6 py-10">
          <h1 className="font-semibold mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: 40, color: c.onSurface }}>Upcoming Events</h1>
          <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Discover academic and campus events this month.</p>
          <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.onSurfaceVariant }}>search</span>
              <input name="q" defaultValue={search} placeholder="Search events…" className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none"
                style={{ background: c.surface, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }} />
            </div>
            <button type="submit" className="px-6 py-3 rounded-xl font-medium text-sm" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="border rounded-xl p-6 sticky top-24" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Filters</h2>
              <button onClick={() => { setCategory('All'); setSearch(''); setPage(1); }} className="text-xs hover:underline" style={{ color: c.primary, fontFamily: 'Inter' }}>Clear all</button>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-3" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Category</label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" checked={category === cat} onChange={() => { setCategory(cat); setPage(1); }} className="w-4 h-4" style={{ accentColor: c.primary }} />
                    <span className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main grid */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
              {loading ? 'Loading…' : `${total} event${total !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Sort by:</span>
              <select className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer" style={{ color: c.primary, fontFamily: 'Inter' }}>
                {['Latest First', 'Date (Soonest)', 'Popularity'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-xl overflow-hidden" style={{ borderColor: c.outlineVariant }}>
                  <div className="h-48 animate-pulse" style={{ background: c.surfaceHigh }} />
                  <div className="p-6 space-y-3">
                    <div className="h-5 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '80%' }} />
                    <div className="h-4 rounded animate-pulse" style={{ background: c.surfaceHigh, width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : evts.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined block mx-auto mb-4 text-[56px]" style={{ color: c.outlineVariant }}>event_busy</span>
              <h3 className="font-semibold text-xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>No events found</h3>
              <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {evts.map((ev) => <EventCard key={ev.id} event={ev} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 transition-colors" style={{ borderColor: c.outlineVariant, color: c.onSurfaceVariant }}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className="w-10 h-10 rounded-lg text-sm font-medium"
                    style={n === page ? { background: c.primary, color: c.onPrimary } : { border: `1px solid ${c.outlineVariant}`, color: c.onSurfaceVariant }}>
                    {n}
                  </button>
                ))}
              </div>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 transition-colors" style={{ borderColor: c.outlineVariant, color: c.onSurfaceVariant }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
