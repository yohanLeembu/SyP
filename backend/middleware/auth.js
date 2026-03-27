// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'No token provided.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // pass control to the next handler
  } catch {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admins only.' });
  next();
}

function authorizeBarber(req, res, next) {
  if (req.user.role !== 'barber')
    return res.status(403).json({ message: 'Barbers only.' });
  next();
}

module.exports = { authenticateToken, authorizeAdmin, authorizeBarber };