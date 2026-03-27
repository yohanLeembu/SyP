import { useState, useEffect } from 'react';
import { api } from '../api';

/* Fonts injected by Navbar.jsx */

/* ─── THEME ──────────────────────────────────────────────────────────── */
const T = {
  black:  '#0a0a0a',
  white:  '#fbf9f4',
  blue:   '#346190',
  red:    '#ba1a1a',
  sand:   '#eae8e3',
  higher: '#e4e2dd',
  muted:  '#444748',
};
const HEADLINE = "'Epilogue', 'Impact', sans-serif";
const BODY     = "'Work Sans', sans-serif";
const LABEL    = "'Space Grotesk', sans-serif";

/* ─── STATIC DATA ────────────────────────────────────────────────────── */
const WHY_JOIN = [
  { title: 'FLEXIBLE HOURS',   body: 'We believe in life outside the shop. Work hard, play harder, set your own rhythm.',                        bg: T.blue,   color: '#fff',   rotate: '-2deg' },
  { title: 'STEADY CLIENTS',   body: 'Our marketing machine never stops. We keep your chair full so you can focus on the art.',                   bg: T.higher, color: T.black,  rotate: '1.5deg' },
  { title: 'CREATIVE FREEDOM', body: 'No corporate handbooks. No scripts. Just your vision and your tools.',                                      bg: T.red,    color: '#fff',   rotate: '-2deg' },
];

const TESTIMONIALS = [
  { quote: '"Trimura is not just a place to work, it is a place to thrive. My chair has never been empty, and my style has never been sharper."', name: '— MARCO, SENIOR BARBER', accent: false },
  { quote: '"The energy here is infectious. You are surrounded by talent that pushes you to be better every single day."',                         name: '— SARAH, JUNIOR BARBER', accent: true },
];

const FAQS = [
  { q: 'Do I need my own equipment?',     a: 'Yes, every barber is expected to bring their own primary tools (clippers, trimmers, shears). We provide the chairs, products, and the stage.' },
  { q: 'Is it commission or chair rent?', a: 'We offer competitive commission-based structures for Juniors and Apprentices, and flexible chair rent options for seasoned Seniors.' },
  { q: 'Do you provide training?',        a: 'Continuously. We host monthly workshop sessions to master new techniques and stay ahead of global trends.' },
];

/* ─── FAQ ITEM (accordion) ───────────────────────────────────────────── */
function FaqItem({ faq, i }) {
  const [open, setOpen] = useState(false);
  const rotations = ['none', 'rotate(-1.5deg)', 'none'];
  return (
    <div
      style={{
        ...st.faqItem,
        transform: rotations[i] || 'none',
        background: i === 1 ? '#fff' : 'transparent',
        boxShadow: i === 1 ? `4px 4px 0 ${T.black}` : 'none',
        padding: i === 1 ? '20px 24px' : '0',
      }}
    >
      <div style={st.faqHeader} onClick={() => setOpen(o => !o)}>
        <h3 style={st.faqQ}>{faq.q.toUpperCase()}</h3>
        <span style={{ ...st.faqIcon, transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && <p style={st.faqA}>{faq.a}</p>}
    </div>
  );
}

/* ─── VACANCY PAGE ───────────────────────────────────────────────────── */
export default function Vacancy() {
  const [vacancies,   setVacancies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [openId,      setOpenId]      = useState(null);
  const [applied,     setApplied]     = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [form,        setForm]        = useState({ name: '', email: '', cover_note: '', cv: null });

  /* ── Fetch vacancies (unchanged) ──────────────────────────────────── */
  useEffect(() => {
    api.getVacancies()
      .then(data => { setVacancies(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, []);

  /* ── Toggle vacancy card (unchanged) ─────────────────────────────── */
  const toggle = (id) => {
    setOpenId(prev => prev === id ? null : id);
    setForm({ name: '', email: '', cover_note: '', cv: null });
  };

  /* ── Submit application with CV (unchanged) ──────────────────────── */
  const handleApply = async (e, vacancyId) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append('name',       form.name);
    fd.append('email',      form.email);
    fd.append('cover_note', form.cover_note);
    if (form.cv) fd.append('cv', form.cv);
    try {
      await api.applyForVacancy(vacancyId, fd);
      setApplied(prev => ({ ...prev, [vacancyId]: true }));
      setForm({ name: '', email: '', cover_note: '', cv: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / error states ───────────────────────────────────────── */
  if (loading) return (
    <div style={st.stateScreen}>
      <p style={st.stateText}>LOADING VACANCIES…</p>
    </div>
  );
  if (error) return (
    <div style={st.stateScreen}>
      <p style={{ ...st.stateText, color: T.red }}>ERROR: {error}</p>
    </div>
  );

  return (
    <div style={st.page}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <header style={st.hero}>
        <div style={st.heroInner}>
          {/* Left — text */}
          <div style={st.heroLeft}>
            <span style={st.heroEyebrow}>CAREERS AT TRIMURA</span>
            <h1 style={st.heroTitle}>
              WE'RE<br />HIRING<br />
              <span style={st.heroRed}>REBELS.</span>
            </h1>
            <p style={st.heroBody}>
              TRIMURA isn't just a barbershop. It's a collective of artists, rule-breakers,
              and masters of the blade. We don't do boring. We don't do average.
            </p>
          </div>

          {/* Right — image */}
          <div style={st.heroRight}>
            <div style={st.heroImgWrap}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBenBM7QlCQ8uCLkp3_d5PeMC-6eBnOHo6ZQJKCSnvdGr856beuwlVEZ9ycaildn2B41jnN_ypXvSjbJJSq3JhuOIiW3X2tru5-GPPS0LeQCCEmaJmP8Nuz_4D9X0YJJJ3XJoB1j_0MLzA-NnkUPwHkecH0WtzsPjQ6UKp1VsBAIGWTZwL1iESMByGGybcCNawOd9W1RsWbeqdKUVIGRhmV4yy17onwlXRlGUDNbH2M3x7fFHJuqcQ0dgtvPWarv5rlrKoQlfnvpOxp"
                alt="Trimura barbershop interior"
                style={st.heroImg}
              />
            </div>
            <div style={st.heroEstSticker}>EST. 2024</div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          OPEN CHAIRS — dynamic from API
      ══════════════════════════════════════════════════ */}
      <section style={st.openSection}>
        <div style={st.openInner}>
          <h2 style={st.sectionTitle}>OPEN CHAIRS</h2>

          {vacancies.length === 0 && (
            <div style={st.emptyState}>
              <p style={st.emptyText}>NO OPEN POSITIONS RIGHT NOW. CHECK BACK SOON.</p>
            </div>
          )}

          <div style={st.openGrid}>
            {vacancies.map((pos, i) => {
              const isOpen    = openId === pos.id;
              const wasApplied = applied[pos.id];
              const cardRotations = ['none', 'none', 'rotate(1.5deg)'];
              const shadowSizes   = ['8px 8px 0 #000', '4px 4px 0 #000', '8px 8px 0 #000'];
              return (
                <div
                  key={pos.id}
                  style={{
                    ...st.openCard,
                    transform: isOpen ? 'none' : (cardRotations[i % 3] || 'none'),
                    boxShadow: shadowSizes[i % 3],
                    gridColumn: isOpen ? 'span 3' : 'span 1',
                    transition: 'grid-column 0.2s, transform 0.15s',
                  }}
                >
                  {/* Card top */}
                  <div style={st.openCardTop}>
                    <div style={st.openCardTopLeft}>
                      {/* Number */}
                      <span style={st.openCardNum}>0{i + 1}</span>
                      {pos.type && (
                        <span style={st.openCardType}>{pos.type.toUpperCase()}</span>
                      )}
                    </div>
                    {i === 0 && <span style={st.hotBadge}>HOT</span>}
                  </div>

                  <h3 style={st.openCardTitle}>{pos.title.toUpperCase()}</h3>

                  {pos.requirements?.length > 0 && (
                    <p style={st.openCardExp}>
                      Experience: {pos.requirements[0]}
                    </p>
                  )}

                  <p style={st.openCardDesc}>
                    {pos.description?.slice(0, 100)}{pos.description?.length > 100 ? '…' : ''}
                  </p>

                  {/* ── Expanded body (requirements, perks, form) ── */}
                  {isOpen && (
                    <div style={st.expandedBody}>
                      <div style={st.expandedCols}>
                        {/* Requirements */}
                        {pos.requirements?.length > 0 && (
                          <div>
                            <p style={st.listLabel}>REQUIREMENTS</p>
                            <ul style={st.list}>
                              {pos.requirements.map(r => (
                                <li key={r} style={st.listItem}>— {r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Perks */}
                        {pos.perks?.length > 0 && (
                          <div>
                            <p style={st.listLabel}>WHAT WE OFFER</p>
                            <ul style={st.list}>
                              {pos.perks.map(p => (
                                <li key={p} style={st.listItem}>— {p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* ── Success OR form ── */}
                      {wasApplied ? (
                        <div style={st.successBox}>
                          <div style={st.successMark}>✓</div>
                          <div>
                            <p style={st.successTitle}>APPLICATION SUBMITTED</p>
                            <p style={st.successSub}>
                              We received your application for <em>{pos.title}</em>. We'll be in touch.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* ── APPLICATION FORM ── */
                        <form style={st.applyForm} onSubmit={e => handleApply(e, pos.id)}>
                          <p style={st.applyFormTitle}>SEND US YOUR INTENTIONS</p>

                          <div style={st.formGrid}>
                            {/* Name */}
                            <div style={st.field}>
                              <label style={st.label}>FULL NAME</label>
                              <input
                                style={st.input}
                                type="text" required
                                placeholder="YOUR NAME"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                              />
                            </div>
                            {/* Email */}
                            <div style={st.field}>
                              <label style={st.label}>EMAIL ADDRESS</label>
                              <input
                                style={st.input}
                                type="email" required
                                placeholder="HELLO@REBEL.COM"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                              />
                            </div>
                          </div>

                          {/* Cover note */}
                          <div style={st.field}>
                            <label style={st.label}>TELL US WHY YOU'RE A REBEL</label>
                            <textarea
                              style={st.textarea}
                              rows={3}
                              placeholder="WHAT MAKES YOUR STYLE DIFFERENT?"
                              value={form.cover_note}
                              onChange={e => setForm({ ...form, cover_note: e.target.value })}
                            />
                          </div>

                          {/* CV upload */}
                          <div style={st.field}>
                            <label style={st.label}>UPLOAD CV (PDF, DOC, DOCX — MAX 5MB)</label>
                            <div style={st.fileInputWrap}>
                              <label style={st.fileLabel}>
                                <span style={st.fileIcon}>📎</span>
                                <span style={st.fileText}>
                                  {form.cv ? form.cv.name : 'CHOOSE FILE'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  style={{ display: 'none' }}
                                  onChange={e => setForm({ ...form, cv: e.target.files[0] })}
                                />
                              </label>
                              {form.cv && (
                                <button
                                  type="button"
                                  style={st.fileClear}
                                  onClick={() => setForm({ ...form, cv: null })}
                                >✕</button>
                              )}
                            </div>
                          </div>

                          <div style={st.formActions}>
                            <button
                              type="submit"
                              style={{ ...st.submitBtn, opacity: submitting ? 0.7 : 1 }}
                              disabled={submitting}
                            >
                              {submitting ? 'SUBMITTING…' : 'SUBMIT APPLICATION'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Apply / Close toggle */}
                  <button style={st.applyToggleBtn} onClick={() => toggle(pos.id)}>
                    {isOpen ? 'CLOSE' : 'APPLY'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY JOIN THE CREW
      ══════════════════════════════════════════════════ */}
      <section style={st.whySection}>
        <div style={st.whyInner}>
          <h2 style={st.whyTitle}>WHY JOIN THE CREW?</h2>
          <div style={st.whyCards}>
            {WHY_JOIN.map((w, i) => (
              <div
                key={w.title}
                style={{
                  ...st.whyCard,
                  background: w.bg,
                  color: w.color,
                  transform: w.rotate,
                  marginTop: i === 1 ? '48px' : i === 2 ? '-32px' : '0',
                }}
              >
                <h4 style={{ ...st.whyCardTitle, color: w.color }}>{w.title}</h4>
                <p style={{ ...st.whyCardBody, color: w.color === '#fff' ? 'rgba(255,255,255,0.85)' : T.muted }}>
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative background text */}
        <div style={st.bgWord} aria-hidden="true">CULTURE</div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section style={st.testimonialsSection}>
        <div style={st.testimonialsInner}>
          {/* Left — quotes */}
          <div style={st.quotesCol}>
            <h2 style={st.testimonialsTitle}>WHAT THE<br />CREW SAYS</h2>
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={i}
                style={{
                  ...st.blockquote,
                  ...(t.accent ? st.blockquoteAccent : {}),
                }}
              >
                <p style={{ ...st.quoteText, color: t.accent ? T.black : T.blue }}>{t.quote}</p>
                <cite style={st.quoteCite}>{t.name}</cite>
              </blockquote>
            ))}
          </div>

          {/* Right — image + sticker */}
          <div style={st.imgCol}>
            <div style={st.testimonialsImgWrap}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKur2PTRmx2glL-BEuZHCo1m3Hnezzv1oFpSQNtZeh9V4CcHEFJj5oRe_H_3za_GEJugXOL7xSeUvt-F_sVvJ2xK12K7rC_dfKgB9JNpkn9B0ooeQiSje_oExVPG-nvgub4hqVf28kevZoJhB2ysbnoB8kXebPHc2bRimcO017iPcubUVCCslwOEf2SDCNUyb6bkVO9LQFTv2kvqWl3pxobxRllKYzOMUKi5271IaTNHf2-JyNuSpoh61XRjRFOFI8bE-GqPjjNl5g"
                alt="Barber at work"
                style={st.testimonialsImg}
              />
            </div>
            <div style={st.noRulesSticker}>NO RULES.</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section style={st.faqSection}>
        <div style={st.faqInner}>
          <h2 style={st.faqTitle}>STUFF PEOPLE ASK</h2>
          <div style={st.faqList}>
            {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section style={st.ctaSection}>
        <div style={st.ctaInner}>
          <h2 style={st.ctaTitle}>
            START YOUR<br />JOURNEY.<br />
            <span style={{ color: T.red }}>APPLY NOW.</span>
          </h2>
          <button
            style={st.ctaBtn}
            onClick={() => {
              if (vacancies.length > 0) {
                toggle(vacancies[0].id);
                document.getElementById('open-chairs')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            LET'S GO
          </button>
        </div>
        {/* Decorative bg */}
        <div style={st.ctaBgIcon} aria-hidden="true">✂</div>
      </section>

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #0a0a0a; color: #fbf9f4; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const st = {
  page: {
    fontFamily: BODY,
    background: T.white,
    color: T.black,
    minHeight: '100vh',
  },

  /* Loading / error */
  stateScreen: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.muted,
  },

  /* ── HERO ── */
  hero: {
    padding: '80px 48px 80px',
    background: T.white,
    borderBottom: `8px solid ${T.black}`,
    overflow: 'hidden',
  },
  heroInner: {
    maxWidth: '1440px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '80px',
  },
  heroLeft: {
    flex: '0 0 60%',
  },
  heroEyebrow: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.blue,
    display: 'block',
    marginBottom: '20px',
  },
  heroTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(5rem, 10vw, 9.5rem)',
    lineHeight: '0.88',
    letterSpacing: '-0.04em',
    textTransform: 'uppercase',
    color: T.black,
    margin: '0 0 32px',
  },
  heroRed: { color: T.red },
  heroBody: {
    fontFamily: BODY,
    fontSize: '1.2rem',
    lineHeight: '1.65',
    color: T.muted,
    maxWidth: '500px',
    fontWeight: '400',
    margin: 0,
  },
  heroRight: {
    flex: 1,
    position: 'relative',
  },
  heroImgWrap: {
    border: `4px solid ${T.black}`,
    boxShadow: `8px 8px 0 ${T.black}`,
    overflow: 'hidden',
    transform: 'rotate(1.5deg)',
  },
  heroImg: {
    width: '100%',
    aspectRatio: '1/1',
    objectFit: 'cover',
    display: 'block',
    filter: 'grayscale(100%)',
    transition: 'filter 0.5s',
  },
  heroEstSticker: {
    position: 'absolute',
    bottom: '-24px',
    left: '-24px',
    background: T.blue,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.1rem',
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    padding: '16px 20px',
    transform: 'rotate(-2deg)',
    zIndex: 10,
  },

  /* ── OPEN CHAIRS ── */
  openSection: {
    padding: '80px 48px',
    background: '#f5f3ee',
  },
  openInner: {
    maxWidth: '1440px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(3rem, 5vw, 5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: '0 0 64px',
    color: T.black,
  },
  emptyState: {
    padding: '60px 0',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: T.muted,
  },
  openGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  openCard: {
    background: '#fff',
    border: `4px solid ${T.black}`,
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.15s',
  },
  openCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  openCardTopLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  openCardNum: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2.5rem',
    lineHeight: '1',
    color: T.black,
  },
  openCardType: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    fontWeight: '700',
    color: T.blue,
  },
  hotBadge: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.red,
    border: `2px solid ${T.red}`,
    padding: '3px 10px',
  },
  openCardTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    lineHeight: '1',
    color: T.black,
    margin: 0,
  },
  openCardExp: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.blue,
    margin: 0,
  },
  openCardDesc: {
    fontFamily: BODY,
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: T.muted,
    margin: '0 0 8px',
    fontWeight: '400',
    opacity: 0.85,
    flex: 1,
  },
  applyToggleBtn: {
    width: '100%',
    background: T.black,
    color: '#fff',
    border: 'none',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '16px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.15s',
  },

  /* Expanded body */
  expandedBody: {
    borderTop: `3px solid ${T.black}`,
    paddingTop: '32px',
    marginTop: '8px',
  },
  expandedCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '36px',
  },
  listLabel: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.black,
    marginBottom: '14px',
    display: 'block',
  },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: {
    fontFamily: BODY,
    fontSize: '0.92rem',
    lineHeight: '1.8',
    color: T.muted,
    marginBottom: '6px',
    fontWeight: '400',
  },

  /* Application form — dark bg to match HTML */
  applyForm: {
    background: T.black,
    padding: '40px',
    marginTop: '8px',
  },
  applyFormTitle: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '32px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '28px',
  },
  field: { marginBottom: '28px' },
  label: {
    display: 'block',
    fontFamily: LABEL,
    fontSize: '0.6rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '4px solid #fff',
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: '1.4rem',
    textTransform: 'uppercase',
    padding: '8px 0',
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '0.02em',
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '4px solid #fff',
    color: '#fff',
    fontFamily: BODY,
    fontWeight: '400',
    fontSize: '1.1rem',
    padding: '8px 0',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },

  /* CV file upload — custom styled */
  fileInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: `2px solid rgba(255,255,255,0.4)`,
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    flex: 1,
  },
  fileIcon: {
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  fileText: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#fff',
  },
  fileClear: {
    background: 'none',
    border: `2px solid rgba(255,255,255,0.3)`,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '8px 14px',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '8px',
  },
  submitBtn: {
    background: '#fff',
    color: T.black,
    border: `4px solid #fff`,
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '20px 56px',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },

  /* Success */
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: '#fff',
    border: `4px solid ${T.black}`,
    padding: '24px 28px',
    marginTop: '8px',
    boxShadow: `4px 4px 0 ${T.black}`,
  },
  successMark: {
    width: '52px',
    height: '52px',
    flexShrink: 0,
    border: `3px solid ${T.black}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    color: T.black,
  },
  successTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: '0 0 4px',
    color: T.black,
  },
  successSub: {
    fontFamily: BODY,
    fontSize: '0.9rem',
    color: T.muted,
    margin: 0,
    fontWeight: '400',
  },

  /* ── WHY JOIN ── */
  whySection: {
    padding: '100px 48px',
    background: T.white,
    position: 'relative',
    overflow: 'hidden',
  },
  whyInner: {
    maxWidth: '1440px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  whyTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(3rem, 5vw, 5.5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: '0 0 64px',
    color: T.black,
  },
  whyCards: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '32px',
    alignItems: 'flex-start',
  },
  whyCard: {
    padding: '40px',
    maxWidth: '320px',
    border: `2px solid ${T.black}`,
    boxShadow: `8px 8px 0 ${T.black}`,
    flex: '0 0 auto',
  },
  whyCardTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    marginBottom: '16px',
  },
  whyCardBody: {
    fontFamily: BODY,
    fontSize: '0.95rem',
    lineHeight: '1.65',
    fontWeight: '400',
    margin: 0,
  },
  bgWord: {
    position: 'absolute',
    top: '50%',
    right: '-5%',
    transform: 'translateY(-50%)',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(8rem, 20vw, 20rem)',
    textTransform: 'uppercase',
    color: T.higher,
    opacity: 0.5,
    zIndex: 0,
    userSelect: 'none',
    letterSpacing: '-0.05em',
    lineHeight: 1,
    pointerEvents: 'none',
  },

  /* ── TESTIMONIALS ── */
  testimonialsSection: {
    padding: '80px 48px',
    background: T.white,
  },
  testimonialsInner: {
    maxWidth: '1440px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
  },
  quotesCol: {},
  testimonialsTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 4.5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: '0 0 56px',
    color: T.black,
    lineHeight: '1',
  },
  blockquote: {
    margin: '0 0 56px',
  },
  blockquoteAccent: {
    borderLeft: `8px solid ${T.red}`,
    paddingLeft: '28px',
  },
  quoteText: {
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: 'clamp(1.3rem, 2vw, 1.8rem)',
    fontStyle: 'italic',
    lineHeight: '1.4',
    margin: '0 0 16px',
  },
  quoteCite: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.black,
    fontStyle: 'normal',
    display: 'block',
  },
  imgCol: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  },
  testimonialsImgWrap: {
    width: '100%',
    maxWidth: '380px',
    aspectRatio: '3/4',
    border: `4px solid ${T.black}`,
    boxShadow: `8px 8px 0 ${T.black}`,
    transform: 'rotate(1.5deg)',
    overflow: 'hidden',
  },
  testimonialsImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  noRulesSticker: {
    position: 'absolute',
    bottom: '-40px',
    right: '-16px',
    background: T.black,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    padding: '20px 24px',
    transform: 'rotate(-2deg)',
    zIndex: 20,
  },

  /* ── FAQ ── */
  faqSection: {
    padding: '80px 48px',
    borderTop: `8px solid ${T.black}`,
    background: '#f5f3ee',
  },
  faqInner: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  faqTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    textAlign: 'center',
    margin: '0 0 64px',
    color: T.black,
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  faqItem: {
    borderBottom: `4px solid ${T.black}`,
    paddingBottom: '28px',
    marginBottom: '28px',
  },
  faqHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  faqQ: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    color: T.black,
    margin: 0,
  },
  faqIcon: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    color: T.black,
    lineHeight: '1',
    transition: 'transform 0.2s',
    flexShrink: 0,
  },
  faqA: {
    fontFamily: BODY,
    fontSize: '1.05rem',
    lineHeight: '1.75',
    color: T.muted,
    marginTop: '16px',
    fontWeight: '400',
  },

  /* ── FINAL CTA ── */
  ctaSection: {
    background: T.blue,
    color: '#fff',
    padding: '120px 48px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaInner: {
    position: 'relative',
    zIndex: 1,
  },
  ctaTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(4rem, 9vw, 9rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.04em',
    lineHeight: '0.9',
    color: '#fff',
    margin: '0 0 64px',
  },
  ctaBtn: {
    background: T.black,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2.5rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    padding: '24px 80px',
    border: `4px solid #fff`,
    cursor: 'pointer',
    boxShadow: `8px 8px 0 rgba(0,0,0,0.3)`,
    transition: 'transform 0.15s',
  },
  ctaBgIcon: {
    position: 'absolute',
    bottom: '-80px',
    left: '-40px',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '40rem',
    opacity: 0.08,
    zIndex: 0,
    lineHeight: 1,
    pointerEvents: 'none',
    userSelect: 'none',
    color: '#fff',
  },
};