require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');
    console.log('Server time:', result.rows[0]);
  } catch (err) {
    console.error('❌ Database connection failed');
    console.error(err);
  } finally {
    await pool.end();
  }
}

testConnection();