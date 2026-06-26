import { useEffect, type ReactNode } from 'react';
import { c } from '../../lib/theme';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = '520px' }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,27,56,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: c.surfaceLowest, maxWidth, border: `1px solid ${c.outlineVariant}` }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.outlineVariant }}>
            <h3 className="font-semibold text-xl" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: c.onSurfaceVariant }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
