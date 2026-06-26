import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { auth } from '../../lib/api';
import { c } from '../../lib/theme';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    auth.verifyEmail(token)
      .then((res) => { setStatus('success'); setMessage(res.message || 'Email verified successfully!'); })
      .catch((err: Error) => { setStatus('error'); setMessage(err.message || 'Verification failed.'); });
  }, [token]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: c.surface }}>
      <div className="w-full max-w-md text-center">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: c.primary }}>
            <span className="material-symbols-outlined text-white text-[32px]">school</span>
          </div>
        </Link>

        <div className="rounded-2xl border p-8 shadow-sm" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.surfaceHigh }}>
                <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}40`, borderTopColor: c.primary }} />
              </div>
              <h2 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Verifying…</h2>
              <p style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Please wait while we verify your email address.</p>
            </>
          )}

          {status !== 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: isSuccess ? '#dcfce7' : c.errorContainer }}>
                <span className="material-symbols-outlined text-[32px]" style={{ color: isSuccess ? '#166534' : c.error }}>
                  {isSuccess ? 'verified' : 'error'}
                </span>
              </div>
              <h2 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>
                {isSuccess ? 'Email Verified!' : 'Verification Failed'}
              </h2>
              <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>{message}</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 rounded-lg text-sm font-medium"
                style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}
              >
                {isSuccess ? 'Continue to Login' : 'Back to Login'}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
