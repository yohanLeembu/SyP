import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Roboto:wght@300;400;500&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Cormorant"]')) document.head.appendChild(fontLink);

const API = 'http://localhost:5000/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
}

const STATUS_STYLE = {
  confirmed:  { color: '#2a6b3c', background: '#eaf5ee', label: 'Confirmed' },
  cancelled:  { color: '#8b2020', background: '#fdf0f0', label: 'Cancelled' },
  completed:  { color: '#555',    background: '#f0f0f0', label: 'Completed' },
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings]         = useState([]);
  const [loading,  setLoading]          = useState(true);
  const [error,    setError]            = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [tab, setTab]                   = useState('upcoming'); // 'upcoming' | 'past'

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetch(`${API}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load your bookings.'))
      .finally(() => setLoading(false));
  }, [user, token, navigate]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`${API}/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch {
      alert('Could not cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.date >= today && b.status === 'confirmed');
  const past     = bookings.filter(b => b.date <  today || b.status !== 'confirmed');
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <p style={s.eyebrow}>Your Account</p>
        <h1 style={s.pageTitle}>
          {user ? `Welcome, ${user.name.split(' ')[0]}.` : 'Profile'}
        </h1>
        <div style={s.divider} />
      </div>

      <div style={s.content}>

        {/* ── Left: User info card ── */}
        <div style={s.sidebar}>
          <div style={s.profileCard}>
            <div style={s.avatar}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <p style={s.profileName}>{user?.name}</p>
            <p style={s.profileEmail}>{user?.email}</p>
            <div style={s.profileMeta}>
              <span style={s.roleBadge}>{user?.role}</span>
            </div>
          </div>

          <div style={s.statCard}>
            <p style={s.statNum}>{bookings.length}</p>
            <p style={s.statLabel}>Total Bookings</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statNum}>{upcoming.length}</p>
            <p style={s.statLabel}>Upcoming</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statNum}>{bookings.filter(b => b.status === 'completed').length}</p>
            <p style={s.statLabel}>Completed</p>
          </div>

          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/'); }}>
            Sign Out
          </button>
        </div>

        {/* ── Right: Bookings ── */}
        <div style={s.main}>
          <div style={s.tabRow}>
            <button style={{ ...s.tab, ...(tab === 'upcoming' ? s.tabActive : {}) }} onClick={() => setTab('upcoming')}>
              Upcoming {upcoming.length > 0 && <span style={s.tabCount}>{upcoming.length}</span>}
            </button>
            <button style={{ ...s.tab, ...(tab === 'past' ? s.tabActive : {}) }} onClick={() => setTab('past')}>
              Past & Cancelled
            </button>
          </div>

          {loading && <p style={s.stateText}>Loading your bookings...</p>}
          {error   && <p style={s.errorText}>{error}</p>}

          {!loading && !error && displayed.length === 0 && (
            <div style={s.emptyState}>
              <p style={s.emptyTitle}>
                {tab === 'upcoming' ? 'No upcoming appointments.' : 'No past bookings.'}
              </p>
              {tab === 'upcoming' && (
                <a href="/services" style={s.emptyLink}>Book your first appointment →</a>
              )}
            </div>
          )}

          {!loading && displayed.map(b => {
            const st = STATUS_STYLE[b.status] || STATUS_STYLE.confirmed;
            const isPast = b.date < today || b.status !== 'confirmed';
            return (
              <div key={b.id} style={s.bookingCard}>
                <div style={s.bookingTop}>
                  <div>
                    <p style={s.bookingService}>{b.service}</p>
                    <p style={s.bookingBarber}>with {b.barber_name} · {b.barber_specialty}</p>
                  </div>
                  <span style={{ ...s.statusBadge, color: st.color, background: st.background }}>
                    {st.label}
                  </span>
                </div>

                <div style={s.bookingMeta}>
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Date</span>
                    <span style={s.metaVal}>{formatDate(b.date)}</span>
                  </div>
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Time</span>
                    <span style={s.metaVal}>{formatTime(b.timeslot)} · {b.duration_mins} min</span>
                  </div>
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Price</span>
                    <span style={s.metaVal}>NPR {Number(b.price).toLocaleString()}</span>
                  </div>
                </div>

                <div style={s.bookingActions}>
                  {(b.status === 'confirmed' || b.status === 'completed') && (
                    <button
                      style={s.invoiceBtn}
                      onClick={() => navigate(`/invoice/${b.id}`)}
                    >
                      View Invoice
                    </button>
                  )}
                  {b.status === 'confirmed' && !isPast && (
                    <button
                      style={{ ...s.cancelBtn, ...(cancellingId === b.id ? s.cancelBtnDisabled : {}) }}
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                    >
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Roboto', sans-serif";
const GOLD  = '#b8966a';
const INK   = '#0e0e0e';
const CREAM = '#f6f4f0';

const s = {
  page: { background: CREAM, fontFamily: SANS, minHeight: '100vh', paddingBottom: '80px' },

  header: { textAlign: 'center', padding: '100px 48px 60px' },
  eyebrow: { fontFamily: SANS, fontSize: '0.82rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '20px', fontWeight: '400' },
  pageTitle: { fontFamily: SERIF, fontSize: 'clamp(2.4rem, 4vw, 4rem)', fontWeight: '300', color: INK, margin: '0 0 36px', lineHeight: '1.1' },
  divider: { width: '48px', height: '1px', background: GOLD, margin: '0 auto' },

  content: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px', maxWidth: '1200px', margin: '0 auto', padding: '0 48px' },

  /* Sidebar */
  sidebar: { display: 'flex', flexDirection: 'column', gap: '12px' },
  profileCard: { background: '#fff', padding: '32px 24px', textAlign: 'center', borderTop: `2px solid ${GOLD}` },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', background: GOLD, color: '#fff', fontFamily: SERIF, fontSize: '1.8rem', fontWeight: '300', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  profileName: { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', color: INK, margin: '0 0 4px' },
  profileEmail: { fontFamily: SANS, fontSize: '0.82rem', color: '#aaa', fontWeight: '300', margin: '0 0 16px' },
  profileMeta: { display: 'flex', justifyContent: 'center' },
  roleBadge: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`, padding: '3px 10px' },

  statCard: { background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' },
  statNum: { fontFamily: SERIF, fontSize: '2rem', fontWeight: '300', color: INK, margin: 0 },
  statLabel: { fontFamily: SANS, fontSize: '0.78rem', color: '#999', fontWeight: '300', margin: 0 },

  logoutBtn: { background: 'transparent', border: `1px solid #ddd8d0`, color: '#aaa', fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px', cursor: 'pointer', marginTop: '8px', fontWeight: '400' },

  /* Main */
  main: { minWidth: 0 },
  tabRow: { display: 'flex', gap: '0', borderBottom: '1px solid #ddd8d0', marginBottom: '32px' },
  tab: { fontFamily: SANS, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#aaa', background: 'none', border: 'none', padding: '12px 24px 12px 0', cursor: 'pointer', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { color: INK, borderBottom: `2px solid ${GOLD}`, marginBottom: '-1px' },
  tabCount: { background: GOLD, color: '#fff', fontFamily: SANS, fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px' },

  stateText: { fontFamily: SERIF, fontSize: '1.1rem', fontWeight: '300', color: '#aaa', fontStyle: 'italic', padding: '40px 0' },
  errorText: { fontFamily: SANS, fontSize: '0.88rem', color: '#8b2020', fontWeight: '300' },

  emptyState: { padding: '60px 0', textAlign: 'center' },
  emptyTitle: { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', fontStyle: 'italic', color: '#aaa', marginBottom: '16px' },
  emptyLink: { fontFamily: SANS, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none', borderBottom: `1px solid ${GOLD}`, paddingBottom: '2px' },

  bookingCard: { background: '#fff', padding: '28px 32px', marginBottom: '12px', borderLeft: `3px solid transparent`, borderTop: '1px solid #f0ece6' },
  bookingTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  bookingService: { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', color: INK, margin: '0 0 4px' },
  bookingBarber: { fontFamily: SANS, fontSize: '0.82rem', color: '#aaa', fontWeight: '300' },
  statusBadge: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', fontWeight: '400', flexShrink: 0 },

  bookingMeta: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingTop: '20px', borderTop: '1px solid #f0ece6', marginBottom: '20px' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metaLabel: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc', fontWeight: '400' },
  metaVal: { fontFamily: SANS, fontSize: '0.88rem', color: '#555', fontWeight: '300' },

  bookingActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  invoiceBtn: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: INK, border: 'none', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: '400', transition: 'opacity 0.2s' },
  cancelBtn: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #ddd', color: '#aaa', padding: '10px 20px', cursor: 'pointer', fontWeight: '400', transition: 'border-color 0.2s' },
  cancelBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
};