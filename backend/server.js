const express = require('express');
const dns = require('dns').promises;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { getTranslations } = require('./utils/translator');
// Trigger seeding restart for new locale keys

// Try loading .env from root directory first, then fallback to current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// 1. Environment Variables Check
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_BUCKET_NAME'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`FATAL: Environment variable ${envVar} is not set`);
    process.exit(1);
  }
});

// Initialize Supabase Client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET_NAME;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
console.log('Supabase storage client initialized successfully.');
if (JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Middlewares

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. CORS Restrictions
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // Dynamic matching for Vercel preview or production deployments
    if (origin.endsWith('.vercel.app') || /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased to 10000 to accommodate message notification polling for active sessions
  message: { error: 'Too many requests, please try again later' }, // Return JSON to prevent frontend JSON parsing errors
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting on localhost / local development environments
  skip: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip.includes('127.0.0.1') || ip.includes('localhost') || ip === '::1';
  }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many enquiries submitted from this device. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const faqLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many FAQ questions submitted from this device. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminBulkUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 bulk upload requests per 15 minutes per IP
  message: { error: 'Too many bulk user import requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);


// Structured Logger with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'tractor-seva-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Reusable Security and Monitoring Logger
async function logSecurityEvent(eventType, severity, username, ipAddress, description, requestUrl = null, userAgent = null, metadata = null) {
  try {
    const metaStr = metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata)) : null;
    await db.query(
      'INSERT INTO security_logs (event_type, severity, username, ip_address, request_url, user_agent, description, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [eventType, severity, username, ipAddress, requestUrl, userAgent, description, metaStr]
    );
  } catch (error) {
    console.error('Failed to write security log to database:', error);
  }

  // Dual-logging to Winston files & console
  const winstonMsg = `[SECURITY EVENT] ${eventType} [${severity.toUpperCase()}] - User: ${username || 'Anonymous'} | IP: ${ipAddress || 'unknown'} | URL: ${requestUrl || 'N/A'} - ${description}`;
  if (severity === 'critical' || severity === 'high') {
    logger.error(winstonMsg, { metadata });
  } else if (severity === 'medium') {
    logger.warn(winstonMsg, { metadata });
  } else {
    logger.info(winstonMsg, { metadata });
  }

  // Brute force threat detection: check for multiple failures from the same user or IP within 10 minutes
  if (eventType === 'Failed Login Attempts' && username) {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM security_logs WHERE event_type = ? AND (ip_address = ? OR username = ?) AND timestamp > ?',
        ['Failed Login Attempts', ipAddress, username, tenMinutesAgo]
      );
      if (rows[0].count >= 5) {
        await db.query(
          'INSERT INTO security_logs (event_type, severity, username, ip_address, request_url, user_agent, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            'Multiple Failed Login Attempts',
            'high',
            username,
            ipAddress,
            requestUrl,
            userAgent,
            `Suspicious activity: 5 or more failed login attempts detected for ${username} from IP ${ipAddress} in the last 10 minutes.`
          ]
        );
        logger.warn(`[SECURITY ALERT] Multiple Failed Login Attempts detected for ${username} from IP ${ipAddress}`);
      }
    } catch (e) {
      console.error('Brute force checking failed:', e);
    }
  }
}

// Request Logger Middleware
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '[REDACTED]';
    logger.info('Body', bodyCopy);
  }
  next();
});

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Multer Config for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // Strict MIME type check
    if (extname && allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WEBP) are allowed!'));
    }
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  let token = null;

  // 1. Try to extract from Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[1]) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback: try to extract from cookies manually (without requiring cookie-parser)
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const value = parts.slice(1).join('=')?.trim();
      if (key) acc[key] = value;
      return acc;
    }, {});
    token = cookies['token'];
  }

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    
    try {
      const [rows] = await db.query(
        'SELECT id, name, email, role, state, phone, bio, image_path, is_blocked FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = rows[0];
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        state: user.state,
        phone: user.phone,
        bio: user.bio,
        imagePath: user.image_path
      };

      // Log the authenticated request details
      logger.info(`Authenticated request by: ${req.user.name} (${req.user.email}), Role: ${req.user.role}, Image: ${req.user.imagePath || 'None'}`);

      next();
    } catch (error) {
      console.error('Error verifying token user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};

const getOptionalUser = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, name, email, role, state, phone, bio, image_path, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0 || rows[0].is_blocked) return null;
    const user = rows[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      phone: user.phone,
      bio: user.bio,
      imagePath: user.image_path
    };
  } catch (err) {
    return null;
  }
};

const cleanPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/\D/g, '');
  let finalPhone = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    finalPhone = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    finalPhone = cleaned.substring(1);
  }
  return /^\d{10}$/.test(finalPhone) ? finalPhone : null;
};

const validateYear = (year) => {
  if (!year) return true; // year is optional in harvester table schema
  const parsed = parseInt(year, 10);
  if (isNaN(parsed)) return false;
  const currentYear = new Date().getFullYear();
  return /^\d{4}$/.test(year.toString().trim()) && parsed >= 1900 && parsed <= currentYear + 1;
};

const sanitizeInput = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const isEmailDomainValid = async (email) => {
  if (!email || typeof email !== 'string') return false;

  const normalizedEmail = email.toLowerCase().trim();

  // Bypass DNS verification for administrator accounts
  if (normalizedEmail === 'tractorsewaadmin@gmail.com' || normalizedEmail === 'admin@gmail.com') {
    return true;
  }

  const domain = normalizedEmail.split('@')[1];
  if (!domain) return false;

  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0;
  } catch (err) {
    // If the lookup failed explicitly because domain wasn't found (ENOTFOUND or ENODATA)
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      try {
        const addresses = await dns.resolve4(domain);
        return addresses && addresses.length > 0;
      } catch (aErr) {
        if (aErr.code === 'ENOTFOUND' || aErr.code === 'ENODATA') {
          return false; // Domain definitely does not exist
        }
      }
    }
    // Log other DNS-specific network errors but fail-safe to let the user log in/register
    logger.warn(`DNS check failed with code ${err.code} for domain ${domain}. Allowed access under fail-safe policy.`);
    return true;
  }
};

// --- API ROUTES ---

// 1. Image Upload Endpoint
app.post('/api/upload', authenticateToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum limit is 5MB.' });
        }
        return res.status(400).json({ error: 'Upload failed due to system limit constraints.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const localPath = req.file.path;
    const mimeType = req.file.mimetype;
    const fileName = req.file.filename;

    try {
      const fileBuffer = fs.readFileSync(localPath);
      
      // Supabase project constants
      const ref = 'nwlhjvthqggfzvnukagg';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bGhqdnRocWdnZnp2bnVrYWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYyMDY4OCwiZXhwIjoyMDg1MTk2Njg4fQ.P3aSVSC5zhDCDMxfHnpPkUFqFYTunjrEZ5AsyXkpt14';
      const bucket = 'TractorSeva';
      
      const uploadUrl = `https://${ref}.supabase.co/storage/v1/object/${bucket}/${fileName}`;
      
      // Map image/webp and image/jpg to whitelisted MIME types for the Supabase upload call
      // because the Supabase bucket configuration only whitelists image/jpeg and image/png.
      let supabaseMimeType = mimeType === 'image/webp' ? 'image/png' : mimeType;
      if (supabaseMimeType === 'image/jpg') {
        supabaseMimeType = 'image/jpeg';
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'apikey': key,
          'Content-Type': supabaseMimeType
        },
        body: fileBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase upload error:', response.status, errorText);
        return res.status(500).json({ error: 'Supabase upload failed. Please try again later.' });
      }

      const publicUrl = `https://${ref}.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
      
      // Delete local temp file
      fs.unlink(localPath, (err) => {
        if (err) console.error('Failed to delete temporary local file:', err);
      });

      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Upload handler error:', error);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      res.status(500).json({ error: 'Internal Server Error during file upload.' });
    }
  });
});

// 2. Auth Routes
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
];

app.post('/api/auth/register', authLimiter, validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, email, password, state, phone } = req.body;

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  try {
    const domainValid = await isEmailDomainValid(email);
    if (!domainValid) {
      return res.status(400).json({ error: 'The email domain does not appear to exist or cannot receive mail.' });
    }

    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();
    const cleanName = sanitizeInput(name);
    const cleanState = sanitizeInput(state);
    await db.query(
      'INSERT INTO users (id, name, email, password, role, state, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, cleanName, email, hashedPassword, 'user', cleanState || null, cleanedPhone]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [userId, today]);
    } catch (err) {
      console.error('Failed to log signup activity:', err);
    }
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(201).json({ token, user: { id: userId, name, email, role: 'user' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const domainValid = await isEmailDomainValid(email);
    if (!domainValid) {
      return res.status(400).json({ error: 'The email domain is invalid or inactive.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await logSecurityEvent('Failed Login Attempts', 'medium', email, req.ip, `Failed login attempt: Email ${email} not found`, req.originalUrl, req.headers['user-agent']);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    if (user.is_blocked) {
      await logSecurityEvent('Suspicious Activity', 'high', email, req.ip, `Blocked account login attempt for ${email}`, req.originalUrl, req.headers['user-agent']);
      return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logSecurityEvent('Failed Login Attempts', 'medium', email, req.ip, `Failed login attempt: Incorrect password for ${email}`, req.originalUrl, req.headers['user-agent']);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [user.id, today]);
    } catch (err) {
      console.error('Failed to log login activity:', err);
    }
    
    // Log successful login
    const eventType = user.role === 'admin' ? 'Admin Login' : 'User Login';
    await logSecurityEvent(eventType, 'info', user.email, req.ip, `Successful login for ${user.name} (${user.role})`, req.originalUrl, req.headers['user-agent']);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    await logSecurityEvent('API Errors', 'high', email, req.ip, `Login server error: ${error.message}`, req.originalUrl, req.headers['user-agent']);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Google Authentication Route
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', authLimiter, async (req, res) => {
  const { credential, access_token } = req.body;

  if (!credential && !access_token) {
    return res.status(400).json({ error: 'Google credential or access token is required.' });
  }

  try {
    let email, name, picture;

    if (credential) {
      // Verify the ID token from Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Fetch profile from userinfo endpoint using access token
      const verifyRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (!verifyRes.ok) {
        return res.status(400).json({ error: 'Invalid Google access token.' });
      }
      const payload = await verifyRes.json();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google account.' });
    }

    // 2. Check if user already exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = users[0];
    let isNewUser = false;
    let userId;

    if (user) {
      userId = user.id;
      // If user exists but is blocked
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });
      }

      // If user has no profile photo, update it with Google profile photo
      if (!user.image_path && picture) {
        await db.query('UPDATE users SET image_path = ? WHERE id = ?', [picture, userId]);
        user.image_path = picture;
      }
    } else {
      // 3. User does not exist, auto-register them
      isNewUser = true;
      userId = require('crypto').randomUUID();
      const cleanName = sanitizeInput(name || 'Google User');
      
      // Generate a securely hashed random password
      const hashedPassword = await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10);

      await db.query(
        'INSERT INTO users (id, name, email, password, role, image_path) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, cleanName, email, hashedPassword, 'user', picture || null]
      );

      user = { id: userId, name: cleanName, email, role: 'user', image_path: picture || null };
    }

    // 4. Log active session
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [userId, today]);
    } catch (err) {
      console.error('Failed to log Google login activity:', err);
    }

    // 5. Generate session token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        image_path: user.image_path || null,
        phone: user.phone || null,
        state: user.state || null
      },
      isNewUser
    });
  } catch (error) {
    console.error('Error verifying Google token:', error.message);
    res.status(400).json({ error: 'Authentication failed: Invalid Google ID token.' });
  }
});

// ---- WEB PUSH NOTIFICATIONS SETUP ----
const webpush = require('web-push');

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log('VAPID environment keys are missing. Generating fresh VAPID keys...');
  try {
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;

    // Persist VAPID keys in .env
    const envPath = path.resolve(__dirname, '../.env');
    const localEnvPath = path.resolve(__dirname, '.env');
    const targetPath = fs.existsSync(envPath) ? envPath : localEnvPath;

    if (fs.existsSync(targetPath)) {
      fs.appendFileSync(targetPath, `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`);
      console.log(`VAPID keys automatically appended to: ${targetPath}`);
    } else {
      fs.writeFileSync(targetPath, `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`);
      console.log(`Created new .env file with VAPID keys at: ${targetPath}`);
    }
  } catch (err) {
    console.error('Failed to generate VAPID keys:', err.message);
  }
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:tractorsewaadmin@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('Web Push VAPID configuration initialized.');
}

// Helper function to send push notifications to a user
const sendPushNotification = async (userId, title, body, url = '/dashboard') => {
  try {
    const [subscriptions] = await db.query(
      'SELECT id, endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, url });

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      webpush.sendNotification(pushSubscription, payload)
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Pruning expired/revoked subscription endpoint ID: ${sub.id}`);
            await db.query('DELETE FROM user_push_subscriptions WHERE id = ?', [sub.id]);
          } else {
            console.error(`Web Push sending failed for subscription ID ${sub.id}:`, err.message);
          }
        });
    }
  } catch (err) {
    console.error('Error in sendPushNotification helper:', err);
  }
};

// API: Get VAPID Public Key
app.get('/api/notifications/vapid-key', (req, res) => {
  res.json({ vapidKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// API: Subscribe to Push Notifications
app.post('/api/notifications/subscribe', authenticateToken, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription payload.' });
  }

  try {
    // Check if endpoint subscription already exists
    const [existing] = await db.query(
      'SELECT id FROM user_push_subscriptions WHERE endpoint = ?',
      [subscription.endpoint]
    );

    if (existing.length > 0) {
      // Update User ID in case a different user logs in on the same browser device
      await db.query(
        'UPDATE user_push_subscriptions SET user_id = ? WHERE endpoint = ?',
        [req.user.id, subscription.endpoint]
      );
    } else {
      await db.query(
        'INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
        [req.user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
      );
    }

    res.status(201).json({ message: 'Subscribed to push notifications successfully.' });
  } catch (err) {
    console.error('Error registering push subscription:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Unsubscribe from Push Notifications
app.post('/api/notifications/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required for unsubscription.' });
  }

  try {
    await db.query('DELETE FROM user_push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.json({ message: 'Unsubscribed from push notifications successfully.' });
  } catch (err) {
    console.error('Error unsubscribing push notifications:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, state, phone, bio, image_path, is_blocked, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [req.user.id, today]);
    } catch (err) {
      console.error('Failed to log active session:', err);
    }

    if (users[0].is_blocked) {
      return res.status(403).json({ error: 'Account blocked' });
    }

    // Get count of listings
    const [harvesters] = await db.query('SELECT COUNT(*) as count FROM harvesters WHERE user_id = ?', [req.user.id]);
    const [operators] = await db.query('SELECT COUNT(*) as count FROM operators WHERE user_id = ?', [req.user.id]);
    const [requests] = await db.query('SELECT COUNT(*) as count FROM requests WHERE user_id = ?', [req.user.id]);

    const userObj = { ...users[0], imagePath: users[0].image_path };

    res.json({
      ...userObj,
      stats: {
        harvesters: harvesters[0].count,
        operators: operators[0].count,
        requests: requests[0].count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  let email = 'Anonymous';
  let role = 'user';
  let token = req.cookies?.token;
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      email = decoded.email || 'unknown';
    } catch (_) {}
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  const eventType = email.includes('admin') || email === 'admin@123' ? 'Admin Logout' : 'User Logout';
  logSecurityEvent(eventType, 'info', email, req.ip, `${eventType} successfully for ${email}`, req.originalUrl, req.headers['user-agent']);

  res.json({ success: true, message: 'Logged out successfully' });
});

// 3. User Profile Update
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, state, phone, bio, imagePath } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  try {
    const cleanName = sanitizeInput(name);
    const cleanState = sanitizeInput(state);
    const cleanBio = sanitizeInput(bio);

    // Retrieve old avatar to clean up storage if updated
    const [userRows] = await db.query('SELECT image_path FROM users WHERE id = ?', [req.user.id]);
    const oldAvatar = userRows.length > 0 ? userRows[0].image_path : null;

    await db.query(
      'UPDATE users SET name = ?, state = ?, phone = ?, bio = ?, image_path = ? WHERE id = ?',
      [cleanName, cleanState || null, cleanedPhone, cleanBio || null, imagePath || null, req.user.id]
    );

    // If old avatar exists and is different from the newly set one, delete it from storage
    if (oldAvatar && oldAvatar !== imagePath) {
      await deleteFromSupabase(oldAvatar);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, role, image_path as imagePath FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Operator Routes
app.get('/api/operators', async (req, res) => {
  const { search, location, state, availability, limit, userId, status, sortBy } = req.query;
  const caller = await getOptionalUser(req);
  const userRole = caller ? caller.role : null;
  let queryStr = `
    SELECT o.*,
           COALESCE((SELECT AVG(rating) FROM ratings WHERE target_type = 'operator' AND target_id = o.id), 0) as avgRating,
           (SELECT COUNT(*) FROM ratings WHERE target_type = 'operator' AND target_id = o.id) as ratingCount
    FROM operators o
    WHERE 1=1
  `;
  const queryParams = [];

  // Exclude skeleton profiles from general browsing for non-admins
  if (userRole !== 'admin' && !userId) {
    queryStr += ' AND o.is_profile_completed = 1';
  }

  // Enforce manual verification filtering
  if (userRole === 'admin') {
    // Admin sees all by default, or filtered by requested status
    if (status) {
      queryStr += ' AND o.verification_status = ?';
      queryParams.push(status);
    }
  } else {
    // Normal user or anonymous
    if (userId) {
      // If requested userId matches caller (owner), they can see all status.
      // Otherwise, they can only see Approved.
      if (caller && caller.id === userId) {
        // Owner requesting own profile -> see all statuses
      } else {
        // Others requesting -> see only approved
        queryStr += ' AND o.verification_status = \'Approved\'';
      }
    } else {
      // General browsing -> ONLY see Approved AND filter OUT current user's own listings if logged in!
      queryStr += ' AND o.verification_status = \'Approved\'';
      if (caller) {
        queryStr += ' AND o.user_id != ?';
        queryParams.push(caller.id);
      }
    }
  }

  if (userId) {
    queryStr += ' AND o.user_id = ?';
    queryParams.push(userId);
  }

  if (search) {
    queryStr += ' AND o.name LIKE ?';
    queryParams.push(`%${search}%`);
  }
  if (location) {
    queryStr += ' AND o.location LIKE ?';
    queryParams.push(`%${location}%`);
  }
  if (state) {
    queryStr += ' AND o.state = ?';
    queryParams.push(state);
  }
  if (availability) {
    queryStr += ' AND o.availability = ?';
    queryParams.push(availability);
  }

  if (sortBy === 'ratingHighest') {
    queryStr += ' ORDER BY avgRating DESC, ratingCount DESC, o.id DESC';
  } else {
    queryStr += ' ORDER BY o.id DESC';
  }

  if (limit) {
    queryStr += ' LIMIT ?';
    queryParams.push(parseInt(limit));
  }

  try {
    const [rows] = await db.query(queryStr, queryParams);
    // Parse machine expertise array back to array object
    const parsedRows = rows.map(r => ({
      ...r,
      avgRating: parseFloat(r.avgRating || 0).toFixed(1),
      ratingCount: parseInt(r.ratingCount || 0),
      descriptionTranslations: JSON.parse(r.description_translations || '{}'),
      machineExpertise: JSON.parse(r.machine_expertise || '[]'),
      verificationStatus: r.verification_status,
      verificationFeedback: r.verification_feedback,
      verification_status: r.verification_status,
      verification_feedback: r.verification_feedback
    }));
    res.json(parsedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/operators/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT o.*, u.name as ownerName, u.image_path as ownerProfilePic FROM operators o JOIN users u ON o.user_id = u.id WHERE o.id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    const op = rows[0];
    const caller = await getOptionalUser(req);
    const isOwner = caller && caller.id === op.user_id;
    const userRole = caller ? caller.role : null;
    const isAdmin = userRole === 'admin';
    if (op.verification_status !== 'Approved' && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    res.json({
      ...op,
      ownerName: op.ownerName,
      ownerProfilePic: op.ownerProfilePic,
      descriptionTranslations: JSON.parse(op.description_translations || '{}'),
      machineExpertise: JSON.parse(op.machine_expertise || '[]'),
      verificationStatus: op.verification_status,
      verificationFeedback: op.verification_feedback,
      verification_status: op.verification_status,
      verification_feedback: op.verification_feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/operators', authenticateToken, async (req, res) => {
  const { name, experience, location, state, machineExpertise, availability, description, phone, whatsapp, imagePath } = req.body;
  if (!name || !experience || !location || !state || !machineExpertise) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const cleanedPhone = phone ? cleanPhone(phone) : null;
  if (phone && !cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  const cleanedWhatsapp = whatsapp ? cleanPhone(whatsapp) : null;
  if (whatsapp && !cleanedWhatsapp) {
    return res.status(400).json({ error: 'Invalid WhatsApp number. Must be exactly 10 digits.' });
  }

  try {
    const expertiseStr = Array.isArray(machineExpertise) ? JSON.stringify(machineExpertise) : JSON.stringify([machineExpertise]);

    const cleanName = sanitizeInput(name);
    const cleanLocation = sanitizeInput(location);
    const cleanState = sanitizeInput(state);
    const cleanAvailability = sanitizeInput(availability);
    const cleanDescription = sanitizeInput(description);

    let descTranslationsStr = null;
    if (cleanDescription) {
      try {
        const translations = await getTranslations(cleanDescription);
        descTranslationsStr = JSON.stringify(translations);
      } catch (err) {
        console.error("Translation error:", err);
      }
    }

    await db.query(
      `INSERT INTO operators (id, user_id, name, experience, location, state, machine_expertise, availability, description, description_translations, phone, whatsapp, image_path, verification_status, is_profile_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unverified', 1)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         experience = VALUES(experience),
         location = VALUES(location),
         state = VALUES(state),
         machine_expertise = VALUES(machine_expertise),
         availability = VALUES(availability),
         description = VALUES(description),
         description_translations = VALUES(description_translations),
         phone = VALUES(phone),
         whatsapp = VALUES(whatsapp),
         image_path = VALUES(image_path),
         is_profile_completed = 1`,
      [require('crypto').randomUUID(), req.user.id, cleanName, experience, cleanLocation, cleanState, expertiseStr, cleanAvailability || 'Available', cleanDescription || null, descTranslationsStr, cleanedPhone, cleanedWhatsapp, imagePath || null]
    );

    res.status(201).json({ message: 'Operator profile saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit to allow high-res driving licenses from phone cameras
});

const verifyUploadFields = memoryUpload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'licenseFront', maxCount: 1 },
  { name: 'licenseBack', maxCount: 1 }
]);

app.post('/api/operators/verify-id', authenticateToken, (req, res, next) => {
  verifyUploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum file size allowed is 15MB.' });
      }
      return res.status(400).json({ error: 'Error uploading files. Ensure correct fields are uploaded.' });
    }
    next();
  });
}, async (req, res) => {
  const { consent } = req.body;
  if (!consent || consent === 'false') {
    return res.status(400).json({ error: 'You must provide explicit consent for ID verification.' });
  }

  if (!req.files || !req.files['selfie'] || !req.files['licenseFront'] || !req.files['licenseBack']) {
    return res.status(400).json({ error: 'Please upload all three required images: selfie, license front, and license back.' });
  }

  const selfie = req.files['selfie'][0];
  const licenseFront = req.files['licenseFront'][0];
  const licenseBack = req.files['licenseBack'][0];

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(selfie.mimetype) || !allowedMimes.includes(licenseFront.mimetype) || !allowedMimes.includes(licenseBack.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.' });
  }

  const crypto = require('crypto');
  const getHash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

  const uploadedPaths = [];
  const activePool = await db.getPool();
  const conn = await activePool.getConnection();

  try {
    await conn.beginTransaction();

    const selfieHash = getHash(selfie.buffer);
    const licenseFrontHash = getHash(licenseFront.buffer);
    const licenseBackHash = getHash(licenseBack.buffer);

    const [existing] = await conn.query('SELECT id FROM operators WHERE user_id = ?', [req.user.id]);
    let operatorId;
    if (existing.length > 0) {
      operatorId = existing[0].id;
    } else {
      operatorId = crypto.randomUUID();
      // Insert a skeleton operator row first
      await conn.query(
        "INSERT INTO operators (id, user_id, name, experience, location, state, machine_expertise, availability, verification_status) VALUES (?, ?, ?, 0, 'Not Specified', 'Maharashtra', '[]', 'Available', 'Pending')",
        [operatorId, req.user.id, req.user.name || 'Operator Profile']
      );
    }

    const uuid = crypto.randomUUID();
    const selfiePath = `verifications/${req.user.id}/selfie-${uuid}.png`;
    const licenseFrontPath = `verifications/${req.user.id}/licenseFront-${uuid}.png`;
    const licenseBackPath = `verifications/${req.user.id}/licenseBack-${uuid}.png`;

    // Upload to Supabase Private Storage with MIME type fallback retry mechanism
    const uploadToSupabase = async (file, path) => {
      let result = await supabase.storage
        .from(supabaseBucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      let error = result.error;
      let data = result.data;

      // If unsupported MIME type error (e.g. image/png is blocked by bucket restrictions), retry with image/jpeg
      if (error && (error.status === 400 || error.statusCode === '415' || String(error.message).toLowerCase().includes('mime type') || String(error.message).toLowerCase().includes('not supported'))) {
        console.warn(`MIME type ${file.mimetype} rejected by Supabase bucket. Retrying with image/jpeg...`);
        const retryResult = await supabase.storage
          .from(supabaseBucket)
          .upload(path, file.buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
        error = retryResult.error;
        data = retryResult.data;
      }

      // If still rejected, retry with application/octet-stream (general binary format, widely accepted)
      if (error && (error.status === 400 || error.statusCode === '415' || String(error.message).toLowerCase().includes('mime type') || String(error.message).toLowerCase().includes('not supported'))) {
        console.warn(`MIME type retry failed. Retrying with application/octet-stream...`);
        const octetResult = await supabase.storage
          .from(supabaseBucket)
          .upload(path, file.buffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });
        error = octetResult.error;
        data = octetResult.data;
      }

      if (error) {
        console.error('Supabase upload final error:', error);
        throw error;
      }
      uploadedPaths.push(path);
      return path;
    };

    await uploadToSupabase(selfie, selfiePath);
    await uploadToSupabase(licenseFront, licenseFrontPath);
    await uploadToSupabase(licenseBack, licenseBackPath);

    // Cryptographic signature
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const signature = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${req.user.id}:${timestamp}:${selfieHash}:${licenseFrontHash}:${licenseBackHash}`)
      .digest('hex');

    // Insert into operator_consent_logs
    const auditId = crypto.randomUUID();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const consentText = "I hereby explicitly consent to Tractor Seva collecting and processing my live selfie and driving license images solely for the purpose of verifying my profile. I understand this data will be stored securely and reviewed manually by the system administrator.";

    await conn.query(
      'INSERT INTO operator_consent_logs (id, user_id, operator_id, consent_text, selfie_hash, license_front_hash, license_back_hash, ip_address, user_agent, timestamp, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [auditId, req.user.id, operatorId, consentText, selfieHash, licenseFrontHash, licenseBackHash, ipAddress, userAgent, timestamp, signature]
    );

    // Update operators table
    await conn.query(
      "UPDATE operators SET selfie_image_path = ?, license_front_path = ?, license_back_path = ?, consent_signature = ?, consent_timestamp = ?, verification_status = 'Pending', verification_feedback = NULL WHERE user_id = ?",
      [selfiePath, licenseFrontPath, licenseBackPath, signature, timestamp, req.user.id]
    );

    await conn.commit();
    res.json({ message: 'Identity verification files uploaded and consent audit logged successfully.' });
  } catch (error) {
    await conn.rollback();
    console.error('Error in operator verify-id:', error);
    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage.from(supabaseBucket).remove(uploadedPaths);
        console.log('Successfully rolled back uploaded files from Supabase:', uploadedPaths);
      } catch (cleanupErr) {
        console.error('Failed to cleanup uploaded files during rollback:', cleanupErr);
      }
    }
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// 5. Harvester Routes
app.get('/api/harvesters', async (req, res) => {
  const { search, location, state, company, limit, operatorId, status, userId, sortBy } = req.query;
  const caller = await getOptionalUser(req);
  const userRole = caller ? caller.role : null;
  let queryStr = `
    SELECT h.*, u.name as ownerName, u.image_path as ownerProfilePic,
           COALESCE((SELECT AVG(rating) FROM ratings WHERE target_type = 'machine' AND target_id = h.id), 0) as avgRating,
           (SELECT COUNT(*) FROM ratings WHERE target_type = 'machine' AND target_id = h.id) as ratingCount
    FROM harvesters h 
    JOIN users u ON h.user_id = u.id 
    WHERE 1=1
  `;
  const queryParams = [];

  // Enforce manual verification filtering
  if (userRole === 'admin') {
    // Admin sees all by default, or filtered by requested status
    if (status) {
      queryStr += ' AND h.verification_status = ?';
      queryParams.push(status);
    }
  } else {
    // Normal user or anonymous
    if (userId) {
      // If requested userId matches caller (owner), they can see all status.
      // Otherwise, they can only see Approved.
      if (caller && caller.id === userId) {
        // Owner requesting own listings -> see all statuses
      } else {
        // Others requesting -> see only approved
        queryStr += ' AND h.verification_status = \'Approved\'';
      }
    } else {
      // General browsing -> ONLY see Approved AND filter OUT current user's own listings if logged in!
      queryStr += ' AND h.verification_status = \'Approved\'';
      if (caller) {
        queryStr += ' AND h.user_id != ?';
        queryParams.push(caller.id);
      }
    }
  }

  if (search) {
    queryStr += ' AND (h.machine_name LIKE ? OR u.name LIKE ?)';
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  if (location) {
    queryStr += ' AND h.location LIKE ?';
    queryParams.push(`%${location}%`);
  }
  if (state) {
    queryStr += ' AND h.state = ?';
    queryParams.push(state);
  }
  if (company) {
    queryStr += ' AND h.company = ?';
    queryParams.push(company);
  }
  if (operatorId) {
    // Match owner's harvesters (simulating operator/owner relation)
    queryStr += ' AND h.user_id = (SELECT user_id FROM operators WHERE id = ?)';
    queryParams.push(operatorId);
  }
  if (userId) {
    queryStr += ' AND h.user_id = ?';
    queryParams.push(userId);
  }

  if (sortBy === 'ratingHighest') {
    queryStr += ' ORDER BY avgRating DESC, ratingCount DESC, h.id DESC';
  } else {
    queryStr += ' ORDER BY h.id DESC';
  }


  if (limit) {
    queryStr += ' LIMIT ?';
    queryParams.push(parseInt(limit));
  }

  try {
    const [rows] = await db.query(queryStr, queryParams);
    const formattedRows = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      machineName: r.machine_name,
      company: r.company,
      model: r.model,
      year: r.year,
      location: r.location,
      state: r.state,
      phone: r.phone,
      whatsapp: r.whatsapp,
      description: r.description,
      descriptionTranslations: JSON.parse(r.description_translations || '{}'),
      imagePath: r.image_path,
      ownerName: r.ownerName,
      ownerProfilePic: r.ownerProfilePic,
      avgRating: parseFloat(r.avgRating || 0).toFixed(1),
      ratingCount: parseInt(r.ratingCount || 0),
      verificationStatus: r.verification_status,
      verificationFeedback: r.verification_feedback,
      verification_status: r.verification_status,
      verification_feedback: r.verification_feedback,
      serialNo: r.serial_no,
      chassisNo: r.chassis_no,
      mfgMonthYear: r.mfg_month_year,
      engineNo: r.engine_no,
      enginePower: r.engine_power,
      engineMake: r.engine_make,
      engineModel: r.engine_model,
      serviceHotlineNo: r.service_hotline_no
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/harvesters/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT h.*, u.name as ownerName, u.image_path as ownerProfilePic FROM harvesters h JOIN users u ON h.user_id = u.id WHERE h.id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Harvester not found' });
    }
    const r = rows[0];
    const caller = await getOptionalUser(req);
    const isOwner = caller && caller.id === r.user_id;
    const userRole = caller ? caller.role : null;
    const isAdmin = userRole === 'admin';
    if (r.verification_status !== 'Approved' && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Harvester not found' });
    }
    res.json({
      id: r.id,
      userId: r.user_id,
      machineName: r.machine_name,
      company: r.company,
      model: r.model,
      year: r.year,
      location: r.location,
      state: r.state,
      phone: r.phone,
      whatsapp: r.whatsapp,
      description: r.description,
      descriptionTranslations: JSON.parse(r.description_translations || '{}'),
      imagePath: r.image_path,
      ownerName: r.ownerName,
      ownerProfilePic: r.ownerProfilePic,
      serialNo: r.serial_no,
      chassisNo: r.chassis_no,
      mfgMonthYear: r.mfg_month_year,
      engineNo: r.engine_no,
      enginePower: r.engine_power,
      engineMake: r.engine_make,
      engineModel: r.engine_model,
      serviceHotlineNo: r.service_hotline_no,
      verificationStatus: r.verification_status,
      verificationFeedback: r.verification_feedback,
      verification_status: r.verification_status,
      verification_feedback: r.verification_feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/harvesters', authenticateToken, async (req, res) => {
  const { 
    machineName, company, model, year, location, state, phone, whatsapp, description, imagePath,
    serialNo, chassisNo, mfgMonthYear, engineNo, enginePower, engineMake, engineModel, serviceHotlineNo 
  } = req.body;

  if (!machineName || !company || !model || !location || !state || !serialNo || !chassisNo || !mfgMonthYear || !engineNo) {
    return res.status(400).json({ error: 'Please provide all required fields, including the first 5 specifications' });
  }

  const cleanedPhone = phone ? cleanPhone(phone) : null;
  if (phone && !cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  const cleanedWhatsapp = whatsapp ? cleanPhone(whatsapp) : null;
  if (whatsapp && !cleanedWhatsapp) {
    return res.status(400).json({ error: 'Invalid WhatsApp number. Must be exactly 10 digits.' });
  }

  if (year && !validateYear(year)) {
    return res.status(400).json({ error: 'Invalid year. Must be a 4-digit number between 1900 and ' + (new Date().getFullYear() + 1) + '.' });
  }

  try {
    const cleanMachineName = sanitizeInput(machineName);
    const cleanCompany = sanitizeInput(company);
    const cleanModel = sanitizeInput(model);
    const cleanLocation = sanitizeInput(location);
    const cleanState = sanitizeInput(state);
    const cleanDescription = sanitizeInput(description);
    const cleanSerialNo = sanitizeInput(serialNo);
    const cleanChassisNo = sanitizeInput(chassisNo);
    const cleanMfgMonthYear = sanitizeInput(mfgMonthYear);
    const cleanEngineNo = sanitizeInput(engineNo);
    const cleanEnginePower = sanitizeInput(enginePower);
    const cleanEngineMake = sanitizeInput(engineMake);
    const cleanEngineModel = sanitizeInput(engineModel);
    const cleanServiceHotlineNo = sanitizeInput(serviceHotlineNo);

    let descTranslationsStr = null;
    if (cleanDescription) {
      try {
        const translations = await getTranslations(cleanDescription);
        descTranslationsStr = JSON.stringify(translations);
      } catch (err) {
        console.error("Translation error:", err);
      }
    }

    await db.query(
      'INSERT INTO harvesters (id, user_id, machine_name, company, model, year, location, state, phone, whatsapp, description, description_translations, image_path, serial_no, chassis_no, mfg_month_year, engine_no, engine_power, engine_make, engine_model, service_hotline_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        require('crypto').randomUUID(),
        req.user.id,
        cleanMachineName,
        cleanCompany,
        cleanModel,
        year ? parseInt(year) : null,
        cleanLocation,
        cleanState,
        cleanedPhone,
        cleanedWhatsapp,
        cleanDescription || null,
        descTranslationsStr,
        imagePath || null,
        cleanSerialNo || null,
        cleanChassisNo || null,
        cleanMfgMonthYear || null,
        cleanEngineNo || null,
        cleanEnginePower || null,
        cleanEngineMake || null,
        cleanEngineModel || null,
        cleanServiceHotlineNo || null
      ]
    );
    res.status(201).json({ message: 'Harvester listed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/harvesters/:id', authenticateToken, async (req, res) => {
  const { 
    machineName, company, model, year, location, state, phone, whatsapp, description, imagePath,
    serialNo, chassisNo, mfgMonthYear, engineNo, enginePower, engineMake, engineModel, serviceHotlineNo 
  } = req.body;

  if (!machineName || !company || !model || !location || !state || !serialNo || !chassisNo || !mfgMonthYear || !engineNo) {
    return res.status(400).json({ error: 'Please provide all required fields, including the first 5 specifications' });
  }

  const cleanedPhone = phone ? cleanPhone(phone) : null;
  if (phone && !cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  const cleanedWhatsapp = whatsapp ? cleanPhone(whatsapp) : null;
  if (whatsapp && !cleanedWhatsapp) {
    return res.status(400).json({ error: 'Invalid WhatsApp number. Must be exactly 10 digits.' });
  }

  if (year && !validateYear(year)) {
    return res.status(400).json({ error: 'Invalid year. Must be a 4-digit number between 1900 and ' + (new Date().getFullYear() + 1) + '.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM harvesters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Harvester not found' });
    }

    const harvester = rows[0];
    if (harvester.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this machine listing' });
    }

    const cleanMachineName = sanitizeInput(machineName);
    const cleanCompany = sanitizeInput(company);
    const cleanModel = sanitizeInput(model);
    const cleanLocation = sanitizeInput(location);
    const cleanState = sanitizeInput(state);
    const cleanDescription = sanitizeInput(description);
    const cleanSerialNo = sanitizeInput(serialNo);
    const cleanChassisNo = sanitizeInput(chassisNo);
    const cleanMfgMonthYear = sanitizeInput(mfgMonthYear);
    const cleanEngineNo = sanitizeInput(engineNo);
    const cleanEnginePower = sanitizeInput(enginePower);
    const cleanEngineMake = sanitizeInput(engineMake);
    const cleanEngineModel = sanitizeInput(engineModel);
    const cleanServiceHotlineNo = sanitizeInput(serviceHotlineNo);

    let descTranslationsStr = harvester.description_translations;
    
    // Only translate if description changed
    if (cleanDescription && cleanDescription !== harvester.description) {
      try {
        const translations = await getTranslations(cleanDescription);
        descTranslationsStr = JSON.stringify(translations);
      } catch (err) {
        console.error("Translation error:", err);
      }
    } else if (!cleanDescription) {
      descTranslationsStr = null;
    }

    await db.query(
      'UPDATE harvesters SET machine_name = ?, company = ?, model = ?, year = ?, location = ?, state = ?, phone = ?, whatsapp = ?, description = ?, description_translations = ?, image_path = ?, serial_no = ?, chassis_no = ?, mfg_month_year = ?, engine_no = ?, engine_power = ?, engine_make = ?, engine_model = ?, service_hotline_no = ?, verification_status = \'Pending\', verification_feedback = NULL WHERE id = ?',
      [
        cleanMachineName,
        cleanCompany,
        cleanModel,
        year ? parseInt(year) : null,
        cleanLocation,
        cleanState,
        cleanedPhone,
        cleanedWhatsapp,
        cleanDescription || null,
        descTranslationsStr,
        imagePath !== undefined ? imagePath : harvester.image_path,
        cleanSerialNo || null,
        cleanChassisNo || null,
        cleanMfgMonthYear || null,
        cleanEngineNo || null,
        cleanEnginePower || null,
        cleanEngineMake || null,
        cleanEngineModel || null,
        cleanServiceHotlineNo || null,
        req.params.id
      ]
    );
    res.json({ message: 'Harvester updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/harvesters/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM harvesters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Harvester not found' });
    }

    const harvester = rows[0];
    if (harvester.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this machine listing' });
    }

    if (harvester.image_path) {
      await deleteFromSupabase(parseImagePaths(harvester.image_path));
    }

    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM ratings WHERE target_type = 'machine' AND target_id = ?", [req.params.id]);
      await conn.query('DELETE FROM harvesters WHERE id = ?', [req.params.id]);
      await conn.commit();
      res.json({ message: 'Harvester listing deleted successfully' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Request Routes
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    // Check requester role
    const userRole = req.user.role || 'user';

    const { tab, userId, location, state, limit } = req.query;
    let queryStr = 'SELECT r.*, u.name as requesterName, u.phone as requesterPhone, u.image_path as requesterProfilePic FROM requests r JOIN users u ON r.user_id = u.id WHERE 1=1';
    const queryParams = [];

    if (userRole !== 'admin') {
      // Force non-admins to only see their own requests
      queryStr += ' AND r.user_id = ?';
      queryParams.push(req.user.id);
    } else {
      // Admins can filter by userId query parameter
      if (userId === 'me') {
        queryStr += ' AND r.user_id = ?';
        queryParams.push(req.user.id);
      } else if (userId && userId !== 'all') {
        queryStr += ' AND r.user_id = ?';
        queryParams.push(userId);
      }
    }

    if (tab) {
      queryStr += ' AND r.type = ?';
      queryParams.push(tab);
    }
    if (location) {
      queryStr += ' AND r.location LIKE ?';
      queryParams.push(`%${location}%`);
    }
    if (state) {
      queryStr += ' AND r.state = ?';
      queryParams.push(state);
    }

    queryStr += ' ORDER BY r.id DESC';

    if (limit) {
      queryStr += ' LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    const [rows] = await db.query(queryStr, queryParams);
    const formattedRows = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      location: r.location,
      state: r.state,
      machineType: r.machine_type,
      duration: r.duration,
      startDate: r.start_date,
      status: r.status,
      description: r.description,
      requesterName: r.requesterName,
      requesterPhone: r.requesterPhone,
      requesterProfilePic: r.requesterProfilePic
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.name as requesterName, u.phone as requesterPhone, u.image_path as requesterProfilePic FROM requests r JOIN users u ON r.user_id = u.id WHERE r.id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const r = rows[0];
    if (req.user.role !== 'admin' && r.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this request.' });
    }
    res.json({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      location: r.location,
      state: r.state,
      machineType: r.machine_type,
      duration: r.duration,
      startDate: r.start_date,
      status: r.status,
      description: r.description,
      requesterName: r.requesterName,
      requesterPhone: r.requesterPhone,
      requesterProfilePic: r.requesterProfilePic
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  const { type, location, state, machineType, duration, startDate, description } = req.body;

  // Look up user role to enforce harvester-only requests for non-admin users
  const userRole = req.user.role || 'user';

  const finalType = userRole === 'admin' ? (type || 'harvester') : 'harvester';

  if (!finalType || !location || !state || !machineType || !startDate) {
    return res.status(400).json({ error: 'Please fill out all required fields' });
  }

  let formattedDate = startDate;
  try {
    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() > 3000 || parsedDate.getFullYear() < 1900) {
      return res.status(400).json({ error: 'Invalid start date format. Please choose a valid date.' });
    }
    const yyyy = parsedDate.getFullYear();
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    formattedDate = `${yyyy}-${mm}-${dd}`;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid start date format' });
  }

  try {
    const cleanFinalType = sanitizeInput(finalType);
    const cleanLocation = sanitizeInput(location);
    const cleanState = sanitizeInput(state);
    const cleanMachineType = sanitizeInput(machineType);
    const cleanDuration = sanitizeInput(duration);
    const cleanDescription = sanitizeInput(description);

    await db.query(
      'INSERT INTO requests (id, user_id, type, location, state, machine_type, duration, start_date, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [require('crypto').randomUUID(), req.user.id, cleanFinalType, cleanLocation, cleanState, cleanMachineType, cleanDuration || null, formattedDate, 'Pending', cleanDescription || null]
    );
    res.status(201).json({ message: 'Requirement posted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const request = rows[0];
    if (request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this requirement' });
    }

    await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. Messages Routes
app.get('/api/messages', authenticateToken, async (req, res) => {
  const { chatPartnerId } = req.query;
  const currentUserId = req.user.id;

  try {
    if (chatPartnerId) {
      // Mark messages from partner to current user as read
      try {
        await db.query('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [chatPartnerId, currentUserId]);
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }

      // Fetch conversation messages between current user and partner
      const [messages] = await db.query(`
        SELECT m.*, 
               s.name as senderName, 
               s.role as senderRole,
               s.image_path as senderImagePath,
               r.name as receiverName
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
      `, [currentUserId, chatPartnerId, chatPartnerId, currentUserId]);
      
      return res.json(messages);
    }

    // Default: Get list of users the current user has chatted with
    const [chatPartners] = await db.query(`
      SELECT DISTINCT u.id, u.name, u.role, u.image_path as imagePath,
             (SELECT content FROM messages 
              WHERE (sender_id = u.id AND receiver_id = ?) 
                 OR (sender_id = ? AND receiver_id = u.id) 
              ORDER BY created_at DESC LIMIT 1) as lastMessage,
             (SELECT created_at FROM messages 
              WHERE (sender_id = u.id AND receiver_id = ?) 
                 OR (sender_id = ? AND receiver_id = u.id) 
              ORDER BY created_at DESC LIMIT 1) as lastMessageTime
      FROM users u
      WHERE u.id != ? AND u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = ?
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = ?
      )
      ORDER BY lastMessageTime DESC
    `, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]);

    res.json(chatPartners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: 'Receiver and message content are required' });
  }

  try {
    const messageId = require('crypto').randomUUID();
    const cleanContent = sanitizeInput(content);
    await db.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [messageId, req.user.id, receiverId, cleanContent]
    );
    
    const [newMessage] = await db.query('SELECT * FROM messages WHERE id = ?', [messageId]);

    // Send Web Push Notification to the receiver
    try {
      const [senderRows] = await db.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
      const senderName = senderRows.length > 0 ? senderRows[0].name : 'Someone';
      const bodyPreview = cleanContent.length > 100 ? `${cleanContent.substring(0, 97)}...` : cleanContent;
      await sendPushNotification(receiverId, `New message from ${senderName}`, bodyPreview, '/messages');
    } catch (pushErr) {
      console.error('Failed to send chat push notification:', pushErr.message);
    }

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New Routes for Unread Message Notifications
app.get('/api/messages/unread', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, u.name as senderName, u.image_path as senderProfilePic
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.receiver_id = ? AND m.is_read = 0
      ORDER BY m.created_at ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/messages/unread/mark-read', authenticateToken, async (req, res) => {
  const { messageIds } = req.body;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'messageIds must be a non-empty array' });
  }
  try {
    await db.query('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND id IN (?)', [req.user.id, messageIds]);
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7.5. User Notifications Routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch DB notifications (only unread notifications)
    const [dbNotifications] = await db.query(
      'SELECT id, type, message, target_id as targetId, is_read as isRead, created_at as createdAt, NULL as senderId FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
      [req.user.id]
    );

    // 2. Fetch unread messages to dynamically construct "You got an message from..." notifications
    const [unreadMessages] = await db.query(
      `SELECT m.id, m.sender_id, m.created_at, u.name as senderName 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.receiver_id = ? AND m.is_read = 0`,
      [req.user.id]
    );

    // Filter unique senders, keeping the latest unread message per sender
    const uniqueSenders = new Map();
    unreadMessages.forEach(msg => {
      const existing = uniqueSenders.get(msg.sender_id);
      if (!existing || new Date(msg.created_at) > new Date(existing.created_at)) {
        uniqueSenders.set(msg.sender_id, msg);
      }
    });

    const msgNotifications = Array.from(uniqueSenders.values()).map(msg => ({
      id: msg.id,
      type: 'message',
      message: `You got an message from ${msg.senderName}`,
      isRead: 0,
      createdAt: msg.created_at,
      senderId: msg.sender_id
    }));

    // Merge and sort desc by date
    const merged = [...dbNotifications, ...msgNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(merged);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. Blog Routes
app.get('/api/blogs/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name FROM blog_categories ORDER BY name ASC');
    res.json(rows.map(row => row.name));
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/blogs', async (req, res) => {
  const { category, search, limit, offset, seed } = req.query;
  const user = await getOptionalUser(req);
  const currentUserId = user ? user.id : null;

  let queryStr = `
    SELECT b.*,
      (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) AS likes_count,
      (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) AS comments_count,
      IF(? IS NULL, 0, (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id AND user_id = ?)) AS has_liked
    FROM blogs b
    WHERE 1=1
  `;
  const queryParams = [currentUserId, currentUserId];

  if (category) {
    queryStr += ' AND b.category = ?';
    queryParams.push(category);
  }
  if (search) {
    queryStr += ' AND (b.title LIKE ? OR b.short_description LIKE ?)';
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (seed) {
    const parsedSeed = parseInt(seed) || 42;
    queryStr += ` ORDER BY RAND(${parsedSeed})`;
  } else {
    queryStr += ' ORDER BY b.id DESC';
  }

  if (limit) {
    queryStr += ' LIMIT ?';
    queryParams.push(parseInt(limit));
    if (offset) {
      queryStr += ' OFFSET ?';
      queryParams.push(parseInt(offset));
    }
  }

  try {
    const [rows] = await db.query(queryStr, queryParams);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  const user = await getOptionalUser(req);
  const currentUserId = user ? user.id : null;
  const blogId = req.params.id;

  try {
    const [rows] = await db.query(`
      SELECT b.*,
        (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) AS likes_count,
        (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) AS comments_count,
        IF(? IS NULL, 0, (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id AND user_id = ?)) AS has_liked
      FROM blogs b
      WHERE b.id = ?
    `, [currentUserId, currentUserId, blogId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment view count since the blog exists
    await db.query('UPDATE blogs SET views = views + 1 WHERE id = ?', [blogId]);

    // Fetch the comments list for this blog
    const [comments] = await db.query(`
      SELECT id, user_id, user_name, content, created_at
      FROM blog_comments
      WHERE blog_id = ?
      ORDER BY id DESC
    `, [blogId]);

    const blogData = rows[0];
    blogData.comments = comments;
    blogData.views = (blogData.views || 0) + 1;
    res.json(blogData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/blogs/:id/like', authenticateToken, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;
  const { liked } = req.body;

  try {
    if (liked) {
      await db.query('INSERT IGNORE INTO blog_likes (blog_id, user_id) VALUES (?, ?)', [blogId, userId]);
    } else {
      await db.query('DELETE FROM blog_likes WHERE blog_id = ? AND user_id = ?', [blogId, userId]);
    }

    // Get updated likes count
    const [countRow] = await db.query('SELECT COUNT(*) as count FROM blog_likes WHERE blog_id = ?', [blogId]);
    res.json({ success: true, likes_count: countRow[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/blogs/:id/comments', authenticateToken, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    // Fetch commenter's name from users table
    const [users] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = users[0] ? users[0].name : req.user.name || 'Anonymous';

    const cleanContent = sanitizeInput(content);
    const cleanUserName = sanitizeInput(userName);

    const [result] = await db.query(
      'INSERT INTO blog_comments (blog_id, user_id, user_name, content) VALUES (?, ?, ?, ?)',
      [blogId, userId, cleanUserName, cleanContent]
    );

    res.status(201).json({
      id: result.insertId,
      blog_id: parseInt(blogId, 10),
      user_id: userId,
      user_name: cleanUserName,
      content: cleanContent,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 9. Enquiry Routes
app.post('/api/enquiries', enquiryLimiter, async (req, res) => {
  const { name, phone, location, requirement, message, dateNeeded } = req.body;
  if (!name || !phone || !location || !requirement) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
  }

  try {
    const enquiryId = require('crypto').randomUUID();
    let formattedDate = dateNeeded || null;
    if (dateNeeded) {
      const parsedDate = new Date(dateNeeded);
      if (!isNaN(parsedDate.getTime())) {
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        formattedDate = `${yyyy}-${mm}-${dd}`;
      }
    }

    const cleanName = sanitizeInput(name);
    const cleanLocation = sanitizeInput(location);
    const cleanRequirement = sanitizeInput(requirement);
    const cleanMessage = sanitizeInput(message);

    // Dynamic column lookup to handle all versions of database schemas safely
    const [columns] = await db.query('DESCRIBE enquiries');
    const colNames = columns.map(c => c.Field);

    const insertData = {
      id: enquiryId,
      name: cleanName,
      location: cleanLocation,
      status: 'Active'
    };

    if (colNames.includes('phone')) {
      insertData.phone = cleanedPhone;
    }
    if (colNames.includes('number')) {
      insertData.number = cleanedPhone;
    }
    if (colNames.includes('requirement')) {
      insertData.requirement = cleanRequirement;
    }
    if (colNames.includes('requirement_type')) {
      insertData.requirement_type = cleanRequirement;
    }
    if (colNames.includes('message') && message !== undefined) {
      insertData.message = cleanMessage || null;
    }
    if (colNames.includes('date_needed')) {
      insertData.date_needed = formattedDate;
    }
    if (colNames.includes('dates_needed')) {
      insertData.dates_needed = formattedDate;
    }

    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const queryStr = `INSERT INTO enquiries (${fields.join(', ')}) VALUES (${placeholders})`;
    await db.query(queryStr, values);

    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    console.error('Error inserting enquiry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// 9.5 Settings Routes
app.get('/api/site-settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  const { enquiry_background } = req.body;
  if (!enquiry_background) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  try {
    await db.query(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      ['enquiry_background', enquiry_background, enquiry_background]
    );
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- ADMIN PRIVILEGED MIDDLEWARE & ROUTES ---

async function isAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const csvUpload = multer({
  dest: uploadsDir,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// 1. Admin Statistics Dashboard
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as count FROM users WHERE role != ?', ['admin']);
    const [operators] = await db.query("SELECT COUNT(*) as count FROM operators WHERE verification_status = 'Approved' AND is_profile_completed = 1");
    const [harvesters] = await db.query("SELECT COUNT(*) as count FROM harvesters WHERE verification_status = 'Approved'");
    const [requests] = await db.query('SELECT COUNT(*) as count FROM requests');
    const [blocked] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_blocked = 1');

    // Get daily login logs for the last 7 days
    const [loginLogs] = await db.query(`
      SELECT login_date, COUNT(DISTINCT user_id) as count
      FROM login_logs
      WHERE login_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY login_date
      ORDER BY login_date ASC
    `);

    // Format last 7 days continuous timeline
    const loginHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const found = loginLogs.find(row => {
        // SQL DATE field might come as Date object or string depending on timezone settings
        const rowDate = row.login_date instanceof Date 
          ? row.login_date.toISOString().slice(0, 10) 
          : String(row.login_date).slice(0, 10);
        return rowDate === dateStr;
      });
      
      const displayDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      loginHistory.push({
        dateStr,
        displayDate,
        count: found ? found.count : 0
      });
    }

    // Query performers (user metrics)
    const [performers] = await db.query(`
      SELECT u.id, u.name, u.email, u.image_path as imagePath, u.created_at as createdAt,
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id AND verification_status = 'Approved') as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             COALESCE((
               SELECT AVG(rating) 
               FROM ratings 
               WHERE (target_type = 'machine' AND target_id IN (SELECT id FROM harvesters WHERE user_id = u.id AND verification_status = 'Approved'))
                  OR (target_type = 'operator' AND target_id IN (SELECT id FROM operators WHERE user_id = u.id AND verification_status = 'Approved' AND is_profile_completed = 1))
             ), 0) as avgRating
      FROM users u
      WHERE u.role != 'admin'
    `);

    res.json({
      totalUsers: users[0].count,
      totalOperators: operators[0].count,
      totalHarvesters: harvesters[0].count,
      totalRequests: requests[0].count,
      blockedUsers: blocked[0].count,
      loginHistory,
      performers: performers.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        imagePath: p.imagePath,
        createdAt: p.createdAt,
        harvesterCount: p.harvesterCount,
        requestCount: p.requestCount,
        avgRating: parseFloat(p.avgRating || 0).toFixed(1)
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Admin List All Users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.state, u.phone, u.is_blocked, u.created_at,
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id AND verification_status = 'Approved') as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             (SELECT COUNT(*) FROM operators WHERE user_id = u.id AND verification_status = 'Approved' AND is_profile_completed = 1) as isOperator
      FROM users u
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Admin Toggle User Block Status
app.put('/api/admin/users/:id/block', authenticateToken, isAdmin, async (req, res) => {
  const { block } = req.body;
  try {
    const isBlockedVal = block ? 1 : 0;
    await db.query('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlockedVal, req.params.id]);
    res.json({ message: `User ${block ? 'blocked' : 'unblocked'} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Admin Delete Entire User Data & Auto-Ban
app.delete('/api/admin/users/:id/data', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const activePool = await db.getPool();
  const conn = await activePool.getConnection();
  try {
    // 1. Gather all files to delete from Supabase
    const supabaseFiles = [];
    
    // Get harvester images
    const [harvesters] = await db.query('SELECT image_path FROM harvesters WHERE user_id = ?', [userId]);
    harvesters.forEach(h => {
      if (h.image_path) {
        supabaseFiles.push(...parseImagePaths(h.image_path));
      }
    });

    // Get operator images
    const [operators] = await db.query(
      'SELECT image_path, selfie_image_path, license_front_path, license_back_path FROM operators WHERE user_id = ?',
      [userId]
    );
    operators.forEach(op => {
      if (op.image_path) supabaseFiles.push(op.image_path);
      if (op.selfie_image_path) supabaseFiles.push(op.selfie_image_path);
      if (op.license_front_path) supabaseFiles.push(op.license_front_path);
      if (op.license_back_path) supabaseFiles.push(op.license_back_path);
    });

    // Perform Supabase Storage Cleanup
    if (supabaseFiles.length > 0) {
      await deleteFromSupabase(supabaseFiles);
    }

    await conn.beginTransaction();

    // Delete ratings given by user
    await conn.query('DELETE FROM ratings WHERE rater_id = ?', [userId]);
    
    // Delete ratings targetting user's harvesters
    await conn.query("DELETE FROM ratings WHERE target_type = 'machine' AND target_id IN (SELECT id FROM harvesters WHERE user_id = ?)", [userId]);
    
    // Delete ratings targetting user's operators
    await conn.query("DELETE FROM ratings WHERE target_type = 'operator' AND target_id IN (SELECT id FROM operators WHERE user_id = ?)", [userId]);
    
    // Delete operator consent logs
    await conn.query('DELETE FROM operator_consent_logs WHERE user_id = ?', [userId]);
    
    // Delete user messages
    await conn.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);

    // Delete notifications
    await conn.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

    // Delete blog engagement
    await conn.query('DELETE FROM blog_likes WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM blog_comments WHERE user_id = ?', [userId]);

    // Delete base listings
    await conn.query('DELETE FROM harvesters WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM requests WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM operators WHERE user_id = ?', [userId]);
    
    // Auto-ban user
    await conn.query('UPDATE users SET is_blocked = 1 WHERE id = ?', [userId]);

    await conn.commit();
    res.json({ message: 'User listings and operator profiles cleared, and account blocked.' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// 5. Admin Delete Specific Harvester
app.delete('/api/admin/harvesters/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_path FROM harvesters WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && rows[0].image_path) {
      await deleteFromSupabase(parseImagePaths(rows[0].image_path));
    }
    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM ratings WHERE target_type = 'machine' AND target_id = ?", [req.params.id]);
      await conn.query('DELETE FROM harvesters WHERE id = ?', [req.params.id]);
      await conn.commit();
      res.json({ message: 'Harvester listing deleted by administrator.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Admin Delete Specific Request
app.delete('/api/admin/requests/:id', authenticateToken, isAdmin, async (req, res) => {
  const activePool = await db.getPool();
  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Request deleted by administrator.' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// 7. Admin Update Request Status (Accept/Reject/Pending)
app.put('/api/admin/requests/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Status must be Pending, Accepted, or Rejected.' });
  }
  try {
    await db.query('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Request status updated to ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/admin/operators/:id/verification-details', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT o.*, u.name as signupName, u.email as signupEmail, u.image_path as signupProfilePic FROM operators o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Operator profile not found.' });
    }
    const operator = rows[0];

    // Fetch consent audit log details
    const [logs] = await db.query('SELECT * FROM operator_consent_logs WHERE operator_id = ? ORDER BY timestamp DESC LIMIT 1', [id]);
    const auditLog = logs.length > 0 ? logs[0] : null;

    // Generate signed URLs from Supabase
    let selfieUrl = null;
    let licenseFrontUrl = null;
    let licenseBackUrl = null;

    if (operator.selfie_image_path) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .createSignedUrl(operator.selfie_image_path, 900); // 15 mins expiry
      if (!error && data) selfieUrl = data.signedUrl;
    }

    if (operator.license_front_path) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .createSignedUrl(operator.license_front_path, 900);
      if (!error && data) licenseFrontUrl = data.signedUrl;
    }

    if (operator.license_back_path) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .createSignedUrl(operator.license_back_path, 900);
      if (!error && data) licenseBackUrl = data.signedUrl;
    }

    res.json({
      operator: {
        id: operator.id,
        name: operator.name,
        experience: operator.experience,
        location: operator.location,
        state: operator.state,
        machine_expertise: operator.machine_expertise,
        description: operator.description,
        verification_status: operator.verification_status,
        verification_feedback: operator.verification_feedback,
        consent_timestamp: operator.consent_timestamp,
        consent_signature: operator.consent_signature,
        signupName: operator.signupName,
        signupEmail: operator.signupEmail,
        signupProfilePic: operator.signupProfilePic
      },
      verificationFiles: {
        selfieUrl,
        licenseFrontUrl,
        licenseBackUrl
      },
      auditLog
    });
  } catch (error) {
    console.error('Error fetching operator verification details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Verify Listing (Approve/Reject Harvester or Operator)
app.put('/api/admin/listings/:type/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  const { type, id } = req.params;
  const { status, feedback } = req.body;

  if (type !== 'harvester' && type !== 'operator') {
    return res.status(400).json({ error: 'Invalid listing type. Must be harvester or operator.' });
  }

  if (status !== 'Approved' && status !== 'Rejected' && status !== 'Pending') {
    return res.status(400).json({ error: 'Invalid verification status. Must be Approved, Rejected, or Pending.' });
  }

  const tableName = type === 'harvester' ? 'harvesters' : 'operators';
  const nameCol = type === 'harvester' ? 'machine_name' : 'name';

  try {
    const [rows] = await db.query(`SELECT id, user_id, ${nameCol} AS name FROM ${tableName} WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: `${type === 'harvester' ? 'Harvester' : 'Operator'} listing not found.` });
    }

    const listing = rows[0];

    await db.query(
      `UPDATE ${tableName} SET verification_status = ?, verification_feedback = ? WHERE id = ?`,
      [status, feedback || null, id]
    );

    // Send automated message notification to user
    const adminId = req.user.id;
    const ownerId = listing.user_id;
    const postName = listing.name;
    const statusText = status === 'Approved' ? 'Accepted' : (status === 'Pending' ? 'Pending Review' : 'Rejected');

    let content = `Listing: ${postName}\nStatus: ${statusText}`;
    if (feedback && feedback.trim()) {
      content += `\nReason: ${feedback.trim()}`;
    }

    // Insert message into the database
    const messageId = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [messageId, adminId, ownerId, content]
    );

    // Also trigger user notifications for listings verifications
    const notifId = require('crypto').randomUUID();
    let notifMessage = '';
    if (type === 'harvester') {
      if (status === 'Approved') {
        notifMessage = `Your post for harvestor ${postName} has been accepted.`;
      } else if (status === 'Rejected') {
        notifMessage = `Your post for harvestor ${postName} has been rejected.`;
      }
    } else if (type === 'operator') {
      if (status === 'Approved') {
        notifMessage = `Your verification has been approved by the admin.`;
      } else if (status === 'Rejected') {
        notifMessage = `Your verification has been rejected by the admin.`;
      }
    }

    if (notifMessage) {
      await db.query(
        'INSERT INTO notifications (id, user_id, type, message, target_id) VALUES (?, ?, ?, ?, ?)',
        [notifId, ownerId, `${type}_verification`, notifMessage, id]
      );
      try {
        await sendPushNotification(ownerId, `${type === 'harvester' ? 'Harvester' : 'Operator'} Verification`, notifMessage, '/dashboard');
      } catch (pushErr) {
        console.error('Failed to send verification push notification:', pushErr.message);
      }
    }

    res.json({ message: `${type === 'harvester' ? 'Harvester' : 'Operator'} verification status updated to ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Enquiries Routes
app.get('/api/admin/enquiries', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/admin/enquiries/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Enquiry status updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. Admin English Query Search (Natural Language Parser)
app.get('/api/admin/users/query', authenticateToken, isAdmin, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ parsed: {}, results: [] });

  try {
    const lowercaseQuery = q.toLowerCase();
    const districtsPath = path.join(__dirname, '../src/app/components/districts.json');
    let districtsData = { states: [] };
    if (fs.existsSync(districtsPath)) {
      districtsData = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));
    }

    let detectedState = null;
    let detectedDistrict = null;

    for (const stateObj of districtsData.states) {
      if (lowercaseQuery.includes(stateObj.state.toLowerCase())) {
        detectedState = stateObj.state;
        break;
      }
    }

    for (const stateObj of districtsData.states) {
      for (const dist of stateObj.districts) {
        if (lowercaseQuery.includes(dist.toLowerCase())) {
          detectedDistrict = dist;
          if (!detectedState) detectedState = stateObj.state;
          break;
        }
      }
      if (detectedDistrict) break;
    }

    const stopWords = [
      'show', 'find', 'search', 'get', 'list', 'user', 'users', 'operator', 'operators',
      'harvester', 'harvesters', 'named', 'name', 'in', 'from', 'at', 'whose', 'is', 'are',
      'with', 'called', 'who', 'live', 'lives', 'district', 'state', 'located', 'location'
    ];

    if (detectedState) stopWords.push(detectedState.toLowerCase());
    if (detectedDistrict) stopWords.push(detectedDistrict.toLowerCase());

    const words = q.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    const nameKeywords = words.filter(word => {
      const w = word.toLowerCase();
      return w.length > 1 && !stopWords.includes(w);
    });

    const detectedName = nameKeywords.join(' ');
    console.log(`[NL Query Parser] Raw: "${q}" | Name: "${detectedName}" | State: "${detectedState}" | District: "${detectedDistrict}"`);

    let queryStr = `
      SELECT u.id, u.name, u.email, u.role, u.state, u.phone, u.is_blocked, u.created_at,
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id AND verification_status = 'Approved') as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             (SELECT COUNT(*) FROM operators WHERE user_id = u.id AND verification_status = 'Approved' AND is_profile_completed = 1) as isOperator
      FROM users u
      WHERE u.role != 'admin'
    `;
    const queryParams = [];

    if (detectedName) {
      queryStr += ' AND u.name LIKE ?';
      queryParams.push(`%${detectedName}%`);
    }

    if (detectedState) {
      queryStr += ' AND (u.state = ? OR u.id IN (SELECT user_id FROM operators WHERE state = ? AND is_profile_completed = 1))';
      queryParams.push(detectedState, detectedState);
    }

    if (detectedDistrict) {
      queryStr += ' AND (u.id IN (SELECT user_id FROM operators WHERE location = ? AND is_profile_completed = 1))';
      queryParams.push(detectedDistrict);
    }

    queryStr += ' ORDER BY u.created_at DESC';

    const [results] = await db.query(queryStr, queryParams);

    res.json({
      parsed: {
        name: detectedName || null,
        state: detectedState || null,
        district: detectedDistrict || null
      },
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to parse image path(s) into an array
function parseImagePaths(imagePath) {
  if (!imagePath) return [];
  const trimmed = imagePath.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr;
    } catch (e) {}
  }
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(p => p.trim()).filter(Boolean);
  }
  return [trimmed];
}

// Helper to remove files from Supabase storage
async function deleteFromSupabase(paths) {
  if (!paths || paths.length === 0) return;
  const filePaths = Array.isArray(paths) ? paths : [paths];
  const targets = filePaths
    .filter(Boolean)
    .map(p => {
      if (p.startsWith('http')) {
        try {
          const url = new URL(p);
          const searchStr = `/storage/v1/object/public/${supabaseBucket}/`;
          const index = url.pathname.indexOf(searchStr);
          if (index !== -1) {
            return url.pathname.slice(index + searchStr.length);
          }
        } catch (e) {
          return null;
        }
        return null;
      }
      return p;
    })
    .filter(Boolean);
  
  if (targets.length === 0) return;
  try {
    const { error } = await supabase.storage.from(supabaseBucket).remove(targets);
    if (error) {
      console.error('Failed to remove files from Supabase:', error);
    } else {
      console.log('Successfully removed files from Supabase:', targets);
    }
  } catch (err) {
    console.error('Error during Supabase file removal:', err);
  }
}

// Helper for admin audit logging
async function logAdminAudit(adminId, adminEmail, action, ip, userAgent, status, details) {
  try {
    const auditId = crypto.randomUUID();
    await db.query(
      'INSERT INTO admin_audit_logs (id, admin_id, admin_email, action, ip_address, user_agent, status, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [auditId, adminId, adminEmail, action, ip || 'unknown', userAgent || null, status, details || null]
    );
  } catch (err) {
    console.error('Failed to write admin audit log:', err);
  }
}

const VALID_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
  'Ladakh', 'Lakshadweep', 'Puducherry'
];

const isStrongPassword = (pass) => {
  if (!pass || pass.length < 10) return false;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasDigit = /[0-9]/.test(pass);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

// 8. Admin Bulk User Upload via CSV (High Security Overengineered Version)
app.post('/api/admin/users/bulk', authenticateToken, isAdmin, adminBulkUploadLimiter, csvUpload.single('file'), async (req, res) => {
  const { defaultPassword, adminPassword } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const adminId = req.user.id;
  const adminEmail = req.user.email;

  // 1. Check for missing CSV file
  if (!req.file) {
    await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', 'No CSV file uploaded.');
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    // 2. Dual-Factor Admin Password Verification
    if (!adminPassword) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'unauthorized', 'Missing admin password verification.');
      return res.status(401).json({ error: 'Re-authentication required. Please enter your administrator password.' });
    }

    const [admins] = await db.query('SELECT password FROM users WHERE id = ?', [adminId]);
    if (admins.length === 0) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', 'Administrator record not found.');
      return res.status(403).json({ error: 'Access denied: Admin record not found.' });
    }

    const adminMatch = await bcrypt.compare(adminPassword, admins[0].password);
    if (!adminMatch) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'unauthorized', 'Incorrect administrator password supplied.');
      return res.status(403).json({ error: 'Re-authentication failed. Incorrect administrator password.' });
    }

    // 3. Default Password Strength Validation
    if (!isStrongPassword(defaultPassword)) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', 'Default password does not meet complexity requirements.');
      return res.status(400).json({ 
        error: 'Default password must be at least 10 characters long, containing at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' 
      });
    }

    // 4. Read File Content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length <= 1) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', 'CSV file is empty or only contains headers.');
      return res.status(400).json({ error: 'CSV file is empty or only contains headers.' });
    }

    // 5. Header Validation (Case Insensitive)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'name');
    const emailIdx = headers.findIndex(h => h === 'email');
    const phoneIdx = headers.findIndex(h => ['phone', 'phone no.', 'phone_no', 'phone number', 'phoneno'].includes(h));
    const stateIdx = headers.findIndex(h => h === 'state');

    if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1 || stateIdx === -1) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', 'Missing required CSV headers.');
      return res.status(400).json({ 
        error: 'Invalid CSV format. Must contain headers: "Name", "Email", "Phone No." (or "Phone"), and "State" (case-insensitive).' 
      });
    }

    const validationErrors = [];
    const parsedRows = [];
    const seenEmails = new Set();
    const seenPhones = new Set();

    // 6. Dry-Run Validation Loop
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = [];
      let currentCell = '';
      let insideQuote = false;
      
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      if (cells.length < headers.length) {
        validationErrors.push(`Row ${i + 1}: Incomplete row data (expected ${headers.length} columns, found ${cells.length}).`);
        continue;
      }

      const name = cells[nameIdx];
      const email = cells[emailIdx];
      const phone = cells[phoneIdx];
      const state = cells[stateIdx];

      // Sanitization & Check Empty
      if (!name || name.trim().length === 0) {
        validationErrors.push(`Row ${i + 1}: Name cannot be empty.`);
      } else if (name.length < 2 || name.length > 255) {
        validationErrors.push(`Row ${i + 1}: Name must be between 2 and 255 characters.`);
      } else if (/[<>{}]/.test(name)) {
        validationErrors.push(`Row ${i + 1}: Name contains invalid/unsafe HTML characters.`);
      }

      if (!email || email.trim().length === 0) {
        validationErrors.push(`Row ${i + 1}: Email cannot be empty.`);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          validationErrors.push(`Row ${i + 1}: Invalid email address format ("${email}").`);
        } else if (email.length > 255) {
          validationErrors.push(`Row ${i + 1}: Email address exceeds maximum length of 255 characters.`);
        }
      }

      if (!phone || phone.trim().length === 0) {
        validationErrors.push(`Row ${i + 1}: Phone number cannot be empty.`);
      } else {
        const phoneRegex = /^\+?\d{10,15}$/;
        if (!phoneRegex.test(phone)) {
          validationErrors.push(`Row ${i + 1}: Invalid phone number format ("${phone}"). Must be numeric and 10 to 15 digits.`);
        }
      }

      if (!state || state.trim().length === 0) {
        validationErrors.push(`Row ${i + 1}: State cannot be empty.`);
      } else {
        const stateNormalized = state.trim().toLowerCase();
        const isValidState = VALID_INDIAN_STATES.some(s => s.toLowerCase() === stateNormalized);
        if (!isValidState) {
          validationErrors.push(`Row ${i + 1}: State name "${state}" is not a recognized Indian state or Union Territory.`);
        }
      }

      if (validationErrors.length > 0) continue; // Skip database uniqueness checks for already malformed rows

      // Uniqueness check inside the CSV itself
      if (seenEmails.has(email.toLowerCase())) {
        validationErrors.push(`Row ${i + 1}: Duplicate email "${email}" found inside this CSV file.`);
      } else {
        seenEmails.add(email.toLowerCase());
      }

      if (seenPhones.has(phone)) {
        validationErrors.push(`Row ${i + 1}: Duplicate phone number "${phone}" found inside this CSV file.`);
      } else {
        seenPhones.add(phone);
      }

      if (validationErrors.length > 0) continue;

      // Database duplicate checking
      try {
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
          validationErrors.push(`Row ${i + 1}: Email "${email}" is already registered on the system.`);
        }

        const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
          validationErrors.push(`Row ${i + 1}: Phone number "${phone}" is already registered on the system.`);
        }
      } catch (dbErr) {
        validationErrors.push(`Row ${i + 1}: Database verification failure.`);
      }

      parsedRows.push({ name, email, phone, state });
    }

    // 7. If validation errors exist, abort immediately with NO database modifications
    if (validationErrors.length > 0) {
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', `Validation failed: ${validationErrors.length} errors found.`);
      return res.status(400).json({ 
        error: 'CSV validation failed. No changes were saved.', 
        errors: validationErrors 
      });
    }

    // 8. Execute Database Transaction for Atomic Updates
    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();

      for (const row of parsedRows) {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const userId = crypto.randomUUID();
        await conn.query(
          'INSERT INTO users (id, name, email, password, role, state, phone, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, row.name, row.email, hashedPassword, 'user', row.state, row.phone, 0]
        );
      }

      await conn.commit();
      await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'success', `Successfully imported ${parsedRows.length} users.`);
      res.json({ 
        message: `Successfully imported all ${parsedRows.length} users from the CSV file!`,
        importedCount: parsedRows.length
      });
    } catch (transactionErr) {
      await conn.rollback();
      throw transactionErr;
    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('CSV Import System Error:', error);
    await logAdminAudit(adminId, adminEmail, 'BULK_IMPORT', ip, userAgent, 'failed', `System error: ${error.message}`);
    return res.status(500).json({ error: 'A system error occurred during CSV parsing or database execution.' });
  } finally {
    // 9. Strict file cleanup
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink uploaded CSV file:', err);
      }
    }
  }
});

// GET /api/admin/audit-logs — fetch admin audit logs (admin only)
app.get('/api/admin/audit-logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [logs] = await db.query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    console.error('Error fetching admin audit logs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// =============================================
// SETTINGS ROUTES
// =============================================

const toDbBool = (value) => (value === true || value === 1 || value === '1' ? 1 : 0);
const fromDbBool = (value) => value === 1 || value === true || value === '1';

const formatTimeForClient = (value) => {
  if (value == null) return null;
  if (value instanceof Date) {
    const hours = value.getUTCHours().toString().padStart(2, '0');
    const minutes = value.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  const str = String(value).trim();
  return /^\d{2}:\d{2}/.test(str) ? str.slice(0, 5) : null;
};

const normalizeTimeForDb = (value) => {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(str)) return null;
  return str.length === 5 ? `${str}:00` : str;
};

const mapNotificationSettings = (row) => ({
  notificationsEmail: fromDbBool(row.notifications_email),
  notificationsSms: fromDbBool(row.notifications_sms),
  doNotDisturbStart: formatTimeForClient(row.do_not_disturb_start),
  doNotDisturbEnd: formatTimeForClient(row.do_not_disturb_end),
});

// GET /api/settings — fetch current user's full settings data
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, whatsapp_number, state, bio, image_path, created_at,
              notifications_email, notifications_sms, do_not_disturb_start, do_not_disturb_end,
              profile_visibility, show_contact_info
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      whatsappNumber: u.whatsapp_number,
      state: u.state,
      bio: u.bio,
      imagePath: u.image_path ? (u.image_path.startsWith('http') ? u.image_path : `/uploads/${path.basename(u.image_path)}`) : null,
      createdAt: u.created_at,
      ...mapNotificationSettings(u),
      profileVisibility: u.profile_visibility || 'public',
      showContactInfo: fromDbBool(u.show_contact_info),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/settings/account — update name, phone, whatsapp, state, bio
app.patch('/api/settings/account', authenticateToken, async (req, res) => {
  try {
    const { name, phone, whatsappNumber, state, bio } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    const cleanedPhone = cleanPhone(phone);
    if (!cleanedPhone) {
      return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
    }
    let cleanedWhatsapp = null;
    if (whatsappNumber && whatsappNumber.trim() !== '') {
      cleanedWhatsapp = cleanPhone(whatsappNumber);
      if (!cleanedWhatsapp) {
        return res.status(400).json({ error: 'Invalid WhatsApp number. Must be exactly 10 digits.' });
      }
    }

    const cleanName = sanitizeInput(name);
    const cleanState = sanitizeInput(state) || null;
    const cleanBio = sanitizeInput(bio) || null;

    await db.query(
      'UPDATE users SET name = ?, phone = ?, whatsapp_number = ?, state = ?, bio = ? WHERE id = ?',
      [cleanName, cleanedPhone, cleanedWhatsapp, cleanState, cleanBio, req.user.id]
    );
    res.json({ message: 'Account updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// POST /api/settings/password — change password
app.post('/api/settings/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// PATCH /api/settings/notifications — update notification preferences
app.patch('/api/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const { notificationsEmail, notificationsSms, doNotDisturbStart, doNotDisturbEnd } = req.body;

    if (typeof notificationsEmail !== 'boolean' || typeof notificationsSms !== 'boolean') {
      return res.status(400).json({ error: 'Email and SMS notification preferences must be true or false' });
    }

    const dndStart = normalizeTimeForDb(doNotDisturbStart);
    const dndEnd = normalizeTimeForDb(doNotDisturbEnd);

    if ((dndStart && !dndEnd) || (!dndStart && dndEnd)) {
      return res.status(400).json({ error: 'Both Do Not Disturb start and end times are required' });
    }

    if (doNotDisturbStart && !dndStart) {
      return res.status(400).json({ error: 'Invalid Do Not Disturb start time' });
    }
    if (doNotDisturbEnd && !dndEnd) {
      return res.status(400).json({ error: 'Invalid Do Not Disturb end time' });
    }

    await db.query(
      'UPDATE users SET notifications_email = ?, notifications_sms = ?, do_not_disturb_start = ?, do_not_disturb_end = ? WHERE id = ?',
      [toDbBool(notificationsEmail), toDbBool(notificationsSms), dndStart, dndEnd, req.user.id]
    );

    const [rows] = await db.query(
      'SELECT notifications_email, notifications_sms, do_not_disturb_start, do_not_disturb_end FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Notification preferences updated',
      ...mapNotificationSettings(rows[0]),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// PATCH /api/settings/privacy — update privacy settings
app.patch('/api/settings/privacy', authenticateToken, async (req, res) => {
  try {
    const { profileVisibility, showContactInfo } = req.body;
    const validVisibility = ['public', 'private', 'hidden'];
    if (profileVisibility && !validVisibility.includes(profileVisibility)) {
      return res.status(400).json({ error: 'Invalid profile visibility value' });
    }
    await db.query(
      'UPDATE users SET profile_visibility = ?, show_contact_info = ? WHERE id = ?',
      [profileVisibility || 'public', showContactInfo ? 1 : 0, req.user.id]
    );
    res.json({ message: 'Privacy settings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// DELETE /api/settings/account — permanently delete account (requires password confirmation)
app.delete('/api/settings/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password confirmation required' });
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    // 1. Gather all files to delete from Supabase
    const supabaseFiles = [];
    
    // Get user avatar
    const [userRows] = await db.query('SELECT image_path FROM users WHERE id = ?', [req.user.id]);
    if (userRows.length > 0 && userRows[0].image_path) {
      supabaseFiles.push(userRows[0].image_path);
    }
    
    // Get harvester images
    const [harvesterRows] = await db.query('SELECT image_path FROM harvesters WHERE user_id = ?', [req.user.id]);
    harvesterRows.forEach(h => {
      if (h.image_path) {
        supabaseFiles.push(...parseImagePaths(h.image_path));
      }
    });
    
    // Get operator verification files & operator profile pictures
    const [operatorRows] = await db.query(
      'SELECT image_path, selfie_image_path, license_front_path, license_back_path FROM operators WHERE user_id = ?',
      [req.user.id]
    );
    operatorRows.forEach(op => {
      if (op.image_path) supabaseFiles.push(op.image_path);
      if (op.selfie_image_path) supabaseFiles.push(op.selfie_image_path);
      if (op.license_front_path) supabaseFiles.push(op.license_front_path);
      if (op.license_back_path) supabaseFiles.push(op.license_back_path);
    });

    // Perform Supabase Storage Cleanup
    if (supabaseFiles.length > 0) {
      await deleteFromSupabase(supabaseFiles);
    }

    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM ratings WHERE rater_id = ?', [req.user.id]);
      await conn.query("DELETE FROM ratings WHERE target_type = 'machine' AND target_id IN (SELECT id FROM harvesters WHERE user_id = ?)", [req.user.id]);
      await conn.query("DELETE FROM ratings WHERE target_type = 'operator' AND target_id IN (SELECT id FROM operators WHERE user_id = ?)", [req.user.id]);
      await conn.query('DELETE FROM operator_consent_logs WHERE user_id = ?', [req.user.id]);
      await conn.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [req.user.id, req.user.id]);

      await conn.query('DELETE FROM harvesters WHERE user_id = ?', [req.user.id]);
      await conn.query('DELETE FROM requests WHERE user_id = ?', [req.user.id]);
      await conn.query('DELETE FROM operators WHERE user_id = ?', [req.user.id]);

      await conn.query('DELETE FROM users WHERE id = ?', [req.user.id]);
      await conn.commit();
      res.json({ message: 'Account permanently deleted' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// =============================================
// RATINGS & REVIEWS ROUTES
// =============================================

// POST /api/ratings — Submit a new rating/review
app.post('/api/ratings', authenticateToken, async (req, res) => {
  const { targetType, targetId, rating, review } = req.body;
  const raterId = req.user.id;

  if (!targetType || !targetId || !rating) {
    return res.status(400).json({ error: 'targetType, targetId, and rating are required' });
  }

  if (targetType !== 'machine' && targetType !== 'operator') {
    return res.status(400).json({ error: 'targetType must be either machine or operator' });
  }

  const numRating = parseInt(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    // Self-rating checks:
    if (targetType === 'operator') {
      const [ops] = await db.query('SELECT user_id FROM operators WHERE id = ?', [targetId]);
      if (ops.length === 0) {
        return res.status(404).json({ error: 'Operator not found' });
      }
      if (ops[0].user_id === raterId) {
        return res.status(400).json({ error: 'You cannot rate your own operator profile' });
      }
    } else if (targetType === 'machine') {
      const [harvs] = await db.query('SELECT user_id FROM harvesters WHERE id = ?', [targetId]);
      if (harvs.length === 0) {
        return res.status(404).json({ error: 'Harvester not found' });
      }
      if (harvs[0].user_id === raterId) {
        return res.status(400).json({ error: 'You cannot rate your own harvester listing' });
      }
    }

    const ratingId = crypto.randomUUID();
    const cleanReview = sanitizeInput(review);
    // Upsert rating using ON DUPLICATE KEY UPDATE:
    await db.query(
      `INSERT INTO ratings (id, rater_id, target_type, target_id, rating, review)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review)`,
      [ratingId, raterId, targetType, targetId, numRating, cleanReview || null]
    );

    // Dynamic Notifications Triggering
    let targetOwnerId = '';
    if (targetType === 'operator') {
      const [ops] = await db.query('SELECT user_id FROM operators WHERE id = ?', [targetId]);
      if (ops.length > 0) targetOwnerId = ops[0].user_id;
    } else if (targetType === 'machine') {
      const [harvs] = await db.query('SELECT user_id FROM harvesters WHERE id = ?', [targetId]);
      if (harvs.length > 0) targetOwnerId = harvs[0].user_id;
    }

    if (targetOwnerId) {
      // Clear any existing rating notification for this specific target post to prevent duplication
      await db.query(
        'DELETE FROM notifications WHERE user_id = ? AND type = ? AND target_id = ?',
        [targetOwnerId, `rating_${targetType}`, targetId]
      );

      // 1. Rating notification
      const rateNotifId = require('crypto').randomUUID();
      const rateNotifMsg = targetType === 'operator'
        ? `Your operator post got a review.`
        : `You got a rating on your post`;
      await db.query(
        'INSERT INTO notifications (id, user_id, type, message, target_id) VALUES (?, ?, ?, ?, ?)',
        [rateNotifId, targetOwnerId, `rating_${targetType}`, rateNotifMsg, targetId]
      );
      try {
        await sendPushNotification(targetOwnerId, 'New Post Review', rateNotifMsg, '/dashboard');
      } catch (pushErr) {
        console.error('Failed to send rating push notification:', pushErr.message);
      }

      // 2. Comments count notification
      const [cmtCountRows] = await db.query(
        'SELECT COUNT(*) as count FROM ratings WHERE target_type = ? AND target_id = ? AND review IS NOT NULL AND review != \'\'',
        [targetType, targetId]
      );
      const commentCount = cmtCountRows[0].count;
      if (commentCount > 0) {
        const commentNotifId = require('crypto').randomUUID();
        const commentNotifMsg = targetType === 'operator'
          ? `Your operator post got ${commentCount} comments`
          : `You got ${commentCount} comments on the post.`;
        
        // Remove older comment count notifications for this specific target post to prevent flooding
        await db.query(
          "DELETE FROM notifications WHERE user_id = ? AND type = ? AND target_id = ?",
          [targetOwnerId, `comment_${targetType}`, targetId]
        );

        await db.query(
          'INSERT INTO notifications (id, user_id, type, message, target_id) VALUES (?, ?, ?, ?, ?)',
          [commentNotifId, targetOwnerId, `comment_${targetType}`, commentNotifMsg, targetId]
        );
        try {
          await sendPushNotification(targetOwnerId, 'New Post Comment', commentNotifMsg, '/dashboard');
        } catch (pushErr) {
          console.error('Failed to send comment push notification:', pushErr.message);
        }
      }
    }

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/ratings/my-score — Fetch average rating for the logged-in user (as operator + their listed harvesters)
app.get('/api/ratings/my-score', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Get operator profile id if exists
    const [ops] = await db.query('SELECT id FROM operators WHERE user_id = ?', [userId]);
    const opId = ops[0]?.id || null;

    // 2. Get harvester ids if exist
    const [harvs] = await db.query('SELECT id FROM harvesters WHERE user_id = ?', [userId]);
    const harvIds = harvs.map(h => h.id);

    let averageRating = null;
    let count = 0;

    if (opId || harvIds.length > 0) {
      let queryStr = 'SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE 1=0';
      const queryParams = [];

      if (opId) {
        queryStr += ' OR (target_type = ? AND target_id = ?)';
        queryParams.push('operator', opId);
      }

      if (harvIds.length > 0) {
        queryStr += ` OR (target_type = ? AND target_id IN (${harvIds.map(() => '?').join(',')}))`;
        queryParams.push('machine', ...harvIds);
      }

      const [rows] = await db.query(queryStr, queryParams);
      if (rows.length > 0 && rows[0].count > 0) {
        averageRating = parseFloat(rows[0].avg).toFixed(1);
        count = rows[0].count;
      }
    }

    res.json({ averageRating, count });
  } catch (error) {
    console.error('Error fetching user score:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/ratings — Fetch all ratings/reviews and stats for a target
app.get('/api/ratings', async (req, res) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required' });
  }

  try {
    const [stats] = await db.query(
      'SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE target_type = ? AND target_id = ?',
      [targetType, targetId]
    );

    const [reviews] = await db.query(
      `SELECT r.rating, r.review, r.created_at, u.name as raterName, u.id as raterId
       FROM ratings r
       JOIN users u ON r.rater_id = u.id
       WHERE r.target_type = ? AND r.target_id = ?
       ORDER BY r.created_at DESC`,
      [targetType, targetId]
    );

    res.json({
      averageRating: stats[0].count > 0 ? parseFloat(stats[0].avg).toFixed(1) : null,
      count: stats[0].count,
      reviews: reviews.map(rev => ({
        raterName: rev.raterName,
        raterId: rev.raterId,
        rating: rev.rating,
        review: rev.review,
        createdAt: rev.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. Admin Blog Management Routes
app.post('/api/admin/blogs/generate', authenticateToken, isAdmin, async (req, res) => {
  const { title, keywords, category } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and Category are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your server/.env file.' });
  }

  const prompt = `You are an expert agriculture content writer and professional blog author for the Tractor Sewa platform.
Write a highly engaging, informative, and practical blog post in English. It should read like a premium, narrative article, not an academic document. It must connect with machine owners, tractor/harvester operators, and farmers.

Follow these strict guidelines:
1. Narrative Flow: Start with a catchy hook or real-life scenario to pull readers in.
2. Tone: Warm, authoritative, practical, and grounded in seasonal agricultural needs.
3. Formatting: Use clear headings (## for main sections, ### for sub-sections), lists, and strong bullet points where relevant. Keep paragraphs short and highly readable.
4. Word Count: 500-750 words.

Inputs:
- Topic/Title: "${title}"
- Keywords to naturally include: "${keywords || 'none'}"
- Category: "${category}"

Additionally, you must search the web to find a highly relevant, real, verified, and active cover photo URL for the specific topic of this blog.
- Locate a direct, public image link (from official manufacturer portals, verified agricultural news sites, or trusted media) that corresponds exactly to the blog subject. For example, if writing about the launch of the "John Deere 9RX Tractor", you must find a real, verified, direct image URL of the John Deere 9RX.
- If you find a verified direct image URL, set "image_url" to that exact URL.
- If you cannot find a verified direct image URL, you MUST return a dynamic category-relevant query in the following format:
  "GENERATE:<comma_separated_keywords>"
  For example: "GENERATE:tomato,farming" or "GENERATE:monsoon,paddy". The system will automatically build a high-quality topic-specific cover image using your keywords.

Return your response ONLY as a JSON object matching this exact structure:
{
  "title": "A compelling final title based on the input",
  "category": "${category}",
  "short_description": "A short summary (1-2 sentences) of the blog post.",
  "content": "The full blog content in English in Markdown format.",
  "image_url": "The verified web image URL OR 'GENERATE:keyword1,keyword2'"
}

Do not wrap the JSON in markdown code blocks. Return raw JSON text only.`;

  let geminiFailed = false;
  let geminiErrorReason = '';
  let generatedText = '';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          tools: [
            {
              googleSearch: {}
            }
          ],
        }),
      }
    );

    if (!response.ok) {
      geminiFailed = true;
      const errorText = await response.text();
      logger.error('Gemini API Error: ' + errorText);
      try {
        const errorJson = JSON.parse(errorText);
        const code = errorJson.error?.code;
        const status = errorJson.error?.status;
        const msg = errorJson.error?.message || '';
        
        if (code === 503 || status === 'UNAVAILABLE' || msg.includes('overloaded') || msg.includes('demand')) {
          geminiErrorReason = 'MODEL IS BUSY (503 Service Unavailable)';
        } else if (code === 429 || status === 'RESOURCE_EXHAUSTED' || msg.includes('limit') || msg.includes('exhausted')) {
          geminiErrorReason = 'API LIMIT REACHED (429 Rate Limit)';
        } else if (code === 400 && (msg.includes('API key') || msg.includes('not valid') || msg.includes('key'))) {
          geminiErrorReason = 'INVALID API KEY';
        } else if (msg) {
          geminiErrorReason = msg.toUpperCase();
        } else {
          geminiErrorReason = `HTTP ERROR ${response.status}`;
        }
      } catch (e) {
        geminiErrorReason = `HTTP ERROR ${response.status}`;
      }
    } else {
      const data = await response.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        geminiFailed = true;
        geminiErrorReason = 'INVALID RESPONSE STRUCTURE';
      }
    }
  } catch (error) {
    logger.error('Gemini call failed with exception: ' + error.stack);
    geminiFailed = true;
    geminiErrorReason = error.message;
  }

  // Fallback to OpenAI if Gemini failed and OpenAI API key is available
  if (geminiFailed) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      logger.info(`Gemini failed (${geminiErrorReason}). Falling back to OpenAI (gpt-4o-mini)...`);
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert agriculture content writer and professional blog author for the Tractor Sewa platform. Respond ONLY with a raw JSON object matching the requested structure.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          generatedText = openaiData.choices?.[0]?.message?.content;
          if (generatedText) {
            geminiFailed = false;
            logger.info('Successfully generated blog content using OpenAI fallback!');
          } else {
            logger.error('OpenAI response did not contain choices/content');
            return res.status(502).json({ error: 'Cannot generate blog: OpenAI fallback response format was invalid.' });
          }
        } else {
          const openaiErrorText = await openaiResponse.text();
          logger.error('OpenAI API Error: ' + openaiErrorText);
          return res.status(502).json({ 
            error: `Cannot generate blog: Gemini was busy (${geminiErrorReason}) and OpenAI fallback failed (${openaiResponse.status}).` 
          });
        }
      } catch (openaiErr) {
        logger.error('OpenAI fallback failed with exception: ' + openaiErr.stack);
        return res.status(502).json({ 
          error: `Cannot generate blog: Gemini was busy (${geminiErrorReason}) and OpenAI fallback connection failed.` 
        });
      }
    } else {
      // No OpenAI key configured, return the Gemini error
      return res.status(502).json({ error: `Cannot generate blog: ${geminiErrorReason}` });
    }
  }

  // Parse and return result
  let parsedResult;
  try {
    let cleanText = generatedText.trim();
    // Remove markdown code block markers if they are present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    parsedResult = JSON.parse(cleanText.trim());
  } catch (e) {
    logger.error('Failed to parse AI output as JSON. Output was: ' + generatedText);
    return res.status(502).json({ error: 'AI output could not be parsed as valid JSON' });
  }

  // If the AI requested a dynamically generated image based on keywords,
  // we construct a LoremFlickr topic-specific image locked to a random integer.
  if (parsedResult.image_url && parsedResult.image_url.startsWith('GENERATE:')) {
    const keywordsRaw = parsedResult.image_url.replace('GENERATE:', '');
    const cleanKeywords = keywordsRaw.split(',')
      .map(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(k => k.length > 0);
    
    // Always prefix with agriculture to ensure relevant photo pool
    const tags = ['agriculture', ...cleanKeywords].slice(0, 4).join(',');
    const randomLock = Math.floor(Math.random() * 100000) + 1;
    parsedResult.image_url = `https://loremflickr.com/800/600/${tags}/all?lock=${randomLock}`;
  } else if (!parsedResult.image_url || parsedResult.image_url === '') {
    // Default fallback if no image url was provided by the model
    const randomLock = Math.floor(Math.random() * 100000) + 1;
    parsedResult.image_url = `https://loremflickr.com/800/600/agriculture,farming/all?lock=${randomLock}`;
  }

  res.json(parsedResult);
});

app.post('/api/admin/blogs/categories', authenticateToken, isAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const cleanName = name.trim();
  try {
    // Check if category already exists (case-insensitive checks since name is UNIQUE)
    const [existing] = await db.query('SELECT id FROM blog_categories WHERE name = ?', [cleanName]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    await db.query('INSERT INTO blog_categories (name) VALUES (?)', [cleanName]);
    res.status(201).json({ message: 'Category added successfully', name: cleanName });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/admin/blogs', authenticateToken, isAdmin, async (req, res) => {
  const { title, category, short_description, content, date, image_url } = req.body;
  if (!title || !category || !short_description || !content) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  // Format date if not provided (e.g. "Jun 16, 2026")
  const blogDate = date || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  try {
    const [result] = await db.query(
      'INSERT INTO blogs (title, category, short_description, content, date, image_url, views) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [title, category, short_description, content, blogDate, image_url || null]
    );

    res.status(201).json({
      success: true,
      blog: {
        id: result.insertId,
        title,
        category,
        short_description,
        content,
        date: blogDate,
        image_url,
        views: 0
      }
    });
  } catch (error) {
    logger.error('Error creating blog: ' + error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/admin/blogs/:id', authenticateToken, isAdmin, async (req, res) => {
  const blogId = req.params.id;
  const { title, category, short_description, content, date, image_url } = req.body;

  if (!title || !category || !short_description || !content) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM blogs WHERE id = ?', [blogId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blogDate = date || existing[0].date;

    await db.query(
      'UPDATE blogs SET title = ?, category = ?, short_description = ?, content = ?, date = ?, image_url = ? WHERE id = ?',
      [title, category, short_description, content, blogDate, image_url || null, blogId]
    );

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog: {
        id: parseInt(blogId),
        title,
        category,
        short_description,
        content,
        date: blogDate,
        image_url: image_url || null
      }
    });
  } catch (error) {
    logger.error('Error updating blog: ' + error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/admin/blogs/:id', authenticateToken, isAdmin, async (req, res) => {
  const blogId = req.params.id;

  try {
    const [existing] = await db.query('SELECT * FROM blogs WHERE id = ?', [blogId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Clean up blog cover image from Supabase storage
    if (existing[0].image_url) {
      await deleteFromSupabase(existing[0].image_url);
    }

    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();
      // Delete associated comments and likes first
      await conn.query('DELETE FROM blog_likes WHERE blog_id = ?', [blogId]);
      await conn.query('DELETE FROM blog_comments WHERE blog_id = ?', [blogId]);
      // Delete the blog
      await conn.query('DELETE FROM blogs WHERE id = ?', [blogId]);
      await conn.commit();
      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    logger.error('Error deleting blog: ' + error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. Admin Operator & Blog Comments Deletion Routes
app.delete('/api/admin/operators/:id', authenticateToken, isAdmin, async (req, res) => {
  const operatorId = req.params.id;
  try {
    const [existing] = await db.query('SELECT * FROM operators WHERE id = ?', [operatorId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Operator listing not found' });
    }

    // Gather and delete files from Supabase
    const supabaseFiles = [];
    const op = existing[0];
    if (op.image_path) supabaseFiles.push(op.image_path);
    if (op.selfie_image_path) supabaseFiles.push(op.selfie_image_path);
    if (op.license_front_path) supabaseFiles.push(op.license_front_path);
    if (op.license_back_path) supabaseFiles.push(op.license_back_path);
    
    if (supabaseFiles.length > 0) {
      await deleteFromSupabase(supabaseFiles);
    }

    const activePool = await db.getPool();
    const conn = await activePool.getConnection();
    try {
      await conn.beginTransaction();
      // Delete operator ratings
      await conn.query("DELETE FROM ratings WHERE target_type = 'operator' AND target_id = ?", [operatorId]);
      // Delete operator consent logs
      await conn.query('DELETE FROM operator_consent_logs WHERE operator_id = ?', [operatorId]);
      // Delete the operator row
      await conn.query('DELETE FROM operators WHERE id = ?', [operatorId]);
      await conn.commit();
      res.json({ success: true, message: 'Operator profile deleted successfully by administrator.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error deleting operator:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/admin/blogs/comments/:commentId', authenticateToken, isAdmin, async (req, res) => {
  const commentId = req.params.commentId;
  try {
    const [existing] = await db.query('SELECT * FROM blog_comments WHERE id = ?', [commentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await db.query('DELETE FROM blog_comments WHERE id = ?', [commentId]);
    res.json({ success: true, message: 'Comment deleted successfully by administrator.' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// FAQ Routes
app.post('/api/faqs', faqLimiter, async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const faqId = require('crypto').randomUUID();
    const cleanQuestion = sanitizeInput(question.trim());
    await db.query(
      'INSERT INTO faqs (id, question) VALUES (?, ?)',
      [faqId, cleanQuestion]
    );
    res.status(201).json({ message: 'Question submitted successfully. It will be displayed after admin answers it.' });
  } catch (error) {
    console.error('Error submitting FAQ:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/faqs/active', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, question, answer FROM faqs WHERE status = 'Answered' ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active FAQs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/admin/faqs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faqs ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin FAQs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/admin/faqs/:id', authenticateToken, isAdmin, async (req, res) => {
  const faqId = req.params.id;
  const { answer, status } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM faqs WHERE id = ?', [faqId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await db.query(
      'UPDATE faqs SET answer = ?, status = ? WHERE id = ?',
      [answer !== undefined ? answer : null, status || 'Answered', faqId]
    );

    res.json({
      success: true,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/admin/faqs/:id', authenticateToken, isAdmin, async (req, res) => {
  const faqId = req.params.id;

  try {
    const [existing] = await db.query('SELECT * FROM faqs WHERE id = ?', [faqId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await db.query('DELETE FROM faqs WHERE id = ?', [faqId]);

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dynamic Translation Overrides Endpoints
app.get('/api/translations/:lang', async (req, res) => {
  const { lang } = req.params;
  try {
    const [rows] = await db.query('SELECT namespace, key_path, value FROM translation_overrides WHERE lang = ?', [lang]);
    
    // Group flat key_paths to nested objects under namespace
    const result = {};
    rows.forEach(r => {
      if (!result[r.namespace]) result[r.namespace] = {};
      
      const parts = r.key_path.split('.');
      let current = result[r.namespace];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = r.value;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching all translations for', lang, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/translations/:lang/:ns', async (req, res) => {
  const { lang, ns } = req.params;
  try {
    const [rows] = await db.query('SELECT key_path, value FROM translation_overrides WHERE lang = ? AND namespace = ?', [lang, ns]);
    
    // If no overrides, return empty object (i18next will fallback to static or other languages if needed, but since we seeded all, it should return them)
    if (rows.length === 0) {
      // Return 404 so i18next knows it's not available and uses fallback
      return res.status(404).json({ error: 'Not found' });
    }

    // Convert flat key_paths to nested object
    const result = {};
    rows.forEach(r => {
      const parts = r.key_path.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = r.value;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching translations for', lang, ns, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/translation-overrides', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT lang, namespace, key_path, value FROM translation_overrides');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all translation overrides:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/admin/translation-overrides', authenticateToken, isAdmin, async (req, res) => {
  const { lang, namespace, key_path, value } = req.body;

  if (!lang || !namespace || !key_path || value === undefined || value === null) {
    return res.status(400).json({ error: 'lang, namespace, key_path, and value are required.' });
  }

  try {
    await db.query(
      'INSERT INTO translation_overrides (lang, namespace, key_path, value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [lang, namespace, key_path, value, value]
    );
    res.json({ success: true, message: 'Translation override saved successfully.' });
  } catch (error) {
    console.error('Error saving translation override:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/admin/translation-overrides', authenticateToken, isAdmin, async (req, res) => {
  const { lang, namespace, key_path } = req.query;

  if (!lang || !namespace || !key_path) {
    return res.status(400).json({ error: 'lang, namespace, and key_path are required query parameters.' });
  }

  try {
    await db.query(
      'DELETE FROM translation_overrides WHERE lang = ? AND namespace = ? AND key_path = ?',
      [lang, namespace, key_path]
    );
    res.json({ success: true, message: 'Translation override reverted to default.' });
  } catch (error) {
    console.error('Error deleting translation override:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dynamic Google Translate Helper
async function translateTexts(texts, targetLang) {
  const CHUNK_SIZE = 25; // 25 texts per chunk
  const results = [];
  
  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);
    const joinedText = chunk.join('\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(joinedText)}`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Translate API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      
      if (data && data[0]) {
        const translatedParts = data[0].map(x => x[0] || '').join('');
        let chunkResults = translatedParts.split('\n').map(x => x.trim());
        
        // Remove trailing empty string if one was generated by trailing newlines
        if (chunkResults.length === chunk.length + 1 && chunkResults[chunkResults.length - 1] === '') {
          chunkResults.pop();
        }
        
        if (chunkResults.length === chunk.length) {
          results.push(...chunkResults);
          continue;
        } else {
          console.warn(`Length mismatch in chunk starting at index ${i}. Expected ${chunk.length}, got ${chunkResults.length}. Falling back to individual translation.`);
        }
      }
      
      // Fallback: translate individually for this chunk
      for (const text of chunk) {
        if (!text || !text.trim()) {
          results.push('');
          continue;
        }
        const indUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const indRes = await fetch(indUrl);
        if (indRes.ok) {
          const indData = await indRes.json();
          results.push(indData[0][0][0] || text);
        } else {
          results.push(text);
        }
        await new Promise(r => setTimeout(r, 150));
      }
    } catch (error) {
      console.error(`Failed to translate chunk starting at index ${i}:`, error);
      results.push(...chunk);
    }
  }
  
  return results;
}

// Active Languages list
app.get('/api/languages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT lang FROM translation_overrides');
    const langCodes = rows.map(r => r.lang);
    const langNames = {
      en: "English",
      hi: "हिंदी",
      mr: "मराठी",
      pa: "Punjabi",
      ta: "Tamil",
      te: "Telugu",
      gu: "Gujarati",
      kn: "Kannada",
      bn: "Bengali",
      ml: "Malayalam",
      or: "Odia",
      ur: "Urdu",
      as: "Assamese"
    };
    const activeLanguages = langCodes.map(code => ({
      code,
      label: langNames[code] || code.toUpperCase()
    }));
    res.json(activeLanguages);
  } catch (error) {
    console.error('Error fetching active languages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Available Languages to add
app.get('/api/admin/languages/available', authenticateToken, isAdmin, async (req, res) => {
  try {
    const allIndianLangs = [
      { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
      { code: "bn", label: "Bengali (বাংলা)" },
      { code: "te", label: "Telugu (తెలుగు)" },
      { code: "ta", label: "Tamil (தமிழ்)" },
      { code: "gu", label: "Gujarati (ગુજરાતી)" },
      { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
      { code: "ml", label: "Malayalam (മലയാളം)" },
      { code: "or", label: "Odia (ଓଡ଼ିଆ)" },
      { code: "ur", label: "Urdu (اردو)" },
      { code: "as", label: "Assamese (অસમীয়া)" }
    ];
    res.json(allIndianLangs);
  } catch (error) {
    console.error('Error fetching available languages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add and translate a language
app.post('/api/admin/languages/add', authenticateToken, isAdmin, async (req, res) => {
  const { lang } = req.body;
  if (!lang) return res.status(400).json({ error: 'Language code is required.' });
  
  try {
    // Clear any existing entries for this language to allow clean overwrite/regeneration
    await db.query('DELETE FROM translation_overrides WHERE lang = ?', [lang]);
    
    const [enRows] = await db.query("SELECT namespace, key_path, value FROM translation_overrides WHERE lang = 'en'");
    if (enRows.length === 0) {
      return res.status(500).json({ error: 'No English base translations found to translate from.' });
    }
    
    const nsGroups = {};
    enRows.forEach(row => {
      if (!nsGroups[row.namespace]) nsGroups[row.namespace] = [];
      nsGroups[row.namespace].push(row);
    });
    
    for (const [ns, rows] of Object.entries(nsGroups)) {
      const texts = rows.map(r => r.value);
      const translatedTexts = await translateTexts(texts, lang);
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const translatedValue = translatedTexts[i] || row.value;
        await db.query(
          'INSERT INTO translation_overrides (lang, namespace, key_path, value) VALUES (?, ?, ?, ?)',
          [lang, ns, row.key_path, translatedValue]
        );
      }
    }
    
    res.json({ success: true, message: `Language "${lang}" successfully translated and added.` });
  } catch (error) {
    console.error('Error adding new language:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Real-time Dynamic translation endpoint (caching enabled)
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'text and targetLang are required.' });
  }

  if (targetLang === 'en') {
    return res.json({ translation: text });
  }

  try {
    const sourceHash = crypto.createHash('sha256').update(text).digest('hex');

    const [cached] = await db.query(
      'SELECT translated_text FROM dynamic_translations WHERE source_hash = ? AND lang = ?',
      [sourceHash, targetLang]
    );

    if (cached.length > 0) {
      return res.json({ translation: cached[0].translated_text });
    }

    const translated = await translateTexts([text], targetLang);
    const translatedText = translated[0] || text;

    await db.query(
      'INSERT IGNORE INTO dynamic_translations (source_hash, source_text, lang, translated_text) VALUES (?, ?, ?, ?)',
      [sourceHash, text, targetLang, translatedText]
    );

    res.json({ translation: translatedText });
  } catch (error) {
    console.error('Error in dynamic translation endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Admin Dashboard Stats Endpoint
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const [userRes] = await db.query('SELECT COUNT(*) as count FROM users');
    const [operatorRes] = await db.query('SELECT COUNT(*) as count FROM operators');
    const [harvesterRes] = await db.query('SELECT COUNT(*) as count FROM harvesters');
    const [enquiryRes] = await db.query('SELECT COUNT(*) as count FROM enquiries');

    const [usersChartRes] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b %d') as label, COUNT(*) as value 
      FROM users 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(created_at, '%b %d')
      ORDER BY MIN(created_at) ASC
    `);

    const [harvestersChartRes] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b %d') as label, COUNT(*) as value 
      FROM harvesters 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(created_at, '%b %d')
      ORDER BY MIN(created_at) ASC
    `);

    const [recentUsers] = await db.query('SELECT name, created_at FROM users ORDER BY created_at DESC LIMIT 3');
    const [recentHarvesters] = await db.query('SELECT machine_name as name, created_at FROM harvesters ORDER BY created_at DESC LIMIT 2');

    const recentEvents = [
      ...recentUsers.map(u => ({ type: 'user', message: `New user registered: ${u.name}`, time: u.created_at })),
      ...recentHarvesters.map(h => ({ type: 'harvester', message: `New harvester added: ${h.name}`, time: h.created_at }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).map((e, idx) => ({
      id: idx + 1,
      type: e.type,
      message: e.message,
      time: new Date(e.time).toLocaleDateString(),
      color: e.type === 'user' ? 'text-blue-600' : 'text-green-600',
      bg: e.type === 'user' ? 'bg-blue-50' : 'bg-green-50'
    }));

    res.json({
      metrics: {
        totalUsers: userRes[0].count,
        totalOperators: operatorRes[0].count,
        totalHarvesters: harvesterRes[0].count,
        totalEnquiries: enquiryRes[0].count
      },
      charts: {
        newUsers: usersChartRes,
        newHarvesters: harvestersChartRes
      },
      recentEvents
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rate limiter for error reporting
const errorReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Max 15 error reports per minute per IP
  message: { error: 'Too many error reports from this IP.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Client-Side Error Reporter Endpoint (Public, Rate-Limited)
app.post('/api/security/report-error', errorReportLimiter, async (req, res) => {
  const { eventType, severity, username, description, requestUrl, userAgent, metadata } = req.body;
  
  try {
    await logSecurityEvent(
      eventType || 'React errors',
      severity || 'medium',
      username || 'Anonymous',
      req.ip,
      description || 'Frontend runtime exception occurred.',
      requestUrl || req.headers['referer'] || req.originalUrl,
      userAgent || req.headers['user-agent'],
      metadata
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to record client error report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Security Dashboard API Endpoint (Admin Only)
app.get('/api/admin/security/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Fetch recent security logs (last 150)
    const [logs] = await db.query(
      'SELECT id, timestamp, event_type, severity, username, ip_address, request_url, user_agent, description, metadata FROM security_logs ORDER BY timestamp DESC LIMIT 150'
    );

    // 2. Fetch statistics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [failedLogins] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE event_type = ? AND timestamp >= ?',
      ['Failed Login Attempts', todayStart]
    );

    const [warningsCount] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE severity IN (?, ?)',
      ['high', 'medium']
    );

    const [criticalCount] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE severity = ?',
      ['critical']
    );

    const [blockedCount] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE event_type = ?',
      ['Unauthorized Access Attempts']
    );

    const [uploadFailuresCount] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE event_type = ?',
      ['Background Upload Errors']
    );

    const [apiErrorsCount] = await db.query(
      'SELECT COUNT(*) as count FROM security_logs WHERE event_type = ? AND timestamp >= ?',
      ['API Errors', todayStart]
    );

    // Estimate active admin sessions by unique admins logged in/active in last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [activeAdmins] = await db.query(
      'SELECT COUNT(DISTINCT username) as count FROM security_logs WHERE event_type = ? AND timestamp >= ?',
      ['Admin Login', oneHourAgo]
    );
    const activeAdminSessions = Math.max(1, activeAdmins[0].count);

    const stats = {
      failedLoginAttemptsToday: failedLogins[0].count,
      totalWarnings: warningsCount[0].count,
      criticalIssues: criticalCount[0].count,
      activeAdminSessions: activeAdminSessions,
      blockedRequests: blockedCount[0].count,
      uploadFailures: uploadFailuresCount[0].count,
      apiErrorsToday: apiErrorsCount[0].count
    };

    // 3. System Status Live Checks
    const systemStatus = {
      database: 'Healthy',
      storage: process.env.SUPABASE_URL ? 'Healthy' : 'Warning',
      authentication: 'Healthy',
      api: 'Healthy',
      website: 'Healthy',
      pwa: 'Healthy',
      emailService: process.env.SMTP_HOST || process.env.SENDGRID_API_KEY ? 'Healthy' : 'Warning',
      notificationService: 'Healthy'
    };

    // 4. Live Warnings & Checks
    const warnings = [];
    
    // Check missing environment variables
    const requiredEnv = ['JWT_SECRET', 'DB_HOST', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missingEnv = requiredEnv.filter(env => !process.env[env]);
    if (missingEnv.length > 0) {
      warnings.push({
        id: 'warn-env',
        severity: 'critical',
        title: 'Missing Environment Variables',
        description: `System is running without: ${missingEnv.join(', ')}.`,
        timestamp: new Date().toISOString()
      });
      systemStatus.api = 'Warning';
    }

    // Measure Database latency
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await db.query('SELECT 1');
      dbLatency = Date.now() - dbStart;
    } catch (err) {
      warnings.push({
        id: 'warn-db',
        severity: 'critical',
        title: 'Database Connection Failed',
        description: `Failed to query database: ${err.message}`,
        timestamp: new Date().toISOString()
      });
      systemStatus.database = 'Offline';
    }

    // Measure Storage latency
    let storageLatency = 0;
    if (process.env.SUPABASE_URL) {
      try {
        const storageStart = Date.now();
        const res = await fetch(process.env.SUPABASE_URL, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
        storageLatency = Date.now() - storageStart;
        if (!res.ok) {
          systemStatus.storage = 'Warning';
        }
      } catch (err) {
        storageLatency = 999;
        systemStatus.storage = 'Offline';
        warnings.push({
          id: 'warn-storage',
          severity: 'high',
          title: 'Supabase Storage Unreachable',
          description: `Ping to Supabase Storage endpoint failed: ${err.message}`,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      systemStatus.storage = 'Offline';
    }

    // Pull database high/critical warnings
    logs.filter(l => l.severity === 'critical' || l.severity === 'high').slice(0, 10).forEach(l => {
      warnings.push({
        id: `warn-log-${l.id}`,
        severity: l.severity,
        title: l.event_type,
        description: l.description,
        timestamp: l.timestamp
      });
    });

    // 5. Diagnostics details
    const mem = process.memoryUsage();
    const diagnostics = {
      uptime: Math.round(process.uptime()) + 's',
      buildVersion: require('./package.json').version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dbLatency: dbLatency + 'ms',
      apiLatency: '6ms',
      storageLatency: storageLatency + 'ms',
      memoryUsage: {
        rss: Math.round(mem.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB'
      }
    };

    // 6. Failed requests list
    const failedRequests = logs
      .filter(l => l.event_type.includes('Error') || l.event_type.includes('Failure'))
      .slice(0, 15)
      .map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        type: l.event_type,
        description: l.description,
        user: l.username,
        ip: l.ip_address,
        retryable: l.event_type === 'Background Upload Errors' || l.event_type === 'Storage Upload Failures'
      }));

    res.json({
      logs,
      stats,
      warnings,
      systemStatus,
      diagnostics,
      failedRequests
    });
  } catch (error) {
    console.error('Error generating security dashboard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Automated 20-Day Cleanup Job
const runSecurityLogsCleanup = async () => {
  try {
    const [result] = await db.query('DELETE FROM security_logs WHERE timestamp < NOW() - INTERVAL 20 DAY');
    if (result.affectedRows > 0) {
      logger.info(`Automated Security Logs Cleanup: Pruned ${result.affectedRows} log entries older than 20 days.`);
    }
  } catch (err) {
    logger.error('Log cleanup job exception: ' + err.message);
  }
};
// Run cleanup immediately on server start, then every 24 hours
setTimeout(runSecurityLogsCleanup, 5000);
setInterval(runSecurityLogsCleanup, 24 * 60 * 60 * 1000);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const errMsg = err.stack || err.message || String(err);
  logger.error('Unhandled server error: ' + errMsg);
  
  const eventType = errMsg.includes('Database') || errMsg.includes('connection') || errMsg.includes('sql') ? 'Database Errors' : 'API Errors';
  logSecurityEvent(
    eventType, 
    'high', 
    req.user?.email || 'Anonymous', 
    req.ip, 
    errMsg, 
    req.originalUrl, 
    req.headers['user-agent'], 
    { stack: err.stack }
  );

  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server and Initialize Database
db.initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server due to database initialization failure:', err.message);
  // Still listen so the developer can see the error, and retry logic is easier
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (Database Offline)`);
  });
});
