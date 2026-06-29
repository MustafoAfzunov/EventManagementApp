import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { checkIn, events as eventsApi, type CheckInResult, type CheckInStats } from '../../lib/api';
import QrScanner from '../../components/checkin/QrScanner';
import { c } from '../../lib/theme';

const resultConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  CheckedIn:           { bg: '#dcfce7', text: '#166534', icon: 'check_circle', label: 'CHECKED IN' },
  AlreadyCheckedIn:    { bg: '#fef9c3', text: '#854d0e', icon: 'warning', label: 'ALREADY CHECKED IN' },
  NotFound:            { bg: '#fee2e2', text: '#991b1b', icon: 'cancel', label: 'TICKET NOT FOUND' },
  InvalidCode:         { bg: '#fee2e2', text: '#991b1b', icon: 'cancel', label: 'INVALID CODE' },
  WrongEvent:          { bg: '#ffedd5', text: '#9a3412', icon: 'swap_horiz', label: 'WRONG EVENT' },
  Cancelled:           { bg: '#fee2e2', text: '#991b1b', icon: 'block', label: 'REGISTRATION CANCELLED' },
  InvalidRegistration: { bg: '#fee2e2', text: '#991b1b', icon: 'error', label: 'INVALID REGISTRATION' },
};

const fallbackCfg = { bg: '#fee2e2', text: '#991b1b', icon: 'error', label: 'ERROR' };

export default function CheckInPage() {
  const [eventId, setEventId] = useState('');
  const [eventOptions, setEventOptions] = useState<{ id: string; title: string }[]>([]);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [attendance, setAttendance] = useState<CheckInStats | null>(null);
  const [attendees, setAttendees] = useState<{ name: string; seat?: string; time: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    eventsApi.list({ page: 1, pageSize: 100 })
      .then((res) => setEventOptions(res.items.map((e) => ({ id: e.id, title: e.title }))))
      .catch(() => setEventOptions([]));
  }, []);

  useEffect(() => {
    if (!eventId) { setAttendance(null); setAttendees([]); return; }
    checkIn.stats(eventId).then(setAttendance).catch(() => setAttendance(null));
    checkIn.attendance(eventId)
      .then((list) => setAttendees(list.map((a) => ({
        name: a.attendeeName,
        seat: a.seatLabel ?? undefined,
        time: new Date(a.checkedInAt).toLocaleTimeString(),
      }))))
      .catch(() => setAttendees([]));
  }, [eventId]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await processScan(code.trim());
  };

  const processScan = useCallback(async (rawCode: string) => {
    if (!rawCode) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await checkIn.scan(rawCode, eventId || undefined);
      setResult(res);
      if (res.status === 'CheckedIn') {
        setAttendees((prev) => [{ name: res.attendeeName ?? 'Guest', seat: res.seatLabel, time: new Date().toLocaleTimeString() }, ...prev]);
        toast.success(`${res.attendeeName ?? 'Attendee'} checked in!`);
        if (eventId) checkIn.stats(eventId).then(setAttendance).catch(() => { /* ignore */ });
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Scan failed.');
    } finally {
      setScanning(false);
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [eventId]);

  const cfg = result ? (resultConfig[result.status] ?? fallbackCfg) : null;

  return (
    <div className="pb-12" style={{ background: c.surface, minHeight: '100vh' }}>
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <h2 className="font-semibold mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Check-in Console</h2>
        <p className="mb-8" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Scan QR codes or enter ticket codes manually to check in attendees.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Scanner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Picker */}
            <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <label className="block text-sm font-medium mb-2" style={{ color: c.onSurface, fontFamily: 'Inter' }}>Select Event</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: c.surface, borderColor: c.outlineVariant, color: c.onSurface, fontFamily: 'Inter' }}
              >
                <option value="">— All Events —</option>
                {eventOptions.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>

            {/* Code Input */}
            <div className="border rounded-xl p-6" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <h3 className="font-semibold text-lg mb-4" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Scan or Enter Code</h3>

              <QrScanner onScan={(scanned) => void processScan(scanned)} paused={scanning} />

              <form onSubmit={handleScan} className="flex gap-3 mt-6">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.onSurfaceVariant }}>key</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter ticket code (e.g. UCA-2024-TECH-A12-001)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none font-mono text-sm"
                    style={{ background: c.surface, borderColor: c.outlineVariant, color: c.onSurface }}
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={scanning || !code.trim()}
                  className="px-6 py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                  {scanning ? '…' : 'Check In'}
                </button>
              </form>
            </div>

            {/* Result */}
            {result && cfg && (
              <div className="border rounded-xl p-8 text-center transition-all" style={{ background: cfg.bg, borderColor: cfg.text + '40' }}>
                <span className="material-symbols-outlined text-[72px] block mb-4" style={{ color: cfg.text, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                <h3 className="font-bold text-3xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: cfg.text }}>{cfg.label}</h3>
                {result.attendeeName && (
                  <p className="text-xl font-semibold mb-1" style={{ color: cfg.text, fontFamily: 'Inter' }}>{result.attendeeName}</p>
                )}
                {result.seatLabel && (
                  <p className="text-sm" style={{ color: cfg.text, fontFamily: 'Inter', opacity: 0.8 }}>Seat: {result.seatLabel}</p>
                )}
                <p className="text-sm mt-3" style={{ color: cfg.text, fontFamily: 'Inter', opacity: 0.8 }}>{result.message}</p>
              </div>
            )}
          </div>

          {/* Right: Stats + Attendance */}
          <div className="space-y-6">
            {/* Live Counter */}
            <div className="border rounded-xl p-6 text-center" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <p className="text-sm font-medium mb-2" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>LIVE CHECK-INS</p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke={c.surfaceHigh} strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={c.primary} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - (attendance?.checkedIn ?? 0) / Math.max(attendance?.total ?? 1, 1))}`}
                    strokeLinecap="round" className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-3xl" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>{attendance?.checkedIn ?? 0}</span>
                  <span className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>of {attendance?.total ?? 0}</span>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: c.onSurface, fontFamily: 'Inter' }}>
                {attendance ? Math.round((attendance.checkedIn / Math.max(attendance.total, 1)) * 100) : 0}% attendance rate
              </p>
            </div>

            {/* Recent Check-ins */}
            <div className="border rounded-xl overflow-hidden" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: c.outlineVariant }}>
                <h4 className="font-semibold" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Recent Check-ins</h4>
              </div>
              {attendees.length === 0 ? (
                <div className="p-8 text-center" style={{ color: c.onSurfaceVariant }}>
                  <span className="material-symbols-outlined block text-[32px] mb-2" style={{ color: c.outlineVariant }}>person_off</span>
                  <p className="text-sm" style={{ fontFamily: 'Inter' }}>No check-ins yet</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: c.outlineVariant }}>
                  {attendees.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c.primaryFixed, color: c.primary }}>
                        {a.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{a.name}</p>
                        {a.seat && <p className="text-xs" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Seat {a.seat}</p>}
                      </div>
                      <span className="text-xs shrink-0" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
