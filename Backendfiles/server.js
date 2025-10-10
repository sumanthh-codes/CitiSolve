import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import authRoutes from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS configuration - IMPORTANT: Include credentials
app.use(cors({
  origin: 'http://localhost:5173', // Your React app URL
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware - MUST be before routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'citisolve-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('User ID in session:', req.session?.userId);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    sessionId: req.sessionID,
    userId: req.session?.userId || 'Not logged in'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('✅ Test the server: http://localhost:5000/api/test');
  console.log('✅ Session middleware enabled');
});