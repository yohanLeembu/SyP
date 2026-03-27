import { useState } from 'react';
import { Link } from 'react-router-dom';

const HEADLINE = "'Epilogue', 'Impact', sans-serif";
const BODY     = "'Work Sans', sans-serif";
const LABEL    = "'Space Grotesk', sans-serif";
const T = {
  black: '#0a0a0a',
  white: '#fbf9f4',
  blue:  '#346190',
  red:   '#ba1a1a',
};

const LEGAL_LINKS = [
  { label: 'Privacy',   to: '/privacy'   },
  { label: 'Terms',     to: '/terms'     },
  { label: 'Contact',   to: '/contact'   },
  { label: 'Instagram', to: '/instagram' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSent(true);
      setEmail('');
    }
  };

  return (
    <footer style={s.footer}>
      {/* Top row */}
      <div style={s.top}>
        {/* Brand */}
        <div style={s.brand}>
          <span style={s.logo}>TRIMURA</span>
          <p style={s.tagline}>
            © {new Date().getFullYear()} TRIMURA.<br />
            STAY SHARP OR STAY HOME.
          </p>
        </div>

        {/* Legal links */}
        <div style={s.col}>
          <span style={s.colLabel}>LEGAL STUFF</span>
          {LEGAL_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} style={s.footLink}>
              {label.toUpperCase()}
            </Link>
          ))}
        </div>

        {/* Newsletter */}
        <div style={s.newsletterWrap}>
          <div style={s.newsletter}>
            <span style={s.newsletterTitle}>NEWSLETTER?</span>
            <p style={s.newsletterSub}>WE DON'T DO SPAM. WE JUST SEND VIBES.</p>
            {sent ? (
              <p style={s.sentMsg}>NICE. YOU'RE IN. ✓</p>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL"
                  style={s.input}
                  required
                />
                <button type="submit" style={s.submitBtn}>→</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={s.bottom}>
        <span style={s.bottomText}>KATHMANDU · EST. 2024</span>
        <span style={s.bottomText}>ALL CUTS FINAL. NO REFUNDS ON BAD CHOICES.</span>
      </div>
    </footer>
  );
}

const s = {
  footer: {
    background: T.black,
    color: '#fff',
    padding: '80px 48px 0',
    marginTop: '0',
    fontFamily: BODY,
  },

  top: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '64px',
    alignItems: 'start',
    paddingBottom: '80px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },

  /* Brand */
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  logo: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: 'clamp(3rem, 5vw, 5rem)',
    letterSpacing: '-0.04em',
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: '1',
  },
  tagline: {
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: '1.6',
  },

  /* Links column */
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  colLabel: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '700',
    marginBottom: '8px',
  },
  footLink: {
    fontFamily: HEADLINE,
    fontWeight: '700',
    fontSize: '1.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    transition: 'color 0.15s',
    lineHeight: '1.1',
  },

  /* Newsletter */
  newsletterWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  newsletter: {
    background: T.blue,
    padding: '36px 40px',
    transform: 'rotate(1.5deg)',
    maxWidth: '320px',
    width: '100%',
  },
  newsletterTitle: {
    fontFamily: HEADLINE,
    fontWeight: '900',
    fontSize: '1.8rem',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    display: 'block',
    marginBottom: '8px',
    color: '#fff',
  },
  newsletterSub: {
    fontFamily: LABEL,
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '20px',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    borderBottom: '2px solid rgba(255,255,255,0.6)',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontFamily: LABEL,
    fontSize: '0.85rem',
    letterSpacing: '0.1em',
    padding: '8px 0',
    textTransform: 'uppercase',
  },
  submitBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontFamily: HEADLINE,
    fontSize: '1.4rem',
    fontWeight: '900',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  sentMsg: {
    fontFamily: LABEL,
    fontSize: '0.85rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#fff',
    fontWeight: '700',
  },

  /* Bottom strip */
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  bottomText: {
    fontFamily: LABEL,
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
};