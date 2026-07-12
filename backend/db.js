const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Try loading .env from root directory first, then fallback to current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

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

  const dbName = process.env.DB_NAME || 'tractorsewa';

  try {
    // Try to connect without specifying database to create it if it doesn't exist
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();
      console.log(`Database "${dbName}" ensured (created or already exists).`);
    } catch (dbCreateError) {
      console.warn('Warning: Could not create database automatically. Proceeding to connect directly:', dbCreateError.message);
    }

    // 2. Create Connection Pool targeting the database
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Verify pool connection
    const conn = await pool.getConnection();
    console.log(`Connected to MySQL database: ${dbName}`);
    conn.release();
    return pool;
  } catch (error) {
    console.error('MySQL Connection Error:', error.message);
    console.error('Please make sure your MySQL server is running and the credentials/database exist.');
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
        bio TEXT DEFAULT NULL,
        image_path VARCHAR(255) DEFAULT NULL,
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
        verification_status VARCHAR(50) DEFAULT 'Unverified',
        verification_feedback TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Clean up duplicate operators (keeping the latest one based on created_at)
    try {
      await activePool.query(`
        DELETE o1 FROM operators o1
        INNER JOIN operators o2 
        ON o1.user_id = o2.user_id AND o1.created_at < o2.created_at
      `);
    } catch (cleanupErr) {
      console.error('Error cleaning up duplicate operators:', cleanupErr);
    }

    // Add unique constraint on user_id to existing operators table if not present
    try {
      await activePool.query(`
        ALTER TABLE operators ADD UNIQUE KEY unique_user_id (user_id)
      `);
    } catch (alterErr) {
      // Ignore if index already exists (Error code ER_DUP_KEYNAME is 1061)
      if (alterErr.errno !== 1061) {
        console.error('Error adding unique key to operators table:', alterErr);
      }
    }

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS harvesters (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        machine_name VARCHAR(255) NOT NULL,
        company VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        serial_no VARCHAR(100) DEFAULT NULL,
        chassis_no VARCHAR(100) DEFAULT NULL,
        mfg_month_year VARCHAR(100) DEFAULT NULL,
        engine_no VARCHAR(100) DEFAULT NULL,
        engine_power VARCHAR(100) DEFAULT NULL,
        engine_make VARCHAR(100) DEFAULT NULL,
        engine_model VARCHAR(100) DEFAULT NULL,
        service_hotline_no VARCHAR(100) DEFAULT NULL,
        year INT DEFAULT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        whatsapp VARCHAR(20) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_path TEXT DEFAULT NULL,
        verification_status VARCHAR(50) DEFAULT 'Pending',
        verification_feedback TEXT DEFAULT NULL,
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
        message TEXT DEFAULT NULL,
        date_needed DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Active',
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
      await activePool.query('ALTER TABLE enquiries ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER name');
      console.log('Successfully added phone column to enquiries table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE enquiries ADD COLUMN requirement TEXT DEFAULT NULL AFTER location');
      console.log('Successfully added requirement column to enquiries table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE enquiries ADD COLUMN date_needed DATE DEFAULT NULL AFTER requirement');
      console.log('Successfully added date_needed column to enquiries table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query("UPDATE enquiries SET status = 'Active' WHERE status = 'Pending' OR status IS NULL");
      console.log("Successfully migrated Pending or NULL enquiries to Active.");
    } catch (err) {
      // safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE enquiries ADD COLUMN message TEXT DEFAULT NULL AFTER requirement');
      console.log('Successfully added message column to enquiries table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) DEFAULT 0 AFTER phone');
      console.log('Successfully added is_blocked column to users table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL AFTER phone');
      console.log('Successfully added bio column to users table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN description_translations JSON DEFAULT NULL AFTER description');
      console.log('Successfully added description_translations column to harvesters table.');
    } catch (err) {
      // Columns might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE operators ADD COLUMN description_translations JSON DEFAULT NULL AFTER description');
      console.log('Successfully added description_translations column to operators table.');
    } catch (err) {
      // Columns might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE users ADD COLUMN image_path VARCHAR(255) DEFAULT NULL AFTER bio');
      console.log('Successfully added image_path column to users table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    // Settings columns
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN notifications_email TINYINT(1) DEFAULT 1 AFTER image_path");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN notifications_sms TINYINT(1) DEFAULT 1 AFTER notifications_email");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN do_not_disturb_start TIME DEFAULT NULL AFTER notifications_sms");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN do_not_disturb_end TIME DEFAULT NULL AFTER do_not_disturb_start");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public' AFTER do_not_disturb_end");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN show_contact_info TINYINT(1) DEFAULT 1 AFTER profile_visibility");
    } catch (err) { /* already exists */ }
    try {
      await activePool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL AFTER phone");
    } catch (err) { /* already exists */ }

    // Harvesters Table Migrations for specifications and multiple images
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN serial_no VARCHAR(100) DEFAULT NULL AFTER model');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN chassis_no VARCHAR(100) DEFAULT NULL AFTER serial_no');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN mfg_month_year VARCHAR(100) DEFAULT NULL AFTER chassis_no');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN engine_no VARCHAR(100) DEFAULT NULL AFTER mfg_month_year');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN engine_power VARCHAR(100) DEFAULT NULL AFTER engine_no');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN engine_make VARCHAR(100) DEFAULT NULL AFTER engine_power');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN engine_model VARCHAR(100) DEFAULT NULL AFTER engine_make');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN service_hotline_no VARCHAR(100) DEFAULT NULL AFTER engine_model');
    } catch (err) {}
    try {
      await activePool.query('ALTER TABLE harvesters MODIFY COLUMN image_path TEXT DEFAULT NULL');
    } catch (err) {}

    // Harvesters Table Migrations for verification status
    try {
      await activePool.query("ALTER TABLE harvesters ADD COLUMN verification_status VARCHAR(50) DEFAULT 'Pending' AFTER created_at");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE harvesters ADD COLUMN verification_feedback TEXT DEFAULT NULL AFTER verification_status");
    } catch (err) {}

    // Operators Table Migrations for verification status
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN verification_status VARCHAR(50) DEFAULT 'Unverified' AFTER created_at");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN verification_feedback TEXT DEFAULT NULL AFTER verification_status");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN selfie_image_path VARCHAR(255) DEFAULT NULL");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN license_front_path VARCHAR(255) DEFAULT NULL");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN license_back_path VARCHAR(255) DEFAULT NULL");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN consent_signature VARCHAR(255) DEFAULT NULL");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN consent_timestamp TIMESTAMP NULL DEFAULT NULL");
    } catch (err) {}
    try {
      await activePool.query("ALTER TABLE operators ADD COLUMN is_profile_completed TINYINT DEFAULT 0");
    } catch (err) {}
    try {
      await activePool.query("UPDATE operators SET is_profile_completed = 1 WHERE experience > 0 AND location != 'Not Specified' AND name != 'Operator Profile'");
    } catch (err) {}
    try {
      await activePool.query("UPDATE operators SET verification_status = 'Unverified' WHERE verification_status = 'Pending' AND selfie_image_path IS NULL");
    } catch (err) {}

    // Create operator_consent_logs table
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS operator_consent_logs (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          operator_id VARCHAR(50) NOT NULL,
          consent_text TEXT NOT NULL,
          selfie_hash VARCHAR(64) NOT NULL,
          license_front_hash VARCHAR(64) NOT NULL,
          license_back_hash VARCHAR(64) NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          signature VARCHAR(64) NOT NULL
        )
      `);
    } catch (err) {
      console.error("Error creating operator_consent_logs table:", err);
    }

    try {
      await activePool.query("CREATE INDEX idx_consent_user_id ON operator_consent_logs (user_id)");
    } catch (err) {}
    try {
      await activePool.query("CREATE INDEX idx_consent_op_timestamp ON operator_consent_logs (operator_id, timestamp DESC)");
    } catch (err) {}


    // Seed hardcoded administrator account if not exists
    try {
      const [admins] = await activePool.query("SELECT id FROM users WHERE email = 'tractorsewaadmin@gmail.com'");
      if (admins.length === 0) {
        const defaultAdminPass = process.env.DEFAULT_ADMIN_PASSWORD;
        if (!defaultAdminPass) {
          throw new Error('DEFAULT_ADMIN_PASSWORD environment variable is not defined. Administrator account seeding skipped.');
        }
        const adminId = require('crypto').randomUUID();
        const hashedAdminPassword = await require('bcryptjs').hash(defaultAdminPass, 10);
        await activePool.query(
          "INSERT INTO users (id, name, email, password, role, state, phone, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [adminId, 'System Administrator', 'tractorsewaadmin@gmail.com', hashedAdminPassword, 'admin', 'Maharashtra', '9999999999', 0]
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
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create User Push Subscriptions Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS user_push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Blog Categories Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
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
        image_url VARCHAR(255) DEFAULT NULL,
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Blog Likes Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blog_id INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_blog_like (user_id, blog_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Blog Comments Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blog_id INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Safe Alter Table migrations to add foreign key constraints for existing tables
    try {
      await activePool.query(`
        ALTER TABLE blog_likes 
        ADD CONSTRAINT fk_blog_likes_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('Added fk_blog_likes_user foreign key constraint.');
    } catch (err) {
      if (err.errno !== 1061 && err.errno !== 1022 && err.errno !== 1826) {
        console.error('Error adding foreign key constraint to blog_likes:', err);
      }
    }

    try {
      await activePool.query(`
        ALTER TABLE blog_comments 
        ADD CONSTRAINT fk_blog_comments_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('Added fk_blog_comments_user foreign key constraint.');
    } catch (err) {
      if (err.errno !== 1061 && err.errno !== 1022 && err.errno !== 1826) {
        console.error('Error adding foreign key constraint to blog_comments:', err);
      }
    }


    // Create Enquiries Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        requirement TEXT NOT NULL,
        message TEXT DEFAULT NULL,
        date_needed DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Ratings Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id VARCHAR(36) PRIMARY KEY,
        rater_id VARCHAR(36) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL,
        review TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_rater_target (rater_id, target_type, target_id)
      )
    `);

    // Create Login Logs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        login_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, login_date)
      )
    `);

    // Create Admin Audit Logs Table
    try {
      await activePool.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id VARCHAR(36) PRIMARY KEY,
          admin_id VARCHAR(36) NOT NULL,
          admin_email VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          status VARCHAR(50) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('Successfully initialized admin_audit_logs table.');
    } catch (err) {
      console.error('Error creating admin_audit_logs table:', err);
    }


    // Create FAQs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id VARCHAR(36) PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Notifications Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        target_id VARCHAR(36) DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try {
      await activePool.query("ALTER TABLE notifications ADD COLUMN target_id VARCHAR(36) DEFAULT NULL AFTER message");
      console.log('Successfully added target_id column to notifications table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    // Create Site Settings Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL
      )
    `);

    // Seed default background image path
    await activePool.query(`
      INSERT IGNORE INTO site_settings (setting_key, setting_value)
      VALUES ('enquiry_background', '/enquiry_background/background.png')
    `);

    try {
      await activePool.query('ALTER TABLE blogs ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER date');
      console.log('Successfully added image_url column to blogs table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE blogs ADD COLUMN views INT DEFAULT 0');
      console.log('Successfully added views column to blogs table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE harvesters ADD COLUMN whatsapp VARCHAR(20) DEFAULT NULL AFTER phone');
      console.log('Successfully added whatsapp column to harvesters table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    try {
      await activePool.query('ALTER TABLE messages ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER content');
      console.log('Successfully added is_read column to messages table.');
    } catch (err) {
      // Column might already exist, safe to ignore
    }

    // Alter table schemas if columns exist as INT from initial creation
    try {
      await activePool.query('ALTER TABLE blog_likes MODIFY COLUMN user_id VARCHAR(36) NOT NULL');
      await activePool.query('ALTER TABLE blog_comments MODIFY COLUMN user_id VARCHAR(36) NOT NULL');
      console.log('Database blog tables columns migrated successfully to VARCHAR(36).');
    } catch (err) {
      console.log('Database migration note:', err.message);
    }

    // Create Translation Overrides Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS translation_overrides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lang VARCHAR(10) NOT NULL,
        namespace VARCHAR(50) NOT NULL,
        key_path VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_translation (lang, namespace, key_path)
      )
    `);

    // Create Dynamic Translations Cache Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS dynamic_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_hash VARCHAR(64) NOT NULL,
        source_text TEXT NOT NULL,
        lang VARCHAR(10) NOT NULL,
        translated_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_dyn_trans (source_hash, lang)
      )
    `);

    // Create Security Logs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        username VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        request_url TEXT DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        description TEXT NOT NULL,
        metadata TEXT DEFAULT NULL
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed tables if empty
    await seedData(activePool);

    // Seed translations if empty
    await seedTranslations(activePool);

    // Clean up testing/duplicate FAQs from the database
    await cleanupTestingFaqs(activePool);

  } catch (error) {
    console.error('Database Initialization Error:', error);
    throw error;
  }
}

async function seedTranslations(activePool) {
  try {
    console.log('Synchronizing translation_overrides table from local JSON files...');

    console.log('Seeding translation_overrides table from local JSON files...');
    const localesDir = path.resolve(__dirname, '../frontend/src/locales');
    if (!fs.existsSync(localesDir)) {
      console.warn('Warning: Locales directory not found at', localesDir);
      return;
    }

    const langs = fs.readdirSync(localesDir);
    for (const lang of langs) {
      const langPath = path.join(localesDir, lang);
      if (!fs.statSync(langPath).isDirectory()) continue;

      const files = fs.readdirSync(langPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const namespace = file.replace('.json', '');
        const filePath = path.join(langPath, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const flatTranslations = flattenObject(fileContent);
        const entries = Object.entries(flatTranslations);
        
        // Batch insert to prevent connection hanging on large dictionaries
        const batchSize = 500;
        for (let i = 0; i < entries.length; i += batchSize) {
          const chunk = entries.slice(i, i + batchSize);
          const values = [];
          const placeholders = [];
          
          for (const [key_path, value] of chunk) {
            values.push(lang, namespace, key_path, value);
            placeholders.push('(?, ?, ?, ?)');
          }
          
          if (placeholders.length > 0) {
            await activePool.query(
              `INSERT INTO translation_overrides (lang, namespace, key_path, value) VALUES ${placeholders.join(',')} ON DUPLICATE KEY UPDATE value=VALUES(value)`,
              values
            );
          }
        }
      }
    }
    console.log('Successfully seeded all translation files into database.');
  } catch (error) {
    console.error('Error seeding translations:', error.message);
  }
}

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], propName));
      } else {
        result[propName] = String(obj[key]);
      }
    }
  }
  return result;
}

async function seedData(activePool) {
  // Database user/listing seeding disabled to allow a completely clean database.
  console.log('Skipping mock data seeding (disabled).');

  // Seed login logs if empty
  try {
    const [logCount] = await activePool.query('SELECT COUNT(*) as count FROM login_logs');
    if (logCount[0].count === 0) {
      const [users] = await activePool.query('SELECT id FROM users');
      if (users.length > 0) {
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().slice(0, 10);
          
          for (const u of users) {
            // Seed a log with 70% probability for each user each day
            if (Math.random() > 0.3) {
              await activePool.query('INSERT IGNORE INTO login_logs (user_id, login_date) VALUES (?, ?)', [u.id, dateStr]);
            }
          }
        }
        console.log('Seeded initial login logs for existing users.');
      }
    }
  } catch (err) {
    console.error('Error seeding login logs:', err.message);
  }

  // Check Blogs Count
  const [blogs] = await activePool.query('SELECT COUNT(*) as count FROM blogs');
  if (blogs[0].count === 0) {
    const mockBlogs = [
      { title: "5 Tips to Maintain Your Combine Harvester Before Rabi Season", category: "Machine Maintenance", short_description: "Proper maintenance before the harvest season ensures your machine performs at its best and avoids costly breakdowns during peak time.", content: "Proper maintenance is key to a smooth harvest. Make sure to: 1. Clean the combine thoroughly inside and out. 2. Inspect belts and chains for wear. 3. Lubricate all grease fittings. 4. Change engine oil and filters. 5. Inspect and sharpen the cutter bar components.", date: "Mar 15, 2025", image_url: "/blog-punjab-farmers.png" },
      { title: "How Farmers in Punjab are Using Tech to Find Operators Faster", category: "Success Stories", short_description: "A look at how digital platforms like Tractor Seva are helping farmers in Punjab reduce harvest delays by connecting with verified machine operators.", content: "In recent years, harvesting has become heavily dependent on timing. Digital tools are making it easier for farmers and harvester owners to find skilled workers during the peak Rabi and Kharif seasons. By connecting through peer-to-peer networks, search times have decreased by over 60%, saving both time and money.", date: "Feb 28, 2025", image_url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800" },
      { title: "Kharif Harvesting Guide: Crop-by-Crop Breakdown for 2025", category: "Harvesting Tips", short_description: "Complete guide to Kharif crop harvesting — including paddy, soybean, maize, and sugarcane — with the right machines and timing for each.", content: "Harvesting Kharif crops requires careful attention. Paddy requires harvesting when the grain moisture is around 20-22%. Soybeans should be harvested when pods are dry to prevent shattering. Sugarcane harvesting requires careful alignment to maintain sugar content, and using specialized harvesters is highly recommended.", date: "Jan 10, 2025", image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800" }
    ];

    for (const b of mockBlogs) {
      await activePool.query(
        'INSERT INTO blogs (title, category, short_description, content, date, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [b.title, b.category, b.short_description, b.content, b.date, b.image_url]
      );
    }
    console.log('Seeded default blogs.');
  }

  // Seed default categories if empty
  try {
    const [catCount] = await activePool.query('SELECT COUNT(*) as count FROM blog_categories');
    if (catCount[0].count === 0) {
      const defaultCategories = [
        "Harvesting Tips",
        "Machine Maintenance",
        "Success Stories",
        "Agri News",
        "Weather & Season"
      ];
      for (const cat of defaultCategories) {
        await activePool.query('INSERT IGNORE INTO blog_categories (name) VALUES (?)', [cat]);
      }
      console.log('Seeded default blog categories.');
    }
  } catch (err) {
    console.error('Error seeding blog categories:', err.message);
  }
}

async function cleanupTestingFaqs(activePool) {
  try {
    const badQuestions = [
      'Testing question',
      'Can I book a harvester for just a single day, or is there a minimum booking period during harvest season?',
      'Are there any service charges or commission fees taken by Tractor Seva when I hire an operator?',
      'How does the service requests portal work?',
      'Is it free to list my machine or register as an operator?',
      'How are operators and machines verified?'
    ];
    const [result] = await activePool.query(
      'DELETE FROM faqs WHERE question IN (?)',
      [badQuestions]
    );
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} testing/duplicate FAQs from database.`);
    }
  } catch (err) {
    console.error('Error cleaning up testing FAQs:', err.message);
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
