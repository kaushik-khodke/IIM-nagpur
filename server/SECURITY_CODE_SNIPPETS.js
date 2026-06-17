// 🔐 TRACTOR SEVA - SECURITY IMPLEMENTATION CODE SNIPPETS
// Copy these snippets into your server.js and use them as templates

// ============================================================================
// 1. HELMET SECURITY HEADERS
// ============================================================================

const helmet = require('helmet');

// Apply helmet with custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // React needs unsafe-inline for now
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true // Add to HSTS preload list
  },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Legacy XSS protection
  permittedCrossDomainPolicies: false,
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// ============================================================================
// 2. CORS CONFIGURATION (RESTRICTIVE)
// ============================================================================

const cors = require('cors');

// Get allowed origin from environment
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Allow cookies with CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 3600, // Pre-flight cache 1 hour
};

app.use(cors(corsOptions));

// ============================================================================
// 3. RATE LIMITING
// ============================================================================

const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
  message: { error: 'Too many login attempts, please try again later' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts, please try again later' });
  },
});

// Strict limiter for password reset
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset attempts per hour
  message: { error: 'Too many password reset attempts' },
});

// Apply limiters to routes
app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter, handleLogin);
app.post('/api/auth/register', authLimiter, handleRegister);
app.post('/api/auth/forgot-password', resetLimiter, handleForgotPassword);

// ============================================================================
// 4. INPUT VALIDATION (EXPRESS-VALIDATOR)
// ============================================================================

const { body, validationResult, param, query } = require('express-validator');

// Validation middleware for login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 255 })
    .withMessage('Password too long'),
];

// Validation middleware for registration
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be 2-255 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Invalid Indian phone number'),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Usage:
// app.post('/api/auth/login', validateLogin, handleValidationErrors, handleLogin);

// ============================================================================
// 5. PASSWORD VALIDATION FUNCTION
// ============================================================================

function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const strength = {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    score: 0,
    feedback: []
  };

  if (password.length >= minLength) strength.score++;
  else strength.feedback.push('At least 8 characters');

  if (hasLowerCase) strength.score++;
  else strength.feedback.push('At least one lowercase letter');

  if (hasUpperCase) strength.score++;
  else strength.feedback.push('At least one uppercase letter');

  if (hasNumbers) strength.score++;
  else strength.feedback.push('At least one number');

  if (hasSpecialChar) strength.score++;

  return strength;
}

// Usage:
// const pwdCheck = validatePasswordStrength(password);
// if (!pwdCheck.isValid) {
//   return res.status(400).json({ error: pwdCheck.feedback.join(', ') });
// }

// ============================================================================
// 6. FILE UPLOAD VALIDATION
// ============================================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Define allowed file types
const ALLOWED_MIMES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with crypto
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img-${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIMES[file.mimetype]) {
    return cb(new Error(`Invalid file type: ${file.mimetype}`));
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension: ${ext}`));
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  }
});

// Validation after upload
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Verify file size again
  if (req.file.size > MAX_FILE_SIZE) {
    fs.unlinkSync(req.file.path); // Delete file
    return res.status(400).json({ error: 'File size exceeds limit' });
  }

  next();
};

// Usage:
// app.post('/api/upload', upload.single('file'), validateUploadedFile, (req, res) => {
//   res.json({ filename: req.file.filename, path: req.file.path });
// });

// ============================================================================
// 7. ENVIRONMENT VARIABLE VALIDATION
// ============================================================================

function validateEnvironmentVariables() {
  const required = [
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'NODE_ENV', 'PORT'
  ];

  const missing = required.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ FATAL: Missing environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret.length < 32) {
    console.error('❌ FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }

  console.log('✅ All required environment variables are configured');
}

// Call at startup:
// validateEnvironmentVariables();

// ============================================================================
// 8. SECURE JWT HANDLING
// ============================================================================

const jwt = require('jsonwebtoken');

// Generate token with expiration
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h', // Token expires in 24 hours
      issuer: 'tractor-seva',
      audience: 'tractor-seva-app',
    }
  );
}

// Verify token middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'tractor-seva',
      audience: 'tractor-seva-app',
    });
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Usage:
// app.get('/api/protected', verifyToken, handleProtectedRoute);

// ============================================================================
// 9. STRUCTURED LOGGING (WINSTON)
// ============================================================================

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tractor-seva-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // All logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Usage:
// logger.info('User logged in', { userId: user.id, email: user.email });
// logger.warn('Failed login attempt', { email, ip: req.ip });
// logger.error('Database error', { error: err.message });

// ============================================================================
// 10. SECURITY MONITORING & SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

class SecurityMonitor {
  constructor() {
    this.failedAttempts = new Map();
    this.suspiciousPatterns = [
      /(\.\.|\.\/)/,  // Directory traversal
      /(union|select|insert|delete|drop|exec|script)/i, // SQL/code injection
      /<script|javascript|onerror|onclick/i, // Script injection
      /eval\(|function\(|document\./i, // Dangerous functions
    ];
  }

  recordFailedLogin(email, ip) {
    const key = `${email}:${ip}`;
    const attempts = (this.failedAttempts.get(key) || 0) + 1;
    this.failedAttempts.set(key, attempts);

    if (attempts >= 5) {
      logger.warn('SECURITY: Potential brute force attack', {
        email,
        ip,
        attempts
      });
      // Could implement account lockout here
    }

    return attempts;
  }

  clearFailedAttempt(email, ip) {
    const key = `${email}:${ip}`;
    this.failedAttempts.delete(key);
  }

  checkForSuspiciousInput(input) {
    const inputStr = JSON.stringify(input);
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(inputStr)) {
        return true;
      }
    }
    return false;
  }
}

const securityMonitor = new SecurityMonitor();

// Middleware to detect suspicious requests
app.use((req, res, next) => {
  if (securityMonitor.checkForSuspiciousInput(req.body)) {
    logger.warn('SECURITY: Suspicious input detected', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      body: req.body
    });
    // Could block the request or rate limit
  }
  next();
});

// ============================================================================
// 11. HTTPS REDIRECT (FOR PRODUCTION)
// ============================================================================

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // AWS ELB sets X-Forwarded-Proto
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// ============================================================================
// 12. GLOBAL ERROR HANDLER (Don't leak sensitive info)
// ============================================================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Don't expose internal errors to client
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================================

module.exports = {
  validatePasswordStrength,
  validateLogin,
  validateRegister,
  handleValidationErrors,
  upload,
  validateUploadedFile,
  verifyToken,
  generateToken,
  logger,
  securityMonitor,
  validateEnvironmentVariables,
};
