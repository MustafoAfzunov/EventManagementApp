import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { c } from '../../lib/theme';

interface Props {
  onScan: (code: string) => void;
  paused?: boolean;
}

export default function QrScanner({ onScan, paused = false }: Props) {
  const readerId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onScanRef.current = onScan;
  pausedRef.current = paused;

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* ignore cleanup errors */
    }
    scannerRef.current = null;
    setActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    setStarting(true);
    setError(null);
    await stopScanner();

    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    const config = { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 };
    const onDecoded = (text: string) => {
      if (pausedRef.current) return;
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.code === text && now - last.at < 2500) return;
      lastScanRef.current = { code: text, at: now };
      onScanRef.current(text);
    };

    const cameras = await Html5Qrcode.getCameras().catch(() => [] as { id: string; label: string }[]);
    const backCamera = cameras.find((cam) => /back|rear|environment/i.test(cam.label));
    const cameraId = backCamera?.id ?? cameras[0]?.id;

    try {
      if (cameraId) {
        await scanner.start(cameraId, config, onDecoded, () => {});
      } else {
        await scanner.start({ facingMode: 'environment' }, config, onDecoded, () => {});
      }
      setActive(true);
      setError(null);
    } catch {
      try {
        await scanner.start({ facingMode: 'user' }, config, onDecoded, () => {});
        setActive(true);
        setError(null);
      } catch {
        scannerRef.current = null;
        setError('Could not access the camera. Allow camera permission in your browser, or enter the ticket code manually.');
      }
    } finally {
      setStarting(false);
    }
  }, [readerId, stopScanner]);

  useEffect(() => () => { void stopScanner(); }, [stopScanner]);

  return (
    <div className="qr-scanner-host w-full rounded-xl border overflow-hidden relative" style={{ borderColor: c.outlineVariant, background: '#000' }}>
      <div id={readerId} className="w-full min-h-[220px]" />

      {!active && !starting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: c.surfaceLow }}>
          <span className="material-symbols-outlined text-[48px]" style={{ color: c.primaryContainer }}>qr_code_scanner</span>
          <p className="text-sm" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
            {error ?? 'Position the ticket QR code in the camera view'}
          </p>
          <button
            type="button"
            onClick={() => void startScanner()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            {error ? 'Try Again' : 'Start Camera'}
          </button>
        </div>
      )}

      {starting && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.onPrimary}30`, borderTopColor: c.onPrimary }} />
        </div>
      )}

      {active && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 rounded-xl" style={{ borderColor: c.primaryContainer, boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }} />
          </div>
          <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center justify-between gap-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
            <p className="text-xs" style={{ color: '#fff', fontFamily: 'Inter', opacity: 0.9 }}>
              {paused ? 'Processing scan…' : 'Scanning for QR codes'}
            </p>
            <button
              type="button"
              onClick={() => void stopScanner()}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'Inter' }}
            >
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}
