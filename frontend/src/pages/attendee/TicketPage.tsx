import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { tickets as ticketsApi, type Ticket } from '../../lib/api';
import { c } from '../../lib/theme';

export default function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    setLoading(true);
    ticketsApi.get(ticketId!)
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleEmail = async () => {
    setEmailing(true);
    try {
      await ticketsApi.email(ticketId!);
      toast.success('Ticket sent to your email!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send email.');
    } finally {
      setEmailing(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await ticketsApi.downloadPdf(ticketId!);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to download PDF.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: c.surface }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}40`, borderTopColor: c.primary }} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: c.surface }}>
        <span className="material-symbols-outlined text-[56px]" style={{ color: c.outlineVariant }}>confirmation_number</span>
        <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Ticket not found.</p>
        <Link to="/my-events" className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>Back to My Events</Link>
      </div>
    );
  }

  const t = ticket;
  const ev = t.event;
  const startDate = new Date(ev.startDate);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(t.qrCode)}&color=003f87&bgcolor=f9f9ff`;

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[680px] mx-auto px-6 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/my-events" className="flex items-center gap-2 text-sm hover:underline" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter', textDecoration: 'none' }}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> My Events
          </Link>
        </div>

        {/* Ticket Card */}
        <div className="border rounded-2xl overflow-hidden shadow-lg" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
          {/* Header */}
          <div className="p-6 flex gap-4 items-center" style={{ background: c.primary }}>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="material-symbols-outlined text-white">confirmation_number</span>
            </div>
            <div className="text-white">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80" style={{ fontFamily: 'Inter' }}>{t.status}</span>
              <h2 className="font-bold text-xl leading-tight" style={{ fontFamily: 'Hanken Grotesk' }}>{ev.title}</h2>
            </div>
          </div>

          {/* Ticket details */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              {[
                { icon: 'person', label: 'Holder', value: t.attendeeName },
                { icon: 'tag', label: 'Ticket Code', value: t.ticketCode },
                { icon: 'calendar_today', label: 'Date', value: startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
                { icon: 'schedule', label: 'Time', value: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                { icon: 'chair', label: 'Seat', value: t.seatLabel ?? 'General Admission' },
                { icon: 'verified', label: 'Status', value: t.status },
              ].map((detail) => (
                <div key={detail.label}>
                  <div className="flex items-center gap-1 mb-1" style={{ color: c.onSurfaceVariant }}>
                    <span className="material-symbols-outlined text-[16px]">{detail.icon}</span>
                    <span className="text-xs uppercase font-bold tracking-wider" style={{ fontFamily: 'Inter' }}>{detail.label}</span>
                  </div>
                  <p className="font-medium text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{detail.value}</p>
                </div>
              ))}
            </div>

            {/* Dashed divider */}
            <div className="relative my-6">
              <div className="border-t border-dashed" style={{ borderColor: c.outlineVariant }} />
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: c.surface }} />
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: c.surface }} />
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center py-4">
              <img src={qrUrl} alt="Ticket QR Code" className="w-48 h-48 rounded-xl mb-3" style={{ border: `2px solid ${c.outlineVariant}` }} />
              <p className="text-xs font-mono font-bold" style={{ color: c.onSurface }}>{t.ticketCode}</p>
              <p className="text-xs mt-1" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Scan at the entrance for check-in</p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: c.outlineVariant, background: c.surfaceLow }}>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95"
              style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download PDF
            </button>
            <button
              onClick={handleEmail}
              disabled={emailing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm border transition-all active:scale-95 disabled:opacity-50"
              style={{ borderColor: c.primary, color: c.primary, fontFamily: 'Inter' }}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {emailing ? 'Sending…' : 'Email Ticket'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          This ticket is non-transferable. Present the QR code at the entrance.
        </p>
      </div>
    </div>
  );
}
