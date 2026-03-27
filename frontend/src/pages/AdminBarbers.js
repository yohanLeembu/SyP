import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

/* ─── Inject fonts & styles to match BarberProfile ───────────────────────── */
(function injectStyles() {
  if (!document.head.querySelector('[href*="Epilogue"]')) {
    const l = document.createElement('link');
    l.href = 'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,700;0,900;1,900&family=Work+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;700&display=swap';
    l.rel = 'stylesheet';
    document.head.appendChild(l);
  }
})();

// ─── Form shape — covers all profile fields + evidences ───────────────────
const EMPTY = {
  name:                '',
  specialty:           '',
  bio:                 '',
  image:               null,
  evidences:           [], // NEW: Portfolio/proof images
  experience:          '',
  availability_status: 'available',
  phone:               '',
  email:               '',
};

const AVAILABILITY_OPTIONS = [
  { value: 'available',   label: 'AVAILABLE' },
  { value: 'on_leave',    label: 'ON LEAVE' },
  { value: 'unavailable', label: 'OFF DUTY' },
];

export default function AdminBarbers() {
  const { token, user } = useAuth(); // Assuming 'user' contains current barber info

  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // We treat this as a singular profile manager now
  const [hasProfile, setHasProfile] = useState(false);
  const [profileId,  setProfileId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  
  const [profilePreview, setProfilePreview] = useState(null);
  const [evidencePreviews, setEvidencePreviews] = useState([]);

  const profileFileRef  = useRef(null);
  const evidenceFileRef = useRef(null);

  // ── Load current barber's profile ──────────────────────────────────────────
  const loadProfile = async () => {
    try {
      // Assuming api.getBarbers() returns all, and we filter by the logged-in user
      // Adjust this depending on your backend (e.g., api.getMyProfile(token))
      const allBarbers = await api.getBarbers();
      const myProfile = allBarbers.find(b => b.user_id === user?.id || b.email === user?.email);

      if (myProfile) {
        setHasProfile(true);
        setProfileId(myProfile.id);
        setForm({
          name:                myProfile.name                || '',
          specialty:           myProfile.specialty           || '',
          bio:                 myProfile.bio                 || '',
          image:               null,
          evidences:           [], 
          experience:          myProfile.experience          ?? '',
          availability_status: myProfile.availability_status || 'available',
          phone:               myProfile.phone               || '',
          email:               myProfile.email               || '',
        });
        setProfilePreview(myProfile.image_url || null);
        // If your backend returns existing portfolio images, set them here
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { 
    if (user) loadProfile(); 
  }, [user]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const flash = (ok, text) => {
    if (ok) { setMsg(text); setError(''); }
    else    { setError(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 5000);
  };

  const handleProfileImageChange = (file) => {
    if (!file) return;
    setForm({ ...form, image: file });
    const reader = new FileReader();
    reader.onload = e => setProfilePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleEvidenceChange = (files) => {
    if (!files.length) return;
    const fileArray = Array.from(files);
    setForm({ ...form, evidences: [...form.evidences, ...fileArray] });
    
    // Generate previews for the new evidence files
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setEvidencePreviews(prev => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeEvidence = (index) => {
    const newEvidences = [...form.evidences];
    newEvidences.splice(index, 1);
    setForm({ ...form, evidences: newEvidences });

    const newPreviews = [...evidencePreviews];
    newPreviews.splice(index, 1);
    setEvidencePreviews(newPreviews);
  };

  // Build FormData 
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name',                form.name.trim());
    fd.append('specialty',           form.specialty.trim());
    fd.append('bio',                 form.bio.trim());
    fd.append('experience',          form.experience === '' ? '' : Number(form.experience));
    fd.append('availability_status', form.availability_status);
    fd.append('phone',               form.phone.trim());
    fd.append('email',               form.email.trim());
    
    if (form.image) fd.append('image', form.image);
    
    // Append multiple evidences (ensure your backend handles array uploads)
    form.evidences.forEach((file, index) => {
      fd.append('evidences', file); 
    });

    return fd;
  };

  // ── Save/Update Profile ──────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return flash(false, 'Your name is required to establish your manifesto.');
    setLoading(true);
    
    const fd = buildFormData();
    fd.append('active', 1);

    try {
      if (hasProfile) {
        await api.updateBarber(profileId, fd, token);
        flash(true, 'MANIFESTO UPDATED SUCCESSFULLY.');
      } else {
        await api.createBarber(fd, token);
        flash(true, 'PROFILE ESTABLISHED. WELCOME TO THE CRAFT.');
        loadProfile(); // Reload to get the new ID
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      flash(false, err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      
      <div style={s.headerWrap}>
        <h2 style={s.heading}>
          {hasProfile ? 'UPDATE MANIFESTO' : 'PROFILE ARCHITECT'}
        </h2>
        <p style={s.subHeading}>
          Define your craft. Upload your evidences. Set your status.
        </p>
      </div>

      {error && <div style={s.err}>{error}</div>}
      {msg   && <div style={s.ok}>{msg}</div>}

      <form onSubmit={handleSave} style={s.formWrapper}>
        
        {/* ── Top Section: Identity & Portrait ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>01. THE IDENTITY</h3>
          </div>
          
          <div style={s.heroGrid}>
            <div style={s.imagePicker}>
              <div style={s.previewBox}>
                {profilePreview
                  ? <img src={profilePreview} alt="Portrait" style={s.previewImg} />
                  : <span style={s.previewPlaceholder}>NO PORTRAIT</span>
                }
              </div>
              <div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  ref={profileFileRef}
                  style={{ display: 'none' }}
                  onChange={e => handleProfileImageChange(e.target.files[0])}
                />
                <button type="button" style={s.uploadBtn} onClick={() => profileFileRef.current.click()}>
                  {profilePreview ? 'REPLACE PORTRAIT' : 'UPLOAD PORTRAIT'}
                </button>
                <p style={s.uploadHint}>JPG, PNG or WEBP · MAX 4 MB</p>
              </div>
            </div>

            <div style={s.col}>
              <label style={s.label}>FULL NAME *</label>
              <input
                style={s.input}
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="YOUR GIVEN NAME"
              />
            </div>
          </div>
        </section>

        {/* ── Middle Section: The Craft ── */}
        <section style={{...s.section, background: '#eae8e3', border: 'none', boxShadow: '8px 8px 0 0 rgba(0,0,0,1)', border: '2px solid #000'}}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>02. THE CRAFT</h3>
          </div>
          
          <div style={s.row}>
            <div style={s.col}>
              <label style={s.label}>SPECIALTY (COMMA SEPARATED)</label>
              <input
                style={s.input}
                value={form.specialty}
                onChange={e => setForm({ ...form, specialty: e.target.value })}
                placeholder="e.g. Signature Cuts, Razor Rituals"
              />
            </div>
            <div style={s.col}>
              <label style={s.label}>YEARS OF EXPERIENCE</label>
              <input
                style={s.input}
                type="number"
                min="0"
                max="50"
                value={form.experience}
                onChange={e => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div style={{...s.col, marginTop: '24px'}}>
            <label style={s.label}>THE MANIFESTO (BIO)</label>
            <textarea
              style={s.textarea}
              rows={4}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Describe your style, background, and philosophy..."
            />
          </div>
        </section>

        {/* ── Evidences Section ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>03. EVIDENCES & PORTFOLIO</h3>
            <p style={{...s.uploadHint, marginTop: 4}}>Upload shots of your best work, certificates, or shop aesthetics.</p>
          </div>
          
          <div style={s.evidenceGrid}>
            {evidencePreviews.map((src, idx) => (
              <div key={idx} style={s.evidenceCard}>
                <img src={src} alt={`Evidence ${idx}`} style={s.evidenceImg} />
                <button type="button" style={s.removeEvidenceBtn} onClick={() => removeEvidence(idx)}>
                  ✕ REMOVE
                </button>
              </div>
            ))}
            
            <div style={s.addEvidenceBox} onClick={() => evidenceFileRef.current.click()}>
              <span style={{ fontSize: '2rem', color: '#ccc', marginBottom: '8px' }}>+</span>
              <span style={s.label}>ADD EVIDENCE</span>
            </div>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              ref={evidenceFileRef}
              style={{ display: 'none' }}
              onChange={e => handleEvidenceChange(e.target.files)}
            />
          </div>
        </section>

        {/* ── Bottom Section: Logistics ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>04. LOGISTICS</h3>
          </div>

          <div style={s.row}>
            <div style={s.col}>
              <label style={s.label}>PHONE NUMBER</label>
              <input
                style={s.input}
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 000 000 0000"
              />
            </div>
            <div style={s.col}>
              <label style={s.label}>EMAIL ADDRESS</label>
              <input
                style={s.input}
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@domain.com"
              />
            </div>
          </div>

          <div style={{...s.col, marginTop: '24px'}}>
            <label style={s.label}>CURRENT STATUS</label>
            <select
              style={s.select}
              value={form.availability_status}
              onChange={e => setForm({ ...form, availability_status: e.target.value })}
            >
              {AVAILABILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Submit ── */}
        <div style={s.submitWrapper}>
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'COMMITTING...' : (hasProfile ? 'UPDATE MANIFESTO →' : 'PUBLISH PROFILE →')}
          </button>
        </div>

      </form>
    </div>
  );
}

// ─── Brutalist "Zine" Styles ──────────────────────────────────────────────────
const s = {
  page:        { maxWidth: '900px', margin: '0 auto', padding: '64px 24px 120px', fontFamily: "'Work Sans', sans-serif", background: '#fbf9f4', minHeight: '100vh' },
  headerWrap:  { marginBottom: '48px', borderBottom: '4px solid #000', paddingBottom: '24px' },
  heading:     { fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: 'clamp(2.5rem, 5vw, 4rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1, fontStyle: 'italic' },
  subHeading:  { fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', margin: 0, fontWeight: 700 },
  
  formWrapper: { display: 'flex', flexDirection: 'column', gap: '48px' },
  section:     { background: '#fff', border: '2px solid #000', padding: '32px', position: 'relative' },
  sectionHeader:{ marginBottom: '24px' },
  sectionTitle:{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 },

  heroGrid:    { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'end' },
  row:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  col:         { display: 'flex', flexDirection: 'column', gap: '8px' },

  // Portrait Image Picker
  imagePicker: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' },
  previewBox:  { width: '140px', height: '180px', background: '#1c1b1b', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg:  { width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)' }, // matching the brutalist grayscale vibe
  previewPlaceholder: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem', color: '#fff', fontWeight: 700, letterSpacing: '0.1em' },
  uploadBtn:   { background: '#fff', color: '#000', border: '2px solid #000', padding: '8px 16px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', width: '100%' },
  uploadHint:  { fontFamily: "'Work Sans', sans-serif", fontSize: '0.7rem', color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },

  // Evidences / Portfolio
  evidenceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' },
  evidenceCard: { position: 'relative', width: '100%', aspectRatio: '1/1', border: '2px solid #000', overflow: 'hidden' },
  evidenceImg:  { width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.5)' },
  removeEvidenceBtn: { position: 'absolute', top: 0, right: 0, background: '#ba1a1a', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.6rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: 'pointer' },
  addEvidenceBox: { width: '100%', aspectRatio: '1/1', border: '2px dashed #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f5f3ee', transition: 'background 0.2s' },

  // Inputs
  label:       { fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#000', fontWeight: 700 },
  input:       { padding: '12px 16px', border: '2px solid #000', background: '#fff', fontSize: '1rem', fontFamily: "'Work Sans', sans-serif", color: '#000', outline: 'none', borderRadius: 0 },
  textarea:    { padding: '12px 16px', border: '2px solid #000', background: '#fff', fontSize: '1rem', fontFamily: "'Work Sans', sans-serif", color: '#000', outline: 'none', resize: 'vertical', lineHeight: 1.6, borderRadius: 0 },
  select:      { padding: '12px 16px', border: '2px solid #000', background: '#fff', fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#000', outline: 'none', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 0 },

  // Buttons & Messages
  submitWrapper: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' },
  submitBtn:   { background: '#000', color: '#fff', border: 'none', padding: '20px 40px', cursor: 'pointer', fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background 0.2s' },
  
  err:         { background: '#fff', color: '#ba1a1a', border: '2px solid #ba1a1a', padding: '16px', marginBottom: '32px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' },
  ok:          { background: '#000', color: '#fff', padding: '16px', marginBottom: '32px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' },

  '@media (max-width: 768px)': {
    row: { gridTemplateColumns: '1fr' },
    heroGrid: { gridTemplateColumns: '1fr' }
  }
};