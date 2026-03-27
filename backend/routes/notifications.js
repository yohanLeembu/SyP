// routes/notifications.js
const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ── GET /api/notifications ───────────────────────────────────────────────────
// Returns all notifications for the logged-in user, newest first
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// ── PATCH /api/notifications/read-all ───────────────────────────────────────
// Mark all of the user's notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
});

// ── PATCH /api/notifications/:id/read ───────────────────────────────────────
// Mark a single notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update notification.' });
  }
});

// ── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
});

module.exports = router;