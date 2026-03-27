import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function AdminVacancy() {
  const { token } = useAuth();

  const [vacancies, setVacancies]       = useState([]);
  const [applications, setApplications] = useState([]);
  const [msg, setMsg]   = useState('');
  const [error, setError] = useState('');

  // Form state for creating a new vacancy
  const [form, setForm] = useState({
    title: '',
    type: 'Full-Time',
    description: '',
    requirements: '',   // admin types one requirement per line
    perks: '',          // admin types one perk per line
  });


  const handleStatus = async (appId, status, applicantName) => {
  if (!window.confirm(`Mark ${applicantName}'s application as ${status}?`)) return;
  try {
    await api.updateApplicationStatus(appId, status, token);
    setMsg(`Application marked as ${status}.`);
    load(); // refresh the list
  } catch (err) {
    setError(err.message);
  }
};

  const load = () => {
    api.getVacancies().then(setVacancies).catch(console.error);
    api.getApplications(token).then(setApplications).catch(console.error);
  };

  useEffect(() => { load(); }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');

    // Split the textarea lines into arrays before sending
    const body = {
      title:        form.title.trim(),
      type:         form.type,
      description:  form.description.trim(),
      requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
      perks:        form.perks.split('\n').map(s => s.trim()).filter(Boolean),
    };

    try {
      await api.createVacancy(body, token);
      setMsg('Vacancy created successfully.');
      setForm({ title: '', type: 'Full-Time', description: '', requirements: '', perks: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete vacancy "${title}"?`)) return;
    try {
      await api.deleteVacancy(id, token);
      setMsg(`Vacancy "${title}" deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={s.page}>
      <h2 style={s.heading}>Manage Vacancies</h2>

      {error && <div style={s.err}>{error}</div>}
      {msg   && <div style={s.ok}>{msg}</div>}

      {/* ── Add New Vacancy ───────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sub}>Post a New Vacancy</h3>
        <form onSubmit={handleCreate} style={s.form}>

          <label style={s.label}>Job Title</label>
          <input style={s.input} required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Senior Barber" />

          <label style={s.label}>Type</label>
          <select style={s.input} value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}>
            <option>Full-Time</option>
            <option>Part-Time</option>
            <option>Full-Time / Part-Time</option>
            <option>Contract</option>
          </select>

          <label style={s.label}>Description</label>
          <textarea style={s.textarea} rows={4} required value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the role…" />

          {/* One requirement per line — simpler than adding dynamic input fields */}
          <label style={s.label}>Requirements (one per line)</label>
          <textarea style={s.textarea} rows={4} required value={form.requirements}
            onChange={e => setForm({ ...form, requirements: e.target.value })}
            placeholder={"Minimum 3 years experience\nValid barbering certificate"} />

          <label style={s.label}>Perks / What We Offer (one per line)</label>
          <textarea style={s.textarea} rows={3} required value={form.perks}
            onChange={e => setForm({ ...form, perks: e.target.value })}
            placeholder={"Competitive salary\nFlexible hours"} />

          <button type="submit" style={s.btn}>Create Vacancy</button>
        </form>
      </section>

      {/* ── Current Vacancies ─────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sub}>Current Vacancies ({vacancies.length})</h3>
        {vacancies.length === 0
          ? <p style={s.empty}>No vacancies posted yet.</p>
          : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Title', 'Type', 'Posted', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vacancies.map(v => (
                  <tr key={v.id}>
                    <td style={s.td}>{v.title}</td>
                    <td style={s.td}>{v.type}</td>
                    <td style={s.td}>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td style={s.td}>
                      <button style={s.delBtn} onClick={() => handleDelete(v.id, v.title)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </section>

      {/* ── Applications ──────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sub}>Applications Received ({applications.length})</h3>
        {applications.length === 0
          ? <p style={s.empty}>No applications yet.</p>
          : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Applicant', 'Email', 'Position', 'Cover Note', 'CV', 'Status', 'Date', 'Actions'].map(h => (
                         <th key={h} style={s.th}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td style={s.td}>{app.name}</td>
                    <td style={s.td}>{app.email}</td>
                    <td style={s.td}>{app.vacancy_title}</td>
                    <td style={s.td}>
                      <span title={app.cover_note} style={s.notePreview}>
                        {app.cover_note ? app.cover_note.slice(0, 60) + (app.cover_note.length > 60 ? '…' : '') : '—'}
                      </span>

                    </td>
                    <td style={s.td}>
                      {app.cv_filename
                        ? <a href={`http://localhost:5000/uploads/cvs/${app.cv_filename}`}
                             target="_blank" rel="noreferrer" style={s.cvLink}>
                            Download CV
                          </a>
                        : '—'
                      }
                      </td>
                         <td style={s.td}>
                            {/* Color-coded status badge */}
                            <span style={{
                            ...s.badge,
                                background: app.status === 'accepted' ? '#2ecc71'
                                            : app.status === 'rejected' ? '#e94560'
                                            : '#f0a500'
                                }}>
                                {app.status}
                                </span>
                    </td>
                    <td style={s.td}>{new Date(app.submitted_at).toLocaleDateString()}</td>
                    <td style={s.td}>
                        {app.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={s.acceptBtn} onClick={() => handleStatus(app.id, 'accepted', app.name)}>
                                    Accept
                                </button>
                                <button style={s.rejectBtn} onClick={() => handleStatus(app.id, 'rejected', app.name)}>
                                    Reject
                                </button>
                            </div>
                        )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </section>
    </div>
  );
}

const s = {
  page: { maxWidth: '960px', margin: '40px auto', padding: '0 24px', fontFamily: 'Roboto, sans-serif' },
  heading: { fontSize: '1.8rem', marginBottom: '8px' },
  sub: { fontSize: '1.1rem', marginBottom: '16px', color: '#333' },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '28px', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '2px' },
  input: { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit' },
  textarea: { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' },
  btn: { background: '#0e0e0e', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', alignSelf: 'flex-start', marginTop: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #ddd', fontWeight: '600' },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee', verticalAlign: 'top' },
  delBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  cvLink: { color: '#b8966a', textDecoration: 'underline' },
  notePreview: { color: '#555', fontSize: '0.85rem' },
  empty: { color: '#aaa', fontStyle: 'italic' },
  err: { background: '#ffe0e0', color: '#c00', padding: '10px', borderRadius: '5px', marginBottom: '16px' },
  ok:  { background: '#e0ffe0', color: '#060', padding: '10px', borderRadius: '5px', marginBottom: '16px' },
  badge:     { color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem' },
  acceptBtn: { background: '#2ecc71', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  rejectBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
};