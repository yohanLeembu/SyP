import { useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Fonts + Material Symbols ────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById('__trimura_admin_styles')) return;

  [
    'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
  ].forEach(href => {
    if (!document.head.querySelector(`[href="${href}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    }
  });

  const style = document.createElement('style');
  style.id = '__trimura_admin_styles';
  style.textContent = `
    .mso {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      font-style: normal; font-weight: normal; display: inline-block;
      line-height: 1; text-transform: none; letter-spacing: normal;
      word-wrap: normal; white-space: nowrap; direction: ltr; font-size: 20px;
      vertical-align: middle;
    }
    .t-nav-link { transition: background 0.15s, transform 0.15s, color 0.15s; }
    .t-nav-link:hover { background: #f5f3ee !important; transform: translateX(4px); }
    .t-nav-link.t-active { background: #000 !important; color: #fff !important; }
    .t-nav-link.t-active .mso { color: #fff !important; }
    .t-icon-btn:hover { background: #e4e2dd; }
    .t-footer-btn:hover { background: #f5f3ee; }
    .t-top-link:hover { color: #000 !important; }
    .t-book-btn:hover { opacity: 0.85; }
    @media (max-width: 768px) {
      .t-sidebar { display: none !important; }
      .t-main { margin-left: 0 !important; padding-bottom: 72px; }
      .t-mobile-nav { display: flex !important; }
      .t-top-links { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

const NAV_ITEMS = [
  { label: 'Members',      to: '/admin/members',   icon: 'group'          },
  { label: 'Barbers',      to: '/admin/barbers',   icon: 'content_cut'    },
  { label: 'Appointments', to: '/admin/vacancy',   icon: 'calendar_today' },
  { label: 'Billing',      to: '/admin/billing',   icon: 'payments'       },
];

const H = "'Epilogue', sans-serif";
const L = "'Space Grotesk', sans-serif";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { injectStyles(); }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fbf9f4', fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="t-sidebar" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 256,
        background: '#fbf9f4', borderRight: '1px solid #f0eeeb',
        display: 'flex', flexDirection: 'column', zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid #f0eeeb' }}>
          <h1 style={{ fontFamily: H, fontWeight: 900, fontSize: 20, color: '#000', margin: 0, letterSpacing: '-0.01em' }}>
            TRIMURA
          </h1>
          <p style={{ fontFamily: L, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#888', margin: '4px 0 0' }}>
            Admin Terminal
          </p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ label, to, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `t-nav-link${isActive ? ' t-active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', color: '#666', textDecoration: 'none',
                fontFamily: H, fontWeight: 700, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}
            >
              <span className="mso" style={{ color: 'inherit' }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: '1px solid #f0eeeb' }}>
          <button
            className="t-book-btn"
            onClick={() => navigate('/admin/dashboard')}
            style={{
              width: '100%', background: '#000', color: '#fff', border: 'none',
              padding: '14px 16px', fontFamily: H, fontWeight: 700, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Dashboard
          </button>
          <div style={{ marginTop: 16 }}>
            {[
              { icon: 'settings', label: 'Settings', onClick: () => {} },
              { icon: 'logout',   label: 'Logout',   onClick: handleLogout },
            ].map(({ icon, label, onClick }) => (
              <button
                key={label}
                className="t-footer-btn"
                onClick={onClick}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', color: '#888', fontFamily: L,
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
              >
                <span className="mso" style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="t-main" style={{ marginLeft: 256, minHeight: '100vh', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <header style={{
          background: '#fbf9f4', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 40,
          borderBottom: '1px solid #f0eeeb',
        }}>
          <span style={{ fontFamily: H, fontWeight: 900, fontSize: 20, color: '#000', textTransform: 'uppercase' }}>
            TRIMURA
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="t-top-links" style={{ display: 'flex', gap: 28 }}>
              {['Directory', 'Analytics', 'Logs'].map((l, i) => (
                <a key={l} className="t-top-link" style={{
                  fontFamily: H, fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.12em', textDecoration: 'none', cursor: 'pointer',
                  transition: 'color 0.15s',
                  color: i === 0 ? '#000' : '#aaa',
                  fontWeight: i === 0 ? '700' : '400',
                }}>
                  {l}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="t-icon-btn" style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'background 0.12s', display: 'flex' }}>
                <span className="mso">notifications</span>
              </button>
              <button className="t-icon-btn" onClick={handleLogout} title="Logout" style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'background 0.12s', display: 'flex' }}>
                <span className="mso">logout</span>
              </button>
              <div style={{
                width: 32, height: 32, background: '#e4e2dd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: H, fontWeight: 700, fontSize: 13, color: '#000',
              }}>
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page outlet */}
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav className="t-mobile-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fbf9f4', borderTop: '1px solid #e4e2dd',
        zIndex: 50, justifyContent: 'space-around', alignItems: 'center', padding: '10px 0',
      }}>
        {NAV_ITEMS.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, textDecoration: 'none', color: isActive ? '#000' : '#aaa',
              fontFamily: L, fontSize: 9, textTransform: 'uppercase',
            })}
          >
            <span className="mso" style={{ fontSize: 22 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}