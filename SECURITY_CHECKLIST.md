# Security Implementation Quick Checklist

## 🎯 Quick Priority Summary

### 🔴 MUST DO BEFORE PRODUCTION (This Week)
- [ ] Enable HTTPS/TLS with Let's Encrypt
- [ ] Secure JWT_SECRET (remove hardcoded fallback)
- [ ] Restrict CORS to frontend domain only
- [ ] Implement rate limiting on /api/auth endpoints
- [ ] Add Helmet security headers middleware
- [ ] Create database backup strategy
- [ ] Document all environment variables

### 🟡 DO BEFORE PUBLIC LAUNCH (Next 2 Weeks)
- [ ] Input validation with express-validator
- [ ] Password complexity requirements
- [ ] Enhanced file upload validation
- [ ] Structured logging setup (Winston)
- [ ] Security monitoring alerts
- [ ] Create incident response plan

### 🟢 PLAN FOR FUTURE (Next Quarter)
- [ ] Two-Factor Authentication (2FA/OTP)
- [ ] JWT secret rotation automation
- [ ] Advanced API security headers
- [ ] Vulnerability scanning in CI/CD
- [ ] Penetration testing

---

## 📦 Required NPM Packages to Install

```bash
cd server
npm install --save \
  helmet \
  express-rate-limit \
  express-validator \
  bcryptjs \
  dotenv \
  winston \
  cors \
  jsonwebtoken

# For Phase 2+
npm install --save speakeasy qrcode node-schedule
```

---

## 🔧 Quick Configuration Steps

### Step 1: Update server.js with Security Middleware

Replace the CORS section with:
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Enable security headers
app.use(helmet());

// CORS configuration - UPDATE WITH YOUR DOMAIN
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts',
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter, handleLogin);
app.post('/api/auth/register', authLimiter, handleRegister);
```

### Step 2: Create .env Configuration

```bash
# Remove hardcoded JWT_SECRET fallback
# server.js line should be:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not configured');
  process.exit(1);
}
```

### Step 3: Update .env File Format

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tractorsewa_app
DB_PASSWORD=your_secure_password_here
DB_NAME=tractorsewa

# Application
NODE_ENV=production
PORT=5000
ALLOWED_ORIGIN=https://yourdomain.com

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=generate_64_char_random_string_here

# Optional
DB_SSL_REQUIRED=false
DB_SSL_CA_PATH=/path/to/ca.pem
```

---

## 🧪 Testing Security Configuration

### 1. Test HTTPS/SSL
```bash
curl -I https://yourdomain.com
# Should show 200 OK with HTTPS
```

### 2. Test Security Headers
```bash
curl -I https://yourdomain.com | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options"
```

### 3. Test Rate Limiting
```bash
# Should fail after 5 attempts
for i in {1..10}; do
  curl -X POST https://yourdomain.com/api/auth/login -d '{"email":"test","password":"test"}'
done
```

### 4. Test CORS
```bash
# Should reject origin not in whitelist
curl -H "Origin: https://malicious.com" https://yourdomain.com/api/
```

### 5. Verify No Sensitive Info in Errors
```bash
curl https://yourdomain.com/api/nonexistent
# Should not leak database info, file paths, or stack traces
```

---

## 📊 Security Score Calculation

```
Current Score:  ████░░░░░░ 40/100  (40%)
  ✅ SQL Injection (10 pts)
  ✅ Password Hashing (10 pts)
  ✅ JWT Auth (10 pts)
  ✅ UUID Prevention (10 pts)
  ❌ HTTPS (15 pts)
  ❌ Rate Limiting (10 pts)
  ❌ Security Headers (10 pts)
  ❌ Input Validation (10 pts)
  ❌ Error Handling (5 pts)

Target Score:   ██████████ 100/100 (100%)
  After Phase 1: 75/100 (75%)
  After Phase 2: 90/100 (90%)
  After Phase 3: 100/100 (100%)
```

---

## 🚨 Deployment Checklist (Day Before Go-Live)

### Pre-Deployment (24 hours before)
- [ ] All Phase 1 items implemented & tested
- [ ] SSL certificate installed & renewed
- [ ] Database backups automated
- [ ] Environment variables configured on production server
- [ ] Rate limiting tested under load
- [ ] Error pages don't leak sensitive info

### Deployment Day
- [ ] Backup production database
- [ ] Deploy code to production
- [ ] Verify HTTPS works
- [ ] Test authentication flow
- [ ] Check security headers (securityheaders.com)
- [ ] Monitor logs for errors
- [ ] Smoke test critical features

### Post-Deployment (First 24 hours)
- [ ] Monitor failed login attempts
- [ ] Watch server resources (CPU, Memory)
- [ ] Check response times
- [ ] Verify file uploads work
- [ ] Monitor error logs
- [ ] Test from different networks/IPs

---

## 📞 Security Contact Information

**Security Issues Found?**
- DO NOT post publicly
- Email: security@yourdomain.com
- Response time: 24-48 hours
- Disclosure policy: 90-day coordinated disclosure

---

## 📚 Documentation Links

- [Main Security Plan](./SECURITY_PLAN.md)
- [Deployment Guide](./DO_THIS_BEFORE_DEPLOYING/security_and_deployment_guide.md)
- [Database Schema](./server/schema.md)

---

**Last Updated:** June 2026  
**Next Review:** December 2026
