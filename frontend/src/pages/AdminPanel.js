import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchUsers = () =>
    api.getAllUsers(token).then(setUsers).catch((err) => setError(err.message));

  useEffect(() => { fetchUsers(); }, [token]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.deleteUser(id, token);
      setMsg(`User "${name}" deleted.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={s.page}>
      <h2>Admin Panel</h2>
      <p style={s.sub}>Logged in as <strong>{user?.name}</strong> (admin)</p>

      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

        <Link to="/admin/vacancy" style={{ display: 'inline-block', marginBottom: '24px', color: '#b8966a' }}>
        → Manage Vacancies
        </Link>
      <div style={s.card}>
        <h3 style={s.cardTitle}>All Users ({users.length})</h3>
        <table style={s.table}>
          <thead>
            <tr>
              {['ID', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={s.td}>{u.id}</td>
                <td style={s.td}>{u.name}</td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: u.role === 'admin' ? '#e94560' : '#3498db' }}>
                    {u.role}
                  </span>
                </td>
                <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={s.td}>
                  {u.id !== user.id && (
                    <button style={s.delBtn} onClick={() => handleDelete(u.id, u.name)}>
                      Delete
                    </button>
                  )}
                  {u.id === user.id && <span style={s.you}>You</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



const s = {
  page: { maxWidth: '900px', margin: '40px auto', padding: '0 20px' },
  sub: { color: '#555', marginBottom: '28px' },
  card: { border: '1px solid #ddd', borderRadius: '8px', padding: '24px', overflowX: 'auto' },
  cardTitle: { marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #ddd', fontWeight: '600' },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee' },
  badge: { color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem' },
  delBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  you: { color: '#aaa', fontSize: '0.85rem' },
  error: { background: '#ffe0e0', color: '#c00', padding: '10px', borderRadius: '5px', marginBottom: '16px' },
  success: { background: '#e0ffe0', color: '#060', padding: '10px', borderRadius: '5px', marginBottom: '16px' },
};
