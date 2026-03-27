import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/hero-barber.jpg';

/* Fonts injected by Navbar.jsx */

/* ─── THEME ──────────────────────────────────────────────────────────── */
const T = {
  black:  '#0a0a0a',
  white:  '#fbf9f4',
  blue:   '#346190',
  red:    '#ba1a1a',
  sand:   '#eae8e3',
  muted:  '#444748',
  high:   '#eae8e3',   /* surface-container-high */
  higher: '#e4e2dd',   /* surface-container-highest */
};
const HEADLINE = "'Epilogue', 'Impact', sans-serif";
const BODY     = "'Work Sans', sans-serif";
const LABEL    = "'Space Grotesk', sans-serif";

/* ─── BARBERS DATA ───────────────────────────────────────────────────── */
const BARBERS = [
  {
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuCmYz-K0tzAvwW4xZuPlYJjwv8sK-W08BFYCdIVcoDTSDKWB04ROHQw-Ls2B-CLETItOk5Jw_8CWYaIIDVuy82W4DgD7D9CRgpZx5lPGXYlpbxhvyT2zXk_8JwvJKHYHvQ14oHxMO7YN-3W5-wrOU83NHFKN7CTnc4NK62uZpTvVQpwpqa180ODjqNez3ExVo735N--gkabnzBoYODgk5zbkv1Gz8PHm1GJjD8T6n8E_jWhXl8CbLau1ulMXApmjuyX6wp1lamZysYT',
    name:  'JACK "THE RIPPER"',
    spec:  'Precision Fades & Dark Roast Coffee',
    color: T.blue,
    textColor: '#fff',
    offset: 0,
  },
  {
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuDj2_FySpxhZ9VlqCFW0Gb9sQE0Hg7DBfzc3wvz2rzwwhgeDKsyeBBMFj4PzanPIwj_2G_jinnhczii3EvxjMN5dMTr1QLrQyW2zGsMPnnXkNT8mJOoffuAM3Rhu0ZNkS4BJ3853lvDtjKPwQqFwC4JySg-1efJnaWvwnJaD0Rengach6Qvs84TXKEXflVs7ttrYxUHO2Sv2W1TSaM1QiJJITKeSsBTlCOFKP92ZYvADavLorXYZV34npjsYaVXj25nZMQfr2BHUbVu',
    name:  'SARAH "VANDAL"',
    spec:  'Creative Color & Punk Texture',
    color: T.red,
    textColor: '#fff',
    offset: 48,
  },
  {
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuBa4HF6w_ajm-2U-QtqZesUcTZtk6ElBCf4-OuJfSnspRbyai9aX9YvlcnjfALP-ttvyCC_aoGJofhC9H59fBrE8magKSaFT66rXFfCpAR9sZN8ytuagTn8ZJI72QD913Ozh7JSIhymM0I1CU9cXhN49SURXbpq_BKXHChHOq2P7vIcNegRg0Nh-GU-5yudpvtJJjN3XXPn906wXzhs4q1Q1PDH-7JOPS8LR0YJdO_Jyl1gO3mEs9N6ql-BNHRUrs-E5CNnKfLMZNz2',
    name:  'MARCO "MUTE"',
    spec:  'Silent Services & Straight Razors',
    color: T.white,
    textColor: T.black,
    offset: 0,
  },
  {
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuCcpnN3zxT5C3fBJZTjBS9_r7j-qiL8jbOEMYMs0KYjXz75Yl_71ic81RRSjtXihemH-iIOEZ9C4fYcxqUOJrDQb5dvcn971cUwyt9OVaLB7rQr-uy5CnbCryWsudyTau1eyKRIGzJ2IP0bJvkrL1O9000XEpHVjHav7wpCCYLXMb2LjS1pMwKF5zNqkvZsHGb1ZZfhMih39mVuHCO3GBu38VzzoKvCFUvxbMN83kdaa-Sjt9_HbCq6teyieDQaNmwiGYQg8GXGPGY2',
    name:  'ELENA "THE BOSS"',
    spec:  'Classic Tapers & Business Advice',
    color: '#9fcaff',
    textColor: T.black,
    offset: 96,
  },
];

/* ─── SERVICES DATA ──────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    ),
    price: '$45',
    title: 'THE CHAOTIC CLEAN',
    body:  "A full cut, wash, and existential crisis management session. We'll make you look like you own the place.",
    bg:    T.white,
    shadow: `8px 8px 0 ${T.black}`,
    rotate: false,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7c0 5-4 9-8 9s-8-4-8-9"/><path d="M12 16v6"/><path d="M8 22h8"/>
      </svg>
    ),
    price: '$30',
    title: 'BEARD ANARCHY',
    body:  'Sculpting your facial hair into a weapon of mass distraction. Hot towel included, obviously.',
    bg:    T.blue,
    textWhite: true,
    shadow: 'none',
    rotate: true,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    price: '$65',
    title: 'THE FULL MUTINY',
    body:  'Color, cut, and a complete reimagining of who you are as a person. Not for the faint of heart.',
    bg:    T.higher,
    shadow: `8px 8px 0 ${T.red}`,
    rotate: false,
    iconRed: true,
  },
];

/* ─── BARBER CARD ────────────────────────────────────────────────────── */
function BarberCard({ barber }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...st.barberCard, marginTop: barber.offset }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={barber.img} alt={barber.name} style={st.barberImg} />
      <div style={{
        ...st.barberOverlay,
        background: barber.color,
        color: barber.textColor,
        transform: hovered ? 'translateY(0)' : 'translateY(100%)',
      }}>
        <p style={st.barberName}>{barber.name}</p>
        <p style={st.barberSpec}>Specialty: {barber.spec}</p>
      </div>
    </div>
  );
}

/* ─── HOME ───────────────────────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();

  const dashPath =
    user?.role === 'admin'  ? '/admin' :
    user?.role === 'barber' ? '/barber-dashboard' :
    '/dashboard';

  return (
    <div style={st.page}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={st.hero}>
        <div style={st.heroInner}>

          {/* Warning sticker */}
          <span style={st.warnSticker}>⚡ Warning: High Style</span>

          {/* Big title */}
          <div style={st.titleWrap}>
            <h1 style={st.heroTitle}>
              YOUR HAIR<br />
              <span style={st.heroTitleBlue}>DESERVES</span><br />
              BETTER.
            </h1>
          </div>

          <div style={st.heroBottom}>
            {/* Body + CTA */}
            <div style={st.heroText}>
              <p style={st.heroBody}>
                Look, we get it. Your current barber is "fine." But fine is for beige walls and lukewarm coffee.
                We do the kind of cuts that make strangers ask for your ID just to check if you're actually that cool.
              </p>
              <div style={st.heroCtas}>
                {!user ? (
                  <Link to="/register" style={st.ctaBig}>BOOK NOW</Link>
                ) : (
                  <>
                    <p style={st.welcomeBack}>
                      WELCOME BACK, <em>{user.name?.toUpperCase()}</em>
                    </p>
                    <Link to={dashPath} style={st.ctaBig}>
                      {user.role === 'admin' ? 'ADMIN PANEL' : user.role === 'barber' ? 'BARBER DASHBOARD' : 'YOUR DASHBOARD'}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Polaroid image */}
            <div style={st.heroImgWrap}>
              <img src={heroImg} alt="Sharp haircut" style={st.heroImg} />
              <div style={st.heroImgSticker}>Real Cut #402</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY SECTION
      ══════════════════════════════════════════════════ */}
      <section style={st.whySection}>
        <div style={st.whyInner}>

          {/* Left col */}
          <div style={st.whyLeft}>
            <h2 style={st.whyTitle}>
              HAIR ISN'T<br />JUST FILAMENTS<br />OF PROTEIN.
            </h2>

            <div style={st.pullQuote}>
              <p style={st.pullQuoteText}>
                "It's a statement. It's the first thing people see before you even open your mouth
                to explain why you're wearing a vintage tuxedo at a grocery store.
                If your hair is boring, you're essentially telling the world you've given up.
                Don't give up. Get a trim."
              </p>
              <div style={st.pullQuoteAttr}>— TRIMURA MANIFESTO, VOL 1.</div>
            </div>
          </div>

          {/* Right col — image */}
          <div style={st.whyRight}>
            <div style={st.whyImgWrap}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDETOfJr2OYI2Ic6LOEoJyh1_a1KTI_ke00PabjV0eKNPdDUquiYUbLpj6G_BU58sxstJYfJ4paeSn31Tdb2Wj-CGtIHmc87qFiDPAmgIqgeKXeGw8IhUuwYKwEiyCB2TwSRwV6t2k9RBWFCXcde_zd8bfuQR1DPhU_SULjH83KM3ydBoP5JlUz3yMoc5xNGBMvKFmaJnzXGjgLJMxfPbzNCkP9G1jonF7yLgH6Ovi-PwbLQNtOrfxXwZqpGoi3L6qyBx-4aTmus8rB"
                alt="Barber hands"
                style={st.whyImg}
              />
            </div>
            <div style={st.whyAccentCircle} />
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════════ */}
      <section style={st.servicesSection}>
        <div style={st.servicesInner}>
          <div style={st.servicesHeader}>
            <h3 style={st.servicesTitle}>WHAT WE DO</h3>
            <span style={st.servicesHint}>SELECT SERVICE TO PROCEED →</span>
          </div>

          <div style={st.servicesGrid}>
            {SERVICES.map((svc) => (
              <Link
                key={svc.title}
                to="/services"
                style={{
                  ...st.serviceCard,
                  background: svc.bg,
                  boxShadow: svc.shadow,
                  transform: svc.rotate ? 'rotate(-3deg)' : 'none',
                  color: svc.textWhite ? '#fff' : T.black,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!svc.rotate) e.currentTarget.style.transform = 'translateY(-8px)';
                  else e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = svc.rotate ? 'rotate(-3deg)' : 'none';
                }}
              >
                <div style={st.serviceCardTop}>
                  <span style={{ color: svc.iconRed ? T.red : 'inherit' }}>{svc.icon}</span>
                  <span style={st.servicePrice}>{svc.price}</span>
                </div>
                <h4 style={st.serviceTitle}>{svc.title}</h4>
                <p style={{ ...st.serviceBody, color: svc.textWhite ? 'rgba(255,255,255,0.88)' : T.muted }}>
                  {svc.body}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TEAM — THE CULPRITS
      ══════════════════════════════════════════════════ */}
      <section style={st.teamSection}>
        <div style={st.teamInner}>
          <h3 style={st.teamTitle}>THE CULPRITS</h3>
          <div style={st.teamGrid}>
            {BARBERS.map((b) => (
              <BarberCard key={b.name} barber={b} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BOOKING
      ══════════════════════════════════════════════════ */}
      <section style={st.bookingSection}>
        <div style={st.bookingInner}>
          <div style={st.bookingCard}>
            <h3 style={st.bookingTitle}>CLAIM YOUR TIME</h3>

            <div style={st.bookingForm}>
              {/* Barber select */}
              <div style={st.fieldGroup}>
                <label style={st.label}>WHICH HUMAN IS CUTTING YOU?</label>
                <select style={st.select}>
                  <option>ANYBODY WHO ISN'T ASLEEP</option>
                  <option>JACK THE RIPPER</option>
                  <option>SARAH VANDAL</option>
                  <option>MARCO MUTE</option>
                  <option>ELENA THE BOSS</option>
                </select>
              </div>

              {/* Date + time row */}
              <div style={st.fieldRow}>
                <div style={st.fieldGroup}>
                  <label style={st.label}>DATE OF RECKONING</label>
                  <input type="date" style={st.input} />
                </div>
                <div style={st.fieldGroup}>
                  <label style={st.label}>PREFERRED HOUR</label>
                  <select style={st.select}>
                    <option>MORNING (COFFEE)</option>
                    <option>NOON (LUNCH)</option>
                    <option>EVENING (FREEDOM)</option>
                  </select>
                </div>
              </div>

              {/* Submit — routes to /services for real booking */}
              <Link to="/services" style={st.bookingBtn}>
                CONFIRM MUTINY
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #346190; color: #fff; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const st = {
  page: {
    fontFamily: BODY,
    color: T.black,
    background: T.white,
    overflowX: 'hidden',
  },

  /* ── HERO ── */
  hero: {
    minHeight: '100vh',
    background: T.white,
    padding: '0 0 80px',
  },
  heroInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '80px 48px 0',
    position: 'relative',
  },
  warnSticker: {
    display: 'inline-block',
    background: T.red,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    padding: '6px 16px',
    fontWeight: '700',
    transform: 'rotate(-3deg)',
    marginBottom: '32px',
  },
  titleWrap: {
    transform: 'rotate(-1deg)',
    display: 'inline-block',
    marginBottom: '48px',
  },
  heroTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(4.5rem, 10vw, 9.5rem)',
    lineHeight: '0.88',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    color: T.black,
    margin: 0,
  },
  heroTitleBlue: {
    color: T.blue,
    fontStyle: 'italic',
  },
  heroBottom: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '64px',
    marginTop: '48px',
  },
  heroText: {
    maxWidth: '520px',
    flex: '0 0 auto',
  },
  heroBody: {
    fontSize: '1.2rem',
    lineHeight: '1.65',
    color: T.muted,
    marginBottom: '40px',
    fontWeight: '400',
  },
  heroCtas: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
  welcomeBack: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.blue,
    margin: 0,
  },
  ctaBig: {
    display: 'inline-block',
    background: T.black,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.5rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '20px 52px',
    textDecoration: 'none',
    boxShadow: `10px 10px 0 ${T.blue}`,
    transition: 'box-shadow 0.15s, transform 0.15s',
  },

  /* Polaroid image */
  heroImgWrap: {
    position: 'relative',
    flex: '0 0 auto',
    width: 'clamp(260px, 30vw, 420px)',
    padding: '16px',
    background: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    transform: 'rotate(2deg)',
  },
  heroImg: {
    width: '100%',
    display: 'block',
    filter: 'grayscale(100%) contrast(1.15)',
    aspectRatio: '4/5',
    objectFit: 'cover',
  },
  heroImgSticker: {
    position: 'absolute',
    bottom: '-20px',
    right: '-20px',
    background: T.blue,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.62rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '700',
    padding: '10px 14px',
    transform: 'rotate(-3deg)',
  },

  /* ── WHY SECTION ── */
  whySection: {
    background: '#f5f3ee',
    padding: '100px 0',
    overflow: 'hidden',
  },
  whyInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 48px',
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '80px',
    alignItems: 'center',
  },
  whyLeft: {},
  whyTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.8rem, 5vw, 5.5rem)',
    lineHeight: '0.9',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    color: T.black,
    margin: '0 0 48px',
  },
  pullQuote: {
    background: T.higher,
    borderLeft: `8px solid ${T.black}`,
    padding: '40px 48px',
    transform: 'rotate(1deg)',
    boxShadow: `12px 12px 0 ${T.outline}`,
  },
  pullQuoteText: {
    fontFamily: BODY,
    fontSize: '1.15rem',
    fontStyle: 'italic',
    lineHeight: '1.75',
    color: T.black,
    marginBottom: '24px',
    margin: '0 0 24px',
  },
  pullQuoteAttr: {
    fontFamily: LABEL,
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: T.blue,
    fontWeight: '700',
    textAlign: 'right',
    display: 'block',
  },
  whyRight: {
    position: 'relative',
  },
  whyImgWrap: {
    position: 'relative',
    zIndex: 1,
    padding: '16px',
    background: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    transform: 'rotate(-1.5deg)',
  },
  whyImg: {
    width: '100%',
    display: 'block',
    filter: 'grayscale(100%)',
    objectFit: 'cover',
    maxHeight: '400px',
  },
  whyAccentCircle: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: '#9fcaff',
    opacity: 0.5,
    zIndex: 0,
  },

  /* ── SERVICES ── */
  servicesSection: {
    padding: '100px 0',
    background: T.white,
  },
  servicesInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 48px',
  },
  servicesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '56px',
  },
  servicesTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(3rem, 5vw, 5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: 0,
    color: T.black,
  },
  servicesHint: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: T.red,
    fontWeight: '700',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px',
    alignItems: 'start',
  },
  serviceCard: {
    padding: '36px',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'block',
  },
  serviceCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
  },
  servicePrice: {
    fontFamily: LABEL,
    fontWeight: '700',
    fontSize: '1.4rem',
  },
  serviceTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.6rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    marginBottom: '16px',
    lineHeight: '1',
    margin: '0 0 16px',
  },
  serviceBody: {
    fontFamily: BODY,
    fontSize: '1rem',
    lineHeight: '1.65',
    margin: 0,
    fontWeight: '400',
  },

  /* ── TEAM ── */
  teamSection: {
    background: T.black,
    color: '#fff',
    padding: '80px 0 100px',
  },
  teamInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 48px',
  },
  teamTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(3.5rem, 7vw, 7rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.04em',
    textAlign: 'center',
    margin: '0 0 64px',
    color: '#fff',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    alignItems: 'start',
  },
  barberCard: {
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  barberImg: {
    width: '100%',
    height: '480px',
    objectFit: 'cover',
    display: 'block',
    filter: 'grayscale(100%)',
    transition: 'filter 0.5s',
  },
  barberOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px',
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
  },
  barberName: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    margin: '0 0 4px',
    letterSpacing: '-0.01em',
  },
  barberSpec: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    opacity: 0.8,
    margin: 0,
    fontWeight: '500',
  },

  /* ── BOOKING ── */
  bookingSection: {
    background: T.white,
    padding: '100px 0',
  },
  bookingInner: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 48px',
  },
  bookingCard: {
    background: '#fff',
    padding: '64px',
    border: `2px solid ${T.black}`,
    boxShadow: `16px 16px 0 ${T.black}`,
  },
  bookingTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    margin: '0 0 48px',
    color: T.black,
  },
  bookingForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
  },
  label: {
    fontFamily: LABEL,
    fontSize: '0.68rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
  },
  select: {
    width: '100%',
    padding: '16px 0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: `4px solid ${T.black}`,
    background: '#f5f3ee',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: T.black,
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '16px 0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: `4px solid ${T.black}`,
    background: '#f5f3ee',
    fontFamily: LABEL,
    fontSize: '0.9rem',
    color: T.black,
    outline: 'none',
  },
  bookingBtn: {
    display: 'block',
    width: '100%',
    background: T.black,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '28px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
    marginTop: '8px',
  },
};

/* Suppress the undefined T.outline reference */
T.outline = '#c4c7c7';