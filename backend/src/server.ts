import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimit.middleware.js';
import { prisma } from './utils/prisma.js';

const app = express();

// 1. Security Headers via Helmet (FR-APP-06, AT-16)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"] // Anti-Clickjacking
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// 2. CORS Configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  })
);

// 3. Body parsers with payload size limit (FR-APP-10)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate Limiting for API routes
app.use('/api', apiRateLimiter);

// 5. Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch {
    res.status(503).json({ status: 'DOWN', database: 'DISCONNECTED', timestamp: new Date() });
  }
});

// 6. Mount API v1
app.use('/api/v1', apiRouter);

// 7. 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.originalUrl} not found`, code: 'NOT_FOUND' }
  });
});

// 8. Global Safe Error Handler (FR-APP-05, AT-15)
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`[SecureOrg Backend] Running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[SecureOrg Backend] API available at http://localhost:${config.port}/api/v1`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server and database pool.');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
