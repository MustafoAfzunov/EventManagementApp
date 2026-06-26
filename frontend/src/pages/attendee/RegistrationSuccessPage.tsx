import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { c } from '../../lib/theme';

export default function RegistrationSuccessPage() {
  const { state } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = [c.primary, c.primaryContainer, c.secondaryContainer, c.primaryFixed, c.secondaryFixed];
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4, speed: Math.random() * 3 + 1, angle: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 4 - 2,
    }));
    let raf: number; let running = true;
    const animate = () => {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed; p.angle += p.rot;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
      });
      raf = requestAnimationFrame(animate);
    };
    setTimeout(() => { animate(); setTimeout(() => { running = false; cancelAnimationFrame(raf); }, 5000); }, 300);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: c.surface }}>
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full blur-[100px]" style={{ background: c.primary }} />
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 rounded-full blur-[120px]" style={{ background: c.secondaryContainer }} />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      <div className="relative z-20 w-full max-w-[560px] border rounded-2xl shadow-xl p-16 flex flex-col items-center text-center" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8" style={{ background: c.surfaceHigh }}>
          <span className="material-symbols-outlined text-[56px]" style={{ color: c.primary, fontVariationSettings: "'FILL' 1,'wght' 700" }}>check_circle</span>
        </div>

        <h1 className="font-semibold mb-4" style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, color: c.onSurface }}>Registration Successful!</h1>
        <p className="text-lg mb-8 max-w-[400px]" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
          You are now registered for{' '}
          <span className="font-bold" style={{ color: c.primary }}>{(state as { event?: { title: string } })?.event?.title ?? 'the event'}</span>.
        </p>

        {(state as { event?: { startDate: string; venue?: { name: string } } })?.event && (
          <div className="w-full rounded-lg border p-5 text-left mb-10 flex gap-4 items-center" style={{ background: c.surfaceLow, borderColor: c.outlineVariant }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.primaryFixed }}>
              <span className="material-symbols-outlined" style={{ color: c.primary }}>event</span>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: c.onSurface, fontFamily: 'Inter' }}>{(state as { event: { title: string } }).event.title}</p>
              <p className="text-xs mt-0.5" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                {new Date((state as { event: { startDate: string } }).event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {(state as { event: { venue?: { name: string } } }).event.venue && ` • ${(state as { event: { venue: { name: string } } }).event.venue.name}`}
              </p>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col sm:flex-row gap-4">
          <Link to="/my-events" className="flex-1 py-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', fontWeight: 500, textDecoration: 'none' }}>
            Go to My Events
          </Link>
          <Link to="/events" className="flex-1 border py-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95" style={{ borderColor: c.primary, color: c.primary, fontFamily: 'Inter', fontWeight: 500, textDecoration: 'none' }}>
            <span className="material-symbols-outlined text-[18px]">explore</span> More Events
          </Link>
        </div>

        <Link to="/events" className="mt-8 text-sm hover:underline" style={{ color: c.secondary, fontFamily: 'Inter', textDecoration: 'none' }}>
          Browse all upcoming events
        </Link>
      </div>
    </div>
  );
}
