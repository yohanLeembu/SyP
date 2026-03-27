import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Roboto:wght@300;400;500&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Cormorant"]')) document.head.appendChild(fontLink);



const MAX_PORTFOLIO = 8;
const EMPTY_BARBER = { name: '', specialty: '', bio: '', image: null, experience: '', phone: '', email: '', availability_status: 'available' };
const EMPTY_VACANCY = { title: '', type: 'Full-time', description: '', requirements: '', perks: '' };

export default function BarberDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('vacancies');

  // ── Vacancy state ─────────────────────────────────────────────────────────
  const [vacancies, setVacancies]       = useState([]);
  const [vacForm, setVacForm]           = useState(EMPTY_VACANCY);
  const [editingVac, setEditingVac]     = useState(null);
  const [vacLoading, setVacLoading]     = useState(false);

  // ── Barber state ──────────────────────────────────────────────────────────
  const [barbers, setBarbers]           = useState([]);
  
  // Add State
  const [barberForm, setBarberForm]     = useState(EMPTY_BARBER);
  const [barberPreview, setBarberPreview] = useState(null);
  const [addPortfolioSlots, setAddPortfolioSlots] = useState([]);
  
  // Edit State
  const [editingBarber, setEditingBarber] = useState(null);
  const [editBarberForm, setEditBarberForm] = useState(EMPTY_BARBER);
  const [editBarberPreview, setEditBarberPreview] = useState(null);
  const [editPortfolioSlots, setEditPortfolioSlots] = useState([]);
  
  const [barberLoading, setBarberLoading] = useState(false);

  const addFileRef = useRef(null);
  const editFileRef = useRef(null);

  // ── Messages ──────────────────────────────────────────────────────────────
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setError(''); }
    else    { setError(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadVacancies = async () => {
    try { setVacancies(await api.getVacancies()); }
    catch { setVacancies([]); }
  };

  const loadBarbers = async () => {
    try { setBarbers(await api.getBarbers()); }
    catch { setBarbers([]); }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadVacancies();
    loadBarbers();
  }, [user, navigate]);

  // ── Vacancy CRUD ──────────────────────────────────────────────────────────
  const handleVacSubmit = async (e) => {
    e.preventDefault();
    setVacLoading(true);
    try {
      const body = {
        ...vacForm,
        requirements: vacForm.requirements.split('\n').filter(Boolean),
        perks: vacForm.perks.split('\n').filter(Boolean),
      };

      if (editingVac) {
        await api.updateVacancy(editingVac.id, body, token);
        flash(true, `Vacancy "${vacForm.title}" updated.`);
        setEditingVac(null);
      } else {
        await api.createVacancy(body, token);
        flash(true, `Vacancy "${vacForm.title}" created.`);
      }
      setVacForm(EMPTY_VACANCY);
      loadVacancies();
    } catch (err) {
      flash(false, err.message || 'Failed to save vacancy.');
    } finally {
      setVacLoading(false);
    }
  };

  const editVacancy = (v) => {
    setEditingVac(v);
    setVacForm({
      title: v.title,
      type: v.type,
      description: v.description,
      requirements: Array.isArray(v.requirements) ? v.requirements.join('\n') : v.requirements,
      perks: Array.isArray(v.perks) ? v.perks.join('\n') : v.perks,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteVacancy = async (v) => {
    if (!window.confirm(`Delete vacancy "${v.title}"?`)) return;
    try {
      await api.deleteVacancy(v.id, token);
      flash(true, `Vacancy "${v.title}" deleted.`);
      loadVacancies();
    } catch (err) {
      flash(false, err.message);
    }
  };

  // ── Barber CRUD ───────────────────────────────────────────────────────────
  const handleImageChange = (file, setPreview, setForm, form) => {
    if (!file) return;
    setForm({ ...form, image: file });
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const buildFormData = (form, portfolioSlots = []) => {
    const fd = new FormData();
    fd.append('name',      form.name.trim());
    fd.append('specialty', form.specialty.trim());
    fd.append('bio',       form.bio.trim());
    if (form.image) fd.append('image', form.image);
    if (form.experience !== '' && form.experience !== null && form.experience !== undefined) fd.append('experience', form.experience);
    if (form.phone) fd.append('phone', form.phone.trim());
    if (form.email) fd.append('email', form.email.trim());
    fd.append('availability_status', form.availability_status || 'available');

    // Portfolio: new files + existing URLs to keep, in display order
    portfolioSlots.forEach((slot) => {
      if (slot.file) {
        fd.append('portfolio_images', slot.file);
      } else if (slot.src) {
        fd.append('portfolio_keep_urls', slot.src);
      }
    });

    return fd;
  };

  const handleAddBarber = async (e) => {
    e.preventDefault();
    if (!barberForm.name.trim()) return flash(false, 'Barber name is required.');
    setBarberLoading(true);
    try {
      await api.createBarber(buildFormData(barberForm, addPortfolioSlots), token);
      flash(true, `Barber "${barberForm.name}" added.`);
      setBarberForm(EMPTY_BARBER);
      setBarberPreview(null);
      setAddPortfolioSlots([]);
      if (addFileRef.current) addFileRef.current.value = '';
      loadBarbers();
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBarberLoading(false);
    }
  };

  const openEditBarber = (b) => {
    setEditingBarber(b);
    setEditBarberForm({ name: b.name, specialty: b.specialty || '', bio: b.bio || '', image: null, experience: b.experience ?? '', phone: b.phone || '', email: b.email || '', availability_status: b.availability_status || 'available' });
    setEditBarberPreview(b.image_url || null);
    
    // Populate existing portfolio images
    const existingSlots = Array.isArray(b.portfolio_images)
      ? b.portfolio_images.map(url => ({ src: url, file: null }))
      : [];
    setEditPortfolioSlots(existingSlots);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditBarber = async (e) => {
    e.preventDefault();
    if (!editBarberForm.name.trim()) return flash(false, 'Barber name is required.');
    setBarberLoading(true);
    const fd = buildFormData(editBarberForm, editPortfolioSlots);
    fd.append('active', 1);
    try {
      await api.updateBarber(editingBarber.id, fd, token);
      flash(true, `Barber "${editBarberForm.name}" updated.`);
      setEditingBarber(null);
      setEditBarberPreview(null);
      setEditPortfolioSlots([]);
      loadBarbers();
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBarberLoading(false);
    }
  };

  const deactivateBarber = async (b) => {
    if (!window.confirm(`Deactivate "${b.name}"?`)) return;
    try {
      await api.deleteBarber(b.id, token);
      flash(true, `"${b.name}" deactivated.`);
      loadBarbers();
    } catch (err) {
      flash(false, err.message);
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────
  const ImagePicker = ({ preview, fileRef, onChange }) => (
    <div style={s.imagePicker}>
      <div style={s.previewBox}>
        {preview
          ? <img src={preview} alt="Preview" style={s.previewImg} />
          : <span style={s.previewPlaceholder}>No image</span>
        }
      </div>
      <div>
        <input type="file" accept=".jpg,.jpeg,.png,.webp" ref={fileRef} style={{ display: 'none' }} onChange={e => onChange(e.target.files[0])} />
        <button type="button" style={s.uploadBtn} onClick={() => fileRef.current.click()}>
          {preview ? 'Change Photo' : 'Choose Photo'}
        </button>
        <p style={s.uploadHint}>JPG, PNG or WEBP · max 4 MB</p>
      </div>
    </div>
  );

  const PortfolioPicker = ({ slots, onChange }) => {
    const inputRef = useRef(null);

    const handleFiles = (files) => {
      const incoming = Array.from(files).slice(0, MAX_PORTFOLIO - slots.length);
      if (incoming.length === 0) return;
      const readers = incoming.map(
        file =>
          new Promise(resolve => {
            const r = new FileReader();
            r.onload = e => resolve({ src: e.target.result, file });
            r.readAsDataURL(file);
          })
      );
      Promise.all(readers).then(newSlots => onChange([...slots, ...newSlots]));
    };

    const removeSlot = (idx) => {
      const next = slots.filter((_, i) => i !== idx);
      onChange(next);
    };

    const moveSlot = (from, to) => {
      if (to < 0 || to >= slots.length) return;
      const next = [...slots];
      [next[from], next[to]] = [next[to], next[from]];
      onChange(next);
    };

    const remaining = MAX_PORTFOLIO - slots.length;

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={s.label}>
            Portfolio / Evidence
            <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              {' '}— max {MAX_PORTFOLIO} images
            </span>
          </label>
          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
            {slots.length}/{MAX_PORTFOLIO} uploaded
          </span>
        </div>

        <div style={s.portfolioGrid}>
          {slots.map((slot, idx) => (
            <div key={idx} style={s.portfolioThumb}>
              <img src={slot.src} alt={`Evidence ${idx + 1}`} style={s.portfolioImg} />
              <span style={s.portfolioBadge}>{idx + 1}</span>
              <div style={s.portfolioOverlay}>
                <button type="button" title="Move left" style={s.portfolioCtrlBtn} disabled={idx === 0} onClick={() => moveSlot(idx, idx - 1)}>←</button>
                <button type="button" title="Remove" style={{ ...s.portfolioCtrlBtn, background: '#d44' }} onClick={() => removeSlot(idx)}>✕</button>
                <button type="button" title="Move right" style={s.portfolioCtrlBtn} disabled={idx === slots.length - 1} onClick={() => moveSlot(idx, idx + 1)}>→</button>
              </div>
              {slot.file && <span style={s.newBadge}>NEW</span>}
            </div>
          ))}

          {remaining > 0 && (
            <button type="button" style={s.portfolioAddSlot} onClick={() => inputRef.current.click()}>
              <span style={{ fontSize: '1.8rem', color: '#ccc', lineHeight: 1 }}>+</span>
              <span style={{ fontSize: '0.72rem', color: '#bbb', marginTop: 4 }}>Add photo</span>
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
        <p style={s.uploadHint}>JPG, PNG or WEBP · max 4 MB each · use ← → to reorder</p>
      </div>
    );
  };

  return (
    <div style={s.page}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <p style={s.eyebrow}>Barber Dashboard</p>
        <h1 style={s.pageTitle}>
          {user ? `Welcome, ${user.name.split(' ')[0]}.` : 'Dashboard'}
        </h1>
        <div style={s.divider} />
      </div>

      {error && <div style={s.alertError}>{error}</div>}
      {msg   && <div style={s.alertOk}>{msg}</div>}

      <div style={s.content}>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div style={s.sidebar}>
          <div style={s.profileCard}>
            <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <p style={s.profileName}>{user?.name}</p>
            <p style={s.profileEmail}>{user?.email}</p>
            <div style={s.profileMeta}>
              <span style={s.roleBadge}>barber</span>
            </div>
          </div>

          <div style={s.statCard}>
            <p style={s.statNum}>{vacancies.length}</p>
            <p style={s.statLabel}>Active Vacancies</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statNum}>{barbers.length}</p>
            <p style={s.statLabel}>Active Barbers</p>
          </div>

          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/'); }}>
            Sign Out
          </button>
        </div>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <div style={s.main}>

          <div style={s.tabRow}>
            <button style={{ ...s.tab, ...(tab === 'vacancies' ? s.tabActive : {}) }} onClick={() => setTab('vacancies')}>Vacancies</button>
            <button style={{ ...s.tab, ...(tab === 'barbers' ? s.tabActive : {}) }} onClick={() => setTab('barbers')}>Manage Barbers</button>
          </div>

          {/* ═══════════════════ VACANCIES TAB ═══════════════════════════ */}
          {tab === 'vacancies' && (
             <>
             {/* Vacancy form */}
             <div style={s.formCard}>
               <div style={s.formCardHeader}>
                 <h3 style={s.formCardTitle}>
                   {editingVac ? `Editing: ${editingVac.title}` : 'Create New Vacancy'}
                 </h3>
                 {editingVac && (
                   <button style={s.cancelEditBtn} onClick={() => { setEditingVac(null); setVacForm(EMPTY_VACANCY); }}>
                     Cancel
                   </button>
                 )}
               </div>

               <form onSubmit={handleVacSubmit} style={s.form}>
                 <div style={s.fieldRow}>
                   <div style={s.fieldHalf}>
                     <label style={s.label}>Position Title *</label>
                     <input style={s.input} required value={vacForm.title}
                       onChange={e => setVacForm({ ...vacForm, title: e.target.value })}
                       placeholder="e.g. Senior Barber" />
                   </div>
                   <div style={s.fieldHalf}>
                     <label style={s.label}>Type</label>
                     <select style={{ ...s.input, cursor: 'pointer' }} value={vacForm.type}
                       onChange={e => setVacForm({ ...vacForm, type: e.target.value })}>
                       <option>Full-time</option>
                       <option>Part-time</option>
                       <option>Contract</option>
                       <option>Internship</option>
                     </select>
                   </div>
                 </div>

                 <label style={s.label}>Description *</label>
                 <textarea style={s.textarea} rows={3} required value={vacForm.description}
                   onChange={e => setVacForm({ ...vacForm, description: e.target.value })}
                   placeholder="Describe the role, responsibilities, and expectations…" />

                 <div style={s.fieldRow}>
                   <div style={s.fieldHalf}>
                     <label style={s.label}>Requirements (one per line) *</label>
                     <textarea style={s.textarea} rows={3} required value={vacForm.requirements}
                       onChange={e => setVacForm({ ...vacForm, requirements: e.target.value })}
                       placeholder={"2+ years experience\nCustomer service skills\nPortfolio preferred"} />
                   </div>
                   <div style={s.fieldHalf}>
                     <label style={s.label}>Perks (one per line) *</label>
                     <textarea style={s.textarea} rows={3} required value={vacForm.perks}
                       onChange={e => setVacForm({ ...vacForm, perks: e.target.value })}
                       placeholder={"Competitive salary\nFlexible hours\nFree grooming products"} />
                   </div>
                 </div>

                 <button type="submit" style={s.primaryBtn} disabled={vacLoading}>
                   {vacLoading ? 'Saving…' : editingVac ? 'Update Vacancy' : 'Create Vacancy'}
                 </button>
               </form>
             </div>

             {/* Vacancy list */}
             <div style={s.listSection}>
               <h3 style={s.listTitle}>Active Vacancies ({vacancies.length})</h3>

               {vacancies.length === 0 ? (
                 <p style={s.emptyText}>No vacancies posted yet.</p>
               ) : (
                 vacancies.map(v => (
                   <div key={v.id} style={s.vacCard}>
                     <div style={s.vacCardHeader}>
                       <div>
                         <p style={s.vacTitle}>{v.title}</p>
                         <span style={s.vacType}>{v.type}</span>
                       </div>
                       <div style={s.vacActions}>
                         <button style={s.editBtn} onClick={() => editVacancy(v)}>Edit</button>
                         <button style={s.deleteBtn} onClick={() => deleteVacancy(v)}>Delete</button>
                       </div>
                     </div>
                     <p style={s.vacDesc}>{v.description}</p>
                     <div style={s.vacDetails}>
                       <div>
                         <p style={s.vacDetailLabel}>Requirements</p>
                         <ul style={s.vacList}>
                           {(Array.isArray(v.requirements) ? v.requirements : []).map((r, i) => (
                             <li key={i} style={s.vacListItem}>{r}</li>
                           ))}
                         </ul>
                       </div>
                       <div>
                         <p style={s.vacDetailLabel}>Perks</p>
                         <ul style={s.vacList}>
                           {(Array.isArray(v.perks) ? v.perks : []).map((p, i) => (
                             <li key={i} style={s.vacListItem}>{p}</li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </>
          )}

          {/* ═══════════════════ BARBERS TAB ════════════════════════════ */}
          {tab === 'barbers' && (
            <>
              {/* Edit barber form */}
              {editingBarber && (
                <div style={{ ...s.formCard, borderLeft: `3px solid ${GOLD}` }}>
                  <div style={s.formCardHeader}>
                    <h3 style={s.formCardTitle}>Editing: {editingBarber.name}</h3>
                    <button style={s.cancelEditBtn} onClick={() => { setEditingBarber(null); setEditBarberPreview(null); setEditPortfolioSlots([]); }}>
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleEditBarber} style={s.form}>
                    <ImagePicker preview={editBarberPreview} fileRef={editFileRef} onChange={file => handleImageChange(file, setEditBarberPreview, setEditBarberForm, editBarberForm)} />
                    
                    <div style={s.fieldRow}>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Full Name *</label>
                        <input style={s.input} required value={editBarberForm.name} onChange={e => setEditBarberForm({ ...editBarberForm, name: e.target.value })} placeholder="e.g. James Osei" />
                      </div>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Specialty</label>
                        <input style={s.input} value={editBarberForm.specialty} onChange={e => setEditBarberForm({ ...editBarberForm, specialty: e.target.value })} placeholder="e.g. Classic cuts & beard styling" />
                      </div>
                    </div>
                    
                    <label style={s.label}>Bio</label>
                    <textarea style={s.textarea} rows={3} value={editBarberForm.bio} onChange={e => setEditBarberForm({ ...editBarberForm, bio: e.target.value })} placeholder="A short description…" />
                    
                    <div style={s.fieldRow}>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Phone</label>
                        <input style={s.input} value={editBarberForm.phone} onChange={e => setEditBarberForm({ ...editBarberForm, phone: e.target.value })} placeholder="e.g. +977-9800000000" />
                      </div>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Email</label>
                        <input style={s.input} type="email" value={editBarberForm.email} onChange={e => setEditBarberForm({ ...editBarberForm, email: e.target.value })} placeholder="e.g. barber@trimura.com" />
                      </div>
                    </div>

                    <div style={s.fieldRow}>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Experience (years)</label>
                        <input style={s.input} type="number" min="0" value={editBarberForm.experience} onChange={e => setEditBarberForm({ ...editBarberForm, experience: e.target.value })} placeholder="e.g. 5" />
                      </div>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Availability</label>
                        <select style={{ ...s.input, cursor: 'pointer' }} value={editBarberForm.availability_status} onChange={e => setEditBarberForm({ ...editBarberForm, availability_status: e.target.value })}>
                          <option value="available">Available</option>
                          <option value="on_leave">On Leave</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                    </div>
                    
                    <PortfolioPicker slots={editPortfolioSlots} onChange={setEditPortfolioSlots} />
                    
                    <button type="submit" style={s.primaryBtn} disabled={barberLoading}>
                      {barberLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Add barber form */}
              <div style={s.formCard}>
                <h3 style={s.formCardTitle}>Add New Barber</h3>
                <form onSubmit={handleAddBarber} style={s.form}>
                  <ImagePicker preview={barberPreview} fileRef={addFileRef} onChange={file => handleImageChange(file, setBarberPreview, setBarberForm, barberForm)} />
                  
                  <div style={s.fieldRow}>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Full Name *</label>
                      <input style={s.input} required value={barberForm.name} onChange={e => setBarberForm({ ...barberForm, name: e.target.value })} placeholder="e.g. James Osei" />
                    </div>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Specialty</label>
                      <input style={s.input} value={barberForm.specialty} onChange={e => setBarberForm({ ...barberForm, specialty: e.target.value })} placeholder="e.g. Classic cuts & beard styling" />
                    </div>
                  </div>
                  
                  <label style={s.label}>Bio</label>
                  <textarea style={s.textarea} rows={3} value={barberForm.bio} onChange={e => setBarberForm({ ...barberForm, bio: e.target.value })} placeholder="A short description…" />

                  <div style={s.fieldRow}>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Phone</label>
                      <input style={s.input} value={barberForm.phone} onChange={e => setBarberForm({ ...barberForm, phone: e.target.value })} placeholder="e.g. +977-9800000000" />
                    </div>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Email</label>
                      <input style={s.input} type="email" value={barberForm.email} onChange={e => setBarberForm({ ...barberForm, email: e.target.value })} placeholder="e.g. barber@trimura.com" />
                    </div>
                  </div>

                  <div style={s.fieldRow}>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Experience (years)</label>
                      <input style={s.input} type="number" min="0" value={barberForm.experience} onChange={e => setBarberForm({ ...barberForm, experience: e.target.value })} placeholder="e.g. 5" />
                    </div>
                    <div style={s.fieldHalf}>
                      <label style={s.label}>Availability</label>
                      <select style={{ ...s.input, cursor: 'pointer' }} value={barberForm.availability_status} onChange={e => setBarberForm({ ...barberForm, availability_status: e.target.value })}>
                        <option value="available">Available</option>
                        <option value="on_leave">On Leave</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                  
                  <PortfolioPicker slots={addPortfolioSlots} onChange={setAddPortfolioSlots} />
                  
                  <button type="submit" style={s.primaryBtn} disabled={barberLoading}>
                    {barberLoading ? 'Adding…' : 'Add Barber'}
                  </button>
                </form>
              </div>

              {/* Barber list */}
              <div style={s.listSection}>
                <h3 style={s.listTitle}>Current Barbers ({barbers.length})</h3>

                {barbers.length === 0 ? (
                  <p style={s.emptyText}>No barbers added yet.</p>
                ) : (
                  barbers.map(b => (
                    <div key={b.id} style={s.barberCard}>
                      <div style={s.barberInfo}>
                        {b.image_url
                          ? <img src={b.image_url} alt={b.name} style={s.barberThumb} />
                          : <div style={s.barberNoPhoto}>{b.name?.[0]?.toUpperCase()}</div>
                        }
                        <div>
                          <p style={s.barberName}>{b.name}</p>
                          <p style={s.barberSpec}>{b.specialty || 'No specialty listed'}</p>
                          {b.bio && <p style={s.barberBio}>{b.bio.length > 90 ? b.bio.slice(0, 90) + '…' : b.bio}</p>}
                        </div>
                      </div>
                      <div style={s.barberActions}>
                        <button style={s.editBtn} onClick={() => openEditBarber(b)}>Edit</button>
                        <button style={s.deleteBtn} onClick={() => deactivateBarber(b)}>Deactivate</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
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

  alertError: { maxWidth: '1200px', margin: '0 auto 16px', padding: '12px 24px', background: '#fff0f0', color: '#8b2020', fontFamily: SANS, fontSize: '0.88rem', borderLeft: `3px solid #8b2020`, fontWeight: '300' },
  alertOk:    { maxWidth: '1200px', margin: '0 auto 16px', padding: '12px 24px', background: '#f0fff4', color: '#2a6b3c', fontFamily: SANS, fontSize: '0.88rem', borderLeft: `3px solid #2a6b3c`, fontWeight: '300' },

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

  logoutBtn: { background: 'transparent', border: '1px solid #ddd8d0', color: '#aaa', fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px', cursor: 'pointer', marginTop: '8px', fontWeight: '400' },

  /* Main */
  main: { minWidth: 0 },
  tabRow: { display: 'flex', gap: '0', borderBottom: '1px solid #ddd8d0', marginBottom: '32px' },
  tab: { fontFamily: SANS, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#aaa', background: 'none', border: 'none', padding: '12px 24px 12px 0', cursor: 'pointer', fontWeight: '400' },
  tabActive: { color: INK, borderBottom: `2px solid ${GOLD}`, marginBottom: '-1px' },

  /* Form cards */
  formCard: { background: '#fff', padding: '32px', marginBottom: '24px', borderTop: `1px solid #ede8e0` },
  formCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  formCardTitle: { fontFamily: SERIF, fontSize: '1.3rem', fontWeight: '300', color: INK, margin: 0 },
  cancelEditBtn: { fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: `1px solid #d44`, color: '#d44', padding: '6px 16px', cursor: 'pointer' },

  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  fieldHalf: { display: 'flex', flexDirection: 'column', gap: '8px' },

  label: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', fontWeight: '400' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd8d0', background: 'transparent', fontSize: '0.95rem', fontFamily: SANS, color: INK, outline: 'none', boxSizing: 'border-box', fontWeight: '300' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid #ddd8d0', background: 'transparent', fontSize: '0.95rem', fontFamily: SANS, color: INK, outline: 'none', boxSizing: 'border-box', fontWeight: '300', resize: 'vertical' },

  primaryBtn: { alignSelf: 'flex-start', padding: '14px 36px', background: INK, color: '#fff', border: 'none', fontFamily: SANS, fontSize: '0.82rem', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: '400', marginTop: '4px' },

  /* Image picker */
  imagePicker: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px' },
  previewBox: { width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#f5f5f5', border: `2px solid #ede8e0`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  previewPlaceholder: { fontSize: '0.65rem', color: '#ccc', textAlign: 'center', padding: '6px' },
  uploadBtn: { background: INK, color: '#fff', border: 'none', padding: '8px 18px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: SANS, letterSpacing: '0.1em' },
  uploadHint: { fontSize: '0.7rem', color: '#bbb', marginTop: '6px' },

  /* Portfolio Picker specific styles */
  portfolioGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' },
  portfolioThumb: { position: 'relative', width: '90px', height: '115px', background: INK, overflow: 'hidden', flexShrink: 0 },
  portfolioImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(0.4)' },
  portfolioBadge: { position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6rem', fontWeight: '700', padding: '2px 6px', borderRadius: '2px' },
  portfolioOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.72)', padding: '5px 4px' },
  portfolioCtrlBtn: { background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: '2px', padding: '3px 7px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', lineHeight: 1 },
  newBadge: { position: 'absolute', top: '5px', right: '5px', background: GOLD, color: '#fff', fontSize: '0.55rem', fontWeight: '700', padding: '2px 5px', borderRadius: '2px' },
  portfolioAddSlot: { width: '90px', height: '115px', border: `2px dashed #ddd8d0`, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  /* Vacancy cards */
  listSection: { marginTop: '8px' },
  listTitle: { fontFamily: SERIF, fontSize: '1.3rem', fontWeight: '300', color: INK, marginBottom: '20px' },
  emptyText: { fontFamily: SERIF, fontSize: '1.1rem', fontWeight: '300', fontStyle: 'italic', color: '#bbb', padding: '40px 0' },

  vacCard: { background: '#fff', padding: '28px 32px', marginBottom: '12px', borderLeft: `3px solid ${GOLD}`, borderTop: '1px solid #f0ece6' },
  vacCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  vacTitle: { fontFamily: SERIF, fontSize: '1.3rem', fontWeight: '300', color: INK, margin: '0 0 6px' },
  vacType: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`, padding: '2px 8px' },
  vacDesc: { fontFamily: SANS, fontSize: '0.92rem', color: '#666', lineHeight: '1.7', fontWeight: '300', marginBottom: '16px' },
  vacDetails: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingTop: '16px', borderTop: '1px solid #f0ece6' },
  vacDetailLabel: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#bbb', marginBottom: '8px', fontWeight: '400' },
  vacList: { margin: 0, paddingLeft: '18px' },
  vacListItem: { fontFamily: SANS, fontSize: '0.88rem', color: '#666', lineHeight: '1.8', fontWeight: '300' },
  vacActions: { display: 'flex', gap: '8px', flexShrink: 0 },

  /* Barber cards */
  barberCard: { background: '#fff', padding: '24px 32px', marginBottom: '12px', borderTop: '1px solid #f0ece6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  barberInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  barberThumb: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  barberNoPhoto: { width: '56px', height: '56px', borderRadius: '50%', background: GOLD, color: '#fff', fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  barberName: { fontFamily: SERIF, fontSize: '1.2rem', fontWeight: '300', color: INK, margin: '0 0 2px' },
  barberSpec: { fontFamily: SANS, fontSize: '0.82rem', color: GOLD, fontWeight: '300', margin: '0 0 4px' },
  barberBio: { fontFamily: SANS, fontSize: '0.82rem', color: '#aaa', fontWeight: '300', margin: 0, maxWidth: '400px' },
  barberActions: { display: 'flex', gap: '8px', flexShrink: 0 },

  /* Shared buttons */
  editBtn: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, padding: '6px 16px', cursor: 'pointer', fontWeight: '400' },
  deleteBtn: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #d44', color: '#d44', padding: '6px 16px', cursor: 'pointer', fontWeight: '400' },
};