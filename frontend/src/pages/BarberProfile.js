import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const MAX_PORTFOLIO = 8;

const EMPTY = {
  name:                '',
  specialty:           '',
  bio:                 '',
  image:               null,
  experience:          '',
  availability_status: 'available',
  phone:               '',
  email:               '',
  portfolio_images:    [],   // new – up to 8 File objects (or kept URLs for existing)
};

const AVAILABILITY_OPTIONS = [
  { value: 'available',   label: 'Available' },
  { value: 'on_leave',    label: 'On Leave' },
  { value: 'unavailable', label: 'Unavailable' },
];

/* ─── Portrait picker ─────────────────────────────────────────────────────── */
function ImagePicker({ preview, fileRef, onChange }) {
  return (
    <div style={s.imagePicker}>
      <div style={s.previewBox}>
        {preview
          ? <img src={preview} alt="Preview" style={s.previewImg} />
          : <span style={s.previewPlaceholder}>No image selected</span>
        }
      </div>
      <div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={e => onChange(e.target.files[0])}
        />
        <button type="button" style={s.uploadBtn} onClick={() => fileRef.current.click()}>
          {preview ? 'Change Photo' : 'Choose Photo'}
        </button>
        <p style={s.uploadHint}>JPG, PNG or WEBP · max 4 MB</p>
      </div>
    </div>
  );
}

/* ─── Portfolio / Evidence picker ─────────────────────────────────────────── */
/**
 * Manages up to MAX_PORTFOLIO evidence photos.
 *
 * `slots` is an array of { src: string (data-URL or existing URL), file: File|null }.
 * Existing saved URLs come in as { src: url, file: null }.
 * New uploads come in as { src: dataURL, file: File }.
 *
 * When the parent saves, it sends:
 *   – slot.file (File) → appended as 'portfolio_images' multipart entries
 *   – slot.file===null && slot.src → kept URL, appended as 'portfolio_keep_urls'
 */
function PortfolioPicker({ slots, onChange }) {
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
    <div>
      {/* Instruction strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={s.label}>
          Portfolio / Evidence photos
          <span style={{ color: '#888', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {' '}— shown in the "EVIDENCE" grid on the public profile (max {MAX_PORTFOLIO})
          </span>
        </span>
        <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
          {slots.length}/{MAX_PORTFOLIO} uploaded
        </span>
      </div>

      {/* Thumbnails grid */}
      <div style={s.portfolioGrid}>
        {slots.map((slot, idx) => (
          <div key={idx} style={s.portfolioThumb}>
            <img src={slot.src} alt={`Evidence ${idx + 1}`} style={s.portfolioImg} />

            {/* Order badge */}
            <span style={s.portfolioBadge}>{idx + 1}</span>

            {/* Controls overlay */}
            <div style={s.portfolioOverlay}>
              <button type="button" title="Move left"
                style={s.portfolioCtrlBtn}
                disabled={idx === 0}
                onClick={() => moveSlot(idx, idx - 1)}>←</button>
              <button type="button" title="Remove"
                style={{ ...s.portfolioCtrlBtn, background: '#e94560' }}
                onClick={() => removeSlot(idx)}>✕</button>
              <button type="button" title="Move right"
                style={s.portfolioCtrlBtn}
                disabled={idx === slots.length - 1}
                onClick={() => moveSlot(idx, idx + 1)}>→</button>
            </div>

            {/* New-file indicator */}
            {slot.file && (
              <span style={s.newBadge}>NEW</span>
            )}
          </div>
        ))}

        {/* Add slot */}
        {remaining > 0 && (
          <button type="button" style={s.portfolioAddSlot}
            onClick={() => inputRef.current.click()}>
            <span style={{ fontSize: '1.8rem', color: '#ccc', lineHeight: 1 }}>+</span>
            <span style={{ fontSize: '0.72rem', color: '#bbb', marginTop: 4 }}>
              Add photo<br />({remaining} left)
            </span>
          </button>
        )}
      </div>

      {/* Hidden multi-file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      <p style={s.uploadHint}>
        JPG, PNG or WEBP · max 4 MB each · use ← → buttons to reorder · first photo appears top-left in the grid
      </p>
    </div>
  );
}

/* ─── All barber fields (shared by Add + Edit) ────────────────────────────── */
function BarberFields({ form, setForm, preview, fileRef, onImageChange, portfolioSlots, onPortfolioChange }) {
  return (
    <>
      {/* ── Portrait ────────────────────────────────────────────────────── */}
      <p style={s.sectionLabel}>PORTRAIT PHOTO</p>
      <ImagePicker preview={preview} fileRef={fileRef} onChange={onImageChange} />

      {/* ── Core info ───────────────────────────────────────────────────── */}
      <p style={s.sectionLabel}>BASIC INFO</p>
      <div style={s.row}>
        <div style={s.col}>
          <label style={s.label}>Full Name <span style={{ color: '#e94560' }}>*</span></label>
          <input style={s.input} required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Elias Trimura" />
        </div>
        <div style={s.col}>
          <label style={s.label}>Years of Experience</label>
          <input style={s.input} type="number" min="0" max="50" value={form.experience}
            onChange={e => setForm({ ...form, experience: e.target.value })}
            placeholder="e.g. 15" />
        </div>
      </div>

      <div style={s.row}>
        <div style={s.col}>
          <label style={s.label}>Availability Status</label>
          <select style={s.input} value={form.availability_status}
            onChange={e => setForm({ ...form, availability_status: e.target.value })}>
            {AVAILABILITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={s.col}>
          <label style={s.label}>Phone Number</label>
          <input style={s.input} type="tel" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. +977 9800000000" />
        </div>
      </div>

      <div style={s.col}>
        <label style={s.label}>Email Address</label>
        <input style={s.input} type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="e.g. elias@barbernoir.com" />
      </div>

      {/* ── Specialties ─────────────────────────────────────────────────── */}
      <p style={{ ...s.sectionLabel, marginTop: 8 }}>SPECIALTIES</p>
      <div style={s.col}>
        <label style={s.label}>
          Specialties
          <span style={{ color: '#888', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {' '}— separate with commas or &amp;, each becomes a card on the profile
          </span>
        </label>
        <input style={s.input} value={form.specialty}
          onChange={e => setForm({ ...form, specialty: e.target.value })}
          placeholder="e.g. The Blunt Fade, Beard Architecture, Razor Lineage, Texture Sculpt" />
        {/* Live preview of specialty cards */}
        {form.specialty.trim() && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {form.specialty.split(/[,&]/).map(sk => sk.trim()).filter(Boolean).map((sk, i) => (
              <span key={i} style={s.specialtyPreviewChip}>{sk}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bio / Manifesto ─────────────────────────────────────────────── */}
      <p style={{ ...s.sectionLabel, marginTop: 8 }}>BIO / MANIFESTO</p>
      <div style={s.col}>
        <label style={s.label}>
          Bio
          <span style={{ color: '#888', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {' '}— shown as "THE MANIFESTO" block and as the hero quote (first 140 chars)
          </span>
        </label>
        <textarea style={s.textarea} rows={5} value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder='e.g. Born in the backstreets, refined in the high-stakes grooming scene of London. Elias does not follow trends — he burns them down and builds something permanent from the ashes.' />
        {form.bio.length > 0 && (
          <p style={{ fontSize: '0.72rem', color: form.bio.length > 140 ? '#e94560' : '#aaa', marginTop: 4 }}>
            Hero quote preview ({form.bio.length} chars — first 140 shown):
            <em style={{ display: 'block', marginTop: 3, color: '#555', fontStyle: 'italic' }}>
              "{form.bio.slice(0, 140)}{form.bio.length > 140 ? '…' : ''}"
            </em>
          </p>
        )}
      </div>

      {/* ── Portfolio / Evidence ─────────────────────────────────────────── */}
      <p style={{ ...s.sectionLabel, marginTop: 8 }}>EVIDENCE (PORTFOLIO)</p>
      <PortfolioPicker slots={portfolioSlots} onChange={onPortfolioChange} />
    </>
  );
}

/* ─── Main AdminBarbers page ─────────────────────────────────────────────── */
export default function AdminBarbers() {
  const { token } = useAuth();

  const [barbers,  setBarbers]  = useState([]);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [addForm,           setAddForm]           = useState(EMPTY);
  const [addPreview,        setAddPreview]        = useState(null);
  const [addPortfolioSlots, setAddPortfolioSlots] = useState([]);

  const [editTarget,         setEditTarget]         = useState(null);
  const [editForm,           setEditForm]           = useState(EMPTY);
  const [editPreview,        setEditPreview]        = useState(null);
  const [editPortfolioSlots, setEditPortfolioSlots] = useState([]);

  const addFileRef  = useRef(null);
  const editFileRef = useRef(null);

  const load = () => {
    api.getBarbers()
      .then(setBarbers)
      .catch(err => setError(err.message));
  };

  useEffect(() => { load(); }, []);

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setError(''); }
    else     { setError(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const handleImageChange = (file, setPreview, setForm, form) => {
    if (!file) return;
    setForm({ ...form, image: file });
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  /**
   * Build FormData including:
   *   – standard barber fields
   *   – portfolio_images   : new File entries
   *   – portfolio_keep_urls: existing saved URLs to retain (server removes the rest)
   */
  const buildFormData = (form, portfolioSlots) => {
    const fd = new FormData();
    fd.append('name',                form.name.trim());
    fd.append('specialty',           form.specialty.trim());
    fd.append('bio',                 form.bio.trim());
    fd.append('experience',          form.experience === '' ? '' : Number(form.experience));
    fd.append('availability_status', form.availability_status);
    fd.append('phone',               form.phone.trim());
    fd.append('email',               form.email.trim());
    if (form.image) fd.append('image', form.image);

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

  /* ── Add ────────────────────────────────────────────────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return flash(false, 'Name is required.');
    setLoading(true);
    try {
      await api.createBarber(buildFormData(addForm, addPortfolioSlots), token);
      flash(true, `Barber "${addForm.name}" added successfully.`);
      setAddForm(EMPTY);
      setAddPreview(null);
      setAddPortfolioSlots([]);
      if (addFileRef.current) addFileRef.current.value = '';
      load();
    } catch (err) {
      flash(false, err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Edit ───────────────────────────────────────────────────────────────── */
  const openEdit = (barber) => {
    setEditTarget(barber);
    setEditForm({
      name:                barber.name                || '',
      specialty:           barber.specialty           || '',
      bio:                 barber.bio                 || '',
      image:               null,
      experience:          barber.experience          ?? '',
      availability_status: barber.availability_status || 'available',
      phone:               barber.phone               || '',
      email:               barber.email               || '',
      portfolio_images:    [],
    });
    setEditPreview(barber.image_url || null);

    // Populate existing portfolio images as { src: url, file: null }
    const existingSlots = Array.isArray(barber.portfolio_images)
      ? barber.portfolio_images.map(url => ({ src: url, file: null }))
      : [];
    setEditPortfolioSlots(existingSlots);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return flash(false, 'Name is required.');
    setLoading(true);
    const fd = buildFormData(editForm, editPortfolioSlots);
    fd.append('active', 1);
    try {
      await api.updateBarber(editTarget.id, fd, token);
      flash(true, `Barber "${editForm.name}" updated.`);
      setEditTarget(null);
      setEditPreview(null);
      setEditPortfolioSlots([]);
      load();
    } catch (err) {
      flash(false, err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Deactivate ─────────────────────────────────────────────────────────── */
  const handleDeactivate = async (barber) => {
    if (!window.confirm(`Deactivate "${barber.name}"? They will be hidden from the site.`)) return;
    try {
      await api.deleteBarber(barber.id, token);
      flash(true, `"${barber.name}" has been deactivated.`);
      load();
    } catch (err) {
      flash(false, err.message);
    }
  };

  const availBadge = (status) => {
    if (status === 'available') return { background: '#dcfce7', color: '#166534' };
    if (status === 'on_leave')  return { background: '#fef9c3', color: '#854d0e' };
    return                             { background: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div style={s.page}>
      <h2 style={s.heading}>Manage Barbers</h2>

      {error && <div style={s.err}>{error}</div>}
      {msg   && <div style={s.ok}>{msg}</div>}

      {/* ── Edit form ──────────────────────────────────────────────────────── */}
      {editTarget && (
        <section style={{ ...s.section, borderLeft: '3px solid #b8966a' }}>
          <div style={s.sectionHead}>
            <h3 style={s.sub}>Editing: {editTarget.name}</h3>
            <button style={s.cancelBtn} onClick={() => { setEditTarget(null); setEditPreview(null); setEditPortfolioSlots([]); }}>
              Cancel
            </button>
          </div>
          <form onSubmit={handleEdit} style={s.form}>
            <BarberFields
              form={editForm}
              setForm={setEditForm}
              preview={editPreview}
              fileRef={editFileRef}
              onImageChange={file => handleImageChange(file, setEditPreview, setEditForm, editForm)}
              portfolioSlots={editPortfolioSlots}
              onPortfolioChange={setEditPortfolioSlots}
            />
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>
      )}

      {/* ── Add form ───────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sub}>Add New Barber</h3>
        <p style={s.hint}>Fill in the barber's profile details. Only their name is required to start.</p>
        <form onSubmit={handleAdd} style={s.form}>
          <BarberFields
            form={addForm}
            setForm={setAddForm}
            preview={addPreview}
            fileRef={addFileRef}
            onImageChange={file => handleImageChange(file, setAddPreview, setAddForm, addForm)}
            portfolioSlots={addPortfolioSlots}
            onPortfolioChange={setAddPortfolioSlots}
          />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Adding…' : 'Add Barber'}
          </button>
        </form>
      </section>

      {/* ── Barbers table ──────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sub}>Current Barbers ({barbers.length})</h3>
        {barbers.length === 0 ? (
          <p style={s.empty}>No barbers added yet.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Photo', 'Name', 'Specialty', 'Exp.', 'Status', 'Evidence', 'Contact', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {barbers.map(b => (
                <tr key={b.id}>
                  <td style={s.td}>
                    {b.image_url
                      ? <img src={b.image_url} alt={b.name} style={s.thumb} />
                      : <div style={s.noPhoto}>No photo</div>
                    }
                  </td>
                  <td style={s.td}><strong>{b.name}</strong></td>
                  <td style={s.td}>
                    {b.specialty
                      ? b.specialty.split(/[,&]/).map(sk => sk.trim()).filter(Boolean).map((sk, i) => (
                          <span key={i} style={s.specialtyPreviewChip}>{sk}</span>
                        ))
                      : <span style={{ color: '#ccc' }}>—</span>
                    }
                  </td>
                  <td style={s.td}>
                    {b.experience != null && b.experience !== ''
                      ? `${b.experience} yr${b.experience !== 1 ? 's' : ''}`
                      : '—'}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...availBadge(b.availability_status) }}>
                      {(b.availability_status || 'available').replace('_', ' ')}
                    </span>
                  </td>
                  <td style={s.td}>
                    {Array.isArray(b.portfolio_images) && b.portfolio_images.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.portfolio_images.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt="" style={s.evidenceThumb} title={`Evidence ${i + 1}`} />
                        ))}
                        {b.portfolio_images.length > 4 && (
                          <div style={s.evidenceMore}>+{b.portfolio_images.length - 4}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#ccc', fontSize: '0.8rem' }}>none</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '0.82rem', color: '#555' }}>
                      {b.email || b.phone || '—'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={s.editBtn} onClick={() => openEdit(b)}>Edit</button>
                      <button style={s.deactivateBtn} onClick={() => handleDeactivate(b)}>Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const s = {
  page:        { maxWidth: '1040px', margin: '40px auto', padding: '0 24px', fontFamily: 'Roboto, sans-serif' },
  heading:     { fontSize: '1.8rem', marginBottom: '8px' },
  hint:        { fontSize: '0.84rem', color: '#888', marginTop: '4px', marginBottom: '0' },
  sub:         { fontSize: '1.1rem', color: '#333', margin: 0 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  section:     { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '28px', marginBottom: '32px' },
  sectionLabel:{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#aaa', fontWeight: 700, margin: '16px 0 4px', paddingBottom: 6, borderBottom: '1px solid #f0f0f0' },
  form:        { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' },
  row:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  col:         { display: 'flex', flexDirection: 'column', gap: '6px' },

  imagePicker:        { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px' },
  previewBox:         { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', background: '#f5f5f5', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewImg:         { width: '100%', height: '100%', objectFit: 'cover' },
  previewPlaceholder: { fontSize: '0.72rem', color: '#bbb', textAlign: 'center', padding: '8px' },
  uploadBtn:          { background: '#0e0e0e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' },
  uploadHint:         { fontSize: '0.75rem', color: '#aaa', marginTop: '6px' },

  portfolioGrid:    { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  portfolioThumb:   { position: 'relative', width: 110, height: 145, background: '#111', overflow: 'hidden', flexShrink: 0 },
  portfolioImg:     { width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(0.4)' },
  portfolioBadge:   { position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2 },
  portfolioOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.72)', padding: '5px 4px' },
  portfolioCtrlBtn: { background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 2, padding: '3px 7px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1 },
  newBadge:         { position: 'absolute', top: 5, right: 5, background: '#346190', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '2px 5px', borderRadius: 2 },
  portfolioAddSlot: { width: 110, height: 145, border: '2px dashed #ddd', background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  specialtyPreviewChip: { display: 'inline-block', background: '#f0eee9', border: '1px solid #ddd', borderRadius: 3, padding: '2px 10px', fontSize: '0.75rem', color: '#333', fontWeight: 600 },

  label:    { fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' },
  input:    { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit' },
  textarea: { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' },
  btn:      { background: '#0e0e0e', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit', alignSelf: 'flex-start' },
  cancelBtn:{ background: 'none', color: '#e94560', border: '1px solid #e94560', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' },

  table:         { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '12px' },
  th:            { textAlign: 'left', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #ddd', fontWeight: '600' },
  td:            { padding: '12px', borderBottom: '1px solid #eee', verticalAlign: 'middle' },
  thumb:         { width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', display: 'block' },
  noPhoto:       { width: '52px', height: '52px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#aaa', textAlign: 'center' },
  badge:         { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' },
  evidenceThumb: { width: 32, height: 42, objectFit: 'cover', borderRadius: 2, border: '1px solid #eee' },
  evidenceMore:  { width: 32, height: 42, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#888', borderRadius: 2, fontWeight: 700 },
  editBtn:       { background: '#b8966a', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  deactivateBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  empty:         { color: '#aaa', fontStyle: 'italic' },
  err:  { background: '#ffe0e0', color: '#c00', padding: '10px 16px', borderRadius: '5px', marginBottom: '16px' },
  ok:   { background: '#e0ffe0', color: '#060', padding: '10px 16px', borderRadius: '5px', marginBottom: '16px' },
};