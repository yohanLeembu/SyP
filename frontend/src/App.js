import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';        // ← new
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Barbers from './pages/Barbers';
import Vacancy from './pages/Vacancy';
import BarberPublicProfile from './pages/BarberPublicProfile';
import PaymentCallback from './pages/PaymentCallback';
import Invoice from './pages/Invoice';

// Member / Barber pages
import Dashboard from './pages/Dashboard';
import BarberDashboard from './pages/BarberDashboard';

// Admin pages
import AdminPanel from './pages/AdminPanel';              // legacy — kept as /admin/dashboard
import AdminVacancy from './pages/AdminVacancy';
import AdminBarbers from './pages/AdminBarbers';
import MemberManagement from './pages/MemberManagement';  // ← new


/* ─────────────────────────────────────────────────────────────────────
   Public layout — Navbar + Footer shown for everyone EXCEPT admin
───────────────────────────────────────────────────────────────────── */
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Guard: blocks admin from accessing public routes
   Redirects them to /admin/dashboard instead
───────────────────────────────────────────────────────────────────── */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
}

/* ─────────────────────────────────────────────────────────────────────
   Root redirect — decides where "/" sends each role
───────────────────────────────────────────────────────────────────── */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'barber')  return <Navigate to="/barber-dashboard" replace />;
  return <Navigate to="/home" replace />;
}

/* ─────────────────────────────────────────────────────────────────────
   All routes
───────────────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ── Root redirect ───────────────────────────────────────────── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Auth ────────────────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={
                user.role === 'admin'  ? '/admin/dashboard' :
                user.role === 'barber' ? '/barber-dashboard' :
                '/home'
              } replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/home" replace /> : <Register />}
      />

      {/* ── Public pages (blocked for admin) ────────────────────────── */}
      <Route path="/home" element={
        <PublicRoute><PublicLayout><Home /></PublicLayout></PublicRoute>
      }/>
      <Route path="/services" element={
        <PublicRoute><PublicLayout><Services /></PublicLayout></PublicRoute>
      }/>
      <Route path="/barbers" element={
        <PublicRoute><PublicLayout><Barbers /></PublicLayout></PublicRoute>
      }/>
      <Route path="/barbers/:id" element={
        <PublicRoute><PublicLayout><BarberPublicProfile /></PublicLayout></PublicRoute>
      }/>
      <Route path="/vacancy" element={
        <PublicRoute><PublicLayout><Vacancy /></PublicLayout></PublicRoute>
      }/>

      {/* ── Member dashboard ─────────────────────────────────────────── */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="member">
          <PublicLayout><Dashboard /></PublicLayout>
        </ProtectedRoute>
      }/>

      {/* ── Payment callback (public-ish, no nav needed) ─────────────── */}
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* ── Invoice (authenticated) ───────────────────────────────────── */}
      <Route path="/invoice/:id" element={
        <ProtectedRoute>
          <Invoice />
        </ProtectedRoute>
      }/>

      {/* ── Barber dashboard ─────────────────────────────────────────── */}
      <Route path="/barber-dashboard" element={
        <ProtectedRoute requiredRole="barber">
          <BarberDashboard />
        </ProtectedRoute>
      }/>

      {/* ════════════════════════════════════════════════════════════════
          ADMIN SECTION — uses AdminLayout (sidebar, no public navbar)
      ════════════════════════════════════════════════════════════════ */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* /admin  →  redirect to /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Main admin dashboard (repurposes AdminPanel) */}
        <Route path="dashboard" element={<AdminPanel />} />

        {/* Member Management ← NEW */}
        <Route path="members"   element={<MemberManagement />} />

        {/* Barber Management */}
        <Route path="barbers"   element={<AdminBarbers />} />

        {/* Appointments / Vacancies */}
        <Route path="vacancy"   element={<AdminVacancy />} />

        {/* Billing — placeholder until you build the page */}
        <Route path="billing"   element={
          <div style={{ padding: 40, color: '#fbf9f4', fontFamily: 'Space Grotesk, sans-serif' }}>
            <h2>Billing</h2>
            <p style={{ color: '#555' }}>Coming soon.</p>
          </div>
        }/>
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div style={{ textAlign: 'center', marginTop: 80, color: '#555', fontFamily: 'Space Grotesk, sans-serif' }}>
          <h2>404 — Page Not Found</h2>
        </div>
      }/>

    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}