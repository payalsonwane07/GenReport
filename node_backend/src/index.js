require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/user');
const downloadRoutes = require('./routes/download');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Explicit CORS: allow frontend dev origins and any env-configured origins
const defaultAllowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://gen-report-teal.vercel.app',
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;
app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (mobile clients, curl, server-to-server)
      if (!origin) return cb(null, true)
      // allow any localhost origin (dev servers may use various ports)
      if (typeof origin === 'string' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return cb(null, true)
      }
      if (allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('CORS origin not allowed'))
    },
    credentials: true,
  })
);
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/user', userRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => res.send('Automated Report Generator API'));

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Automated Report Generator API',
    uptime: process.uptime(),
    mongo: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Health endpoint for frontend checks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongo: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use((err, req, res, next) => {
  // Multer errors
  if (err && err.name === 'MulterError') {
    console.error('Multer error:', err);
    return res.status(400).json({ message: err.message });
  }

  if (err?.message === 'Unsupported file type') {
    console.error('Upload error:', err.message);
    return res.status(400).json({ message: err.message });
  }

  console.error('Unhandled error:', err && (err.stack || err));
  res.status(500).json({ message: err?.message || 'Internal server error' });
});

// Use configured PORT without searching for alternatives to avoid unexpected port switching
const PORT = Number(process.env.PORT) || 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
