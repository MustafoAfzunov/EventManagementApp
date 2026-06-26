import { Link } from 'react-router';
import type { Event } from '../../lib/api';
import { c } from '../../lib/theme';
import StatusBadge from './StatusBadge';

interface Props {
  event: Event;
  showStatus?: boolean;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Academic:   { bg: c.primary, text: c.onPrimary },
  Cultural:   { bg: c.secondary, text: c.onSecondary },
  Technology: { bg: c.primaryContainer, text: c.onPrimary },
  Research:   { bg: c.tertiaryContainer, text: c.onTertiaryContainer },
  Sports:     { bg: c.secondaryContainer, text: c.onSecondaryContainer },
  Workshop:   { bg: c.primaryContainer, text: c.onPrimary },
  Career:     { bg: c.primary, text: c.onPrimary },
};

export default function EventCard({ event, showStatus }: Props) {
  const catColor = categoryColors[event.category] ?? { bg: c.surfaceHigh, text: c.primary };
  const date = new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <article
      className="border rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}
    >
      <div className="h-48 relative overflow-hidden">
        {event.imageUrl ? (
          <img src={event.imageUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt={event.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: c.surfaceContainer }}>
            <span className="material-symbols-outlined text-[48px]" style={{ color: c.outlineVariant }}>event</span>
          </div>
        )}
        <span
          className="absolute top-4 right-4 text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wider"
          style={{ background: catColor.bg, color: catColor.text, fontFamily: 'Inter' }}
        >
          {event.category}
        </span>
        {showStatus && (
          <div className="absolute top-4 left-4">
            <StatusBadge status={event.status} />
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-semibold text-xl mb-4 line-clamp-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>{event.title}</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2" style={{ color: c.onSurfaceVariant }}>
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            <span className="text-sm" style={{ fontFamily: 'Inter' }}>{date} • {time}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: c.onSurfaceVariant }}>
            <span className="material-symbols-outlined text-[20px]">location_on</span>
            <span className="text-sm" style={{ fontFamily: 'Inter' }}>{event.venue?.name}</span>
          </div>
          {event.seatsLeft !== undefined && (
            <div className="flex items-center gap-2" style={{ color: event.seatsLeft < 10 ? '#9a3412' : c.onSurfaceVariant }}>
              <span className="material-symbols-outlined text-[20px]">people</span>
              <span className="text-sm" style={{ fontFamily: 'Inter' }}>
                {event.seatsLeft > 0 ? `${event.seatsLeft} seats left` : 'Sold out'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t flex justify-end items-center" style={{ borderColor: c.outlineVariant }}>
          <Link
            to={`/events/${event.id}`}
            className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            style={{ color: c.primary, fontFamily: 'Inter', textDecoration: 'none' }}
          >
            View Details <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
