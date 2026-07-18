require('dotenv').config();

const net = require('net');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// MongoDB (Atlas free tier)
// Set MONGODB_URI in your .env file, e.g.:
// mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/reportgen?retryWrites=true&w=majority
// ---------------------------------------------------------------------------
async function connectDB() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/reportgen';

  if (!uri || uri.includes('<user>')) {
    console.warn('Warning: Set MONGODB_URI in .env to your MongoDB Atlas connection string.');
  }

  mongoose.set('strictQuery', false);

  try {
    await Promise.race([
      mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 6000))
    ]);
    console.log('MongoDB connected');
  } catch (err) {
    console.warn(`MongoDB connection failed: ${err.message}`);
    console.warn('Continuing with limited functionality. Features requiring DB will fail gracefully.');
  }
}

// ---------------------------------------------------------------------------
// Find an open port (starts at 5001, then tries 5002, 5003, …)
// ---------------------------------------------------------------------------
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', (err) => resolve(err.code !== 'EADDRINUSE'))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort = 5001, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found in range ${startPort}–${startPort + maxAttempts - 1}`);
}

async function resolvePort() {
  if (process.env.PORT) {
    const preferred = Number(process.env.PORT);
    if (Number.isNaN(preferred)) throw new Error('PORT must be a number');
    const free = await isPortAvailable(preferred);
    if (!free) {
      console.warn(`Port ${preferred} is in use — searching for another port…`);
      return findAvailablePort(preferred + 1);
    }
    return preferred;
  }
  return findAvailablePort(5001);
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get('/', (req, res) => {
    res.json({
      name: 'Automated Report Generator API',
      status: 'ok',
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  });

  // PDF report endpoints (pdfkit → /reports folder)
  try {
    app.use('/api', require('./src/routes/reportApi'));
  } catch (err) {
    console.warn('Report API routes could not be loaded:', err.message);
  }

  // Mount existing API routes (auth, reports, downloads, etc.)
  try {
    app.use('/api/auth', require('./src/routes/auth'));
    app.use('/api/reports', require('./src/routes/reports'));
    app.use('/api/user', require('./src/routes/user'));
    app.use('/api/download', require('./src/routes/download'));
    app.use('/api/dashboard', require('./src/routes/dashboard'));
  } catch (err) {
    console.warn('Some route modules could not be loaded:', err.message);
  }

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function start() {
  await connectDB();

  const app = createApp();
  const port = await resolvePort();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
