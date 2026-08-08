const mysql = require('mysql2/promise');

// Connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u593517978_db_trust',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u593517978_db_trust',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create policies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        text_preview TEXT,
        rule_count INT DEFAULT 0,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system'
      )
    `);
    
    // Create rules table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        policy_id VARCHAR(36),
        rule_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        department VARCHAR(50) DEFAULT 'All',
        source VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
      )
    `);
    
    // Create findings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS findings (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        rule_id VARCHAR(36),
        rule_type VARCHAR(50) NOT NULL,
        rule_description TEXT NOT NULL,
        source VARCHAR(255),
        department VARCHAR(50) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        status ENUM('pass', 'fail') NOT NULL,
        evidence TEXT,
        severity ENUM('low', 'medium', 'high'),
        recommendation JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create trust_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trust_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        overall_score INT,
        categories JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    connection.release();
    console.log('✅ MySQL database tables created successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

// CRUD Operations
async function savePolicy(policy, rules) {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO policies (name, text_preview, rule_count) VALUES (?, ?, ?)',
      [policy.name, policy.textPreview, rules.length]
    );
    
    const [policies] = await connection.query(
      'SELECT * FROM policies WHERE id = LAST_INSERT_ID()'
    );
    const policyData = policies[0];
    
    for (const rule of rules) {
      await connection.query(
        'INSERT INTO rules (policy_id, rule_type, description, department, source) VALUES (?, ?, ?, ?, ?)',
        [policyData.id, rule.ruleType, rule.description, rule.department || 'All', rule.source]
      );
    }
    
    connection.release();
    return { policy: policyData, rules };
  } catch (error) {
    console.error('Save policy error:', error);
    return null;
  }
}

async function getPolicies() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM policies ORDER BY uploaded_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('Get policies error:', error);
    return [];
  }
}

async function getAllRules() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM rules WHERE active = TRUE'
    );
    return rows;
  } catch (error) {
    console.error('Get rules error:', error);
    return [];
  }
}

async function saveFindings(findings) {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM findings');
    
    for (const f of findings) {
      await connection.query(
        `INSERT INTO findings 
         (rule_id, rule_type, rule_description, source, department, entity, status, evidence, severity, recommendation) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          f.ruleId || null,
          f.ruleType,
          f.ruleDescription,
          f.source,
          f.department,
          f.entity,
          f.status,
          f.evidence,
          f.severity,
          f.recommendation ? JSON.stringify(f.recommendation) : null
        ]
      );
    }
    
    connection.release();
    return findings;
  } catch (error) {
    console.error('Save findings error:', error);
    return null;
  }
}

async function getFindings() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM findings ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('Get findings error:', error);
    return [];
  }
}

async function saveTrustHistory(trust) {
  try {
    await pool.query(
      'INSERT INTO trust_history (overall_score, categories) VALUES (?, ?)',
      [trust.overall, JSON.stringify(trust.categories)]
    );
    return trust;
  } catch (error) {
    console.error('Save trust history error:', error);
    return null;
  }
}

async function getTrustHistory() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM trust_history ORDER BY created_at DESC LIMIT 1'
    );
    return rows;
  } catch (error) {
    console.error('Get trust history error:', error);
    return [];
  }
}

module.exports = {
  pool,
  initDatabase,
  savePolicy,
  getPolicies,
  getAllRules,
  saveFindings,
  getFindings,
  saveTrustHistory,
  getTrustHistory
};