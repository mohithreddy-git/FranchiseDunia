const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
const ApiError = require('./src/utils/apiError');
const ApiResponse = require('./src/utils/apiResponse');

const csrfProtection = require('./src/middlewares/csrfMiddleware');

const authRoutes = require('./src/routes/authRoutes');
const franchiseRoutes = require('./src/routes/franchiseRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const businessRoutes = require('./src/routes/businessRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const savedRoutes = require('./src/routes/savedRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS configuration with credentials support for httpOnly cookies
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev flexible
    },
    credentials: true,
  })
);

// 3. Body Parsing & Cookie Parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 4. Data Sanitization against NoSQL query injection & HTTP Parameter Pollution
app.use(mongoSanitize());
app.use(
  hpp({
    whitelist: [
      'industry',
      'city',
      'availableLocations',
      'sortBy',
      'sort',
      'page',
      'limit',
      'type',
      'region',
      'targetType',
      'status',
    ],
  })
);

// 5. CSRF Protection for mutating requests
app.use(csrfProtection);

// 6. HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 7. General API Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 8. Healthcheck Route
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: 'UP',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        demoMode: process.env.ENABLE_DEMO_MODE === 'true',
        timestamp: new Date().toISOString(),
      },
      'FranchiseDunia Core API is operational'
    )
  );
});

// 9. Mount Application Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/franchises', franchiseRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/business-for-sale', businessRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1', messageRoutes); // Mounts /messages and /leads/:id/messages
app.use('/api/v1/saved', savedRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 10. Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// 11. Centralized Error Handler
app.use(errorHandler);

// Server initialization logic
let serverInstance = null;

const startServer = async () => {
  try {
    await connectDB();
    const Franchise = require('./src/models/Franchise');
    const count = await Franchise.countDocuments();
    if (count === 0 && process.env.NODE_ENV !== 'production') {
      const seedDatabase = require('./src/utils/seedData');
      await seedDatabase();
    }
    serverInstance = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🌟 FRANCHISEDUNIA API SERVER RUNNING ON PORT ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🔒 DEMO MODE: ${process.env.ENABLE_DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`====================================================`);
    });
    return serverInstance;
  } catch (err) {
    console.error('Failed to start server:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
