// routes/bookings.js
const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// ── Helper: insert a notification ───────────────────────────────────────────
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

// ── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const { service_id, barber_id, date, timeslot } = req.body;
  const { id: user_id, name, email } = req.user;

  if (!service_id || !barber_id || !date || !timeslot) {
    return res.status(400).json({ message: 'service_id, barber_id, date and timeslot are required.' });
  }

  try {
    // Validate service exists
    const [svcs] = await pool.query(
      'SELECT id, title, duration_mins FROM services WHERE id = ? AND active = 1',
      [service_id]
    );
    if (!svcs.length) return res.status(404).json({ message: 'Service not found.' });
    const service = svcs[0];

    // Validate barber exists
    const [bars] = await pool.query(
      'SELECT id, name FROM barbers WHERE id = ? AND active = 1',
      [barber_id]
    );
    if (!bars.length) return res.status(404).json({ message: 'Barber not found.' });
    const barber = bars[0];

    const newStart = timeToMins(timeslot);
    const newEnd   = newStart + service.duration_mins;

    // Check for overlapping bookings for this barber on this date
    const [existing] = await pool.query(
      `SELECT b.timeslot, s.duration_mins
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.barber_id = ? AND b.date = ? AND b.status != 'cancelled'`,
      [barber_id, date]
    );

    const conflict = existing.some(b => {
      const eStart = timeToMins(b.timeslot);
      const eEnd   = eStart + b.duration_mins;
      return newStart < eEnd && newEnd > eStart;
    });

    if (conflict) {
      return res.status(409).json({
        message: `${barber.name} is already booked at that time. Please choose a different slot.`
      });
    }

    // Save booking
    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, barber_id, service_id, date, timeslot, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [user_id, barber_id, service_id, date, timeslot]
    );

    // Notify the customer
    await notify(
      user_id,
      `Your booking for "${service.title}" with ${barber.name} on ${date} at ${timeslot.slice(0,5)} is confirmed.`
    );

    res.status(201).json({ message: 'Booking confirmed.', bookingId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save booking.' });
  }
});

// ── GET /api/bookings/my ─────────────────────────────────────────────────────
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.date, b.timeslot, b.status, b.notes, b.created_at,
              s.title AS service, s.duration_mins, s.price,
              br.name AS barber_name, br.specialty AS barber_specialty
       FROM bookings b
       JOIN services s  ON b.service_id = s.id
       JOIN barbers  br ON b.barber_id  = br.id
       WHERE b.user_id = ?
       ORDER BY b.date DESC, b.timeslot DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
});

// ── GET /api/bookings/all  (admin only) ──────────────────────────────────────
router.get('/all', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.date, b.timeslot, b.status, b.notes, b.created_at,
              u.name AS client_name, u.email AS client_email,
              s.title AS service, s.duration_mins, s.price,
              br.name AS barber_name
       FROM bookings b
       JOIN users    u  ON b.user_id    = u.id
       JOIN services s  ON b.service_id = s.id
       JOIN barbers  br ON b.barber_id  = br.id
       ORDER BY b.date DESC, b.timeslot DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
});

// ── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.user_id, b.status, s.title AS service, br.name AS barber_name, b.date, b.timeslot
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN barbers br ON b.barber_id = br.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });

    const booking = rows[0];
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);

    // Notify customer
    await notify(
      booking.user_id,
      `Your booking for "${booking.service}" with ${booking.barber_name} on ${booking.date} has been cancelled.`
    );

    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel booking.' });
  }
});

// ── PATCH /api/bookings/:id/complete  (admin only) ──────────────────────────
router.patch('/:id/complete', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.user_id, b.status, s.title AS service, br.name AS barber_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN barbers br ON b.barber_id = br.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });

    await pool.query("UPDATE bookings SET status = 'completed' WHERE id = ?", [req.params.id]);

    await notify(
      rows[0].user_id,
      `Your appointment for "${rows[0].service}" with ${rows[0].barber_name} is complete. Thanks for visiting Trimura!`
    );

    res.json({ message: 'Booking marked as completed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to complete booking.' });
  }
});

// ── GET /api/bookings/:id/invoice ────────────────────────────────────────────
router.get('/:id/invoice', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.date, b.timeslot, b.status, b.payment_method, b.payment_status,
              b.khalti_pidx, b.created_at,
              s.title AS service_title, s.price, s.duration_mins,
              br.name AS barber_name,
              u.name AS customer_name, u.email AS customer_email
       FROM bookings b
       JOIN services s  ON b.service_id = s.id
       JOIN barbers  br ON b.barber_id  = br.id
       JOIN users    u  ON b.user_id    = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });

    const booking = rows[0];

    // Only the booking owner or admin can view the invoice
    if (req.user.role !== 'admin' && booking.customer_email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorised.' });
    }

    // Only confirmed or completed bookings get invoices
    if (!['confirmed', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Invoice is only available for confirmed or completed bookings.' });
    }

    res.json({
      invoice_number: `TRI-${String(booking.id).padStart(5, '0')}`,
      issued_date:    booking.created_at,
      customer: {
        name:  booking.customer_name,
        email: booking.customer_email,
      },
      service: {
        title:         booking.service_title,
        price:         Number(booking.price),
        duration_mins: booking.duration_mins,
      },
      barber_name:     booking.barber_name,
      appointment: {
        date:     booking.date,
        timeslot: booking.timeslot,
      },
      payment: {
        method: booking.payment_method || 'cash',
        status: booking.payment_status || 'unpaid',
        pidx:   booking.khalti_pidx || null,
      },
      total: Number(booking.price),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate invoice.' });
  }
});

module.exports = router;