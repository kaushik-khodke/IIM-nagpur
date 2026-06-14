const mysql = require('mysql2/promise');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// Auto-detect and configure SSL if ca.pem exists in the server folder
const caPath = process.env.DB_SSL_CA_PATH || path.join(__dirname, 'ca.pem');
if (process.env.DB_SSL_REQUIRED === 'true' || fs.existsSync(caPath)) {
  dbConfig.ssl = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath).toString()
  };
}


let pool = null;

async function getPool() {
  if (pool) return pool;

  try {
    // 1. Connect to MySQL Server without specifying database to ensure it exists
    const connection = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'tractorsewa';
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();

    // 2. Create Connection Pool targeting the database
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${dbName}`);
    return pool;
  } catch (error) {
    console.error('MySQL Connection Error:', error.message);
    console.error('Please make sure your MySQL server is running and port 3306 is open.');
    throw error;
  }
}

async function initializeDatabase() {
  const activePool = await getPool();

  try {
    // Create Users Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        state VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        is_blocked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Operators Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS operators (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        experience INT NOT NULL,
        machine_expertise TEXT NOT NULL,
        availability VARCHAR(50) DEFAULT 'Available',
        phone VARCHAR(20) DEFAULT NULL,
        whatsapp VARCHAR(20) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_path VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Harvesters Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS harvesters (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        machine_name VARCHAR(255) NOT NULL,
        company VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT DEFAULT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_path VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Requests Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        machine_type VARCHAR(255) NOT NULL,
        duration VARCHAR(100) DEFAULT NULL,
        start_date DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Enquiries Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        requirement VARCHAR(50) NOT NULL,
        date_needed DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safe Alter Table for existing installations
    try {
      await activePool.query('ALTER TABLE requests ADD COLUMN state VARCHAR(100) DEFAULT NULL AFTER location');
      console.log('Successfully added state column to requests table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) DEFAULT 0 AFTER phone');
      console.log('Successfully added is_blocked column to users table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    // Seed hardcoded administrator account if not exists
    try {
      const [admins] = await activePool.query("SELECT id FROM users WHERE email = 'admin@123'");
      if (admins.length === 0) {
        const adminId = require('crypto').randomUUID();
        const hashedAdminPassword = await require('bcryptjs').hash('123admin@', 10);
        await activePool.query(
          "INSERT INTO users (id, name, email, password, role, state, phone, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [adminId, 'System Administrator', 'admin@123', hashedAdminPassword, 'admin', 'Maharashtra', '9999999999', 0]
        );
        console.log('Successfully seeded hardcoded administrator account.');
      }
    } catch (err) {
      console.error('Error seeding admin user:', err.message);
    }

    // Create Messages Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Blogs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        short_description TEXT NOT NULL,
        content TEXT NOT NULL,
        date VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed tables if empty
    await seedData(activePool);

  } catch (error) {
    console.error('Database Initialization Error:', error);
    throw error;
  }
}

async function seedData(activePool) {
  // Database user/listing seeding disabled to allow a completely clean database.
  console.log('Skipping mock data seeding (disabled).');

  // Check Blogs Count
  const [blogs] = await activePool.query('SELECT COUNT(*) as count FROM blogs');
  if (blogs[0].count === 0) {
    const mockBlogs = [
      { title: "5 Tips to Maintain Your Combine Harvester Before Rabi Season", category: "Machine Maintenance", short_description: "Proper maintenance before the harvest season ensures your machine performs at its best and avoids costly breakdowns during peak time.", content: "Proper maintenance is key to a smooth harvest. Make sure to: 1. Clean the combine thoroughly inside and out. 2. Inspect belts and chains for wear. 3. Lubricate all grease fittings. 4. Change engine oil and filters. 5. Inspect and sharpen the cutter bar components.", date: "Mar 15, 2025" },
      { title: "How Farmers in Punjab are Using Tech to Find Operators Faster", category: "Success Stories", short_description: "A look at how digital platforms like Tractor Seva are helping farmers in Punjab reduce harvest delays by connecting with verified machine operators.", content: "In recent years, harvesting has become heavily dependent on timing. Digital tools are making it easier for farmers and harvester owners to find skilled workers during the peak Rabi and Kharif seasons. By connecting through peer-to-peer networks, search times have decreased by over 60%, saving both time and money.", date: "Feb 28, 2025" },
      { title: "Kharif Harvesting Guide: Crop-by-Crop Breakdown for 2025", category: "Harvesting Tips", short_description: "Complete guide to Kharif crop harvesting — including paddy, soybean, maize, and sugarcane — with the right machines and timing for each.", content: "Harvesting Kharif crops requires careful attention. Paddy requires harvesting when the grain moisture is around 20-22%. Soybeans should be harvested when pods are dry to prevent shattering. Sugarcane harvesting requires careful alignment to maintain sugar content, and using specialized harvesters is highly recommended.", date: "Jan 10, 2025" }
    ];

    for (const b of mockBlogs) {
      await activePool.query(
        'INSERT INTO blogs (title, category, short_description, content, date) VALUES (?, ?, ?, ?, ?)',
        [b.title, b.category, b.short_description, b.content, b.date]
      );
    }
    console.log('Seeded default blogs.');
  }
}

module.exports = {
  getPool,
  initializeDatabase,
  query: async (sql, params) => {
    const activePool = await getPool();
    return activePool.query(sql, params);
  }
};
