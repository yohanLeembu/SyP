// routes/users.js
const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]
  );
  res.json(rows[0]);
});

// GET /api/users/all  (admin only)
router.get('/all', authenticateToken, authorizeAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users');
  res.json(rows);
});

// PATCH /api/users/:id  — update role  (admin only)
router.patch('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const { role } = req.body;

  const ALLOWED_ROLES = ['member', 'barber', 'admin'];
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` });
  }

  // Prevent admin from accidentally demoting themselves
  if (targetId === req.user.id && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }

  const [result] = await pool.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, targetId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ message: 'Role updated successfully.', role });
});

// DELETE /api/users/:id  (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: 'Cannot delete yourself.' });
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted.' });
});

module.exports = router;