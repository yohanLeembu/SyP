import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const H = "'Epilogue', sans-serif";
const L = "'Space Grotesk', sans-serif";
const B = "'Work Sans', sans-serif";

function injectMemberStyles() {
  if (document.getElementById('__member_styles')) return;
  const s = document.createElement('style');
  s.id = '__member_styles';
  s.textContent = `
    .m-tr:hover { background: #f5f3ee; }
    .m-action-btn { transition: color 0.15s; }
    .m-action-btn:hover { color: #000 !important; }
    .m-action-btn.del:hover { color: #ba1a1a !important; }
    .m-filter-btn:hover { background: #000; color: #fff; }
    .m-search-input:focus { outline: none; border-bottom-color: #000; }
    .m-prev-btn:hover { background: #e4e2dd; }
    .m-next-btn:hover { opacity: 0.88; }
    .m-overlay { animation: mOverlayIn 0.18s ease; }
    .m-modal  { animation: mModalIn  0.2s ease; }
    @keyframes mOverlayIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes mModalIn   { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
    .m-role-opt:hover { border-color: #000 !important; }
    .m-toast { animation: mToastIn 0.2s ease; }
    @keyframes mToastIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
    .m-edit-input { width: 100%; background: transparent; border: none; border-bottom: 2px solid #e4e2dd;
      padding: 10px 0; font-family: 'Space Grotesk', sans-serif; font-size: 13px;
      color: #000; box-sizing: border-box; transition: border-bottom-color 0.15s; }
    .m-edit-input:focus { outline: none; border-bottom-color: #000; }
    .m-edit-input::placeholder { color: #bbb; }
  `;
  document.head.appendChild(s);
}

const ROLE_STYLE = {
  member: { bg: '#dcfce7', color: '#166534' },
  barber: { bg: '#dbeafe', color: '#1e40af' },
  admin:  { bg: '#fee2e2', color: '#991b1b' },
};

const ROLES = ['all', 'member', 'barber', 'admin'];
const PER_PAGE = 10;

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="mso" style={{ fontSize: size, verticalAlign: 'middle', lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

/* ── Reusable labelled field ─────────────────────────────────────────── */
function EditField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontFamily: L, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aaa', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        className="m-edit-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function MemberManagement() {
  const { token } = useAuth();

  const [users,      setUsers]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('newest');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState(null);

  const [viewUser,      setViewUser]      = useState(null);
  const [editUser,      setEditUser]      = useState(null);
  const [editName,      setEditName]      = useState('');
  const [editEmail,     setEditEmail]     = useState('');
  const [editPassword,  setEditPassword]  = useState('');
  const [editRole,      setEditRole]      = useState('');
  const [saving,        setSaving]        = useState(false);

  useEffect(() => { injectMemberStyles(); }, []);

  /* ── Open edit — seeds all fields ───────────────────────────────── */
  const openEdit = (u) => {
    setEditUser(u);
    setEditName(u.name  ?? '');
    setEditEmail(u.email ?? '');
    setEditPassword('');          // always blank — only sent if filled
    setEditRole(u.role  ?? 'member');
  };

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try { setUsers(await api.getAllUsers(token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Filter / sort pipeline ─────────────────────────────────────── */
  useEffect(() => {
    let list = [...users];
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'name') list.sort((a, b) => a.name?.localeCompare(b.name));
    setFiltered(list);
    setPage(1);
  }, [users, search, roleFilter, sortBy]);

  /* ── Toast ─────────────────────────────────────────────────────── */
  const toast$ = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete "${u.name}"?`)) return;
    try {
      await api.deleteUser(u.id, token);
      toast$(`"${u.name}" deleted.`);
      fetchUsers();
    } catch (e) { toast$(e.message, 'error'); }
  };

  /* ── Save (name + email + password + role) ───────────────────────── */
  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const body = {
        name:  editName,
        email: editEmail,
        role:  editRole,
        ...(editPassword ? { password: editPassword } : {}), // only if filled
      };

      const res = await fetch(`http://localhost:5000/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');

      toast$(`"${editName}" updated successfully.`);
      setEditUser(null);
      fetchUsers();
    } catch (e) { toast$(e.message, 'error'); }
    finally { setSaving(false); }
  };

  /* ── Pagination ─────────────────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Stats ──────────────────────────────────────────────────────── */
  const stats = {
    total:   users.length,
    active:  users.filter(u => u.role === 'member').length,
    newWeek: users.filter(u => (Date.now() - new Date(u.created_at)) / 864e5 <= 7).length,
  };

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: B, color: '#1b1c19', position: 'relative' }}>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className="m-toast" style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', fontFamily: L, fontSize: 13,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          background: toast.type === 'error' ? '#ba1a1a' : '#000',
          color: '#fff', maxWidth: 340,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Canvas ─────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 24px 80px', maxWidth: 1200 }}>

        {/* ── Hero Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, gap: 32 }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{
              fontFamily: H, fontWeight: 900, fontSize: 'clamp(52px, 8vw, 96px)',
              lineHeight: 0.9, margin: 0, color: '#000', textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}>
              MEMBER<br />DIRECTORY
            </h2>
            <div style={{
              position: 'absolute', top: -24, right: -16, transform: 'rotate(-2deg)',
              background: '#346190', color: '#fff',
              padding: '6px 14px', fontFamily: L, fontSize: 12, fontWeight: 700,
              boxShadow: '2px 4px 12px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
            }}>
              TOTAL: {stats.total.toLocaleString()} REGISTERED
            </div>
          </div>
          <div style={{ maxWidth: 320 }}>
            <p style={{ fontFamily: B, color: '#666', lineHeight: 1.7, margin: '0 0 20px', fontSize: 14 }}>
              Managing the core pulse of the establishment. Filter, edit, and oversee all active memberships and client profiles within the Trimura ecosystem.
            </p>
            <button
              onClick={fetchUsers} disabled={loading}
              style={{
                background: 'none', border: '2px solid #000', color: '#000',
                padding: '10px 20px', fontFamily: H, fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#000'; }}
            >
              {loading ? '⟳ Loading…' : '⟳ Refresh'}
            </button>
          </div>
        </div>

        {/* ── Stats Bento ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 64 }}>
          <div style={{ background: '#f5f3ee', padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontFamily: L, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#888' }}>Active Today</span>
            <span style={{ fontFamily: H, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>{stats.active}</span>
          </div>
          <div style={{ background: '#eae8e3', padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontFamily: L, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#888' }}>New This Week</span>
            <span style={{ fontFamily: H, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>+{stats.newWeek}</span>
          </div>
          <div style={{ background: '#000', color: '#fff', padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontFamily: L, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#888' }}>Total Users</span>
            <span style={{ fontFamily: H, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>{stats.total}</span>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 16px', marginBottom: 24, fontFamily: L, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Search + Filters ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: '1 1 280px', maxWidth: 400, position: 'relative' }}>
            <input
              className="m-search-input"
              type="text"
              placeholder="Search member directory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderBottom: '2px solid #000', padding: '12px 0',
                fontFamily: L, fontSize: 13, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: '#000', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{
              background: '#e4e2dd', border: 'none', borderBottom: '2px solid #000',
              padding: '10px 14px', fontFamily: L, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#000', cursor: 'pointer', fontWeight: 600,
            }}>
              {ROLES.map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: '#e4e2dd', border: 'none', borderBottom: '2px solid #000',
              padding: '10px 14px', fontFamily: L, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#000', cursor: 'pointer', fontWeight: 600,
            }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
            <button className="m-filter-btn" style={{
              background: '#e4e2dd', border: 'none', padding: '10px 16px',
              fontFamily: L, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: '2px solid #000', transition: 'background 0.15s, color 0.15s',
            }}>
              <Icon name="filter_list" size={16} />Filter
            </button>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: '#aaa', fontFamily: L, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Loading directory…
            </div>
          ) : pageItems.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: '#aaa', fontFamily: L, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              No members match your filters.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#e4e2dd' }}>
                  {['Name', 'Contact', 'Join Date', 'Role', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '16px 24px', fontFamily: H, fontWeight: 700,
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#666',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: '2px solid #e4e2dd' }}>
                {pageItems.map((u) => {
                  const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.member;
                  return (
                    <tr key={u.id} className="m-tr" style={{ borderBottom: '1px solid #f0eeeb', transition: 'background 0.12s' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{
                            width: 40, height: 40, background: '#e4e2dd',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: H, fontWeight: 700, fontSize: 13, color: '#000', flexShrink: 0,
                          }}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontFamily: H, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: '#000' }}>{u.name}</p>
                            <p style={{ margin: '2px 0 0', fontFamily: L, fontSize: 10, color: '#aaa', letterSpacing: '0.04em' }}>ID: #{String(u.id).padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontFamily: B, fontSize: 13, color: '#444' }}>{u.email}</p>
                        {u.phone && <p style={{ margin: '2px 0 0', fontFamily: B, fontSize: 12, color: '#aaa' }}>{u.phone}</p>}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontFamily: L, fontSize: 13, textTransform: 'uppercase', color: '#444' }}>
                          {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{
                          padding: '4px 12px', background: rs.bg, color: rs.color,
                          fontFamily: L, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button className="m-action-btn" onClick={() => setViewUser(u)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: '#aaa' }} title="View">
                          <Icon name="visibility" size={20} />
                        </button>
                        {/* ↓ now calls openEdit instead of only setting role */}
                        <button className="m-action-btn" onClick={() => openEdit(u)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: '#aaa' }} title="Edit">
                          <Icon name="edit" size={20} />
                        </button>
                        <button className="m-action-btn del" onClick={() => handleDelete(u)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: '#aaa' }} title="Delete">
                          <Icon name="delete" size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <p style={{ fontFamily: L, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#888', margin: 0 }}>
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} members
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="m-prev-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
              background: '#e4e2dd', border: 'none', padding: '12px 24px',
              fontFamily: H, fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.12em', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.4 : 1, transition: 'background 0.15s',
            }}>Previous</button>
            <button className="m-next-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
              background: '#000', color: '#fff', border: 'none', padding: '12px 32px',
              fontFamily: H, fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.12em', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.4 : 1, transition: 'opacity 0.15s',
            }}>Next Page</button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════ */}
      {viewUser && (
        <div className="m-overlay" onClick={() => setViewUser(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="m-modal" onClick={e => e.stopPropagation()} style={{
            background: '#fbf9f4', maxWidth: 440, width: '90%', padding: '40px 36px', position: 'relative',
          }}>
            <button onClick={() => setViewUser(null)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none',
              border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 20,
            }}>✕</button>

            <div style={{
              width: 56, height: 56, background: '#000', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: H, fontWeight: 700, fontSize: 20, marginBottom: 20,
            }}>{initials(viewUser.name)}</div>

            <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: 24, margin: '0 0 4px', textTransform: 'uppercase' }}>{viewUser.name}</h3>
            <p style={{ fontFamily: B, color: '#666', margin: '0 0 16px', fontSize: 14 }}>{viewUser.email}</p>

            <span style={{
              display: 'inline-block', padding: '4px 12px', marginBottom: 24,
              background: (ROLE_STYLE[viewUser.role] ?? ROLE_STYLE.member).bg,
              color: (ROLE_STYLE[viewUser.role] ?? ROLE_STYLE.member).color,
              fontFamily: L, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>{viewUser.role}</span>

            <div style={{ borderTop: '1px solid #e4e2dd' }}>
              {[
                ['User ID', `#${String(viewUser.id).padStart(4, '0')}`],
                ['Joined',  new Date(viewUser.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                viewUser.phone ? ['Phone', viewUser.phone] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0eeeb' }}>
                  <span style={{ fontFamily: L, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>{k}</span>
                  <span style={{ fontFamily: L, fontSize: 13, color: '#444' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ↓ now calls openEdit so all fields are seeded */}
            <button
              onClick={() => { setViewUser(null); openEdit(viewUser); }}
              style={{
                marginTop: 24, width: '100%', background: '#000', color: '#fff',
                border: 'none', padding: '14px', fontFamily: H, fontWeight: 700,
                fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
              }}
            >
              Edit Member
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          EDIT MODAL  (name + email + password + role)
      ══════════════════════════════════════════════════════════════ */}
      {editUser && (
        <div className="m-overlay" onClick={() => setEditUser(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="m-modal" onClick={e => e.stopPropagation()} style={{
            background: '#fbf9f4', maxWidth: 420, width: '90%', padding: '40px 36px', position: 'relative',
          }}>
            <button onClick={() => setEditUser(null)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none',
              border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 20,
            }}>✕</button>

            <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: 22, margin: '0 0 6px', textTransform: 'uppercase' }}>Edit Member</h3>
            <p style={{ fontFamily: B, color: '#666', margin: '0 0 28px', fontSize: 14 }}>
              Updating profile for <strong style={{ color: '#000' }}>{editUser.name}</strong>
            </p>

            {/* ── Text fields ─────────────────────────────────────────── */}
            <EditField
              label="Full Name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Full name"
            />
            <EditField
              label="Email"
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="Email address"
            />
            <EditField
              label="New Password"
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />

            {/* ── Role selector ───────────────────────────────────────── */}
            <p style={{ fontFamily: L, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#aaa', margin: '0 0 10px' }}>
              Role
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {['member', 'barber', 'admin'].map(role => {
                const active = editRole === role;
                return (
                  <label key={role} className="m-role-opt" style={{
                    flex: 1, border: `2px solid ${active ? '#000' : '#e4e2dd'}`,
                    padding: '14px 0', textAlign: 'center', cursor: 'pointer',
                    background: active ? '#000' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                    <input type="radio" name="editRole" value={role} checked={active}
                      onChange={() => setEditRole(role)} style={{ display: 'none' }} />
                    <span style={{
                      fontFamily: H, fontWeight: 700, fontSize: 12,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: active ? '#fff' : '#666',
                    }}>{role}</span>
                  </label>
                );
              })}
            </div>

            {/* ── Action buttons ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditUser(null)} style={{
                flex: 1, background: '#e4e2dd', border: 'none', padding: '14px',
                fontFamily: H, fontWeight: 700, fontSize: 13, textTransform: 'uppercase',
                letterSpacing: '0.08em', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, background: '#000', color: '#fff', border: 'none', padding: '14px',
                fontFamily: H, fontWeight: 700, fontSize: 13, textTransform: 'uppercase',
                letterSpacing: '0.08em', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}