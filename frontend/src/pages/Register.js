import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

/* Fonts injected by Navbar.jsx */

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

export default function Register() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'member' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── Submit (unchanged) ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.register(form);
      setSuccess('Account created. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={st.page}>

      {/* Decorative background text */}
      <div style={st.bgWordLeft}  aria-hidden="true">RAW</div>
      <div style={st.bgWordRight} aria-hidden="true">ESTD. 2024</div>

      <div style={st.inner}>

        {/* ── LEFT — messaging ── */}
        <div style={st.left}>

          {/* Big headline */}
          <div style={st.headlineWrap}>
            {/* "NO REFUNDS" sticker */}
            <div style={st.noRefundsSticker}>
              NO REFUNDS ON<br />BAD DECISIONS.
            </div>

            <h1 style={st.heroTitle}>
              JOIN THE<br />
              <span style={st.heroInvert}>REBELLION.</span>
            </h1>
          </div>

          {/* Pull quote box */}
          <div style={st.pullBox}>
            <p style={st.pullBoxHead}>WE DON'T DO COMPROMISES.</p>
            <p style={st.pullBoxBody}>
              Trimura is for the bold, the loud, and the unapologetic.
              If you're looking for a "safe" haircut, you're in the wrong shop.
              Register to claim your spot in the chair.
            </p>
          </div>

          {/* Barber image */}
          <div style={st.imgWrap}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYGI2McIYQ_ur9wjmQk8mchwbnB5oG6Q6n37Z-ObmZtRBZ7UZk--rKD7FPiCUZyvhwel2pszgFeiioiiivsemKub8kpZDOdNsrc9vGgyCe8jIbamC38WIt8JATw5sglNG1Axzau2vCq_tVfA_sXL-U1TQtH-7vS2NJ3wYEPxoa8QVZ8sbWaazB7dOK_X7ehCtP-XTSvSe4NGXVIqR1CLnNvI8ufZJtnYCSkwL2SI3r0BV1-2JQDzrHa5_49UNRYIfirv-rlE5URQeG"
              alt="Barber"
              style={st.img}
            />
          </div>
        </div>

        {/* ── RIGHT — registration form ── */}
        <div style={st.right}>

          {error   && <div style={st.error}>{error}</div>}
          {success && <div style={st.successMsg}>{success}</div>}

          <form onSubmit={handleSubmit} style={st.form}>

            <div style={st.formGrid}>
              {/* Name */}
              <div style={st.field}>
                <label style={st.label} htmlFor="name">WHO ARE YOU?</label>
                <input
                  style={st.input}
                  id="name" type="text" name="name" required
                  placeholder="FULL NAME"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              {/* Phone placeholder — not in original model but shown in HTML */}
              <div style={st.field}>
                <label style={st.label} htmlFor="role">ACCOUNT TYPE</label>
                <select
                  style={{ ...st.input, cursor: 'pointer' }}
                  id="role" name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="member">MEMBER</option>
                  <option value="barber">BARBER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div style={st.field}>
              <label style={st.label} htmlFor="email">ELECTRONIC MAIL</label>
              <input
                style={st.input}
                id="email" type="email" name="email" required
                placeholder="EMAIL ADDRESS"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div style={st.field}>
              <label style={st.label} htmlFor="password">YOUR SECRET CODE</label>
              <input
                style={st.input}
                id="password" type="password" name="password" required
                placeholder="PASSWORD"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{ ...st.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'CREATING ACCOUNT…' : 'SIGN ME UP'}
            </button>

            {/* Back to login */}
            <Link to="/login" style={st.loginLink}>
              Already part of the crew?{' '}
              <span style={st.loginLinkHighlight}>Back to login.</span>
            </Link>

          </form>

          {/* "LIMITED SLOTS" sticker */}
          <div style={st.limitedSticker}>BETTER LATE THAN NEVER</div>
        </div>
      </div>

      {/* Bottom ghost text */}
      <div style={st.ghostLine} aria-hidden="true">
        Lather. Rinse. Repeat the Rebellion.
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #346190; color: #fff; }
        input::placeholder, select::placeholder { opacity: 0.2; }
        input:focus, select:focus { background: ${T.sand} !important; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const st = {
  page: {
    minHeight: '100vh',
    background: T.white,
    fontFamily: BODY,
    color: T.black,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '48px',
    paddingBottom: '96px',
  },

  /* Background decorative words */
  bgWordLeft: {
    position: 'absolute',
    top: '80px',
    left: '-24px',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '12rem',
    textTransform: 'uppercase',
    color: T.higher,
    opacity: 0.5,
    userSelect: 'none',
    pointerEvents: 'none',
    lineHeight: '1',
    zIndex: 0,
    writingMode: 'vertical-rl',
    letterSpacing: '-0.05em',
  },
  bgWordRight: {
    position: 'absolute',
    bottom: '80px',
    right: '-48px',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '10rem',
    textTransform: 'uppercase',
    color: T.higher,
    opacity: 0.35,
    userSelect: 'none',
    pointerEvents: 'none',
    lineHeight: '1',
    zIndex: 0,
    transform: 'rotate(-12deg)',
    letterSpacing: '-0.05em',
  },

  /* Main two-col grid */
  inner: {
    maxWidth: '1600px',
    width: '100%',
    padding: '0 48px',
    display: 'grid',
    gridTemplateColumns: '5fr 7fr',
    gap: '48px',
    alignItems: 'start',
    position: 'relative',
    zIndex: 1,
  },

  /* ── LEFT ── */
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    marginTop: '48px',
  },
  headlineWrap: {
    position: 'relative',
  },
  noRefundsSticker: {
    position: 'absolute',
    top: '-48px',
    right: '-32px',
    background: T.blue,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '10px 16px',
    lineHeight: '1.5',
    transform: 'rotate(6deg)',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
    zIndex: 20,
  },
  heroTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(4rem, 7vw, 7.5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.04em',
    lineHeight: '0.88',
    color: T.black,
    margin: 0,
  },
  heroInvert: {
    display: 'inline-block',
    background: T.black,
    color: '#fff',
    fontStyle: 'italic',
    padding: '0 12px',
    transform: 'rotate(-1deg)',
  },

  pullBox: {
    background: T.higher,
    borderLeft: `8px solid ${T.black}`,
    padding: '28px 28px 28px 32px',
    transform: 'rotate(-1deg)',
    maxWidth: '380px',
  },
  pullBoxHead: {
    fontFamily: BODY,
    fontWeight: '600',
    fontSize: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: T.black,
    marginBottom: '10px',
  },
  pullBoxBody: {
    fontFamily: BODY,
    fontSize: '0.92rem',
    lineHeight: '1.65',
    color: T.muted,
    fontWeight: '400',
    margin: 0,
  },

  imgWrap: {
    border: `4px solid ${T.black}`,
    transform: 'rotate(-2deg)',
    overflow: 'hidden',
    boxShadow: 'none',
  },
  img: {
    width: '100%',
    display: 'block',
    height: '240px',
    objectFit: 'cover',
    filter: 'grayscale(100%) contrast(1.2)',
  },

  /* ── RIGHT ── */
  right: {
    background: '#f5f3ee',
    border: `8px solid ${T.black}`,
    padding: '48px',
    position: 'relative',
    boxShadow: `16px 16px 0 ${T.black}`,
    transform: 'rotate(0.5deg)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '28px',
  },
  field: {
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontFamily: LABEL,
    fontSize: '0.62rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: 'rgba(10,10,10,0.4)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `4px solid ${T.black}`,
    padding: '12px 0',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.4rem',
    letterSpacing: '0.01em',
    color: T.black,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'background 0.15s',
    appearance: 'none',
  },
  submitBtn: {
    width: '100%',
    background: T.black,
    color: '#fff',
    border: `4px solid ${T.black}`,
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    padding: '24px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.15s',
    marginBottom: '24px',
  },
  loginLink: {
    fontFamily: LABEL,
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center',
    marginTop: '8px',
  },
  loginLinkHighlight: {
    textDecoration: 'underline',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
  },

  /* Sticker */
  limitedSticker: {
    position: 'absolute',
    bottom: '-24px',
    left: '-24px',
    background: T.red,
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '10px 16px',
    transform: 'rotate(-12deg)',
    zIndex: 20,
  },

  /* Error / success */
  error: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.red,
    borderLeft: `4px solid ${T.red}`,
    paddingLeft: '12px',
    marginBottom: '28px',
    lineHeight: '1.6',
  },
  successMsg: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#2a6b3c',
    borderLeft: '4px solid #2a6b3c',
    paddingLeft: '12px',
    marginBottom: '28px',
    lineHeight: '1.6',
  },

  /* Ghost bottom line */
  ghostLine: {
    marginTop: '80px',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
    textTransform: 'uppercase',
    color: T.black,
    opacity: 0.1,
    letterSpacing: '-0.02em',
    userSelect: 'none',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
};