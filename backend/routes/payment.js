// routes/payment.js
const express = require('express');
const axios   = require('axios');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Khalti production API base (live keys)
const KHALTI_API    = 'https://a.khalti.com/api/v2/epayment';
const SECRET_KEY    = process.env.KHALTI_SECRET_KEY;
const BASE_URL      = process.env.BASE_URL      || 'http://localhost:5000';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'http://localhost:3000';

// ── Helper: insert a notification ─────────────────────────────────────────────
async function notify(user_id, message) {
  await pool.query(
    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [user_id, message]
  );
}

function timeToMins(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ── POST /api/payment/khalti/initiate ─────────────────────────────────────────
// Called when user chooses Khalti. Creates a pending booking, then asks
// Khalti to initiate the payment and returns the payment_url.
router.post('/khalti/initiate', authenticateToken, async (req, res) => {
  const { service_id, barber_id, date, timeslot } = req.body;
  const { id: user_id, name, email } = req.user;

  if (!service_id || !barber_id || !date || !timeslot)
    return res.status(400).json({ message: 'service_id, barber_id, date and timeslot are required.' });

  try {
    // Validate service
    const [svcs] = await pool.query(
      'SELECT id, title, price, duration_mins FROM services WHERE id = ? AND active = 1',
      [service_id]
    );
    if (!svcs.length) return res.status(404).json({ message: 'Service not found.' });
    const service = svcs[0];

    // Validate barber
    const [bars] = await pool.query(
      'SELECT id, name FROM barbers WHERE id = ? AND active = 1',
      [barber_id]
    );
    if (!bars.length) return res.status(404).json({ message: 'Barber not found.' });
    const barber = bars[0];

    // Check for booking conflicts
    const newStart = timeToMins(timeslot);
    const newEnd   = newStart + service.duration_mins;
    const [existing] = await pool.query(
      `SELECT b.timeslot, s.duration_mins
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.barber_id = ? AND b.date = ? AND b.status != 'cancelled'`,
      [barber_id, date]
    );
    const conflict = existing.some(b => {
      const eStart = timeToMins(b.timeslot);
      return newStart < eStart + b.duration_mins && newEnd > eStart;
    });
    if (conflict) return res.status(409).json({
      message: `${barber.name} is already booked at that time. Please choose a different slot.`
    });

    // Save a PENDING booking — will be confirmed after Khalti verifies payment
    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, barber_id, service_id, date, timeslot, status, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, 'pending', 'khalti', 'pending')`,
      [user_id, barber_id, service_id, date, timeslot]
    );
    const bookingId = result.insertId;

    // Khalti amount is in PAISA (NPR × 100)
    const amountPaisa = service.price * 100;

    // Call Khalti initiate API from the server side (secret key never exposed to browser)
    const khaltiRes = await axios.post(
      `${KHALTI_API}/initiate/`,
      {
        return_url:           `${BASE_URL}/api/payment/khalti/verify`,
        website_url:          FRONTEND_URL,
        amount:               amountPaisa,
        purchase_order_id:    String(bookingId),         // our booking ID as the order reference
        purchase_order_name:  service.title,
        customer_info: {
          name,
          email,
          phone: '9800000000',                            // phone required by Khalti; update if you collect it
        },
      },
      {
        headers: {
          Authorization:  `key ${SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { pidx, payment_url } = khaltiRes.data;

    // Store pidx on the booking so we can look it up during verification
    await pool.query(
      'UPDATE bookings SET khalti_pidx = ? WHERE id = ?',
      [pidx, bookingId]
    );

    // Return the payment URL to the frontend — frontend redirects the user there
    res.json({ payment_url, pidx, bookingId });

  } catch (err) {
    console.error('Khalti initiate error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initiate payment. Please try again.' });
  }
});

// ── GET /api/payment/khalti/verify ────────────────────────────────────────────
// Khalti redirects the browser HERE after payment with query params:
// ?pidx=...&status=Completed&purchase_order_id=...
// We verify via Khalti lookup, then confirm the booking and redirect to frontend.
router.get('/khalti/verify', async (req, res) => {
  const { pidx, status, purchase_order_id } = req.query;

  // If user cancelled or payment failed, redirect to frontend with failure flag
  if (status !== 'Completed') {
    // Cancel the pending booking
    if (purchase_order_id) {
      await pool.query(
        "UPDATE bookings SET status = 'cancelled', payment_status = 'failed' WHERE id = ?",
        [purchase_order_id]
      ).catch(() => {});
    }
    return res.redirect(`${FRONTEND_URL}/payment/callback?success=false&reason=${encodeURIComponent(status || 'Payment failed')}`);
  }

  try {
    // Verify the payment with Khalti's lookup API — never trust the redirect alone
    const lookupRes = await axios.post(
      `${KHALTI_API}/lookup/`,
      { pidx },
      { headers: { Authorization: `key ${SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    const { status: lookupStatus, total_amount, transaction_id } = lookupRes.data;

    if (lookupStatus !== 'Completed') {
      return res.redirect(`${FRONTEND_URL}/payment/callback?success=false&reason=Payment+not+completed`);
    }

    // Find the booking by pidx
    const [bookings] = await pool.query(
      `SELECT b.*, s.title AS service_title, br.name AS barber_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN barbers br ON b.barber_id = br.id
       WHERE b.khalti_pidx = ?`,
      [pidx]
    );

    if (!bookings.length) {
      return res.redirect(`${FRONTEND_URL}/payment/callback?success=false&reason=Booking+not+found`);
    }

    const booking = bookings[0];

    // Mark booking as confirmed and paid
    await pool.query(
      "UPDATE bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = ?",
      [booking.id]
    );

    // Send notification to the user
    await notify(
      booking.user_id,
      `Payment confirmed! Your booking for "${booking.service_title}" with ${booking.barber_name} on ${booking.date} at ${booking.timeslot.slice(0, 5)} is confirmed. Transaction ID: ${transaction_id}`
    );

    // Redirect to frontend success page with booking details in query params
    res.redirect(
      `${FRONTEND_URL}/payment/callback?success=true` +
      `&bookingId=${booking.id}` +
      `&service=${encodeURIComponent(booking.service_title)}` +
      `&barber=${encodeURIComponent(booking.barber_name)}` +
      `&date=${encodeURIComponent(booking.date)}` +
      `&timeslot=${encodeURIComponent(booking.timeslot)}` +
      `&txnId=${encodeURIComponent(transaction_id)}`
    );

  } catch (err) {
    console.error('Khalti verify error:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/payment/callback?success=false&reason=Verification+failed`);
  }
});

module.exports = router;