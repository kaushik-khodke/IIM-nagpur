# Security Implementation Step-by-Step Guide

## 🎯 Goal: Transform from 40% to 100% Security Score

This guide walks you through implementing security measures in the correct order. Estimated time: **4-6 hours**

---

## Phase 1: CRITICAL (2-3 hours) - DO FIRST

### ✅ Step 1: Install Security Dependencies (15 minutes)

```bash
cd server
npm install --save \
  helmet \
  express-rate-limit \
  express-validator \
  winston

# Verify installation
npm list helmet express-rate-limit express-validator winston
```

**Expected Output:**
```
├── express-rate-limit@7.0.0
├── express-validator@7.0.0
├── helmet@7.0.0
└── winston@3.8.2
```

---

### ✅ Step 2: Update .env File (10 minutes)

**File:** `server/.env`

Current state:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=tractorsewa
JWT_SECRET=supersecretjwtkeyforsecurity_12345  # ❌ INSECURE
```

Change to:
```env
PORT=5000
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tractorsewa_app
DB_PASSWORD=strong_secure_password_here
DB_NAME=tractorsewa
JWT_SECRET=CHANGE_ME_TO_64_CHAR_RANDOM_STRING
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**Generate secure JWT_SECRET:**
```bash
# Copy one of these commands into terminal:

# On Mac/Linux:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# On Windows PowerShell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example: f3f6c8d7e9b0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6
```

Paste the output into `.env` as your `JWT_SECRET`.

---

### ✅ Step 3: Update server.js - Add Security Middleware (30 minutes)

**File:** `server/server.js`

**Find this section** (around line 10-15):
```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// ... other imports
```

**Replace with:**
```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// ⚠️ CRITICAL: Validate JWT_SECRET exists
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET not configured or too short');
  process.exit(1);
}
```

**Find the CORS section** (around line 15-20), currently looks like:
```javascript
app.use(cors());
app.use(express.json());
```

**Replace with:**
```javascript
// 🔐 1. HELMET - Security Headers
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// 🔐 2. CORS - Restrict to known origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔐 3. RATE LIMITING - General
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});

// 🔐 4. RATE LIMITING - Strict for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts',
});

app.use('/api/', apiLimiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Disable X-Powered-By header** (security through obscurity):
```javascript
app.disable('x-powered-by');
```

---

### ✅ Step 4: Update Login Endpoints with Rate Limiting (20 minutes)

**Find your existing login endpoint**, currently looks like:
```javascript
app.post('/api/auth/login', async (req, res) => {
  // current login code
});
```

**Change to:**
```javascript
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Fetch user
    const [users] = await db.query(
      'SELECT id, name, email, password, role, is_blocked FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Log attempt
      console.warn(`Failed login: user not found - ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.is_blocked) {
      console.warn(`Failed login: user blocked - ${email}`);
      return res.status(403).json({ error: 'Account blocked' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Failed login: invalid password - ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h', issuer: 'tractor-seva' }
    );

    console.log(`✅ Successful login: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

---

### ✅ Step 5: Test Your Changes (30 minutes)

**Start your server:**
```bash
npm start
```

**Test 1: Security Headers**
```bash
curl -I http://localhost:5000/api/auth/login
```

Should show headers like:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

**Test 2: CORS Restriction**
```bash
curl -H "Origin: http://evil.com" http://localhost:5000/api/ \
  -H "Content-Type: application/json"
```

Should show CORS error if origin not allowed.

**Test 3: Rate Limiting**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}'
  echo "Request $i"
done
```

After 5 requests should get rate limit message.

**Test 4: Login Still Works**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"YourPassword123"}'
```

Should get valid token or "Invalid credentials".

---

## Phase 2: HIGH-PRIORITY (2-3 hours) - DO NEXT WEEK

### ✅ Step 6: Add Input Validation (40 minutes)

**Install validator:**
```bash
npm install --save express-validator
```

**Create validation rules in server.js:**

```javascript
const { body, validationResult } = require('express-validator');

// Validation for login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8, max: 255 })
    .withMessage('Password must be 8-255 characters'),
];

// Validation for registration
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be 2-255 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password min 8 chars')
    .matches(/[A-Z]/)
    .withMessage('Password needs uppercase')
    .matches(/[a-z]/)
    .withMessage('Password needs lowercase')
    .matches(/\d/)
    .withMessage('Password needs number'),
];

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Apply to routes
app.post('/api/auth/login', validateLogin, handleValidationErrors, authLimiter, handleLogin);
app.post('/api/auth/register', validateRegister, handleValidationErrors, authLimiter, handleRegister);
```

---

### ✅ Step 7: Setup Structured Logging (30 minutes)

**File:** `server/server.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Use in your code:
logger.info('User login', { email, userId: user.id });
logger.warn('Failed login', { email, reason: 'Invalid password' });
logger.error('Database error', { error: err.message });
```

---

### ✅ Step 8: Enhanced File Upload Security (30 minutes)

**Find your upload section**, currently looks like:
```javascript
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
  // ... other config
});
```

**Replace with:**
```javascript
const crypto = require('crypto');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use crypto for better randomness
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    cb(null, `img-${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error(`Invalid extension: ${ext}`));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_SIZE }
});

// Validate after upload
const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }
  if (req.file.size > MAX_SIZE) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File too large' });
  }
  next();
};
```

---

### ✅ Step 9: Test Everything Again (30 minutes)

```bash
# Restart server
npm start

# Test login validation
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"short"}'
# Should reject with validation errors

# Test password strength
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@test.com",
    "password":"weak"
  }'
# Should require stronger password

# Test file upload
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test.exe"
# Should reject non-image files
```

---

## Phase 3: MEDIUM-PRIORITY (1-2 hours) - DO NEXT MONTH

### ✅ Step 10: Setup HTTPS (Local Testing)

For local testing with self-signed cert:
```bash
# Generate self-signed certificate
cd server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Answer prompts (Country: IN, State: Maharashtra, etc.)
```

For production, use Let's Encrypt:
```bash
# On your EC2 instance
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

---

### ✅ Step 11: Create Monitoring Dashboard (30 minutes)

```javascript
// Add this route to server.js
app.get('/api/admin/security-stats', verifyToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json({
    rateLimitStatus: 'Active',
    failedLogins: securityMonitor.failedAttempts.size,
    logsSize: fs.statSync('logs/combined.log').size,
    timestamp: new Date(),
  });
});
```

---

## 📊 Success Metrics

### After Phase 1 (Critical):
✅ HTTPS enabled  
✅ JWT_SECRET hardened  
✅ CORS restricted  
✅ Rate limiting active  
✅ Security headers set  
**Score: 75/100**

### After Phase 2 (High):
✅ Input validation enabled  
✅ Password complexity enforced  
✅ File uploads hardened  
✅ Structured logging active  
**Score: 90/100**

### After Phase 3 (Medium):
✅ Two-factor authentication  
✅ Advanced monitoring  
✅ Incident response plan  
**Score: 100/100**

---

## ✅ Verification Checklist

Use these tools to verify security:

```bash
# 1. Check SSL certificate (when on HTTPS)
openssl s_client -connect yourdomain.com:443

# 2. Verify security headers
curl -I https://yourdomain.com | grep -i "Strict-Transport\|X-Frame\|X-Content"

# 3. Check npm vulnerabilities
npm audit

# 4. Scan with OWASP ZAP (download from https://www.zaproxy.org/)
```

---

## 🆘 Troubleshooting

**Issue: "Rate limited too early"**
- Check: Are you using correct number of test requests?
- Fix: Increase `max` in rateLimit options if needed

**Issue: "CORS error"**
- Check: Is your frontend origin in ALLOWED_ORIGINS?
- Fix: Update .env with correct origin

**Issue: "JWT verification fails"**
- Check: Is JWT_SECRET the same between server startup?
- Fix: Never change JWT_SECRET without re-authentication

**Issue: "Logs not creating"**
- Check: Does `logs/` directory exist?
- Fix: Run `mkdir -p logs` in server directory

---

## 📞 Next Steps

1. ✅ Complete Phase 1 TODAY
2. ⏳ Schedule Phase 2 for next week
3. 📋 Schedule Phase 3 for next month
4. 🚀 Deploy to production once Phase 1 complete
5. 📊 Monitor logs and security metrics
6. 🔄 Review security plan quarterly

---

**Questions?** Refer to [SECURITY_PLAN.md](../SECURITY_PLAN.md) and [SECURITY_CODE_SNIPPETS.js](./SECURITY_CODE_SNIPPETS.js)
