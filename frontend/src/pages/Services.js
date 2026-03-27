import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* Fonts injected by Navbar.jsx */

/* ─── DATA (unchanged) ───────────────────────────────────────────────── */
const TIME_SLOTS = [
  { label: '09:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '01:00 PM', value: '13:00' },
  { label: '02:00 PM', value: '14:00' },
  { label: '03:00 PM', value: '15:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '05:00 PM', value: '17:00' },
];

const SERVICES = [
  { id: 1, title: 'Classic Haircut',       description: 'A precision cut tailored to your face shape and personal style. Includes consultation, wash, cut, and finish.',             price: 'NPR 500',   duration: '45 min', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80' },
  { id: 2, title: 'Beard Trim & Shape',    description: 'Expert beard sculpting for a clean, defined, masculine silhouette. Hot towel prep included.',                              price: 'NPR 300',   duration: '30 min', img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80' },
  { id: 3, title: 'Hot Towel Shave',       description: 'A luxurious traditional straight-razor shave with hot towel, premium lather, and post-shave treatment.',                  price: 'NPR 700',   duration: '60 min', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80' },
  { id: 4, title: 'Full Grooming Package', description: 'The complete Trimura experience — haircut, beard trim, hot towel shave, and scalp massage. Our signature.',               price: 'NPR 1,400', duration: '2 hrs',  img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80' },
  { id: 5, title: 'Skin Fade',             description: 'A flawless gradient fade blending seamlessly from skin to your desired length. Precision at every pass.',                  price: 'NPR 600',   duration: '50 min', img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80' },
];

const FILTERS = ['All', 'Haircuts', 'Beard', 'Shaves', 'Packages'];

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

/* ─── CARD CONFIGS — maps each service to an HTML-style card layout ─── */
const CARD_LAYOUTS = [
  /* 1 — Classic Haircut: tall card, hover-to-black */
  {
    cols: '4',
    bg: T.higher, textColor: T.black,
    badge: 'Popular', badgeBg: T.red,
    rough: true, rotate: null,
    btnBg: T.blue, btnText: '#fff',
    tags: [],
  },
  /* 2 — Beard Trim: rotated sticky-note style */
  {
    cols: '4',
    bg: T.white, textColor: T.black,
    badge: null,
    rough: false, rotate: '2deg',
    btnBg: T.black, btnText: '#fff',
    tags: [],
  },
  /* 3 — Hot Towel Shave: red / bold */
  {
    cols: '4',
    bg: T.red, textColor: '#fff',
    badge: null,
    rough: true, rotate: '-1deg',
    btnBg: '#fff', btnText: T.red,
    tags: [],
  },
  /* 4 — Full Grooming: wide poster with tags */
  {
    cols: '8',
    bg: T.black, textColor: '#fff',
    badge: 'Signature', badgeBg: T.blue,
    rough: false, rotate: null,
    btnBg: '#fff', btnText: T.black,
    tags: ['Hot Towel', 'Scalp Massage', 'Beard Trim', 'Soul Retrieval'],
    wide: true,
  },
  /* 5 — Skin Fade: secondary-container horizontal */
  {
    cols: '4',
    bg: '#9fcaff', textColor: T.black,
    badge: null,
    rough: true, rotate: null,
    btnBg: T.black, btnText: '#fff',
    tags: [],
  },
];

/* ─── SERVICES PAGE ──────────────────────────────────────────────────── */
export default function Services() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({
    barberId: null, barberName: '', date: '', timeslot: '', paymentMethod: '',
  });
  const [submitted,      setSubmitted]      = useState(false);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [barbers,        setBarbers]        = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [search,         setSearch]         = useState('');
  const [activeFilter,   setActiveFilter]   = useState('All');

  /* ── Fetch barbers when modal opens ──────────────────────────────── */
  useEffect(() => {
    if (!selectedService) return;
    setBarbersLoading(true);
    fetch('http://localhost:5000/api/barbers')
      .then(r => r.json())
      .then(data => setBarbers(data))
      .catch(() => setBarbers([]))
      .finally(() => setBarbersLoading(false));
  }, [selectedService]);

  /* ── Handlers (all unchanged) ─────────────────────────────────────── */
  const handleBookNow = (svc) => {
    if (!user) { navigate('/login'); return; }
    setSelectedService(svc);
    setForm({ barberId: null, barberName: '', date: '', timeslot: '', paymentMethod: '' });
    setError('');
    setSubmitted(false);
  };

  const handleSelectBarber = (barber) => {
    setForm(f => ({ ...f, barberId: barber.id, barberName: barber.name }));
  };

  const allFieldsFilled = form.barberId && form.date && form.timeslot;

  const handleCashSubmit = async () => {
    if (!allFieldsFilled) { setError('Please fill in all fields first.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service_id: selectedService.id,
          barber_id:  form.barberId,
          date:       form.date,
          timeslot:   form.timeslot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKhaltiSubmit = async () => {
    if (!allFieldsFilled) { setError('Please fill in all fields first.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/payment/khalti/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service_id: selectedService.id,
          barber_id:  form.barberId,
          date:       form.date,
          timeslot:   form.timeslot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = data.payment_url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.paymentMethod) { setError('Please choose a payment method.'); return; }
    if (form.paymentMethod === 'cash')   handleCashSubmit();
    if (form.paymentMethod === 'khalti') handleKhaltiSubmit();
  };

  const handleClose = () => {
    setSelectedService(null);
    setSubmitted(false);
    setError('');
    setForm({ barberId: null, barberName: '', date: '', timeslot: '', paymentMethod: '' });
  };

  /* ── Filtered services ─────────────────────────────────────────────── */
  const displayed = SERVICES.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Haircuts')  return s.title.toLowerCase().includes('haircut') || s.title.toLowerCase().includes('fade');
    if (activeFilter === 'Beard')     return s.title.toLowerCase().includes('beard');
    if (activeFilter === 'Shaves')    return s.title.toLowerCase().includes('shave');
    if (activeFilter === 'Packages')  return s.title.toLowerCase().includes('package') || s.title.toLowerCase().includes('full');
    return true;
  });

  return (
    <div style={st.page}>

      {/* ══════════════════════════════════════════════════
          HERO TITLE
      ══════════════════════════════════════════════════ */}
      <section style={st.heroSection}>
        <span style={st.freshBadge}>Fresh Inventory</span>
        <h1 style={st.heroTitle}>
          THE MENU:<br />
          <span style={st.heroBlue}>CHOOSE</span> YOUR<br />
          <span style={st.heroUnderline}>FATE.</span>
        </h1>
        <p style={st.heroSub}>
          WE DON'T JUST CUT HAIR. WE PERFORM EXORCISMS ON YOUR BAD DECISIONS.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════
          SEARCH + FILTERS
      ══════════════════════════════════════════════════ */}
      <section style={st.controlsSection}>
        {/* Search */}
        <div style={st.searchWrap}>
          <label style={st.searchLabel}>Looking for something specific?</label>
          <div style={st.searchInputWrap}>
            <input
              style={st.searchInput}
              placeholder="SEARCH SERVICES (IF YOU DARE)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
            />
            <span style={st.searchIcon}>⌕</span>
          </div>
        </div>

        {/* Filter pills */}
        <div style={st.filters}>
          {FILTERS.map((f, i) => {
            const active = activeFilter === f;
            const rotations = ['-1deg', '2deg', '-2deg', '1deg', '-1deg'];
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  ...st.filterBtn,
                  background: active ? T.black : T.higher,
                  color:      active ? '#fff'  : T.black,
                  border:     active ? `2px solid ${T.black}` : `2px solid ${T.black}`,
                  transform:  active ? 'rotate(0deg)' : `rotate(${rotations[i]})`,
                }}
              >
                {f.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICE GRID — asymmetric poster layout
      ══════════════════════════════════════════════════ */}
      <section style={st.gridSection}>
        {displayed.length === 0 ? (
          <div style={st.noResults}>
            <p style={st.noResultsText}>NO SERVICES MATCH YOUR SEARCH.</p>
          </div>
        ) : (
          <div style={st.grid}>
            {displayed.map((svc) => {
              const layout = CARD_LAYOUTS[svc.id - 1];
              if (layout.wide) {
                return <WideCard key={svc.id} svc={svc} layout={layout} onBook={handleBookNow} user={user} />;
              }
              return <ServiceCard key={svc.id} svc={svc} layout={layout} onBook={handleBookNow} user={user} />;
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════ */}
      <section style={st.ctaSection}>
        <div style={st.ctaCard}>
          <div style={st.ctaPin}>📌</div>
          <h2 style={st.ctaTitle}>Don't See What You Want?</h2>
          <p style={st.ctaBody}>
            Walk in and shout at us. We'll figure something out. We're pretty flexible if you're nice.
            If you're not nice, the price triples.
          </p>
          <div style={st.ctaBtns}>
            <a href="tel:" style={st.ctaBtnDark}>CALL THE SHOP</a>
            <a href="#location" style={st.ctaBtnOutline}>OUR LOCATION</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BOOKING MODAL
      ══════════════════════════════════════════════════ */}
      {selectedService && (
        <div style={st.overlay} onClick={handleClose}>
          <div style={st.modal} onClick={e => e.stopPropagation()}>

            {!submitted ? (
              <>
                {/* Modal image header */}
                <div style={{ ...st.modalImg, backgroundImage: `url(${selectedService.img})` }}>
                  <div style={st.modalImgOverlay} />
                  <div style={st.modalImgText}>
                    <span style={st.modalEyebrow}>RESERVE</span>
                    <h3 style={st.modalTitle}>{selectedService.title.toUpperCase()}</h3>
                    <p style={st.modalMeta}>{selectedService.price} · {selectedService.duration}</p>
                  </div>
                </div>

                <div style={st.modalBody}>
                  {/* User info */}
                  <div style={st.userInfo}>
                    <p style={st.userInfoLabel}>BOOKING FOR</p>
                    <p style={st.userInfoName}>{user.name}</p>
                    <p style={st.userInfoEmail}>{user.email}</p>
                  </div>

                  {error && <div style={st.errorMsg}>{error}</div>}

                  <form onSubmit={handleSubmit}>

                    {/* Barber picker */}
                    <div style={st.field}>
                      <label style={st.label}>CHOOSE YOUR BARBER</label>
                      {barbersLoading && <p style={st.barbersNote}>Loading barbers…</p>}
                      {!barbersLoading && barbers.length === 0 && <p style={st.barbersNote}>No barbers available.</p>}
                      {!barbersLoading && barbers.length > 0 && (
                        <div style={st.barberGrid}>
                          {barbers.map(b => {
                            const selected = form.barberId === b.id;
                            return (
                              <button
                                key={b.id} type="button"
                                onClick={() => handleSelectBarber(b)}
                                style={{
                                  ...st.barberCard,
                                  ...(selected ? st.barberCardSelected : {}),
                                }}
                              >
                                <div style={st.barberPhotoWrap}>
                                  {b.image_url
                                    ? <img src={b.image_url} alt={b.name} style={st.barberPhoto} />
                                    : <div style={st.barberInitial}>{b.name[0]}</div>
                                  }
                                  {selected && <div style={st.barberRing} />}
                                </div>
                                <p style={{ ...st.barberName, ...(selected ? { color: T.blue, fontWeight: '700' } : {}) }}>
                                  {b.name.split(' ')[0]}
                                </p>
                                {b.specialty && (
                                  <p style={st.barberSpec}>{b.specialty.split(',')[0].trim()}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div style={st.field}>
                      <label style={st.label}>DATE OF RECKONING</label>
                      <input
                        style={st.input} type="date" required
                        value={form.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                      />
                    </div>

                    {/* Time slot */}
                    <div style={st.field}>
                      <label style={st.label}>PREFERRED HOUR</label>
                      <select
                        style={{ ...st.input, cursor: 'pointer' }} required
                        value={form.timeslot}
                        onChange={e => setForm({ ...form, timeslot: e.target.value })}
                      >
                        <option value="">SELECT A TIME</option>
                        {TIME_SLOTS.map(slot => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment method — only shown once all fields filled */}
                    {allFieldsFilled && (
                      <div style={st.field}>
                        <label style={st.label}>PAYMENT METHOD</label>
                        <div style={st.paymentGrid}>
                          <button
                            type="button"
                            style={{ ...st.paymentCard, ...(form.paymentMethod === 'cash' ? st.paymentCardSelected : {}) }}
                            onClick={() => setForm(f => ({ ...f, paymentMethod: 'cash' }))}
                          >
                            <span style={st.paymentIcon}>💵</span>
                            <span style={st.paymentLabel}>CASH ON ARRIVAL</span>
                            <span style={st.paymentSub}>Pay at the shop</span>
                          </button>
                          <button
                            type="button"
                            style={{ ...st.paymentCard, ...(form.paymentMethod === 'khalti' ? st.paymentCardSelected : {}) }}
                            onClick={() => setForm(f => ({ ...f, paymentMethod: 'khalti' }))}
                          >
                            <span style={{ ...st.paymentIcon, color: '#5C2D8F' }}>⬡</span>
                            <span style={st.paymentLabel}>PAY WITH KHALTI</span>
                            <span style={st.paymentSub}>Secure online payment</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {form.paymentMethod === 'khalti' && (
                      <p style={st.paymentNote}>
                        You will be redirected to Khalti's secure payment page.
                        Your booking is confirmed only after successful payment.
                      </p>
                    )}
                    {form.paymentMethod === 'cash' && (
                      <p style={st.paymentNote}>
                        Please arrive on time and bring the exact amount. Payment is collected at the shop.
                      </p>
                    )}

                    {/* Actions */}
                    <div style={st.modalActions}>
                      <button
                        type="submit"
                        style={{
                          ...st.confirmBtn,
                          background: form.paymentMethod === 'khalti' ? '#5C2D8F' : T.black,
                          opacity: loading ? 0.7 : 1,
                        }}
                        disabled={loading}
                      >
                        {loading
                          ? (form.paymentMethod === 'khalti' ? 'REDIRECTING…' : 'CONFIRMING…')
                          : form.paymentMethod === 'khalti'
                            ? 'PAY WITH KHALTI'
                            : form.paymentMethod === 'cash'
                              ? 'CONFIRM BOOKING'
                              : 'CONTINUE'
                        }
                      </button>
                      <button type="button" onClick={handleClose} style={st.cancelBtn}>CANCEL</button>
                    </div>

                  </form>
                </div>
              </>
            ) : (
              /* Success screen */
              <div style={st.successScreen}>
                <div style={st.successMark}>✓</div>
                <span style={st.successEyebrow}>CONFIRMED</span>
                <h3 style={st.successTitle}>YOUR APPOINTMENT<br />IS RESERVED.</h3>
                <div style={st.successDetails}>
                  <p style={st.successLine}>{selectedService.title}</p>
                  <p style={st.successLine}>with {form.barberName}</p>
                  <p style={st.successLine}>{form.date} · {TIME_SLOTS.find(t => t.value === form.timeslot)?.label || form.timeslot}</p>
                  <p style={st.successLine}>{user.name}</p>
                  <p style={{ ...st.successLine, color: '#aaa', fontSize: '0.8rem' }}>Payment: Cash on Arrival</p>
                </div>
                <p style={st.successNote}>A confirmation has been sent to your account notifications.</p>
                <button onClick={handleClose} style={st.confirmBtn}>CLOSE</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #0a0a0a; color: #fbf9f4; }
        .svc-card:hover { background: #0a0a0a !important; color: #fbf9f4 !important; }
        .svc-card:hover .svc-body { color: rgba(255,255,255,0.75) !important; }
        .svc-card:hover .svc-btn  { background: #fff !important; color: #0a0a0a !important; }
      `}</style>
    </div>
  );
}

/* ─── SERVICE CARD (normal) ──────────────────────────────────────────── */
function ServiceCard({ svc, layout, onBook, user }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...st.card,
        background:  hovered && !layout.rotate ? T.black : layout.bg,
        color:       hovered && !layout.rotate ? '#fff'  : layout.textColor,
        transform:   layout.rotate || 'none',
        clipPath:    layout.rough ? 'polygon(0% 0%, 100% 2%, 98% 100%, 2% 97%)' : 'none',
        boxShadow:   !layout.rough && !layout.rotate ? `6px 6px 0 ${T.black}` : 'none',
        border:      layout.rotate ? `3px solid ${T.black}` : 'none',
        transition:  'background 0.2s, color 0.2s, transform 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Number + badge row */}
      <div style={st.cardTop}>
        <span style={st.cardNum}>0{svc.id}</span>
        {layout.badge && (
          <span style={{ ...st.badge, background: layout.badgeBg }}>
            {layout.badge}
          </span>
        )}
      </div>

      <h3 style={{ ...st.cardTitle, color: hovered && !layout.rotate ? '#fff' : layout.textColor }}>
        {svc.title.toUpperCase()}
      </h3>
      <p style={{ ...st.cardBody, color: hovered && !layout.rotate ? 'rgba(255,255,255,0.75)' : T.muted, ...(layout.textColor === '#fff' ? { color: 'rgba(255,255,255,0.85)' } : {}) }}>
        {svc.description}
      </p>

      <div style={st.cardDuration}>
        <span style={{ ...st.durationTag, background: hovered && !layout.rotate ? 'rgba(255,255,255,0.15)' : T.sand, color: hovered && !layout.rotate ? '#fff' : T.black }}>
          {svc.duration}
        </span>
      </div>

      {/* Price + CTA */}
      <div style={{ ...st.cardFooter, borderColor: hovered && !layout.rotate ? 'rgba(255,255,255,0.2)' : layout.textColor === '#fff' ? 'rgba(255,255,255,0.2)' : T.black }}>
        <span style={{ ...st.cardPrice, color: layout.textColor === '#fff' ? '#fff' : T.black, ...(hovered && !layout.rotate ? { color: '#fff' } : {}) }}>
          {svc.price}
        </span>
        <button
          onClick={() => onBook(svc)}
          style={{
            ...st.cardBtn,
            background: hovered && !layout.rotate ? '#fff' : layout.btnBg,
            color:      hovered && !layout.rotate ? T.black : layout.btnText,
          }}
        >
          {user ? 'BOOK NOW' : 'SIGN IN'}
        </button>
      </div>
    </div>
  );
}

/* ─── WIDE CARD (Full Grooming — spans 2 cols) ───────────────────────── */
function WideCard({ svc, layout, onBook, user }) {
  return (
    <div style={{ ...st.wideCard, background: layout.bg, color: layout.textColor, gridColumn: 'span 2' }}>
      <div style={st.wideLeft}>
        <div style={st.wideTopRow}>
          <span style={{ ...st.cardNum, color: T.blue }}>0{svc.id}</span>
          {layout.badge && (
            <span style={{ ...st.badge, background: layout.badgeBg }}>{layout.badge}</span>
          )}
        </div>
        <h3 style={{ ...st.wideName }}>{svc.title.toUpperCase()}</h3>
        <p style={{ ...st.cardBody, color: 'rgba(255,255,255,0.78)', marginBottom: '32px' }}>
          {svc.description}
        </p>
        {/* Tags */}
        <div style={st.tagRow}>
          {layout.tags.map(tag => (
            <span key={tag} style={st.tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div style={st.wideRight}>
        {/* Image */}
        <div style={{ ...st.wideImg, backgroundImage: `url(${svc.img})` }} />

        <div style={st.widePriceBlock}>
          <span style={st.widePrice}>{svc.price}</span>
          <span style={st.wideDuration}>{svc.duration}</span>
        </div>
        <button
          onClick={() => onBook(svc)}
          style={st.wideBtn}
        >
          {user ? 'SECURE THE SLOT →' : 'SIGN IN TO BOOK →'}
        </button>
      </div>
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
    paddingBottom: '120px',
  },

  /* ── HERO ── */
  heroSection: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '80px 48px 64px',
    position: 'relative',
  },
  freshBadge: {
    display: 'inline-block',
    background: T.blue,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: '700',
    padding: '6px 16px',
    transform: 'rotate(-3deg)',
    marginBottom: '28px',
  },
  heroTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(4rem, 9vw, 9rem)',
    lineHeight: '0.88',
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    color: T.black,
    margin: '0 0 32px',
    maxWidth: '900px',
  },
  heroBlue: { color: T.blue },
  heroUnderline: {
    display: 'inline-block',
    borderBottom: `8px solid ${T.black}`,
    paddingBottom: '4px',
  },
  heroSub: {
    fontFamily: LABEL,
    fontSize: '1.1rem',
    letterSpacing: '0.04em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.muted,
    maxWidth: '440px',
    lineHeight: '1.5',
    margin: 0,
  },

  /* ── CONTROLS ── */
  controlsSection: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 48px 64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  searchWrap: {
    maxWidth: '600px',
  },
  searchLabel: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
    display: 'block',
    marginBottom: '10px',
  },
  searchInputWrap: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    background: 'transparent',
    border: `4px solid ${T.black}`,
    padding: '20px 60px 20px 24px',
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: '1.2rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: T.black,
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '2rem',
    lineHeight: 1,
    color: T.black,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
  },
  filterBtn: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '10px 28px',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },

  /* ── GRID ── */
  gridSection: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 48px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  noResults: {
    padding: '80px 0',
    textAlign: 'center',
  },
  noResultsText: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    letterSpacing: '-0.02em',
    color: T.muted,
    textTransform: 'uppercase',
  },

  /* ── NORMAL CARD ── */
  card: {
    padding: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    cursor: 'default',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNum: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2.5rem',
    lineHeight: '1',
  },
  badge: {
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '4px 12px',
  },
  cardTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2.2rem',
    lineHeight: '0.95',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    margin: 0,
  },
  cardBody: {
    fontFamily: BODY,
    fontSize: '1rem',
    lineHeight: '1.65',
    margin: 0,
    fontWeight: '400',
    flex: 1,
  },
  cardDuration: {
    display: 'flex',
  },
  durationTag: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '700',
    padding: '4px 12px',
    display: 'inline-block',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: `4px solid`,
    paddingTop: '20px',
    marginTop: 'auto',
  },
  cardPrice: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2.2rem',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
  cardBtn: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '12px 20px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },

  /* ── WIDE CARD ── */
  wideCard: {
    padding: '48px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    alignItems: 'center',
    clipPath: 'polygon(2% 1%, 97% 0%, 100% 98%, 1% 100%)',
  },
  wideLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  wideTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  wideName: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
    lineHeight: '0.9',
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
    margin: 0,
    color: '#fff',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '700',
    padding: '5px 14px',
    border: `1px solid rgba(255,255,255,0.25)`,
    color: 'rgba(255,255,255,0.75)',
  },
  wideRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'flex-end',
  },
  wideImg: {
    width: '100%',
    height: '240px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'grayscale(100%) brightness(0.7) contrast(1.2)',
  },
  widePriceBlock: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  widePrice: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '3.5rem',
    lineHeight: '1',
    letterSpacing: '-0.03em',
    color: T.blue,
  },
  wideDuration: {
    fontFamily: LABEL,
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  wideBtn: {
    width: '100%',
    background: '#fff',
    color: T.black,
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.4rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '20px 32px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.15s, color 0.15s',
  },

  /* ── BOTTOM CTA ── */
  ctaSection: {
    maxWidth: '1440px',
    margin: '64px auto 0',
    padding: '0 48px',
  },
  ctaCard: {
    background: T.higher,
    padding: '64px',
    borderLeft: `8px solid ${T.blue}`,
    clipPath: 'polygon(0% 0%, 100% 2%, 98% 100%, 2% 97%)',
    position: 'relative',
  },
  ctaPin: {
    position: 'absolute',
    top: '-16px',
    right: '64px',
    fontSize: '3rem',
    transform: 'rotate(12deg)',
  },
  ctaTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: '0 0 20px',
    color: T.black,
  },
  ctaBody: {
    fontFamily: BODY,
    fontSize: '1.3rem',
    lineHeight: '1.6',
    color: T.muted,
    margin: '0 0 40px',
    maxWidth: '700px',
    fontWeight: '400',
  },
  ctaBtns: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  ctaBtnDark: {
    flex: 1,
    background: T.black,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textDecoration: 'none',
    padding: '22px 40px',
    textAlign: 'center',
    display: 'block',
    minWidth: '200px',
  },
  ctaBtnOutline: {
    flex: 1,
    background: 'transparent',
    color: T.black,
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textDecoration: 'none',
    padding: '22px 40px',
    textAlign: 'center',
    display: 'block',
    border: `4px solid ${T.black}`,
    minWidth: '200px',
  },

  /* ── MODAL ── */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: T.white,
    width: '100%',
    maxWidth: '540px',
    maxHeight: '92vh',
    overflowY: 'auto',
    border: `3px solid ${T.black}`,
    boxShadow: `8px 8px 0 ${T.black}`,
  },
  modalImg: {
    position: 'relative',
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  modalImgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15))',
  },
  modalImgText: {
    position: 'absolute',
    bottom: '24px',
    left: '28px',
    color: '#fff',
  },
  modalEyebrow: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.blue,
    display: 'block',
    marginBottom: '6px',
  },
  modalTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.8rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    margin: '0 0 4px',
    lineHeight: '1',
  },
  modalMeta: {
    fontFamily: LABEL,
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    margin: 0,
  },
  modalBody: {
    padding: '32px 36px 40px',
  },

  /* User info */
  userInfo: {
    borderLeft: `4px solid ${T.black}`,
    paddingLeft: '16px',
    marginBottom: '28px',
  },
  userInfoLabel: {
    fontFamily: LABEL,
    fontSize: '0.6rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#aaa',
    marginBottom: '4px',
    display: 'block',
  },
  userInfoName: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    color: T.black,
    margin: '0 0 2px',
  },
  userInfoEmail: {
    fontFamily: BODY,
    fontSize: '0.85rem',
    color: '#888',
    margin: 0,
  },

  errorMsg: {
    fontFamily: LABEL,
    fontSize: '0.82rem',
    color: T.red,
    borderLeft: `4px solid ${T.red}`,
    paddingLeft: '12px',
    marginBottom: '20px',
    lineHeight: '1.6',
    fontWeight: '500',
  },

  /* Form fields */
  field: { marginBottom: '28px' },
  label: {
    display: 'block',
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 0',
    border: 'none',
    borderBottom: `3px solid ${T.black}`,
    background: 'transparent',
    fontSize: '1rem',
    fontFamily: BODY,
    color: T.black,
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: '400',
  },

  /* Barbers */
  barbersNote: {
    fontFamily: LABEL,
    fontSize: '0.82rem',
    color: '#aaa',
    fontWeight: '400',
  },
  barberGrid: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  barberCard: {
    background: 'none',
    border: `2px solid ${T.sand}`,
    cursor: 'pointer',
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: '90px',
    transition: 'border-color 0.15s',
  },
  barberCardSelected: {
    border: `2px solid ${T.black}`,
    background: T.sand,
  },
  barberPhotoWrap: {
    position: 'relative',
    width: '56px',
    height: '56px',
  },
  barberPhoto: {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    display: 'block',
    filter: 'grayscale(100%)',
  },
  barberInitial: {
    width: '56px',
    height: '56px',
    background: T.sand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.4rem',
    color: T.black,
  },
  barberRing: {
    position: 'absolute',
    inset: 0,
    border: `2px solid ${T.black}`,
    pointerEvents: 'none',
  },
  barberName: {
    fontFamily: LABEL,
    fontSize: '0.75rem',
    color: T.black,
    fontWeight: '500',
    margin: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  barberSpec: {
    fontFamily: LABEL,
    fontSize: '0.62rem',
    color: '#aaa',
    fontWeight: '400',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  /* Payment */
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  paymentCard: {
    border: `2px solid ${T.sand}`,
    background: 'none',
    cursor: 'pointer',
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    textAlign: 'center',
    transition: 'border-color 0.15s',
  },
  paymentCardSelected: {
    border: `2px solid ${T.black}`,
    background: T.sand,
  },
  paymentIcon: { fontSize: '1.5rem', lineHeight: 1 },
  paymentLabel: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: T.black,
  },
  paymentSub: {
    fontFamily: BODY,
    fontSize: '0.7rem',
    color: '#aaa',
    fontWeight: '400',
  },
  paymentNote: {
    fontFamily: BODY,
    fontSize: '0.82rem',
    color: '#777',
    lineHeight: '1.7',
    borderLeft: `3px solid ${T.sand}`,
    paddingLeft: '12px',
    marginBottom: '20px',
  },

  /* Modal actions */
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  confirmBtn: {
    flex: 1,
    padding: '16px',
    background: T.black,
    color: '#fff',
    border: 'none',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cancelBtn: {
    flex: 1,
    padding: '16px',
    background: 'transparent',
    color: T.muted,
    border: `2px solid ${T.sand}`,
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },

  /* Success */
  successScreen: {
    padding: '56px 40px 48px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  successMark: {
    width: '64px',
    height: '64px',
    border: `3px solid ${T.black}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.8rem',
    color: T.black,
    marginBottom: '8px',
  },
  successEyebrow: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.blue,
  },
  successTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    color: T.black,
    margin: '8px 0',
    lineHeight: '1.1',
  },
  successDetails: {
    borderTop: `2px solid ${T.sand}`,
    borderBottom: `2px solid ${T.sand}`,
    padding: '20px 0',
    width: '100%',
  },
  successLine: {
    fontFamily: BODY,
    fontSize: '0.9rem',
    color: '#555',
    margin: '6px 0',
    fontWeight: '400',
  },
  successNote: {
    fontFamily: BODY,
    fontSize: '0.8rem',
    color: '#aaa',
    marginBottom: '16px',
  },
};