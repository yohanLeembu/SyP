require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

const connectedUsers = {};

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    connectedUsers[String(userId)] = socket.id;
  });
  socket.on('disconnect', () => {
    for (const [uid, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) { delete connectedUsers[uid]; break; }
    }
  });
});

app.set('io', io);
app.set('connectedUsers', connectedUsers);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/barbers',       require('./routes/barbers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/vacancies',     require('./routes/vacancies'));
app.use('/api/payment',       require('./routes/payment'));       // ← Khalti payment routes

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

server.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);