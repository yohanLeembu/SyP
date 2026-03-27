import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Roboto:wght@300;400;500&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Cormorant"]')) document.head.appendChild(fontLink);

const API = 'http://localhost:5000/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function Invoice() {
  const { id } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/bookings/${id}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load invoice.'); return r.json(); })
      .then(data => setInvoice(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div style={s.page}>
        <p style={s.loadingText}>Loading invoice…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={s.page}>
        <div style={s.errorCard}>
          <p style={s.errorTitle}>Could not load invoice</p>
          <p style={s.errorMsg}>{error || 'Invoice not found.'}</p>
          <Link to="/dashboard" style={s.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.payment.status === 'paid';

  return (
    <>
      <div style={s.page} id="invoice-page">
        <div style={s.invoiceCard}>

          {/* ── Actions bar (hidden in print) ── */}
          <div style={s.actionsBar} className="no-print">
            <Link to="/dashboard" style={s.backBtn}>← Dashboard</Link>
            <button style={s.printBtn} onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>

          {/* ── Header ── */}
          <div style={s.header}>
            <div>
              <h1 style={s.brand}>TRIMURA</h1>
              <p style={s.brandSub}>Premium Grooming Studio</p>
            </div>
            <div style={s.headerRight}>
              <p style={s.invoiceLabel}>INVOICE</p>
              <p style={s.invoiceNum}>{invoice.invoice_number}</p>
              <p style={s.invoiceDate}>Issued: {formatDate(invoice.issued_date)}</p>
            </div>
          </div>

          <div style={s.divider} />

          {/* ── Bill To + Appointment ── */}
          <div style={s.twoCol}>
            <div>
              <p style={s.sectionLabel}>BILL TO</p>
              <p style={s.clientName}>{invoice.customer.name}</p>
              <p style={s.clientEmail}>{invoice.customer.email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={s.sectionLabel}>APPOINTMENT</p>
              <p style={s.apptDate}>{formatDate(invoice.appointment.date)}</p>
              <p style={s.apptTime}>{formatTime(invoice.appointment.timeslot)}</p>
              <p style={s.apptBarber}>Barber: {invoice.barber_name}</p>
            </div>
          </div>

          {/* ── Line Items ── */}
          <div style={s.tableWrap}>
            <div style={s.tableHeader}>
              <span style={{ ...s.tableCol, flex: 3 }}>SERVICE</span>
              <span style={{ ...s.tableCol, flex: 1, textAlign: 'center' }}>DURATION</span>
              <span style={{ ...s.tableCol, flex: 1, textAlign: 'right' }}>AMOUNT</span>
            </div>
            <div style={s.tableRow}>
              <span style={{ ...s.tableCell, flex: 3 }}>{invoice.service.title}</span>
              <span style={{ ...s.tableCell, flex: 1, textAlign: 'center' }}>{invoice.service.duration_mins} min</span>
              <span style={{ ...s.tableCell, flex: 1, textAlign: 'right' }}>NPR {invoice.service.price.toLocaleString()}</span>
            </div>
          </div>

          {/* ── Totals ── */}
          <div style={s.totalsWrap}>
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Subtotal</span>
              <span style={s.totalValue}>NPR {invoice.total.toLocaleString()}</span>
            </div>
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Tax</span>
              <span style={s.totalValue}>NPR 0</span>
            </div>
            <div style={s.dividerThin} />
            <div style={s.totalRow}>
              <span style={s.grandTotalLabel}>Total</span>
              <span style={s.grandTotalValue}>NPR {invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {/* ── Payment info ── */}
          <div style={s.paymentSection}>
            <div style={s.paymentRow}>
              <span style={s.paymentLabel}>Payment Method</span>
              <span style={{
                ...s.paymentBadge,
                background: invoice.payment.method === 'khalti' ? '#5C2D8F' : '#2a6b3c',
              }}>
                {invoice.payment.method === 'khalti' ? 'Khalti' : 'Cash'}
              </span>
            </div>
            <div style={s.paymentRow}>
              <span style={s.paymentLabel}>Payment Status</span>
              <span style={{
                ...s.statusText,
                color: isPaid ? '#2a6b3c' : '#b8860b',
              }}>
                {isPaid ? 'Paid' : invoice.payment.status === 'pending' ? 'Pending' : invoice.payment.status}
              </span>
            </div>
            {invoice.payment.pidx && (
              <div style={s.paymentRow}>
                <span style={s.paymentLabel}>Transaction ID</span>
                <span style={s.pidxText}>{invoice.payment.pidx}</span>
              </div>
            )}
          </div>

          <div style={s.divider} />

          {/* ── Footer ── */}
          <div style={s.footer}>
            <p style={s.footerText}>
              Thank you for choosing Trimura. This invoice was generated automatically.
            </p>
            <p style={s.footerContact}>
              trimura.studio@gmail.com · Kathmandu, Nepal
            </p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #invoice-page { padding: 0 !important; min-height: auto !important; }
          #invoice-page > div { box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>
    </>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Roboto', sans-serif";
const GOLD  = '#b8966a';
const INK   = '#0e0e0e';
const CREAM = '#f6f4f0';

const s = {
  page: {
    background: CREAM,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '60px 24px 80px',
    fontFamily: SANS,
  },

  loadingText: {
    fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '300', color: '#aaa', fontStyle: 'italic', marginTop: '120px',
  },

  errorCard: { background: '#fff', padding: '48px', textAlign: 'center', maxWidth: '420px' },
  errorTitle: { fontFamily: SERIF, fontSize: '1.6rem', fontWeight: '300', color: INK, margin: '0 0 8px' },
  errorMsg: { fontFamily: SANS, fontSize: '0.88rem', color: '#aaa', fontWeight: '300', margin: '0 0 24px' },
  backLink: { fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none' },

  invoiceCard: {
    background: '#fff',
    maxWidth: '720px',
    width: '100%',
    padding: '56px 56px 48px',
    boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
  },

  /* Actions */
  actionsBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px',
  },
  backBtn: {
    fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#aaa', textDecoration: 'none', fontWeight: '400',
  },
  printBtn: {
    fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase',
    background: INK, color: '#fff', border: 'none', padding: '12px 28px', cursor: 'pointer', fontWeight: '400',
  },

  /* Header */
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontFamily: SERIF, fontSize: '2.2rem', fontWeight: '300', color: INK, margin: '0', letterSpacing: '0.08em' },
  brandSub: { fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '4px 0 0', fontWeight: '400' },
  headerRight: { textAlign: 'right' },
  invoiceLabel: { fontFamily: SANS, fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px', fontWeight: '400' },
  invoiceNum: { fontFamily: SERIF, fontSize: '1.6rem', fontWeight: '300', color: INK, margin: '0 0 4px' },
  invoiceDate: { fontFamily: SANS, fontSize: '0.78rem', color: '#aaa', margin: '0', fontWeight: '300' },

  divider: { height: '1px', background: '#e8e2d9', margin: '28px 0' },
  dividerThin: { height: '1px', background: '#f0ece6', margin: '8px 0' },

  /* Bill To + Appointment */
  twoCol: { display: 'flex', justifyContent: 'space-between', marginBottom: '36px' },
  sectionLabel: { fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontWeight: '400' },
  clientName: { fontFamily: SERIF, fontSize: '1.3rem', fontWeight: '300', color: INK, margin: '0 0 2px' },
  clientEmail: { fontFamily: SANS, fontSize: '0.82rem', color: '#aaa', fontWeight: '300', margin: '0' },
  apptDate: { fontFamily: SANS, fontSize: '0.88rem', color: '#555', fontWeight: '300', margin: '0 0 2px' },
  apptTime: { fontFamily: SANS, fontSize: '0.88rem', color: '#555', fontWeight: '300', margin: '0 0 2px' },
  apptBarber: { fontFamily: SANS, fontSize: '0.82rem', color: '#aaa', fontWeight: '300', margin: '4px 0 0' },

  /* Table */
  tableWrap: { marginBottom: '24px' },
  tableHeader: {
    display: 'flex', borderBottom: `2px solid ${INK}`, paddingBottom: '8px', marginBottom: '0',
  },
  tableCol: {
    fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', fontWeight: '400',
  },
  tableRow: {
    display: 'flex', padding: '16px 0', borderBottom: '1px solid #f0ece6',
  },
  tableCell: {
    fontFamily: SANS, fontSize: '0.92rem', color: '#444', fontWeight: '300',
  },

  /* Totals */
  totalsWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '32px', paddingRight: '0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', width: '240px', padding: '6px 0' },
  totalLabel: { fontFamily: SANS, fontSize: '0.82rem', color: '#999', fontWeight: '300' },
  totalValue: { fontFamily: SANS, fontSize: '0.88rem', color: '#555', fontWeight: '300' },
  grandTotalLabel: { fontFamily: SANS, fontSize: '0.88rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: INK, fontWeight: '500' },
  grandTotalValue: { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: '400', color: INK },

  /* Payment */
  paymentSection: { background: '#faf8f5', padding: '20px 24px', marginBottom: '28px' },
  paymentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' },
  paymentLabel: { fontFamily: SANS, fontSize: '0.78rem', color: '#999', fontWeight: '300' },
  paymentBadge: {
    fontFamily: SANS, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
    color: '#fff', padding: '3px 12px', fontWeight: '400',
  },
  statusText: { fontFamily: SANS, fontSize: '0.82rem', fontWeight: '500', textTransform: 'capitalize' },
  pidxText: { fontFamily: SANS, fontSize: '0.75rem', color: '#aaa', fontWeight: '300', fontFamily: "'Roboto Mono', monospace" },

  /* Footer */
  footer: { textAlign: 'center' },
  footerText: { fontFamily: SERIF, fontSize: '1.1rem', fontWeight: '300', fontStyle: 'italic', color: '#aaa', margin: '0 0 6px' },
  footerContact: { fontFamily: SANS, fontSize: '0.72rem', color: '#ccc', fontWeight: '300', margin: '0' },
};
