import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Inject fonts & global styles ──────────────────────────────────────── */
(function injectStyles() {
  if (!document.head.querySelector('[href*="Epilogue"]')) {
    const l = document.createElement('link');
    l.href = 'https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,900;1,900&family=Work+Sans:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap';
    l.rel = 'stylesheet';
    document.head.appendChild(l);
  }
  if (!document.head.querySelector('[href*="Material+Symbols"]')) {
    const l2 = document.createElement('link');
    l2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    l2.rel = 'stylesheet';
    document.head.appendChild(l2);
  }
  if (!document.head.querySelector('#trimura-barbers-style')) {
    const s = document.createElement('style');
    s.id = 'trimura-barbers-style';
    s.textContent = `
      .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        font-style: normal; line-height: 1; display: inline-block;
        white-space: nowrap; word-wrap: normal; direction: ltr; user-select: none;
      }
      .tb-card { cursor: pointer; transition: transform 0.15s; }
      .tb-card:hover { transform: translateY(-4px); }
      .tb-card:hover .tb-img { transform: scale(1.05); }
      .tb-img { transition: transform 0.5s; }
      .tb-featured-card { cursor: pointer; }
      .tb-featured-card:hover .tb-img { transform: scale(1.05); }
      .tb-book-btn { transition: background 0.15s, color 0.15s; }
      .tb-book-btn:hover { background: #346190 !important; color: #fff !important; }
      .tb-outline-btn { transition: background 0.15s, color 0.15s; }
      .tb-outline-btn:hover { background: #000 !important; color: #fff !important; }
      .tb-filter-btn { transition: transform 0.1s; }
      .tb-filter-btn:hover { transform: scale(1.05); }
      .tb-sticker-1 { transform: rotate(-1.5deg); }
      .tb-sticker-2 { transform: rotate(2deg); }
      .tb-sticker-3 { transform: rotate(-0.5deg); }
      .tb-star-btn { background: none; border: none; cursor: pointer; padding: 1px; line-height: 1; }
      @media (max-width: 900px) {
        .tb-featured-inner { flex-direction: column !important; }
        .tb-featured-img-wrap { width: 100% !important; min-height: 280px !important; }
        .tb-grid { grid-template-columns: 1fr !important; }
        .tb-hero-title { font-size: 5rem !important; }
        .tb-est-badge { right: 0 !important; }
      }
    `;
    document.head.appendChild(s);
  }
})();

const API = 'http://localhost:5000/api';

function parseSkills(specialty) {
  if (!specialty) return [];
  return specialty.split(/[,&]/).map(s => s.trim()).filter(Boolean);
}

/* ─── Stars (display only on directory) ─────────────────────────────────── */
function Stars({ value = 0, size = 14, color = '#346190' }) {
  const display = value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => {
        const filled = display >= i;
        const half   = !filled && display >= i - 0.5;
        return (
          <span key={i}>
            <svg width={size} height={size} viewBox="0 0 24 24">
              {half ? (<>
                <defs><clipPath id={`dh${i}`}><rect x="0" y="0" width="12" height="24"/></clipPath></defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="#d0d0d0" strokeWidth="1.5"/>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={color} stroke={color} strokeWidth="1.5" clipPath="url(#dh1)"/>
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

/* ─── Availability dot ───────────────────────────────────────────────────── */
function AvailDot({ status }) {
  const s = (status || 'available').toLowerCase();
  const map = {
    available: { color: '#22c55e', label: 'AVAILABLE NOW' },
    busy:      { color: '#f97316', label: 'BUSY' },
    off:       { color: '#ba1a1a', label: 'OFF DUTY' },
  };
  const { color, label } = map[s] || map.off;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em' }}>{label}</span>
    </div>
  );
}

/* ─── Featured card (first barber, spans 2 cols) ─────────────────────────── */
function FeaturedCard({ barber, index, onClick }) {
  const skills = parseSkills(barber.specialty);
  return (
    <div className="tb-featured-card" onClick={onClick}
      style={{ gridColumn: 'span 2', display: 'flex', border: '4px solid #000', background: '#fff', position: 'relative', cursor: 'pointer' }}>

      {/* TOP RATED badge */}
      <div className="tb-sticker-1" style={{ position: 'absolute', top: -30, left: -4, zIndex: 10, background: '#ba1a1a', color: '#fff', fontFamily: "'Epilogue', serif", fontStyle: 'italic', fontWeight: 900, fontSize: '1.3rem', padding: '6px 18px', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>TOP RATED</div>

      {/* Photo */}
      <div className="tb-featured-img-wrap tb-featured-inner" style={{ width: '50%', overflow: 'hidden', position: 'relative', minHeight: 420 }}>
        {barber.image_url ? (
          <img className="tb-img" src={barber.image_url} alt={barber.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1c1b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Epilogue', serif", fontSize: '8rem', fontWeight: 900, color: '#444', lineHeight: 1 }}>{barber.name[0]}</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: 14, left: 18, fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>0{index + 1}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f5f3ee' }}>
        <div>
          <h2 style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: 'clamp(2rem, 3vw, 3.5rem)', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            {barber.name}
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.45, marginBottom: 20 }}>
            {barber.specialty || 'BARBER'}{barber.experience ? ` / ${barber.experience} YRS EXP.` : ''}
          </p>
          <div style={{ marginBottom: 20 }}><AvailDot status={barber.availability_status} /></div>

          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {skills.map(sk => (
                <span key={sk} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: '2px solid #000', padding: '4px 10px' }}>{sk}</span>
              ))}
            </div>
          )}

          {barber.bio && (
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: '0.95rem', lineHeight: 1.75, color: '#555' }}>
              {barber.bio.length > 160 ? barber.bio.slice(0, 160) + '…' : barber.bio}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
          <button className="tb-book-btn"
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={{ background: '#000', color: '#fff', padding: '16px', fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '-0.01em', border: 'none', cursor: 'pointer', width: '100%' }}>
            VIEW PROFILE →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Standard card ──────────────────────────────────────────────────────── */
function BarberCard({ barber, index, badge, onClick }) {
  const isAvail = (barber.availability_status || 'available').toLowerCase() === 'available';
  return (
    <div className="tb-card" onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', border: '4px solid #000', background: '#fff', position: 'relative' }}>

      {badge && (
        <div className="tb-sticker-2" style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: '#346190', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', border: '2px solid #000' }}>{badge}</div>
      )}

      {/* Photo */}
      <div style={{ height: 300, overflow: 'hidden', position: 'relative' }}>
        {barber.image_url ? (
          <img className="tb-img" src={barber.image_url} alt={barber.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.3)', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1c1b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Epilogue', serif", fontSize: '5rem', fontWeight: 900, color: '#444', lineHeight: 1 }}>{barber.name[0]}</span>
          </div>
        )}
        {barber.experience && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: '#fff', padding: '4px 10px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.62rem', fontWeight: 700, border: '2px solid #000' }}>
            {barber.experience} YEARS
          </div>
        )}
        <span style={{ position: 'absolute', top: 12, left: 14, fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>0{index + 1}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '0 0 4px' }}>{barber.name}</h3>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.4, marginBottom: 16 }}>
          {barber.specialty || 'BARBER'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flex: 1 }}>
          <AvailDot status={barber.availability_status} />
        </div>
        <button
          className={isAvail ? 'tb-book-btn' : ''}
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{ width: '100%', background: isAvail ? '#000' : '#e4e2dd', color: isAvail ? '#fff' : 'rgba(0,0,0,0.3)', padding: '13px', fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '-0.01em', border: 'none', cursor: 'pointer' }}>
          VIEW PROFILE →
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/barbers`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setBarbers(data))
      .catch(() => setError('Could not load our team. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = barbers.filter(b => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || (b.specialty || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ background: '#fbf9f4', minHeight: '100vh', fontFamily: "'Work Sans', sans-serif", paddingBottom: 120 }}>

      {/* ── Hero + Search ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px 80px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 48 }}>
          <h1 className="tb-hero-title" style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: 0.85, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0 }}>
            THE<br/>CHOP<br/>SHOP
          </h1>
          <div className="tb-sticker-2 tb-est-badge" style={{ position: 'absolute', top: -6, right: -56, background: '#ba1a1a', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 12px', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>EST. 2024</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flex: '1 1 360px', minWidth: 240 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="FIND YOUR CUTTER..."
              style={{ width: '100%', boxSizing: 'border-box', background: '#eae8e3', border: 'none', borderBottom: '4px solid #000', padding: '18px 52px 18px 18px', fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.01em', outline: 'none', color: '#000' }} />
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '2rem', pointerEvents: 'none' }}>search</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 6 }}>
            {[
              { label: 'Experience', bg: '#346190', color: '#fff',    rot: 'rotate(-1.5deg)' },
              { label: 'Rating',     bg: '#e4e2dd', color: '#000',    rot: 'rotate(2deg)' },
              { label: 'Specialty',  bg: '#9fcaff', color: '#275583', rot: 'rotate(-0.5deg)' },
              { label: 'Available',  bg: '#fff',    color: '#000',    rot: 'rotate(-1.5deg)' },
            ].map(f => (
              <button key={f.label} className="tb-filter-btn"
                style={{ background: f.bg, color: f.color, transform: f.rot, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '10px 18px', border: '2px solid #000', cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 8, background: '#000' }} />

      {/* ── States ────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 48px' }}>
          <p style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#ccc' }}>LOADING…</p>
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: '80px 48px' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#ba1a1a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 48px' }}>
          <p style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#ccc', fontStyle: 'italic' }}>NO CUTTERS FOUND.</p>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px' }}>
          <div className="tb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '64px 48px', alignItems: 'start' }}>

            {filtered.map((b, i) => {
              const goToProfile = () => navigate(`/barbers/${b.id}`);
              if (i === 0) return <FeaturedCard key={b.id} barber={b} index={i} onClick={goToProfile} />;
              const badges = ['MOST BOOKED', 'RISING STAR', 'FAN FAVOURITE'];
              return <BarberCard key={b.id} barber={b} index={i} onClick={goToProfile} badge={i % 4 === 2 ? badges[(i - 1) % badges.length] : null} />;
            })}

            {/* Vacancy card */}
            <div className="tb-sticker-1" style={{ background: '#000', color: '#fff', padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 380, boxShadow: '8px 8px 0 rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontFamily: "'Epilogue', serif", fontWeight: 900, fontStyle: 'italic', fontSize: '2.6rem', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 18 }}>WANT TO<br/>JOIN<br/>TRIMURA?</h3>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 32 }}>WE'RE ALWAYS LOOKING FOR RAW TALENT. NO APOLOGIES. NO EGO. JUST CRAFT.</p>
              <button onClick={() => navigate('/vacancy')}
                style={{ background: '#fff', color: '#000', padding: '16px 28px', fontFamily: "'Epilogue', serif", fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '-0.01em', border: '4px solid #fff', cursor: 'pointer', alignSelf: 'flex-start' }}>
                APPLY NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}