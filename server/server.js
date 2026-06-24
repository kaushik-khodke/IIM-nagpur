const express = require('express');
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

// Try loading .env from root directory first, then fallback to current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// 1. Environment Variables Check
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`FATAL: Environment variable ${envVar} is not set`);
    process.exit(1);
  }
});
if (JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Middlewares

// 2. Helmet Security Headers
app.use(helmet());

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
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});
app.use('/api/', apiLimiter);

// 5. Structured Logging with Winston
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const getOptionalUser = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
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

// --- API ROUTES ---

// 1. Image Upload Endpoint
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum limit is 5MB.' });
        }
        return res.status(400).json({ error: `Multer upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload error.' });
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
      
      // Map image/webp to image/png for the Supabase upload call
      // because the Supabase bucket configuration excludes image/webp from its whitelist.
      const supabaseMimeType = mimeType === 'image/webp' ? 'image/png' : mimeType;

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
        let parsedError = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedError = jsonErr.message || jsonErr.error || errorText;
        } catch (e) {}
        return res.status(500).json({ error: `Supabase upload failed: ${parsedError}` });
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
      res.status(500).json({ error: `Internal Server Error during upload: ${error.message}` });
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
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO users (id, name, email, password, role, state, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, 'user', state || null, cleanedPhone]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [userId, today]);
    } catch (err) {
      console.error('Failed to log signup activity:', err);
    }
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
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [user.id, today]);
    } catch (err) {
      console.error('Failed to log login activity:', err);
    }
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
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
    await db.query(
      'UPDATE users SET name = ?, state = ?, phone = ?, bio = ?, image_path = ? WHERE id = ?',
      [name, state || null, cleanedPhone, bio || null, imagePath || null, req.user.id]
    );

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
  const { search, location, state, availability, limit, userId } = req.query;
  let queryStr = `
    SELECT o.*,
           COALESCE((SELECT AVG(rating) FROM ratings WHERE target_type = 'operator' AND target_id = o.id), 0) as avgRating,
           (SELECT COUNT(*) FROM ratings WHERE target_type = 'operator' AND target_id = o.id) as ratingCount
    FROM operators o
    WHERE 1=1
  `;
  const queryParams = [];

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

  queryStr += ' ORDER BY o.id DESC';

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
      machineExpertise: JSON.parse(r.machine_expertise || '[]')
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
    res.json({
      ...op,
      ownerName: op.ownerName,
      ownerProfilePic: op.ownerProfilePic,
      machineExpertise: JSON.parse(op.machine_expertise || '[]')
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
    // Check if operator listing already exists for this user, if so update it, otherwise create new
    const [existing] = await db.query('SELECT id FROM operators WHERE user_id = ?', [req.user.id]);
    
    let result;
    const expertiseStr = Array.isArray(machineExpertise) ? JSON.stringify(machineExpertise) : JSON.stringify([machineExpertise]);

    if (existing.length > 0) {
      result = await db.query(
        'UPDATE operators SET name = ?, experience = ?, location = ?, state = ?, machine_expertise = ?, availability = ?, description = ?, phone = ?, whatsapp = ?, image_path = ? WHERE user_id = ?',
        [name, experience, location, state, expertiseStr, availability || 'Available', description || null, cleanedPhone, cleanedWhatsapp, imagePath || null, req.user.id]
      );
    } else {
      result = await db.query(
        'INSERT INTO operators (id, user_id, name, experience, location, state, machine_expertise, availability, description, phone, whatsapp, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [require('crypto').randomUUID(), req.user.id, name, experience, location, state, expertiseStr, availability || 'Available', description || null, cleanedPhone, cleanedWhatsapp, imagePath || null]
      );
    }

    res.status(201).json({ message: 'Operator profile saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Harvester Routes
app.get('/api/harvesters', async (req, res) => {
  const { search, location, state, company, limit, operatorId } = req.query;
  let queryStr = `
    SELECT h.*, u.name as ownerName, u.image_path as ownerProfilePic,
           COALESCE((SELECT AVG(rating) FROM ratings WHERE target_type = 'machine' AND target_id = h.id), 0) as avgRating,
           (SELECT COUNT(*) FROM ratings WHERE target_type = 'machine' AND target_id = h.id) as ratingCount
    FROM harvesters h 
    JOIN users u ON h.user_id = u.id 
    WHERE 1=1
  `;
  const queryParams = [];

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

  queryStr += ' ORDER BY h.id DESC';


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
      imagePath: r.image_path,
      ownerName: r.ownerName,
      ownerProfilePic: r.ownerProfilePic,
      avgRating: parseFloat(r.avgRating || 0).toFixed(1),
      ratingCount: parseInt(r.ratingCount || 0)
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
      imagePath: r.image_path,
      ownerName: r.ownerName,
      ownerProfilePic: r.ownerProfilePic
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/harvesters', authenticateToken, async (req, res) => {
  const { machineName, company, model, year, location, state, phone, whatsapp, description, imagePath } = req.body;
  if (!machineName || !company || !model || !location || !state) {
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

  if (year && !validateYear(year)) {
    return res.status(400).json({ error: 'Invalid year. Must be a 4-digit number between 1900 and ' + (new Date().getFullYear() + 1) + '.' });
  }

  try {
    await db.query(
      'INSERT INTO harvesters (id, user_id, machine_name, company, model, year, location, state, phone, whatsapp, description, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [require('crypto').randomUUID(), req.user.id, machineName, company, model, year ? parseInt(year) : null, location, state, cleanedPhone, cleanedWhatsapp, description || null, imagePath || null]
    );
    res.status(201).json({ message: 'Harvester listed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/harvesters/:id', authenticateToken, async (req, res) => {
  const { machineName, company, model, year, location, state, phone, whatsapp, description, imagePath } = req.body;
  if (!machineName || !company || !model || !location || !state) {
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

    await db.query(
      'UPDATE harvesters SET machine_name = ?, company = ?, model = ?, year = ?, location = ?, state = ?, phone = ?, whatsapp = ?, description = ?, image_path = ? WHERE id = ?',
      [machineName, company, model, year ? parseInt(year) : null, location, state, cleanedPhone, cleanedWhatsapp, description || null, imagePath !== undefined ? imagePath : harvester.image_path, req.params.id]
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

    await db.query('DELETE FROM harvesters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Harvester listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Request Routes
app.get('/api/requests', authenticateToken, async (req, res) => {
  const { tab, userId, location, state, limit } = req.query;
  let queryStr = 'SELECT r.*, u.name as requesterName, u.phone as requesterPhone, u.image_path as requesterProfilePic FROM requests r JOIN users u ON r.user_id = u.id WHERE 1=1';
  const queryParams = [];

  if (tab) {
    queryStr += ' AND r.type = ?';
    queryParams.push(tab);
  }
  if (userId === 'me') {
    queryStr += ' AND r.user_id = ?';
    queryParams.push(req.user.id);
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
  try {
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
  if (!type || !location || !state || !machineType || !startDate) {
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
    await db.query(
      'INSERT INTO requests (id, user_id, type, location, state, machine_type, duration, start_date, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [require('crypto').randomUUID(), req.user.id, type, location, state, machineType, duration || null, formattedDate, 'Open', description || null]
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
    await db.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [messageId, req.user.id, receiverId, content]
    );
    
    const [newMessage] = await db.query('SELECT * FROM messages WHERE id = ?', [messageId]);
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
      SELECT m.*, u.name as senderName 
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

// 8. Blog Routes
app.get('/api/blogs', async (req, res) => {
  const { category, search, limit, offset, seed } = req.query;
  const user = getOptionalUser(req);
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
  const user = getOptionalUser(req);
  const currentUserId = user ? user.id : null;
  const blogId = req.params.id;

  try {
    // Increment view count
    await db.query('UPDATE blogs SET views = views + 1 WHERE id = ?', [blogId]);

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

    // Fetch the comments list for this blog
    const [comments] = await db.query(`
      SELECT id, user_id, user_name, content, created_at
      FROM blog_comments
      WHERE blog_id = ?
      ORDER BY id DESC
    `, [blogId]);

    const blogData = rows[0];
    blogData.comments = comments;

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

    const [result] = await db.query(
      'INSERT INTO blog_comments (blog_id, user_id, user_name, content) VALUES (?, ?, ?, ?)',
      [blogId, userId, userName, content]
    );

    res.status(201).json({
      id: result.insertId,
      blog_id: parseInt(blogId, 10),
      user_id: userId,
      user_name: userName,
      content,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 9. Enquiry Routes
app.post('/api/enquiries', async (req, res) => {
  const { name, phone, location, requirement, dateNeeded } = req.body;
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

    await db.query(
      'INSERT INTO enquiries (id, name, phone, location, requirement, date_needed, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [enquiryId, name, cleanedPhone, location, requirement, formattedDate, 'Active']
    );
    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- ADMIN PRIVILEGED MIDDLEWARE & ROUTES ---

const isAdmin = async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const csvUpload = multer({
  dest: uploadsDir,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// 1. Admin Statistics Dashboard
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as count FROM users WHERE role != ?', ['admin']);
    const [operators] = await db.query('SELECT COUNT(*) as count FROM operators');
    const [harvesters] = await db.query('SELECT COUNT(*) as count FROM harvesters');
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
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id) as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             COALESCE((
               SELECT AVG(rating) 
               FROM ratings 
               WHERE (target_type = 'machine' AND target_id IN (SELECT id FROM harvesters WHERE user_id = u.id))
                  OR (target_type = 'operator' AND target_id IN (SELECT id FROM operators WHERE user_id = u.id))
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
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id) as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             (SELECT COUNT(*) FROM operators WHERE user_id = u.id) as isOperator
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
  try {
    await db.query('DELETE FROM harvesters WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM requests WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM operators WHERE user_id = ?', [userId]);
    await db.query('UPDATE users SET is_blocked = 1 WHERE id = ?', [userId]);
    res.json({ message: 'User listings and operator profiles cleared, and account blocked.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Admin Delete Specific Harvester
app.delete('/api/admin/harvesters/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM harvesters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Harvester listing deleted by administrator.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Admin Delete Specific Request
app.delete('/api/admin/requests/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Request deleted by administrator.' });
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
             (SELECT COUNT(*) FROM harvesters WHERE user_id = u.id) as harvesterCount,
             (SELECT COUNT(*) FROM requests WHERE user_id = u.id) as requestCount,
             (SELECT COUNT(*) FROM operators WHERE user_id = u.id) as isOperator
      FROM users u
      WHERE u.role != 'admin'
    `;
    const queryParams = [];

    if (detectedName) {
      queryStr += ' AND u.name LIKE ?';
      queryParams.push(`%${detectedName}%`);
    }

    if (detectedState) {
      queryStr += ' AND (u.state = ? OR u.id IN (SELECT user_id FROM operators WHERE state = ?))';
      queryParams.push(detectedState, detectedState);
    }

    if (detectedDistrict) {
      queryStr += ' AND (u.id IN (SELECT user_id FROM operators WHERE location = ?))';
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

// 8. Admin Bulk User Upload via CSV
app.post('/api/admin/users/bulk', authenticateToken, isAdmin, csvUpload.single('file'), async (req, res) => {
  const { defaultPassword } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }
  if (!defaultPassword || defaultPassword.length < 6) {
    return res.status(400).json({ error: 'Please specify a valid default password (minimum 6 characters).' });
  }

  const filePath = req.file.path;
  const reports = { success: 0, failed: 0, errors: [] };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV file is empty or only contains headers.' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');
    const stateIdx = headers.indexOf('state');

    if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1 || stateIdx === -1) {
      return res.status(400).json({ error: 'Invalid CSV format. Missing required headers: name, email, phone, state.' });
    }

    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');

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
        reports.failed++;
        reports.errors.push(`Row ${i + 1}: Incomplete row data.`);
        continue;
      }

      const name = cells[nameIdx];
      const email = cells[emailIdx];
      const phone = cells[phoneIdx];
      const state = cells[stateIdx];

      if (!name || !email || !phone || !state) {
        reports.failed++;
        reports.errors.push(`Row ${i + 1}: Missing required cell fields.`);
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        reports.failed++;
        reports.errors.push(`Row ${i + 1}: Invalid email address "${email}".`);
        continue;
      }

      try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
          reports.failed++;
          reports.errors.push(`Row ${i + 1}: Email "${email}" already registered.`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const userId = crypto.randomUUID();
        await db.query(
          'INSERT INTO users (id, name, email, password, role, state, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, name, email, hashedPassword, 'user', state, phone]
        );

        reports.success++;
      } catch (err) {
        console.error(`Error importing row ${i + 1}:`, err);
        reports.failed++;
        reports.errors.push(`Row ${i + 1}: Database insertion failure.`);
      }
    }
  } catch (error) {
    console.error('CSV Parsing Error:', error);
    return res.status(500).json({ error: 'Failed to parse CSV file.' });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  res.json({
    message: `CSV parsing completed.`,
    successCount: reports.success,
    failedCount: reports.failed,
    errors: reports.errors
  });
});

// =============================================
// SETTINGS ROUTES
// =============================================

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
      notificationsEmail: u.notifications_email === 1,
      notificationsSms: u.notifications_sms === 1,
      doNotDisturbStart: u.do_not_disturb_start,
      doNotDisturbEnd: u.do_not_disturb_end,
      profileVisibility: u.profile_visibility || 'public',
      showContactInfo: u.show_contact_info === 1,
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
    await db.query(
      'UPDATE users SET name = ?, phone = ?, whatsapp_number = ?, state = ?, bio = ? WHERE id = ?',
      [name, phone, whatsappNumber || null, state, bio || null, req.user.id]
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
    await db.query(
      'UPDATE users SET notifications_email = ?, notifications_sms = ?, do_not_disturb_start = ?, do_not_disturb_end = ? WHERE id = ?',
      [notificationsEmail ? 1 : 0, notificationsSms ? 1 : 0, doNotDisturbStart || null, doNotDisturbEnd || null, req.user.id]
    );
    res.json({ message: 'Notification preferences updated' });
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
    await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Account permanently deleted' });
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
    // Upsert rating using ON DUPLICATE KEY UPDATE:
    await db.query(
      `INSERT INTO ratings (id, rater_id, target_type, target_id, rating, review)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review)`,
      [ratingId, raterId, targetType, targetId, numRating, review || null]
    );

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

Additionally, you must select the most relevant, topic-matching, high-quality, hot-linkable Unsplash image URL from this curated catalog for the cover photo (ensure "?w=800&auto=format&fit=crop" is appended):

- Category: Combine Harvester / Crops Harvesting in Progress
  * URL: https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop
  * Use for: Combine harvesters, machine harvesting, paddy/wheat reaping, harvesting season.
  
- Category: Modern Heavy Tractor Closeup / Purchase / Inspection
  * URL: https://images.unsplash.com/photo-1594754714120-f1a8f9f7a78e?w=800&auto=format&fit=crop
  * Use for: Tractor models, farm equipment buying guide, tractor engines, horse-power specs.

- Category: Tractor Ploughing / Land Preparation
  * URL: https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=800&auto=format&fit=crop
  * Use for: Field soil tilling, tractor operations, farm preparation, sowing season.

- Category: General Agriculture Farms / Green Drone View
  * URL: https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop
  * Use for: General farming practices, organic agriculture, vast landscapes, farm layout.

- Category: Indian Farmer in Field / Golden Wheat Crops
  * URL: https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop
  * Use for: Wheat cultivation, rabi crop guide, farmer stories, field work, harvesting wheat.

- Category: Green Crop Sprouts / Seed Quality / Agronomy
  * URL: https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&auto=format&fit=crop
  * Use for: Early plant growth, pest control, crop selection, fertilization, seedlings.

- Category: Soil Health / Sowing Seedlings / Sustainable Farming
  * URL: https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&auto=format&fit=crop
  * Use for: Sowing seeds, hands with soil, sustainable soil preservation, eco-friendly farming.

- Category: Indian Farmer Community / Rural Success Stories
  * URL: https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop
  * Use for: Farmers' groups, operator networks, agricultural markets, success stories, community.

- Category: Rainy Weather / Rain on Crops / Monsoon Guidelines
  * URL: https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop
  * Use for: Monsoon preparation, heavy rains, rainy day tips, irrigation under rain.

- Category: Workshop Mechanics / Tractor Repairs / Tool Maintenance
  * URL: https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop
  * Use for: Heavy machine maintenance, tractor servicing, workshop repairs, fixing breakdowns.

- Category: Rice Paddy plantation / Water flooded fields
  * URL: https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800&auto=format&fit=crop
  * Use for: Paddy cultivation, rice farming, flooded fields irrigation.

- Category: Cotton Farming / Harvesting Cotton Balls
  * URL: https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800&auto=format&fit=crop
  * Use for: Cotton harvesting, cash crops, cotton cultivation tips.

- Category: Smart Farming / High Tech Greenhouse / Automation
  * URL: https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop
  * Use for: Modern technology, drip irrigation, smart farming systems, future agriculture.

Return your response ONLY as a JSON object matching this exact structure:
{
  "title": "A compelling final title based on the input",
  "category": "${category}",
  "short_description": "A short summary (1-2 sentences) of the blog post.",
  "content": "The full blog content in English in Markdown format.",
  "image_url": "The chosen Unsplash image URL including parameters"
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
          generationConfig: {
            responseMimeType: 'application/json',
          },
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
    parsedResult = JSON.parse(generatedText.trim());
  } catch (e) {
    logger.error('Failed to parse AI output as JSON. Output was: ' + generatedText);
    return res.status(502).json({ error: 'AI output could not be parsed as valid JSON' });
  }

  res.json(parsedResult);
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

    // Delete associated comments and likes first
    await db.query('DELETE FROM blog_likes WHERE blog_id = ?', [blogId]);
    await db.query('DELETE FROM blog_comments WHERE blog_id = ?', [blogId]);

    // Delete the blog
    await db.query('DELETE FROM blogs WHERE id = ?', [blogId]);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
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

    await db.query('DELETE FROM operators WHERE id = ?', [operatorId]);
    res.json({ success: true, message: 'Operator profile deleted successfully by administrator.' });
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
app.post('/api/faqs', async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const faqId = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO faqs (id, question) VALUES (?, ?)',
      [faqId, question.trim()]
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
