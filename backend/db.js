const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Try loading .env from root directory first, then fallback to current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Convert MySQL '?' parameter placeholders to PostgreSQL '$1, $2...' format
function convertPlaceholders(sql) {
  if (!sql || typeof sql !== 'string') return sql;
  let count = 0;
  return sql.replace(/\?/g, () => `$${++count}`);
}

// Format PostgreSQL query output to match mysql2 format [rows, fields]
function formatPgResult(result) {
  const rows = result.rows || [];
  rows.affectedRows = result.rowCount || 0;
  return [rows, result.fields || []];
}

const pgConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
};

if (process.env.DATABASE_URL) {
  pgConfig.connectionString = process.env.DATABASE_URL;
}

if (process.env.DB_SSL_REQUIRED === 'true' || process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_HOST.includes('supabase'))) {
  pgConfig.ssl = {
    rejectUnauthorized: false
  };
}

let pool = null;

class PgConnection {
  constructor(client) {
    this.client = client;
  }
  async query(sql, params = []) {
    const convertedSql = convertPlaceholders(sql);
    const result = await this.client.query(convertedSql, params);
    return formatPgResult(result);
  }
  async beginTransaction() {
    await this.client.query('BEGIN');
  }
  async commit() {
    await this.client.query('COMMIT');
  }
  async rollback() {
    await this.client.query('ROLLBACK');
  }
  release() {
    this.client.release();
  }
}

class PgPoolWrapper {
  constructor(pgPool) {
    this.pgPool = pgPool;
  }
  async query(sql, params = []) {
    const convertedSql = convertPlaceholders(sql);
    const result = await this.pgPool.query(convertedSql, params);
    return formatPgResult(result);
  }
  async getConnection() {
    const client = await this.pgPool.connect();
    return new PgConnection(client);
  }
}

async function getPool() {
  if (pool) return pool;

  try {
    const rawPool = new Pool(pgConfig);
    
    // Verify pool connection
    const client = await rawPool.connect();
    console.log(`Connected to Supabase / PostgreSQL database: ${pgConfig.database || 'postgres'}`);
    client.release();

    pool = new PgPoolWrapper(rawPool);
    return pool;
  } catch (error) {
    console.error('PostgreSQL Connection Error:', error.message);
    console.error('Please make sure your Supabase / PostgreSQL server credentials exist.');
    throw error;
  }
}

async function initializeDatabase() {
  const activePool = await getPool();

  try {
    // 1. Create Users Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        state VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        whatsapp_number VARCHAR(20) DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        image_path VARCHAR(255) DEFAULT NULL,
        is_blocked SMALLINT DEFAULT 0,
        notifications_email SMALLINT DEFAULT 1,
        notifications_sms SMALLINT DEFAULT 1,
        do_not_disturb_start TIME DEFAULT NULL,
        do_not_disturb_end TIME DEFAULT NULL,
        profile_visibility VARCHAR(20) DEFAULT 'public',
        show_contact_info SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Operators Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS operators (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        experience INT NOT NULL,
        machine_expertise TEXT NOT NULL,
        availability VARCHAR(50) DEFAULT 'Available',
        phone VARCHAR(20) DEFAULT NULL,
        whatsapp VARCHAR(20) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        description_translations JSONB DEFAULT NULL,
        image_path VARCHAR(255) DEFAULT NULL,
        selfie_image_path VARCHAR(255) DEFAULT NULL,
        license_front_path VARCHAR(255) DEFAULT NULL,
        license_back_path VARCHAR(255) DEFAULT NULL,
        consent_signature VARCHAR(255) DEFAULT NULL,
        consent_timestamp TIMESTAMPTZ DEFAULT NULL,
        verification_status VARCHAR(50) DEFAULT 'Unverified',
        verification_feedback TEXT DEFAULT NULL,
        is_profile_completed SMALLINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Harvesters Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS harvesters (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
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
        description_translations JSONB DEFAULT NULL,
        image_path TEXT DEFAULT NULL,
        verification_status VARCHAR(50) DEFAULT 'Pending',
        verification_feedback TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Requests Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        machine_type VARCHAR(255) NOT NULL,
        duration VARCHAR(100) DEFAULT NULL,
        start_date DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        description TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create Messages Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read SMALLINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Create User Push Subscriptions Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS user_push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Create Blog Categories Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // 8. Create Blogs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        short_description TEXT NOT NULL,
        content TEXT NOT NULL,
        date VARCHAR(50) DEFAULT NULL,
        image_url VARCHAR(255) DEFAULT NULL,
        views INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Create Blog Likes Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_likes (
        id SERIAL PRIMARY KEY,
        blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_blog_like UNIQUE (user_id, blog_id)
      )
    `);

    // 10. Create Blog Comments Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id SERIAL PRIMARY KEY,
        blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Create Enquiries Table
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
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. Create Ratings Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id VARCHAR(36) PRIMARY KEY,
        rater_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL,
        review TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_rater_target UNIQUE (rater_id, target_type, target_id)
      )
    `);

    // 13. Create Login Logs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        login_date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_date UNIQUE (user_id, login_date)
      )
    `);

    // 14. Create Admin Audit Logs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        admin_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        status VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 15. Create FAQs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id VARCHAR(36) PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 16. Create Notifications Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        target_id VARCHAR(36) DEFAULT NULL,
        is_read SMALLINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 17. Create Site Settings Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL
      )
    `);

    await activePool.query(`
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES ('enquiry_background', '/enquiry_background/background.png')
      ON CONFLICT (setting_key) DO NOTHING
    `);

    // 18. Create Translation Overrides Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS translation_overrides (
        id SERIAL PRIMARY KEY,
        lang VARCHAR(10) NOT NULL,
        namespace VARCHAR(50) NOT NULL,
        key_path VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_translation UNIQUE (lang, namespace, key_path)
      )
    `);

    // 19. Create Dynamic Translations Cache Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS dynamic_translations (
        id SERIAL PRIMARY KEY,
        source_hash VARCHAR(64) NOT NULL,
        source_text TEXT NOT NULL,
        lang VARCHAR(10) NOT NULL,
        translated_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_dyn_trans UNIQUE (source_hash, lang)
      )
    `);

    // 20. Create Security Logs Table
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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

    // 21. Create Operator Consent Logs Table
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
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        signature VARCHAR(64) NOT NULL
      )
    `);

    try {
      await activePool.query("CREATE INDEX IF NOT EXISTS idx_consent_user_id ON operator_consent_logs (user_id)");
    } catch (err) {}
    try {
      await activePool.query("CREATE INDEX IF NOT EXISTS idx_consent_op_timestamp ON operator_consent_logs (operator_id, timestamp DESC)");
    } catch (err) {}

    // Seed administrator account if not exists
    try {
      const [admins] = await activePool.query("SELECT id FROM users WHERE email = 'tractorsewaadmin@gmail.com'");
      if (admins.length === 0) {
        const defaultAdminPass = process.env.DEFAULT_ADMIN_PASSWORD;
        if (defaultAdminPass) {
          const adminId = require('crypto').randomUUID();
          const hashedAdminPassword = await require('bcryptjs').hash(defaultAdminPass, 10);
          await activePool.query(
            "INSERT INTO users (id, name, email, password, role, state, phone, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [adminId, 'System Administrator', 'tractorsewaadmin@gmail.com', hashedAdminPassword, 'admin', 'Maharashtra', '9999999999', 0]
          );
          console.log('Successfully seeded administrator account.');
        }
      }
    } catch (err) {
      console.error('Error seeding admin user:', err.message);
    }

    // Seed default tables if empty
    await seedData(activePool);

    // Seed translations if empty
    await seedTranslations(activePool);

  } catch (error) {
    console.error('Database Initialization Error:', error);
    throw error;
  }
}

async function seedData(activePool) {
  // Check Blogs Count
  try {
    const [blogs] = await activePool.query('SELECT COUNT(*) as count FROM blogs');
    if (blogs.length > 0 && parseInt(blogs[0].count) === 0) {
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
  } catch (err) {
    console.error('Error seeding blogs:', err.message);
  }

  // Seed default categories if empty
  try {
    const [catCount] = await activePool.query('SELECT COUNT(*) as count FROM blog_categories');
    if (catCount.length > 0 && parseInt(catCount[0].count) === 0) {
      const defaultCategories = [
        "Harvesting Tips",
        "Machine Maintenance",
        "Success Stories",
        "Agri News",
        "Weather & Season"
      ];
      for (const cat of defaultCategories) {
        await activePool.query('INSERT INTO blog_categories (name) VALUES (?) ON CONFLICT (name) DO NOTHING', [cat]);
      }
      console.log('Seeded default blog categories.');
    }
  } catch (err) {
    console.error('Error seeding blog categories:', err.message);
  }
}

async function seedTranslations(activePool) {
  try {
    const localesDir = path.resolve(__dirname, '../frontend/src/locales');
    if (!fs.existsSync(localesDir)) {
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
        
        for (const [keyPath, value] of entries) {
          await activePool.query(
            `INSERT INTO translation_overrides (lang, namespace, key_path, value) 
             VALUES (?, ?, ?, ?) 
             ON CONFLICT (lang, namespace, key_path) DO UPDATE SET value = EXCLUDED.value`,
            [lang, namespace, keyPath, typeof value === 'string' ? value : JSON.stringify(value)]
          );
        }
      }
    }
    console.log('Successfully synchronized translation overrides.');
  } catch (err) {
    console.error('Error seeding translations:', err.message);
  }
}

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

module.exports = {
  getPool,
  initializeDatabase,
  query: async (sql, params) => {
    const activePool = await getPool();
    return activePool.query(sql, params);
  }
};
