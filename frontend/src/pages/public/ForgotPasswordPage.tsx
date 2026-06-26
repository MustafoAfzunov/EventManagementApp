import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { auth } from '../../lib/api';
import { c } from '../../lib/theme';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: c.surface }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: c.primary }}>
              <span className="material-symbols-outlined text-white text-[32px]">school</span>
            </div>
            <h1 className="font-bold text-xl mb-1" style={{ fontFamily: 'Hanken Grotesk', color: c.primary }}>University of Central Asia</h1>
          </Link>
        </div>

        <div className="rounded-2xl border p-8 shadow-sm" style={{ background: c.surfaceLowest, borderColor: c.outlineVariant }}>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
                <span className="material-symbols-outlined text-[32px]" style={{ color: '#166534' }}>mark_email_read</span>
              </div>
              <h2 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Check your inbox</h2>
              <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                We&apos;ve sent a password reset link to <strong>{email}</strong>. It will expire in 30 minutes.
              </p>
              <Link to="/login" className="inline-block px-6 py-3 rounded-lg text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'Hanken Grotesk', color: c.onSurface }}>Reset your password</h2>
              <p className="mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>
                Enter your university email and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: c.onSurface, fontFamily: 'Inter' }}>University Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: c.onSurfaceVariant }}>mail</span>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@uca.edu.kg"
                      className="w-full pl-12 pr-4 py-4 rounded-lg border focus:outline-none focus:ring-2"
                      style={{ background: c.surfaceLowest, borderColor: c.outlineVariant, fontFamily: 'Inter', color: c.onSurface }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-lg font-bold text-sm transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                  style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm hover:underline" style={{ color: c.secondary, fontFamily: 'Inter', textDecoration: 'none' }}>
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
