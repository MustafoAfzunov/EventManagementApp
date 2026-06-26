import { createBrowserRouter } from 'react-router';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '../lib/auth';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import Navbar from '../components/layout/Navbar';
import { c } from '../lib/theme';

// Lazy-loaded pages
const HomePage               = lazy(() => import('../pages/public/HomePage'));
const LoginPage              = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage           = lazy(() => import('../pages/public/RegisterPage'));
const ForgotPasswordPage     = lazy(() => import('../pages/public/ForgotPasswordPage'));
const VerifyEmailPage        = lazy(() => import('../pages/public/VerifyEmailPage'));
const EventsPage             = lazy(() => import('../pages/public/EventsPage'));
const EventDetailsPage       = lazy(() => import('../pages/public/EventDetailsPage'));

const DashboardPage          = lazy(() => import('../pages/attendee/DashboardPage'));
const MyEventsPage           = lazy(() => import('../pages/attendee/MyEventsPage'));
const SeatSelectionPage      = lazy(() => import('../pages/attendee/SeatSelectionPage'));
const TicketPage             = lazy(() => import('../pages/attendee/TicketPage'));
const ProfilePage            = lazy(() => import('../pages/attendee/ProfilePage'));
const RegistrationSuccessPage = lazy(() => import('../pages/attendee/RegistrationSuccessPage'));

const CheckInPage            = lazy(() => import('../pages/staff/CheckInPage'));

const AdminEventsPage        = lazy(() => import('../pages/admin/AdminEventsPage'));
const AdminEventEditorPage   = lazy(() => import('../pages/admin/AdminEventEditorPage'));
const AdminVenuesPage        = lazy(() => import('../pages/admin/AdminVenuesPage'));
const AdminReportsPage       = lazy(() => import('../pages/admin/AdminReportsPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: c.surface }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${c.primary}30`, borderTopColor: c.primary }} />
    </div>
  );
}

function WithNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </>
  );
}

function WithAppLayout({ children, roles }: { children: React.ReactNode; roles?: ('Attendee' | 'EventStaff' | 'Admin')[] }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProtectedRoute roles={roles}>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </AppLayout>
      </ProtectedRoute>
    </Suspense>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: c.surface }}>
      <div className="text-center">
        <h1 className="font-bold mb-3" style={{ fontFamily: 'Hanken Grotesk', fontSize: 64, color: c.primary }}>404</h1>
        <p className="text-xl mb-6" style={{ color: c.onSurfaceVariant, fontFamily: 'Inter' }}>Page not found</p>
        <a href="/" className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: c.primary, color: c.onPrimary, fontFamily: 'Inter', textDecoration: 'none' }}>Go Home</a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Public pages (with Navbar) ─────────────────────────────────────────────
  {
    path: '/',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><WithNav><HomePage /></WithNav></Suspense></AuthProvider>,
  },
  {
    path: '/events',
    element: <AuthProvider><WithNav><EventsPage /></WithNav></AuthProvider>,
  },
  {
    path: '/events/:id',
    element: <AuthProvider><WithNav><EventDetailsPage /></WithNav></AuthProvider>,
  },
  {
    path: '/login',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><LoginPage /></Suspense></AuthProvider>,
  },
  {
    path: '/register',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><RegisterPage /></Suspense></AuthProvider>,
  },
  {
    path: '/forgot-password',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense></AuthProvider>,
  },
  {
    path: '/verify-email',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense></AuthProvider>,
  },

  // ── Attendee pages (with AppLayout + sidebar) ──────────────────────────────
  {
    path: '/dashboard',
    element: <AuthProvider><WithAppLayout roles={['Attendee']}><DashboardPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/my-events',
    element: <AuthProvider><WithAppLayout roles={['Attendee']}><MyEventsPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/seat-selection/:registrationId',
    element: <AuthProvider><WithAppLayout roles={['Attendee']}><SeatSelectionPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/ticket/:ticketId',
    element: <AuthProvider><WithAppLayout roles={['Attendee']}><TicketPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/profile',
    element: <AuthProvider><WithAppLayout><ProfilePage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/registration-success',
    element: <AuthProvider><Suspense fallback={<PageLoader />}><RegistrationSuccessPage /></Suspense></AuthProvider>,
  },

  // ── Staff pages ────────────────────────────────────────────────────────────
  {
    path: '/staff/check-in',
    element: <AuthProvider><WithAppLayout roles={['EventStaff', 'Admin']}><CheckInPage /></WithAppLayout></AuthProvider>,
  },

  // ── Admin pages ────────────────────────────────────────────────────────────
  {
    path: '/admin/events',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminEventsPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/admin/events/:id/edit',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminEventEditorPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/admin/events/new',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminEventEditorPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/admin/events/:id/registrations',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminEventEditorPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/admin/venues',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminVenuesPage /></WithAppLayout></AuthProvider>,
  },
  {
    path: '/admin/reports',
    element: <AuthProvider><WithAppLayout roles={['Admin']}><AdminReportsPage /></WithAppLayout></AuthProvider>,
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <AuthProvider><NotFound /></AuthProvider> },
]);
