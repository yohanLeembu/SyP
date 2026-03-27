// routes/vacancies.js
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { pool } = require('../config/db');
const { authenticateToken, authorizeAdmin, authorizeBarber } = require('../middleware/auth');

const router = express.Router();

// ─── CV Upload config ─────────────────────────────────────────────────────────
// Uploaded CVs are saved to backend/uploads/cvs/
const uploadDir = path.join(__dirname, '..', 'uploads', 'cvs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  // Rename the file to avoid collisions: timestamp + original name
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

// Only accept PDF, DOC, DOCX files as CVs
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF, DOC, or DOCX files are allowed for CV.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// ─── PUBLIC: Get all active vacancies ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vacancies WHERE is_active = 1 ORDER BY created_at DESC'
    );
    // Parse JSON strings back into arrays for requirements and perks
    const vacancies = rows.map(v => ({
      ...v,
      requirements: JSON.parse(v.requirements),
      perks: JSON.parse(v.perks),
    }));
    res.json(vacancies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vacancies.' });
  }
});

// ─── BARBER ONLY: Create a new vacancy ───────────────────────────────────────
router.post('/', authenticateToken, authorizeBarber, async (req, res) => {
  const { title, type, description, requirements, perks } = req.body;
  if (!title || !type || !description || !requirements || !perks)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO vacancies (title, type, description, requirements, perks) VALUES (?, ?, ?, ?, ?)',
      [title, type, description, JSON.stringify(requirements), JSON.stringify(perks)]
    );
    res.status(201).json({ message: 'Vacancy created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create vacancy.' });
  }
});

// ─── BARBER ONLY: Update a vacancy ───────────────────────────────────────────
router.put('/:id', authenticateToken, authorizeBarber, async (req, res) => {
  const { title, type, description, requirements, perks } = req.body;
  if (!title || !type || !description || !requirements || !perks)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const [existing] = await pool.query('SELECT id FROM vacancies WHERE id = ?', [req.params.id]);
    if (!existing.length)
      return res.status(404).json({ message: 'Vacancy not found.' });

    await pool.query(
      'UPDATE vacancies SET title = ?, type = ?, description = ?, requirements = ?, perks = ? WHERE id = ?',
      [title, type, description, JSON.stringify(requirements), JSON.stringify(perks), req.params.id]
    );
    res.json({ message: 'Vacancy updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update vacancy.' });
  }
});

// ─── BARBER ONLY: Delete a vacancy ───────────────────────────────────────────
router.delete('/:id', authenticateToken, authorizeBarber, async (req, res) => {
  try {
    await pool.query('DELETE FROM vacancies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vacancy deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete vacancy.' });
  }
});

// ─── ADMIN ONLY: Get all applications ────────────────────────────────────────
router.get('/applications', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, v.title AS vacancy_title
      FROM vacancy_applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      ORDER BY a.submitted_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

// ─── PUBLIC: Apply for a vacancy (with CV file upload) ───────────────────────
router.post('/:id/apply', upload.single('cv'), async (req, res) => {
  const { name, email, cover_note } = req.body;
  const vacancyId = req.params.id;

  if (!name || !email)
    return res.status(400).json({ message: 'Name and email are required.' });

  // Check the vacancy actually exists
  const [rows] = await pool.query('SELECT id FROM vacancies WHERE id = ? AND is_active = 1', [vacancyId]);
  if (!rows.length)
    return res.status(404).json({ message: 'Vacancy not found.' });

  const cvFilename = req.file ? req.file.filename : null;

  try {
    await pool.query(
      'INSERT INTO vacancy_applications (vacancy_id, name, email, cover_note, cv_filename) VALUES (?, ?, ?, ?, ?)',
      [vacancyId, name, email, cover_note || '', cvFilename]
    );
    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

// ─── ADMIN ONLY: Accept or reject an application ─────────────────────────────
router.patch('/applications/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
  const { status } = req.body;  // expects: 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be accepted or rejected.' });

  try {
    // 1. Fetch the application so we know the applicant's email and which vacancy
    const [apps] = await pool.query(
      `SELECT a.*, v.title AS vacancy_title
       FROM vacancy_applications a
       JOIN vacancies v ON a.vacancy_id = v.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!apps.length)
      return res.status(404).json({ message: 'Application not found.' });

    const application = apps[0];

    // 2. Update the application status
    await pool.query(
      'UPDATE vacancy_applications SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    // 3. Try to find a registered user account with the same email as the applicant
    //    (applicant may or may not have an account on the site)
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [application.email]
    );

    if (users.length > 0) {
      const userId = users[0].id;

      // 4. Build the notification message
      const message = status === 'accepted'
        ? `Congratulations! Your application for "${application.vacancy_title}" has been accepted. We will contact you soon.`
        : `Thank you for applying. Unfortunately your application for "${application.vacancy_title}" was not successful this time.`;

      // 5. Save notification to DB (so they see it even if they were offline)
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [userId, message]
      );

      // 6. If the user is currently online, push the notification via socket instantly
      const io             = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const socketId       = connectedUsers[String(userId)];

      if (socketId) {
        io.to(socketId).emit('notification', {
          message,
          is_read: 0,
          created_at: new Date().toISOString(),
        });
      }
    }

    res.json({ message: `Application ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update application status.' });
  }
});

module.exports = router;