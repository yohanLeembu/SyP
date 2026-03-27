import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

/* ── Google Fonts — injected once, covers whole app ── */
const _font = document.createElement('link');
_font.href = 'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,700;0,900;1,700;1,900&family=Work+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap';
_font.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Epilogue"]')) document.head.appendChild(_font);

const API = 'http://localhost:5000/api';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NAV_LINKS = [
  { label: 'Home',     to: '/'        },
  { label: 'Services', to: '/services' },
  { label: 'Barbers',  to: '/barbers'  },
  { label: 'Vacancy',  to: '/vacancy'  },
];

/* ─── THEME ──────────────────────────────────────────────────────────── */
const T = {
  black: '#0a0a0a',
  white: '#fbf9f4',
  blue:  '#346190',
  red:   '#ba1a1a',
  sand:  '#eae8e3',
};
const HEADLINE = "'Epilogue', 'Impact', sans-serif";
const LABEL    = "'Space Grotesk', sans-serif";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const [bellOpen, setBellOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifs,   setNotifs]   = useState([]);

  const socketRef = useRef(null);
  const bellRef   = useRef(null);

  /* ── Scroll listener ───────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close bell on outside click ───────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Fetch notifications ────────────────────────────────────────────── */
  const fetchNotifs = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifs(await res.json());
    } catch { /* silent fail */ }
  }, [user, token]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  /* ── Socket.IO — live push notifications ───────────────────────────── */
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('register', user.id));
    socket.on('notification', (newNotif) => {
      setNotifs(prev => [{ ...newNotif, id: Date.now() * -1, is_read: 0 }, ...prev]);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user, token]);

  /* ── Mark all read ──────────────────────────────────────────────────── */
  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch { /* silent fail */ }
  };

  /* ── Mark single read ───────────────────────────────────────────────── */
  const markRead = async (id) => {
    if (id < 0) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      return;
    }
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch { /* silent fail */ }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const unread = notifs.filter(n => !n.is_read).length;

  /* Dashboard path based on role */
  const dashPath =
    user?.role === 'admin'  ? '/admin' :
    user?.role === 'barber' ? '/barber-dashboard' :
    '/dashboard';

  return (
    <header style={{ ...st.header, ...(scrolled ? st.headerScrolled : {}) }}>

      {/* ── Logo ── */}
      <Link to="/" style={st.logo}>TRIMURA</Link>

      {/* ── Centre nav links ── */}
      <nav style={st.nav}>
        {NAV_LINKS.map(({ label, to }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                ...st.navLink,
                ...(active ? st.navLinkActive : {}),
              }}
            >
              {label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      {/* ── Right: bell + profile/logout ── */}
      <div style={st.right}>

        {/* Bell — only when logged in */}
        {user && (
          <div ref={bellRef} style={st.bellWrap}>
            <button style={st.bellBtn} onClick={() => setBellOpen(o => !o)} aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span style={st.badge}>{unread > 9 ? '9+' : unread}</span>
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && (
              <div style={st.bellDropdown} onClick={e => e.stopPropagation()}>
                <div style={st.bellHeader}>
                  <span style={st.bellTitle}>NOTIFICATIONS</span>
                  {unread > 0 && (
                    <button style={st.markReadBtn} onClick={markAllRead}>MARK ALL READ</button>
                  )}
                </div>
                <div style={st.bellList}>
                  {notifs.length === 0 ? (
                    <div style={st.emptyNotif}>
                      <p style={st.emptyNotifText}>NO NOTIFICATIONS YET</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        style={{ ...st.notifItem, ...(n.is_read ? st.notifRead : {}) }}
                        onClick={() => !n.is_read && markRead(n.id)}
                      >
                        {!n.is_read && <span style={st.notifDot} />}
                        <div style={st.notifContent}>
                          <p style={st.notifText}>{n.message}</p>
                          <p style={st.notifTime}>{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile / Sign In button */}
        {user ? (
          <div style={st.userGroup}>
            <Link to={dashPath} style={st.profileBtn}>
              {user.role === 'admin' ? 'ADMIN' : user.role === 'barber' ? 'DASHBOARD' : 'PROFILE'}
            </Link>
            <button onClick={handleLogout} style={st.logoutBtn}>SIGN OUT</button>
          </div>
        ) : (
          <div style={st.userGroup}>
            <Link to="/login"    style={st.signInBtn}>SIGN IN</Link>
            <Link to="/register" style={st.profileBtn}>SIGN UP</Link>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const st = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 48px',
    background: T.white,
    borderBottom: `2px solid ${T.black}`,
    boxShadow: `0 6px 0 0 ${T.black}`,
    gap: '32px',
    transition: 'padding 0.25s ease',
  },
  headerScrolled: {
    padding: '14px 48px',
  },

  /* Logo */
  logo: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: '2rem',
    letterSpacing: '-0.04em',
    textTransform: 'uppercase',
    color: T.black,
    textDecoration: 'none',
    display: 'inline-block',
    transform: 'rotate(-2deg)',
    flexShrink: 0,
    transition: 'transform 0.2s',
  },

  /* Nav */
  nav: {
    display: 'flex',
    gap: '36px',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.black,
    textDecoration: 'none',
    transition: 'color 0.1s, transform 0.1s',
    display: 'inline-block',
  },
  navLinkActive: {
    color: T.blue,
    textDecoration: 'underline',
    textDecorationThickness: '3px',
    textUnderlineOffset: '7px',
  },

  /* Right side */
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  userGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  /* Profile / CTA button — matches HTML's button style */
  signInBtn: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: 'transparent',
    color: T.black,
    textDecoration: 'none',
    padding: '8px 20px',
    display: 'inline-block',
    border: `2px solid ${T.black}`,
    transition: 'background 0.1s, color 0.1s',
  },
  profileBtn: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: T.black,
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 24px',
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    boxShadow: `4px 4px 0 ${T.blue}`,
  },
  logoutBtn: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: 'none',
    color: T.red,
    border: `2px solid ${T.red}`,
    padding: '8px 20px',
    cursor: 'pointer',
    transition: 'background 0.1s, color 0.1s',
  },

  /* Bell */
  bellWrap: { position: 'relative' },
  bellBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    color: T.black,
  },
  badge: {
    position: 'absolute',
    top: '2px', right: '2px',
    minWidth: '17px', height: '17px',
    borderRadius: '999px',
    background: T.red,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.58rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },

  bellDropdown: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    width: '360px',
    background: T.white,
    border: `2px solid ${T.black}`,
    boxShadow: `6px 6px 0 ${T.black}`,
    zIndex: 400,
  },
  bellHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: `2px solid ${T.black}`,
  },
  bellTitle: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    color: T.black,
    fontWeight: '700',
  },
  markReadBtn: {
    fontFamily: LABEL,
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    color: T.blue,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
  },
  bellList: { maxHeight: '360px', overflowY: 'auto' },

  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: `1px solid ${T.sand}`,
    cursor: 'pointer',
    background: '#fdf9f0',
  },
  notifRead: {
    background: T.white,
    cursor: 'default',
  },
  notifDot: {
    flexShrink: 0,
    width: '7px', height: '7px',
    borderRadius: '50%',
    background: T.blue,
    marginTop: '6px',
  },
  notifContent: { flex: 1 },
  notifText: {
    fontFamily: LABEL,
    fontSize: '0.86rem',
    color: T.black,
    margin: '0 0 4px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  notifTime: {
    fontFamily: LABEL,
    fontSize: '0.7rem',
    color: '#aaa',
    margin: 0,
    fontWeight: '400',
  },
  emptyNotif: { padding: '40px 20px', textAlign: 'center' },
  emptyNotifText: {
    fontFamily: LABEL,
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    color: '#ccc',
    fontWeight: '500',
  },
};