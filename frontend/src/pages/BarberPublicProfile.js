import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Inject fonts & global styles ──────────────────────────────────────── */
(function injectStyles() {
  if (!document.head.querySelector('[href*="Epilogue"]')) {
    const l = document.createElement('link');
    l.href = 'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,700;0,900;1,900&family=Work+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;700&display=swap';
    l.rel = 'stylesheet';
    document.head.appendChild(l);
  }
  if (!document.head.querySelector('[href*="Material+Symbols"]')) {
    const l2 = document.createElement('link');
    l2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    l2.rel = 'stylesheet';
    document.head.appendChild(l2);
  }
  if (!document.head.querySelector('#trimura-profile-style')) {
    const s = document.createElement('style');
    s.id = 'trimura-profile-style';
    s.textContent = `
      .bp-hero-img { filter: grayscale(1) contrast(1.25) brightness(0.9); transition: filter 0.7s; }
      .bp-hero-img:hover { filter: grayscale(0); }
      .bp-portfolio-item img { filter: grayscale(1) brightness(0.75); transition: filter 0.5s, transform 0.5s; }
      .bp-portfolio-item:hover img { filter: grayscale(0); transform: scale(1.1); }
      .bp-specialty-card { transition: transform 0.2s; }
      .bp-specialty-card:hover { transform: translateY(-6px); }
      .bp-review-card { transition: transform 0.15s; }
      .bp-review-card:hover { transform: rotate(0deg) !important; }
      .bp-back-btn { transition: transform 0.1s, background 0.15s; }
      .bp-back-btn:hover { background: #346190 !important; color: #fff !important; transform: rotate(-2deg); }
      @media (max-width: 900px) {
        .bp-hero-grid { grid-template-columns: 1fr !important; }
        .bp-hero-name { font-size: 4rem !important; }
        .bp-content-grid { grid-template-columns: 1fr !important; }
        .bp-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .bp-booking-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(s);
  }
})();

const API = 'http://localhost:5000/api';
const HEADLINE = "'Epilogue', 'Impact', sans-serif";
const BODY     = "'Work Sans', sans-serif";
const LABEL    = "'Space Grotesk', sans-serif";

const T = {
  black: '#0a0a0a',
  white: '#fbf9f4',
  blue:  '#346190',
  red:   '#ba1a1a',
  sand:  '#eae8e3',
  higher:'#e4e2dd',
  muted: '#444748',
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function parseSkills(specialty) {
  if (!specialty) return [];
  return specialty.split(/[,&]/).map(s => s.trim()).filter(Boolean);
}

function statusInfo(status) {
  const s = (status || 'available').toLowerCase();
  if (s === 'available')   return { color: '#22c55e', label: 'AVAILABLE', pulse: true };
  if (s === 'on_leave')    return { color: '#f97316', label: 'ON LEAVE',  pulse: false };
  return                          { color: '#ba1a1a', label: 'UNAVAILABLE', pulse: false };
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ─── Stars ────────────────────────────────────────────────────────────── */
function Stars({ value = 0, size = 14, color = '#346190' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => {
        const filled = value >= i;
        const half   = !filled && value >= i - 0.5;
        return (
          <span key={i}>
            <svg width={size} height={size} viewBox="0 0 24 24">
              {half ? (<>
                <defs><clipPath id={`ph${i}`}><rect x="0" y="0" width="12" height="24"/></clipPath></defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="#d0d0d0" strokeWidth="1.5"/>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={color} stroke={color} strokeWidth="1.5" clipPath={`url(#ph${i})`}/>
              </>) : (
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={filled ? color : 'none'} stroke={filled ? color : '#d0d0d0'} strokeWidth="1.5"/>
              )}
            </svg>
          </span>
        );
      })}
    </div>
  );
}

/* ─── FilledStar (for reviews) ─────────────────────────────────────────── */
function FilledStars({ count = 5, size = 13, color = T.blue }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={color} stroke={color} strokeWidth="1"/>
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function BarberPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [barber,  setBarber]  = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/barbers/${id}`).then(r => { if (!r.ok) throw new Error('Barber not found'); return r.json(); }),
      fetch(`${API}/barbers/${id}/reviews`).then(r => r.ok ? r.json() : { reviews: [], average: null, count: 0 }),
    ])
      .then(([barberData, reviewData]) => {
        setBarber(barberData);
        setReviews(reviewData.reviews || []);
        setAvgRating(reviewData.average ? parseFloat(reviewData.average) : null);
        setReviewCount(reviewData.count || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setReviewSubmitting(true);
    setReviewMsg('');
    try {
      const res = await fetch(`${API}/barbers/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, review_text: reviewText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReviewMsg('Review submitted!');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(5);
      // Refresh reviews
      const revRes = await fetch(`${API}/barbers/${id}/reviews`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
        setAvgRating(revData.average ? parseFloat(revData.average) : null);
        setReviewCount(revData.count || 0);
      }
    } catch (err) {
      setReviewMsg(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  /* ── Loading / Error ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ background: T.white, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', color: '#ccc', letterSpacing: '-0.02em' }}>LOADING…</p>
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div style={{ background: T.white, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <p style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: '2.5rem', textTransform: 'uppercase', color: T.red, letterSpacing: '-0.02em' }}>
          {error || 'BARBER NOT FOUND'}
        </p>
        <button className="bp-back-btn" onClick={() => navigate('/barbers')}
          style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', background: T.black, color: '#fff', border: 'none', padding: '14px 32px', cursor: 'pointer' }}>
          ← BACK TO BARBERS
        </button>
      </div>
    );
  }

  const skills = parseSkills(barber.specialty);
  const status = statusInfo(barber.availability_status);
  const portfolioImages = Array.isArray(barber.portfolio_images) ? barber.portfolio_images : [];
  const heroQuote = barber.bio ? (barber.bio.length > 140 ? `"${barber.bio.slice(0, 140)}…"` : `"${barber.bio}"`) : null;

  // Split name for styling
  const nameParts = barber.name.split(' ');
  const firstName = nameParts[0];
  const lastName  = nameParts.slice(1).join(' ');

  // Border colors for specialty cards
  const borderColors = [T.blue, T.black, T.red, T.blue, T.black, T.red, T.blue, T.black];

  // Rotation styles for review cards
  const reviewRotations = [
    { transform: 'rotate(1.5deg)', borderLeft: `4px solid ${T.blue}` },
    { transform: 'rotate(-2deg)', boxShadow: `8px 8px 0 0 ${T.black}` },
    { transform: 'rotate(0.5deg)', borderRight: `4px solid ${T.black}` },
    { transform: 'rotate(-1deg)', borderLeft: `4px solid ${T.red}` },
  ];

  return (
    <div style={{ background: T.white, minHeight: '100vh', fontFamily: BODY, color: T.black }}>

      {/* ── Black divider ─────────────────────────────────────────────────── */}
      <div style={{ height: 8, background: T.black }} />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px 0' }}>

        {/* Back button */}
        <button className="bp-back-btn" onClick={() => navigate('/barbers')}
          style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: T.sand, color: T.black, border: `2px solid ${T.black}`, padding: '10px 20px', cursor: 'pointer', marginBottom: 48 }}>
          ← BACK TO ALL BARBERS
        </button>

        <div className="bp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 0, marginBottom: 128, position: 'relative' }}>

          {/* Left: Photo */}
          <div style={{ position: 'relative' }}>
            {/* Badge */}
            {barber.experience && (
              <div style={{ position: 'absolute', top: -16, left: -16, zIndex: 10, background: T.blue, color: '#fff', padding: '6px 18px', fontFamily: LABEL, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', transform: 'rotate(1.5deg)', border: `2px solid ${T.black}`, boxShadow: `4px 4px 0 ${T.black}` }}>
                {barber.experience} YEARS EXPERIENCE
              </div>
            )}

            {barber.image_url ? (
              <img className="bp-hero-img" src={barber.image_url} alt={barber.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 500 }} />
            ) : (
              <div style={{ width: '100%', minHeight: 500, background: '#1c1b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: HEADLINE, fontSize: '12rem', fontWeight: 900, color: '#333', lineHeight: 1 }}>{firstName[0]}</span>
              </div>
            )}
          </div>

          {/* Right: Name + Status + Quote */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingLeft: 48, paddingTop: 48 }}>
            <h1 className="bp-hero-name" style={{ fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'normal', fontSize: 'clamp(3.5rem, 8vw, 9rem)', lineHeight: 0.85, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 24px' }}>
              {firstName}<br />
              {lastName && <span style={{ color: T.blue, fontStyle: 'italic' }}>{lastName}</span>}
            </h1>

            {/* Availability status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%', background: status.color,
                display: 'inline-block', flexShrink: 0,
                ...(status.pulse ? { animation: 'pulse 2s ease-in-out infinite' } : {}),
              }} />
              <span style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                STATUS: {status.label}
              </span>
            </div>

            {/* Rating summary */}
            {avgRating !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <Stars value={avgRating} size={20} color={T.blue} />
                <span style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.8rem', color: T.muted }}>
                  {avgRating} / 5 ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Hero quote */}
            {heroQuote && (
              <p style={{ fontFamily: HEADLINE, fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.4, borderLeft: `8px solid ${T.black}`, paddingLeft: 24, paddingTop: 8, paddingBottom: 8, margin: 0 }}>
                {heroQuote}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MANIFESTO (BIO) + SPECIALTIES
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 128px' }}>
        <div className="bp-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

          {/* Left: Bio / Manifesto */}
          <div style={{ background: T.higher, padding: 48, position: 'relative', boxShadow: `8px 8px 0 0 ${T.black}` }}>
            <h2 style={{ fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3.5rem)', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 32px' }}>
              THE MANIFESTO
            </h2>
            <div style={{ fontFamily: BODY, fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(10,10,10,0.85)' }}>
              {barber.bio ? (
                barber.bio.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} style={{ marginBottom: 20 }}>{p}</p>
                ))
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>This barber hasn't written their manifesto yet.</p>
              )}
            </div>

            {/* Contact info */}
            {(barber.email || barber.phone) && (
              <div style={{ marginTop: 40, paddingTop: 40, borderTop: '2px solid rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 16 }}>
                  REACH OUT
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {barber.email && (
                    <a href={`mailto:${barber.email}`} style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: T.black, color: '#fff', padding: '8px 16px', textDecoration: 'none' }}>
                      ✉ {barber.email}
                    </a>
                  )}
                  {barber.phone && (
                    <a href={`tel:${barber.phone}`} style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: T.black, color: '#fff', padding: '8px 16px', textDecoration: 'none' }}>
                      ☎ {barber.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Specialties */}
          <div>
            <h2 style={{ fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3.5rem)', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 32px' }}>
              SPECIALTIES
            </h2>

            {skills.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {skills.map((skill, i) => (
                  <div key={skill} className="bp-specialty-card"
                    style={{
                      background: '#fff',
                      padding: 24,
                      borderBottom: `4px solid ${borderColors[i % borderColors.length]}`,
                      ...(i % 2 === 1 ? { marginTop: 32 } : {}),
                    }}>
                    <h4 style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
                      {skill}
                    </h4>
                    <p style={{ fontFamily: BODY, fontSize: '0.85rem', color: 'rgba(10,10,10,0.6)', margin: 0, lineHeight: 1.6 }}>
                      Expert-level precision craft
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: LABEL, fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic' }}>No specialties listed yet.</p>
            )}

            {/* Experience highlight */}
            {barber.experience && (
              <div style={{ marginTop: 40, background: T.black, color: '#fff', padding: '32px 28px', boxShadow: `8px 8px 0 ${T.blue}` }}>
                <span style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: '4rem', lineHeight: 1, display: 'block', marginBottom: 4 }}>
                  {barber.experience}
                </span>
                <span style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  YEARS BEHIND THE CHAIR
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PORTFOLIO / EVIDENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {portfolioImages.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 128px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <h2 style={{ fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0 }}>
              EVIDENCE
            </h2>
            <span style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: T.blue }}>
              PORTFOLIO ({String(portfolioImages.length).padStart(3, '0')})
            </span>
          </div>

          <div className="bp-portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {portfolioImages.map((url, i) => (
              <div key={i} className="bp-portfolio-item"
                style={{
                  aspectRatio: '3/4',
                  overflow: 'hidden',
                  background: T.black,
                  position: 'relative',
                  ...(i % 2 === 1 ? { marginTop: 40 } : {}),
                }}>
                <img src={url} alt={`Portfolio ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REVIEWS — "THE CHATTER"
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 128px' }}>
        <div className="bp-booking-grid" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 64 }}>

          {/* Left: Book CTA */}
          <div style={{ background: T.black, color: '#fff', padding: '48px 56px', position: 'relative', boxShadow: `8px 8px 0 0 ${T.black}` }}>

            {/* Next available badge */}
            {barber.availability_status === 'available' && (
              <div style={{ position: 'absolute', top: -28, right: 32, background: T.red, color: '#fff', fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'italic', fontSize: '1.1rem', padding: '8px 20px', textTransform: 'uppercase', transform: 'rotate(-2deg)', border: `2px solid ${T.black}` }}>
                BOOKING OPEN
              </div>
            )}

            <h2 style={{ fontFamily: HEADLINE, fontWeight: 900, fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 24px' }}>
              SECURE YOUR<br/>SPOT
            </h2>
            <p style={{ fontFamily: BODY, fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
              Ready for the transformation? Head over to our services page to book an appointment with {firstName}.
            </p>

            <button
              onClick={() => navigate('/services')}
              style={{ width: '100%', background: '#fff', color: T.black, padding: '20px', fontFamily: HEADLINE, fontWeight: 900, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '-0.01em', border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.target.style.background = T.blue; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = T.black; }}
            >
              BOOK NOW →
            </button>

            {/* Write review button */}
            {user && (
              <button
                onClick={() => setShowReviewForm(f => !f)}
                style={{ width: '100%', marginTop: 16, background: 'transparent', color: '#fff', padding: '16px', fontFamily: HEADLINE, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.02em', border: `2px solid rgba(255,255,255,0.3)`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.target.style.borderColor = T.blue}
                onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              >
                {showReviewForm ? 'CANCEL REVIEW' : 'WRITE A REVIEW'}
              </button>
            )}

            {/* Review form */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} style={{ marginTop: 28 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>RATING</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button" onClick={() => setReviewRating(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <svg width={24} height={24} viewBox="0 0 24 24">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                            fill={i <= reviewRating ? T.blue : 'none'} stroke={i <= reviewRating ? T.blue : '#555'} strokeWidth="1.5"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>YOUR THOUGHTS</label>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                    rows={3} placeholder="Share your experience..."
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', padding: '14px', fontFamily: BODY, fontSize: '0.95rem', resize: 'vertical', outline: 'none' }} />
                </div>
                {reviewMsg && (
                  <p style={{ fontFamily: LABEL, fontSize: '0.75rem', color: reviewMsg.includes('submitted') ? '#22c55e' : T.red, marginBottom: 12 }}>{reviewMsg}</p>
                )}
                <button type="submit" disabled={reviewSubmitting}
                  style={{ background: T.blue, color: '#fff', border: 'none', padding: '14px 28px', fontFamily: HEADLINE, fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', cursor: 'pointer', opacity: reviewSubmitting ? 0.6 : 1 }}>
                  {reviewSubmitting ? 'SUBMITTING…' : 'SUBMIT REVIEW'}
                </button>
              </form>
            )}
          </div>

          {/* Right: Reviews collage */}
          <div>
            <h3 style={{ fontFamily: HEADLINE, fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' }}>
              THE CHATTER
            </h3>

            {reviews.length === 0 ? (
              <div style={{ background: T.higher, padding: 32, textAlign: 'center' }}>
                <p style={{ fontFamily: LABEL, fontSize: '0.8rem', color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  NO REVIEWS YET — BE THE FIRST
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {reviews.slice(0, 6).map((rev, i) => {
                  const style = reviewRotations[i % reviewRotations.length];
                  const bgOptions = [T.higher, '#fff', '#f5f3ee', '#fff'];
                  return (
                    <div key={rev.id} className="bp-review-card"
                      style={{
                        background: bgOptions[i % bgOptions.length],
                        padding: '24px 28px',
                        ...style,
                        ...(i % 2 === 1 ? { marginLeft: -32 } : { marginRight: -16 }),
                      }}>
                      <div style={{ marginBottom: 8 }}>
                        <FilledStars count={rev.rating} size={13} color={i % 2 === 0 ? T.blue : T.red} />
                      </div>
                      {rev.review_text && (
                        <p style={{ fontFamily: i % 2 === 0 ? BODY : HEADLINE, fontSize: i % 2 === 0 ? '0.92rem' : '1.05rem', fontStyle: 'italic', fontWeight: i % 2 === 0 ? 400 : 700, lineHeight: 1.6, margin: '0 0 12px', color: 'rgba(10,10,10,0.85)' }}>
                          "{rev.review_text}"
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: LABEL, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.4)' }}>
                          — {rev.reviewer_name}
                        </span>
                        <span style={{ fontFamily: LABEL, fontSize: '0.6rem', color: 'rgba(10,10,10,0.3)' }}>
                          {timeAgo(rev.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pulse keyframes ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
