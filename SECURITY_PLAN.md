# 🔐 Tractor Seva - Comprehensive Security Plan

**Date Created:** June 2026  
**Last Updated:** June 2026  
**Status:** Active Security Implementation Plan

---

## Executive Summary

This document outlines a complete security strategy for the Tractor Seva application across all layers: **Frontend, Backend, Database, Infrastructure, and Operations**. It identifies current security strengths, potential vulnerabilities, and actionable recommendations.

---

## 📋 Table of Contents

1. [Current Security Status](#current-security-status)
2. [Security Architecture Overview](#security-architecture-overview)
3. [Vulnerability Assessment](#vulnerability-assessment)
4. [Security Implementation Roadmap](#security-implementation-roadmap)
5. [Operational Security](#operational-security)
6. [Monitoring & Incident Response](#monitoring--incident-response)

---

## Current Security Status

### ✅ Strengths (Already Implemented)

| Component | Status | Details |
|-----------|--------|---------|
| **SQL Injection Prevention** | ✅ Implemented | Parameterized queries via `mysql2` driver |
| **Password Security** | ✅ Implemented | Bcrypt hashing (salted & iterated) |
| **Authentication** | ✅ Implemented | JWT-based token system with secure signing |
| **Authorization** | ✅ Implemented | Owner verification before CRUD operations |
| **User Identification** | ✅ Implemented | UUID-based identifiers (non-sequential, non-guessable) |
| **Session Management** | ✅ Implemented | Token-based, signed JWT tokens |
| **Input Validation** | ⚠️ Partial | Basic validation present, needs hardening |
| **HTTPS Support** | ⚠️ Not Configured | Needs SSL/TLS setup on production |
| **Rate Limiting** | ⚠️ Not Configured | Recommended in security guide, needs activation |
| **Security Headers** | ⚠️ Not Configured | Helmet middleware not fully configured |

---

## Security Architecture Overview

### 1️⃣ Authentication & Authorization Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                         │
│  - Email & Password submission                              │
│  - JWT stored in localStorage                               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/TLS
┌────────────────────▼────────────────────────────────────────┐
│                  SERVER (Express.js)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Validate input & check email exists              │   │
│  │ 2. Retrieve bcrypt hash from database               │   │
│  │ 3. Compare password with hash (in-memory)           │   │
│  │ 4. Generate signed JWT token                        │   │
│  │ 5. Return token to client                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ Parameterized Queries
┌────────────────────▼────────────────────────────────────────┐
│              DATABASE (MySQL/MariaDB)                        │
│  - Secure password hashes                                   │
│  - User metadata & role information                         │
└─────────────────────────────────────────────────────────────┘
```

### 2️⃣ Data Protection Layer

- **Transit Security**: HTTPS/TLS encryption needed
- **Storage Security**: Passwords hashed with Bcrypt, sensitive data in `.env`
- **Access Control**: Role-based access + UUID-based IDOR prevention

### 3️⃣ Input Validation Layer

- **Database Level**: Parameterized queries prevent SQL injection
- **Application Level**: Needs comprehensive validation framework
- **File Upload**: Multer configured with file type & size restrictions

---

## Vulnerability Assessment

### 🔴 Critical Issues

| Issue | Risk | Current Status | Action |
|-------|------|-----------------|--------|
| **No HTTPS/TLS** | **CRITICAL** | ❌ Not configured | Implement SSL certificates (Let's Encrypt) |
| **JWT Secret in Code** | **CRITICAL** | ⚠️ Hardcoded fallback | Use only environment variables |
| **Unprotected Database Port** | **CRITICAL** | ⚠️ Could be exposed | Firewall MySQL to localhost only |
| **No CORS Origin Validation** | **HIGH** | ⚠️ Uses `cors()` without restrictions | Restrict to frontend domain |
| **No Rate Limiting** | **HIGH** | ❌ Not configured | Implement on auth & API endpoints |
| **Missing Security Headers** | **HIGH** | ❌ Not configured | Add Helmet middleware |

### 🟡 High-Priority Issues

| Issue | Risk | Current Status | Action |
|-------|------|-----------------|--------|
| **No Input Sanitization** | **HIGH** | ⚠️ Minimal validation | Implement comprehensive validation |
| **File Upload Vulnerabilities** | **HIGH** | ⚠️ Basic checks only | Add virus scanning & file type validation |
| **No Request Logging/Audit Trail** | **HIGH** | ✅ Basic logging exists | Enhance with structured logging |
| **Weak Password Requirements** | **MEDIUM** | ❌ Not enforced | Enforce minimum complexity |
| **No 2FA/MFA** | **MEDIUM** | ❌ Not implemented | Add OTP support |
| **No CSRF Protection** | **MEDIUM** | ⚠️ Partial (SameSite cookies) | Add CSRF tokens if needed |

### 🟢 Medium-Priority Issues

| Issue | Risk | Current Status | Action |
|-------|------|-----------------|--------|
| **No Secrets Rotation** | **MEDIUM** | ❌ Not automated | Implement key rotation policy |
| **Missing Error Handling** | **MEDIUM** | ⚠️ Partial | Standardize error responses |
| **No API Versioning** | **LOW** | ⚠️ Single version | Plan for versioning strategy |
| **No API Documentation** | **LOW** | ❌ Missing | Document endpoints & parameters |

---

## Security Implementation Roadmap

### Phase 1: 🔴 CRITICAL (Do Before Going Live)

#### 1.1 Enable HTTPS/TLS
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Configure in server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

#### 1.2 Secure JWT Secret
```javascript
// ❌ NEVER do this:
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforsecurity_12345';

// ✅ DO THIS:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET not set or too short');
  process.exit(1);
}
```

#### 1.3 Implement Helmet Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Tighten this for React
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));
```

#### 1.4 Restrict CORS Origins
```javascript
// ❌ AVOID:
app.use(cors()); // Allows all origins

// ✅ DO THIS:
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  // Add admin dashboard if separate domain
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### 1.5 Implement Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter, handleLogin);
app.post('/api/auth/register', authLimiter, handleRegister);
```

### Phase 2: 🟡 HIGH-PRIORITY (Complete Before Public Launch)

#### 2.1 Input Validation & Sanitization
```javascript
const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

app.post('/api/auth/login', validateLogin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process login
});
```

#### 2.2 Password Requirements
```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    }
  };
};
```

#### 2.3 File Upload Security
```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Validate file on server side
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Verify file integrity (check magic bytes)
  const magicBytes = req.file.buffer.slice(0, 4);
  // ... additional validation
});
```

#### 2.4 Structured Logging & Audit Trail
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'tractor-seva-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Log security events
logger.info('User login attempt', {
  email: req.body.email,
  timestamp: new Date(),
  ip: req.ip,
  userAgent: req.get('user-agent')
});

// Log authentication failures
logger.warn('Failed login attempt', {
  email: req.body.email,
  reason: 'Invalid password',
  ip: req.ip
});
```

#### 2.5 Environment Variable Validation
```javascript
// Create .env.example for documentation
// DB_HOST=127.0.0.1
// DB_PORT=3306
// DB_USER=app_user
// DB_PASSWORD=***CHANGE_ME***
// DB_NAME=tractorsewa
// JWT_SECRET=***CHANGE_ME_64_CHAR_RANDOM_STRING***
// NODE_ENV=production
// PORT=5000

// Validate on startup
const requiredEnvVars = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'NODE_ENV', 'PORT'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`FATAL: Environment variable ${envVar} is not set`);
    process.exit(1);
  }
});
```

### Phase 3: 🟢 MEDIUM-PRIORITY (Plan for Next Quarters)

#### 3.1 Two-Factor Authentication (2FA/OTP)
```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate OTP secret
app.post('/api/auth/2fa/setup', authenticate, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `Tractor Seva (${req.user.email})`,
    issuer: 'Tractor Seva'
  });
  
  const qr = await QRCode.toDataURL(secret.otpauth_url);
  
  // Store temporary secret (not yet verified)
  res.json({ qr, secret: secret.base32 });
});

// Verify OTP during login
const verifyOTP = (userSecret, token) => {
  return speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};
```

#### 3.2 Secrets Rotation Policy
```javascript
// Automate JWT secret rotation
const rotateJWTSecret = async () => {
  const newSecret = require('crypto').randomBytes(32).toString('hex');
  
  // Update environment or secrets manager
  process.env.JWT_SECRET_OLD = process.env.JWT_SECRET;
  process.env.JWT_SECRET = newSecret;
  
  // Log rotation event
  logger.info('JWT secret rotated', { timestamp: new Date() });
};

// Schedule rotation every 90 days
const schedule = require('node-schedule');
schedule.scheduleJob('0 0 1 * *', rotateJWTSecret); // Monthly
```

#### 3.3 API Security Headers Enhancement
```javascript
app.use((req, res, next) => {
  // Prevent HTTP parameter pollution
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Strict-Transport-Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Remove server info
  res.removeHeader('Server');
  res.setHeader('Server', 'Tractor Seva API');
  
  next();
});
```

---

## Operational Security

### 🔐 Database Security

```bash
# 1. Create application-specific database user (not root)
mysql> CREATE USER 'tractorsewa_app'@'127.0.0.1' IDENTIFIED BY 'strong_random_password';
mysql> GRANT SELECT, INSERT, UPDATE, DELETE ON tractorsewa.* TO 'tractorsewa_app'@'127.0.0.1';
mysql> FLUSH PRIVILEGES;

# 2. Disable remote root access
mysql> UPDATE mysql.user SET Host='127.0.0.1' WHERE User='root';
mysql> FLUSH PRIVILEGES;

# 3. Remove anonymous users
mysql> DELETE FROM mysql.user WHERE User='';
mysql> FLUSH PRIVILEGES;

# 4. Enable MySQL binlog for backup & recovery
# Add to /etc/mysql/mysql.conf.d/mysqld.cnf:
# [mysqld]
# log_bin = /var/log/mysql/mysql-bin.log
# server-id = 1
# binlog_format = mixed

# 5. Regular backups
mysqldump -u tractorsewa_app -p tractorsewa > /backups/tractorsewa_backup_$(date +%Y%m%d).sql
```

### 📁 File System Security

```bash
# 1. Set proper permissions for application folder
chmod 755 /var/www/tractor-seva
chmod 750 /var/www/tractor-seva/server
chmod 640 /var/www/tractor-seva/server/.env

# 2. Restrict upload directory
chmod 755 /var/www/tractor-seva/server/uploads
chmod 644 /var/www/tractor-seva/server/uploads/*

# 3. Disable execute on uploads (prevent shell scripts)
chmod 644 /var/www/tractor-seva/server/uploads/*.jpg
chmod 644 /var/www/tractor-seva/server/uploads/*.png

# 4. Regular security scanning
sudo fail2ban-client status
```

### 🔑 Secrets Management

```bash
# Option 1: AWS Secrets Manager
aws secretsmanager create-secret --name tractorsewa/db-password --secret-string "your_password"

# Option 2: HashiCorp Vault
vault kv put secret/tractorsewa db_password=value jwt_secret=value

# Option 3: Node-based (dotenv)
# Keep .env locally, never commit to Git
# Use .env.example for documentation
```

### 🚨 Firewall Configuration

```bash
# AWS Security Group Rules
# Inbound:
# - Port 22 (SSH):     MyIP or specific range only
# - Port 80 (HTTP):    0.0.0.0/0 (auto-redirect to HTTPS)
# - Port 443 (HTTPS):  0.0.0.0/0 (public)
# 
# Outbound:
# - All traffic allowed (unless restricted)
#
# ⚠️ NEVER expose:
# - Port 3306 (MySQL)
# - Port 5000 (Node backend)
# - Any internal service ports

# UFW (Uncomplicated Firewall) on EC2
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw default deny incoming
sudo ufw enable
```

---

## Monitoring & Incident Response

### 📊 Security Monitoring

```javascript
// 1. Failed Login Tracking
const failedLoginAttempts = new Map();

const recordFailedLogin = (email, ip) => {
  const key = `${email}:${ip}`;
  const attempts = failedLoginAttempts.get(key) || 0;
  failedLoginAttempts.set(key, attempts + 1);
  
  if (attempts >= 5) {
    logger.warn('SUSPICIOUS: Multiple failed login attempts', { email, ip });
    // Trigger alert or temporary account lockout
  }
};

// 2. Unusual Activity Detection
app.use((req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\.\/)/,  // Directory traversal
    /(union|select|insert|delete|drop)/i, // SQL keywords
    /<script|javascript/i, // Script injection
  ];
  
  if (suspiciousPatterns.some(p => p.test(JSON.stringify(req.body)))) {
    logger.warn('SUSPICIOUS: Potential attack detected', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
  }
  next();
});

// 3. Monitoring Dashboard
// Use Prometheus + Grafana or AWS CloudWatch
```

### 🚨 Incident Response Plan

```
1. DETECTION
   - Monitor logs for suspicious patterns
   - Set up alerts for failed auth attempts
   - Track rate limit violations

2. CONTAINMENT
   - Immediately revoke compromised tokens
   - Disable affected user accounts
   - Block suspicious IPs temporarily

3. INVESTIGATION
   - Review audit logs
   - Analyze affected records
   - Determine scope of breach

4. REMEDIATION
   - Force password resets
   - Rotate secrets
   - Patch vulnerabilities
   - Update security policies

5. COMMUNICATION
   - Notify affected users
   - Inform stakeholders
   - Document lessons learned
```

### 📋 Security Checklist

- [ ] SSL/TLS certificate installed and valid
- [ ] HTTP redirects to HTTPS
- [ ] JWT_SECRET is 64+ characters and from environment only
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled on auth endpoints
- [ ] Helmet security headers configured
- [ ] Password requirements enforced
- [ ] File upload validation implemented
- [ ] Database user has minimal permissions
- [ ] MySQL port not exposed to internet
- [ ] SSH key pair configured (no password auth)
- [ ] Regular backups scheduled and tested
- [ ] Logs stored separately from application
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies regularly updated
- [ ] Security headers tested with online tools
- [ ] OWASP Top 10 reviewed and mitigated
- [ ] Penetration testing scheduled

---

## Security Testing & Validation

### Online Tools to Verify Security

1. **SSL/TLS Certificate Check**  
   https://www.ssllabs.com/ssltest/

2. **Security Headers Verification**  
   https://securityheaders.com/

3. **OWASP Top 10 Scanner**  
   https://www.zaproxy.org/ (OWASP ZAP)

4. **Dependency Vulnerability Scan**  
   ```bash
   npm audit
   npm audit fix
   ```

5. **HTTP Security Headers Test**  
   https://csp-evaluator.withgoogle.com/

---

## References & Standards

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **Node.js Security Best Practices**: https://nodejs.org/en/docs/guides/security/
- **Express.js Security Best Practices**: https://expressjs.com/en/advanced/best-practice-security.html

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | __________ | __________ | __________ |
| DevOps Lead | __________ | __________ | __________ |
| Project Manager | __________ | __________ | __________ |

---

**Document Version:** 1.0  
**Next Review Date:** December 2026

