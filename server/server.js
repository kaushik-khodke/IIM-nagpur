const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforsecurity_12345';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '[REDACTED]';
    console.log('  Body:', bodyCopy);
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
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
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

// --- API ROUTES ---

// 1. Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ url: filePath });
});

// 2. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, state, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Please provide name, email, password and phone number' });
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
      [userId, name, email, hashedPassword, 'user', state || null, phone]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, name, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
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

  try {
    await db.query(
      'UPDATE users SET name = ?, state = ?, phone = ?, bio = ?, image_path = ? WHERE id = ?',
      [name, state || null, phone, bio || null, imagePath || null, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Operator Routes
app.get('/api/operators', async (req, res) => {
  const { search, location, state, availability, limit, userId } = req.query;
  let queryStr = 'SELECT * FROM operators WHERE 1=1';
  const queryParams = [];

  if (userId) {
    queryStr += ' AND user_id = ?';
    queryParams.push(userId);
  }

  if (search) {
    queryStr += ' AND name LIKE ?';
    queryParams.push(`%${search}%`);
  }
  if (location) {
    queryStr += ' AND location LIKE ?';
    queryParams.push(`%${location}%`);
  }
  if (state) {
    queryStr += ' AND state = ?';
    queryParams.push(state);
  }
  if (availability) {
    queryStr += ' AND availability = ?';
    queryParams.push(availability);
  }

  queryStr += ' ORDER BY id DESC';


  if (limit) {
    queryStr += ' LIMIT ?';
    queryParams.push(parseInt(limit));
  }

  try {
    const [rows] = await db.query(queryStr, queryParams);
    // Parse machine expertise array back to array object
    const parsedRows = rows.map(r => ({
      ...r,
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
    const [rows] = await db.query('SELECT * FROM operators WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    const op = rows[0];
    res.json({
      ...op,
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

  try {
    // Check if operator listing already exists for this user, if so update it, otherwise create new
    const [existing] = await db.query('SELECT id FROM operators WHERE user_id = ?', [req.user.id]);
    
    let result;
    const expertiseStr = Array.isArray(machineExpertise) ? JSON.stringify(machineExpertise) : JSON.stringify([machineExpertise]);

    if (existing.length > 0) {
      result = await db.query(
        'UPDATE operators SET name = ?, experience = ?, location = ?, state = ?, machine_expertise = ?, availability = ?, description = ?, phone = ?, whatsapp = ?, image_path = ? WHERE user_id = ?',
        [name, experience, location, state, expertiseStr, availability || 'Available', description || null, phone || null, whatsapp || null, imagePath || null, req.user.id]
      );
    } else {
      result = await db.query(
        'INSERT INTO operators (id, user_id, name, experience, location, state, machine_expertise, availability, description, phone, whatsapp, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [require('crypto').randomUUID(), req.user.id, name, experience, location, state, expertiseStr, availability || 'Available', description || null, phone || null, whatsapp || null, imagePath || null]
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
  let queryStr = 'SELECT h.*, u.name as ownerName FROM harvesters h JOIN users u ON h.user_id = u.id WHERE 1=1';
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
      description: r.description,
      imagePath: r.image_path,
      ownerName: r.ownerName
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
      'SELECT h.*, u.name as ownerName FROM harvesters h JOIN users u ON h.user_id = u.id WHERE h.id = ?', 
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
      description: r.description,
      imagePath: r.image_path,
      ownerName: r.ownerName
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/harvesters', authenticateToken, async (req, res) => {
  const { machineName, company, model, year, location, state, phone, description, imagePath } = req.body;
  if (!machineName || !company || !model || !location || !state) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    await db.query(
      'INSERT INTO harvesters (id, user_id, machine_name, company, model, year, location, state, phone, description, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [require('crypto').randomUUID(), req.user.id, machineName, company, model, year ? parseInt(year) : null, location, state, phone || null, description || null, imagePath || null]
    );
    res.status(201).json({ message: 'Harvester listed successfully' });
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
  const { tab, userId, location, state } = req.query;
  let queryStr = 'SELECT r.*, u.name as requesterName, u.phone as requesterPhone FROM requests r JOIN users u ON r.user_id = u.id WHERE 1=1';
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


  try {
    const [rows] = await db.query(queryStr, queryParams);
    const formattedRows = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      location: r.location,
      machineType: r.machine_type,
      duration: r.duration,
      startDate: r.start_date,
      status: r.status,
      description: r.description,
      requesterName: r.requesterName,
      requesterPhone: r.requesterPhone
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
      'SELECT r.*, u.name as requesterName, u.phone as requesterPhone FROM requests r JOIN users u ON r.user_id = u.id WHERE r.id = ?', 
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
      requesterPhone: r.requesterPhone
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
      SELECT DISTINCT u.id, u.name, u.role,
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

// 8. Blog Routes
app.get('/api/blogs', async (req, res) => {
  const { category, search } = req.query;
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

  queryStr += ' ORDER BY b.id DESC';

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
      [enquiryId, name, phone, location, requirement, formattedDate, 'Pending']
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

    res.json({
      totalUsers: users[0].count,
      totalOperators: operators[0].count,
      totalHarvesters: harvesters[0].count,
      totalRequests: requests[0].count,
      blockedUsers: blocked[0].count
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
