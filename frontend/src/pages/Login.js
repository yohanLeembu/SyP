import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── Submit (unchanged) ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(form);
      login(data.token, data.user);
      navigate(
        data.user.role === 'admin'  ? '/admin' :
        data.user.role === 'barber' ? '/barber-dashboard' :
        '/dashboard'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={st.page}>

      {/* ── LEFT — brand panel ── */}
      <section style={st.left}>

        {/* Logo */}
        <h1 style={st.logo}>TRIMURA</h1>

        {/* Headline */}
        <div style={st.leftMiddle}>
          <p style={st.leftHeadline}>GET BACK IN<br />THE CHAIR.</p>
          <p style={st.leftBody}>
            You look like you've seen better days. Luckily, we're better
            than most days. Log in and fix it.
          </p>
        </div>

        {/* Bottom stickers */}
        <div style={st.stickers}>
          <span style={{ ...st.sticker, background: T.blue, transform: 'rotate(-2deg)' }}>
            EST. 2024 / RAW CUTS
          </span>
          <span style={{ ...st.sticker, background: T.higher, color: T.black, transform: 'rotate(3deg)' }}>
            NO COMPROMISE
          </span>
        </div>
      </section>

      {/* ── RIGHT — form panel ── */}
      <section style={st.right}>
        <div style={st.formWrap}>

          {/* Form */}
          <form onSubmit={handleSubmit} style={st.form}>

            {error && <div style={st.error}>{error}</div>}

            {/* Email */}
            <div style={st.field}>
              <label style={st.label} htmlFor="email">EMAIL</label>
              <input
                style={st.input}
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Password */}
            <div style={st.field}>
              <label style={st.label} htmlFor="password">PASSWORD</label>
              <input
                style={st.input}
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="password"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{ ...st.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              <span>{loading ? 'LOGGING IN…' : 'LOGIN'}</span>
              <span style={st.arrow}>→</span>
            </button>

            {/* Footer links */}
            <div style={st.formLinks}>
              <Link to="/register" style={st.formLink}>
                Don't have an account?{' '}
                <span style={st.formLinkHighlight}>Join the crew</span>
              </Link>
            </div>
          </form>

          {/* Decorative quote block */}
          <div style={st.quoteBlock}>
            <span style={st.quoteMark}>"</span>
            <p style={st.quoteText}>
              The best haircut I ever had was while I was logged into this portal.
              Coincidence? I think not.
            </p>
            <div style={st.quoteAttr}>— A SATISFIED REBEL</div>
          </div>
        </div>
      </section>

      {/* Fixed corner sticker */}
      <div style={st.cornerSticker}>
        LOGIN OR<br />WALK AWAY
      </div>

      {/* Fixed footer meta */}
      <div style={st.footerMeta}>
        TRIMURA DIGITAL TERMINAL // VER. 4.0.2 // ACCESS RESTRICTED
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #346190; color: #fff; }
        input::placeholder { opacity: 0.2; }
        input:focus { background: ${T.sand} !important; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const st = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: BODY,
    background: T.white,
    position: 'relative',
    overflow: 'hidden',
  },

  /* ── LEFT ── */
  left: {
    flex: 1,
    padding: '64px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRight: `8px solid ${T.black}`,
    position: 'relative',
    background: T.white,
  },
  logo: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 'clamp(3.5rem, 6vw, 6rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.04em',
    lineHeight: '1',
    color: T.black,
    margin: 0,
  },
  leftMiddle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: '48px',
  },
  leftHeadline: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
    textTransform: 'uppercase',
    letterSpacing: '-0.03em',
    lineHeight: '1.05',
    color: T.black,
    margin: '0 0 24px',
  },
  leftBody: {
    fontFamily: BODY,
    fontSize: '1.15rem',
    lineHeight: '1.65',
    color: T.muted,
    maxWidth: '380px',
    fontWeight: '400',
  },
  stickers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
  },
  sticker: {
    fontFamily: LABEL,
    fontWeight: '700',
    fontSize: '0.95rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#fff',
    padding: '14px 20px',
    display: 'inline-block',
    border: `2px solid ${T.black}`,
    boxShadow: `4px 4px 0 ${T.black}`,
  },

  /* ── RIGHT ── */
  right: {
    flex: 1,
    background: '#f5f3ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 48px',
  },
  formWrap: {
    width: '100%',
    maxWidth: '480px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  field: {
    marginBottom: '40px',
    position: 'relative',
  },
  label: {
    display: 'block',
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: 'rgba(10,10,10,0.4)',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `4px solid ${T.black}`,
    padding: '14px 0',
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: '1.5rem',
    letterSpacing: '0.02em',
    color: T.black,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'background 0.15s',
  },
  submitBtn: {
    marginTop: '8px',
    width: '100%',
    background: T.black,
    color: '#fff',
    border: 'none',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '2rem',
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    padding: '24px 32px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.15s, transform 0.1s',
  },
  arrow: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  formLinks: {
    marginTop: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formLink: {
    fontFamily: LABEL,
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
    textDecoration: 'none',
  },
  formLinkHighlight: {
    textDecoration: 'underline',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
  },

  /* Quote block */
  quoteBlock: {
    marginTop: '48px',
    padding: '32px 32px 32px 40px',
    background: T.higher,
    borderLeft: `8px solid ${T.black}`,
    position: 'relative',
  },
  quoteMark: {
    position: 'absolute',
    top: '-24px',
    right: '16px',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '6rem',
    lineHeight: '1',
    color: 'rgba(10,10,10,0.08)',
    userSelect: 'none',
  },
  quoteText: {
    fontFamily: BODY,
    fontSize: '1rem',
    fontStyle: 'italic',
    lineHeight: '1.7',
    color: T.muted,
    margin: '0 0 16px',
    fontWeight: '400',
  },
  quoteAttr: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.black,
  },

  /* Error */
  error: {
    fontFamily: LABEL,
    fontSize: '0.78rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: T.red,
    borderLeft: `4px solid ${T.red}`,
    paddingLeft: '12px',
    marginBottom: '32px',
    lineHeight: '1.6',
  },

  /* Fixed corner sticker */
  cornerSticker: {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    zIndex: 50,
    background: T.red,
    color: '#fff',
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.2rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    padding: '20px 24px',
    transform: 'rotate(-12deg)',
    border: `4px solid ${T.black}`,
    boxShadow: `8px 8px 0 ${T.black}`,
    lineHeight: '1.3',
    pointerEvents: 'none',
  },

  /* Footer meta */
  footerMeta: {
    position: 'fixed',
    bottom: '16px',
    left: '24px',
    zIndex: 50,
    fontFamily: LABEL,
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(10,10,10,0.3)',
    fontWeight: '500',
    pointerEvents: 'none',
  },
};