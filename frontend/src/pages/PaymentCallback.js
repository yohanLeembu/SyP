import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Roboto:wght@300;400;500&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Cormorant"]')) document.head.appendChild(fontLink);

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');  // 'loading' | 'success' | 'failed'

  const success  = params.get('success') === 'true';
  const reason   = params.get('reason') || 'Payment was not completed.';
  const service  = params.get('service');
  const barber   = params.get('barber');
  const date     = params.get('date');
  const timeslot = params.get('timeslot');
  const txnId    = params.get('txnId');
  const bookingId = params.get('bookingId');

  useEffect(() => {
    // Small delay so the page doesn't flash
    const t = setTimeout(() => setStatus(success ? 'success' : 'failed'), 300);
    return () => clearTimeout(t);
  }, [success]);

  if (status === 'loading') {
    return (
      <div style={s.page}>
        <p style={s.loading}>Verifying payment…</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {status === 'success' ? (
          <>
            {/* Success */}
            <div style={s.iconWrap}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#b8966a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={s.eyebrow}>Payment Confirmed</p>
            <h1 style={s.title}>Your appointment<br />is reserved.</h1>

            <div style={s.details}>
              {service  && <div style={s.detailRow}><span style={s.detailLabel}>Service</span><span style={s.detailValue}>{service}</span></div>}
              {barber   && <div style={s.detailRow}><span style={s.detailLabel}>Barber</span><span style={s.detailValue}>{barber}</span></div>}
              {date     && <div style={s.detailRow}><span style={s.detailLabel}>Date</span><span style={s.detailValue}>{date}</span></div>}
              {timeslot && <div style={s.detailRow}><span style={s.detailLabel}>Time</span><span style={s.detailValue}>{timeslot.slice(0,5)}</span></div>}
              {txnId    && <div style={s.detailRow}><span style={s.detailLabel}>Transaction ID</span><span style={{ ...s.detailValue, fontSize: '0.78rem', color: '#aaa' }}>{txnId}</span></div>}
            </div>

            <p style={s.note}>
              A notification has been sent to your account. You can view your booking in your dashboard.
            </p>

            <div style={s.actions}>
              {bookingId && <Link to={`/invoice/${bookingId}`} style={{ ...s.primaryBtn, background: '#b8966a' }}>View Invoice</Link>}
              <Link to="/dashboard" style={s.primaryBtn}>Go to Dashboard</Link>
              <Link to="/services"  style={s.secondaryBtn}>Book Another</Link>
            </div>
          </>
        ) : (
          <>
            {/* Failed */}
            <div style={{ ...s.iconWrap, borderColor: '#c0392b' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p style={{ ...s.eyebrow, color: '#c0392b' }}>Payment Failed</p>
            <h1 style={s.title}>Something went<br />wrong.</h1>
            <p style={s.note}>{decodeURIComponent(reason)}</p>
            <p style={s.note}>Your booking has not been confirmed. Please try again.</p>

            <div style={s.actions}>
              <Link to="/services" style={s.primaryBtn}>Try Again</Link>
              <Link to="/"         style={s.secondaryBtn}>Go Home</Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Roboto', sans-serif";
const GOLD  = '#b8966a';
const INK   = '#0e0e0e';
const CREAM = '#f6f4f0';

const s = {
  page:    { background: CREAM, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: SANS },
  loading: { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', color: '#aaa', fontStyle: 'italic' },

  card:    { background: '#fff', maxWidth: '480px', width: '100%', padding: '64px 56px', textAlign: 'center' },

  iconWrap:{ width: '68px', height: '68px', border: `1px solid ${GOLD}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' },

  eyebrow: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '16px', fontWeight: '400' },
  title:   { fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '300', color: INK, margin: '0 0 36px', lineHeight: '1.2' },

  details: { borderTop: '1px solid #e8e2d9', borderBottom: '1px solid #e8e2d9', padding: '24px 0', margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  detailRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  detailLabel: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#aaa', fontWeight: '400' },
  detailValue: { fontFamily: SANS, fontSize: '0.95rem', color: '#444', fontWeight: '300' },

  note:    { fontFamily: SANS, fontSize: '0.85rem', color: '#aaa', fontWeight: '300', marginBottom: '36px', lineHeight: '1.7' },

  actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
  primaryBtn:   { display: 'block', background: INK, color: '#fff', textDecoration: 'none', fontFamily: SANS, fontSize: '0.82rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '16px', fontWeight: '400' },
  secondaryBtn: { display: 'block', background: 'transparent', color: '#888', textDecoration: 'none', fontFamily: SANS, fontSize: '0.82rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '14px', border: '1px solid #ddd', fontWeight: '400' },
};