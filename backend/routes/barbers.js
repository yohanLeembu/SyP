// routes/barbers.js
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { pool } = require('../config/db');
const { authenticateToken, authorizeBarber } = require('../middleware/auth');
const router = express.Router();

// ─── Shop config ─────────────────────────────────────────────────────────────
const SHOP_OPEN_MINS  = 9  * 60;
const SHOP_CLOSE_MINS = 18 * 60;
const SLOT_INTERVAL   = 30;

function minsToTimeStr(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
}

function timeStrToMins(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ─── Image upload config ──────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'barbers');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 } });

// Upload middleware for barber with portfolio images (single profile + up to 8 portfolio)
const barberUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'portfolio_images', maxCount: 8 },
]);

// ─── Run DB migration on startup ─────────────────────────────────────────────
// Idempotent: adds any missing columns and drops stale unique constraints.
(async () => {
  try {
    // Existing columns
    await pool.query(`
      ALTER TABLE barber_reviews
      ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP
    `).catch(() => {});

    const [constraints] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'barber_reviews'
        AND CONSTRAINT_TYPE = 'UNIQUE'
    `);
    for (const c of constraints) {
      await pool.query(
        `ALTER TABLE barber_reviews DROP INDEX \`${c.CONSTRAINT_NAME}\``
      ).catch(() => {});
    }

    // ── New barber profile columns ────────────────────────────────────────────
    // Add phone, email, experience, availability_status if not already present.
    // Safe to run on every boot.
    await pool.query(`
      ALTER TABLE barbers
      ADD COLUMN IF NOT EXISTS phone               VARCHAR(30)  DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS email               VARCHAR(191) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS experience          TINYINT UNSIGNED DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS availability_status ENUM('available','on_leave','unavailable')
                                                   NOT NULL DEFAULT 'available'
    `).catch(() => {});

    // Portfolio images column (JSON array of URLs)
    await pool.query(`
      ALTER TABLE barbers
      ADD COLUMN IF NOT EXISTS portfolio_images TEXT DEFAULT NULL
    `).catch(() => {});

    console.log('[barbers] DB migration OK');
  } catch (err) {
    console.error('[barbers] DB migration warning:', err.message);
  }
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VALID_AVAILABILITY = ['available', 'on_leave', 'unavailable'];

function parseBarberBody(body) {
  const { name, specialty, bio, experience, availability_status, phone, email } = body;
  return {
    name:                (name || '').trim(),
    specialty:           (specialty || '').trim(),
    bio:                 (bio || '').trim(),
    experience:          experience !== undefined && experience !== '' ? parseInt(experience) : null,
    availability_status: VALID_AVAILABILITY.includes(availability_status)
                           ? availability_status
                           : 'available',
    phone:               (phone || '').trim() || null,
    email:               (email || '').trim() || null,
  };
}

// ─── Helper: parse portfolio_images from DB row ──────────────────────────────
function parsePortfolio(row) {
  try {
    row.portfolio_images = row.portfolio_images ? JSON.parse(row.portfolio_images) : [];
  } catch { row.portfolio_images = []; }
  return row;
}

// ─── GET /api/barbers — public ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, specialty, bio, image_url,
             experience, availability_status, phone, email, portfolio_images
      FROM barbers
      WHERE active = 1
      ORDER BY name
    `);
    res.json(rows.map(parsePortfolio));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch barbers.' });
  }
});

// ─── GET /api/barbers/:id — public ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, specialty, bio, image_url,
             experience, availability_status, phone, email, portfolio_images
      FROM barbers
      WHERE id = ? AND active = 1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Barber not found.' });
    res.json(parsePortfolio(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch barber.' });
  }
});

// ─── GET /api/barbers/:id/slots ───────────────────────────────────────────────
router.get('/:id/slots', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { date, duration } = req.query;

  if (!date || !duration)
    return res.status(400).json({ message: 'date and duration query params are required.' });

  const durationMins = parseInt(duration);
  if (isNaN(durationMins) || durationMins <= 0)
    return res.status(400).json({ message: 'Invalid duration.' });

  try {
    const [bookings] = await pool.query(
      `SELECT b.timeslot, s.duration_mins
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.barber_id = ? AND b.date = ? AND b.status != 'cancelled'`,
      [id, date]
    );

    const blockedRanges = bookings.map(b => {
      const start = timeStrToMins(b.timeslot);
      return { start, end: start + b.duration_mins };
    });

    const available = [];
    for (let start = SHOP_OPEN_MINS; start + durationMins <= SHOP_CLOSE_MINS; start += SLOT_INTERVAL) {
      const end = start + durationMins;
      const overlaps = blockedRanges.some(b => start < b.end && end > b.start);
      if (!overlaps) available.push(minsToTimeStr(start));
    }

    res.json({ barber_id: id, date, duration_mins: durationMins, available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch available slots.' });
  }
});

// ─── GET /api/barbers/:id/reviews — public ────────────────────────────────────
router.get('/:id/reviews', async (req, res) => {
  const sort = req.query.sort || 'latest';
  const orderBy =
    sort === 'highest' ? 'r.rating DESC, r.created_at DESC' :
    sort === 'lowest'  ? 'r.rating ASC,  r.created_at DESC' :
                         'r.created_at DESC';
  try {
    const [reviews] = await pool.query(
      `SELECT r.id, r.user_id, r.rating, r.review_text,
              r.created_at, r.updated_at,
              u.name AS reviewer_name
       FROM barber_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.barber_id = ?
       ORDER BY ${orderBy}`,
      [req.params.id]
    );

    const count   = reviews.length;
    const average = count
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
      : null;

    res.json({ reviews, average, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

// ─── POST /api/barbers/:id/reviews — logged-in users only ────────────────────
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const { rating, review_text } = req.body;
  const barberId = req.params.id;
  const userId   = req.user.id;

  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

  const [barbers] = await pool.query(
    'SELECT id FROM barbers WHERE id = ? AND active = 1', [barberId]
  );
  if (!barbers.length)
    return res.status(404).json({ message: 'Barber not found.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO barber_reviews (barber_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)`,
      [barberId, userId, rating, review_text || '']
    );
    res.status(201).json({ message: 'Review submitted.', reviewId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit review.' });
  }
});

// ─── PUT /api/barbers/:barberId/reviews/:reviewId — owner only ────────────────
router.put('/:barberId/reviews/:reviewId', authenticateToken, async (req, res) => {
  const { rating, review_text } = req.body;
  const { barberId, reviewId } = req.params;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM barber_reviews WHERE id = ? AND barber_id = ?',
      [reviewId, barberId]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'Review not found.' });

    if (rows[0].user_id !== userId)
      return res.status(403).json({ message: 'You can only edit your own reviews.' });

    await pool.query(
      `UPDATE barber_reviews
       SET rating = ?, review_text = ?, updated_at = NOW()
       WHERE id = ?`,
      [rating, review_text || '', reviewId]
    );

    res.json({ message: 'Review updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update review.' });
  }
});

// ─── DELETE /api/barbers/:barberId/reviews/:reviewId — owner only ─────────────
router.delete('/:barberId/reviews/:reviewId', authenticateToken, async (req, res) => {
  const { barberId, reviewId } = req.params;
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM barber_reviews WHERE id = ? AND barber_id = ?',
      [reviewId, barberId]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'Review not found.' });

    if (rows[0].user_id !== userId)
      return res.status(403).json({ message: 'You can only delete your own reviews.' });

    await pool.query('DELETE FROM barber_reviews WHERE id = ?', [reviewId]);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete review.' });
  }
});

// ─── Helper: build portfolio URLs from uploaded files + kept URLs ─────────────
function buildPortfolioUrls(req) {
  const urls = [];
  // Existing URLs the client wants to keep (in order)
  const keepUrls = req.body.portfolio_keep_urls;
  if (keepUrls) {
    const arr = Array.isArray(keepUrls) ? keepUrls : [keepUrls];
    arr.forEach(u => urls.push(u));
  }
  // Newly uploaded portfolio files
  if (req.files && req.files['portfolio_images']) {
    req.files['portfolio_images'].forEach(f => {
      urls.push(`http://localhost:5000/uploads/barbers/${f.filename}`);
    });
  }
  return urls;
}

// ─── POST /api/barbers — admin/barber only ───────────────────────────────────
router.post('/', authenticateToken, authorizeBarber, barberUpload, async (req, res) => {
  const parsed = parseBarberBody(req.body);
  if (!parsed.name) return res.status(400).json({ message: 'Name is required.' });

  const imageFile = req.files && req.files['image'] && req.files['image'][0];
  const image_url = imageFile
    ? `http://localhost:5000/uploads/barbers/${imageFile.filename}`
    : '';

  const portfolioUrls = buildPortfolioUrls(req);

  try {
    const [result] = await pool.query(`
      INSERT INTO barbers
        (name, specialty, bio, image_url, experience, availability_status, phone, email, portfolio_images, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      parsed.name,
      parsed.specialty,
      parsed.bio,
      image_url,
      parsed.experience,
      parsed.availability_status,
      parsed.phone,
      parsed.email,
      JSON.stringify(portfolioUrls),
    ]);
    res.status(201).json({ message: 'Barber created.', barberId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create barber.' });
  }
});

// ─── PUT /api/barbers/:id — admin/barber only ────────────────────────────────
router.put('/:id', authenticateToken, authorizeBarber, barberUpload, async (req, res) => {
  const parsed = parseBarberBody(req.body);
  const { active } = req.body;

  try {
    let image_url;
    const imageFile = req.files && req.files['image'] && req.files['image'][0];
    if (imageFile) {
      image_url = `http://localhost:5000/uploads/barbers/${imageFile.filename}`;
    } else {
      const [rows] = await pool.query('SELECT image_url FROM barbers WHERE id = ?', [req.params.id]);
      image_url = rows[0]?.image_url || '';
    }

    const portfolioUrls = buildPortfolioUrls(req);

    await pool.query(`
      UPDATE barbers
      SET name                = ?,
          specialty           = ?,
          bio                 = ?,
          image_url           = ?,
          experience          = ?,
          availability_status = ?,
          phone               = ?,
          email               = ?,
          portfolio_images    = ?,
          active              = ?
      WHERE id = ?
    `, [
      parsed.name,
      parsed.specialty,
      parsed.bio,
      image_url,
      parsed.experience,
      parsed.availability_status,
      parsed.phone,
      parsed.email,
      JSON.stringify(portfolioUrls),
      active ?? 1,
      req.params.id,
    ]);

    res.json({ message: 'Barber updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update barber.' });
  }
});

// ─── DELETE /api/barbers/:id — admin/barber only (soft delete) ───────────────
router.delete('/:id', authenticateToken, authorizeBarber, async (req, res) => {
  try {
    await pool.query('UPDATE barbers SET active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Barber deactivated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to deactivate barber.' });
  }
});

module.exports = router;