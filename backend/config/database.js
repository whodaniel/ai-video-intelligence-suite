import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

let dbAvailable = false;

if (!process.env.DATABASE_URL || !isValidUrl(process.env.DATABASE_URL)) {
  console.error("❌ CRITICAL: Invalid or missing DATABASE_URL. API will run in degraded mode.");
  dbAvailable = false;
} else {
  dbAvailable = true;
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = dbAvailable ? new Pool(poolConfig) : null;

if (pool) {
  pool.on('connect', () => {
    dbAvailable = true;
    console.log('✅ Database connected');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err.message);
    dbAvailable = false;
  });
}

export const isDbAvailable = () => dbAvailable;

export const query = async (text, params) => {
  if (!pool || !dbAvailable) {
    throw new Error('Database is currently unavailable. Please try again later.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 80), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === '57P03' || error.code === '08006' || error.code === '08001') {
      dbAvailable = false;
    }
    throw error;
  }
};

export const getClient = () => {
  if (!pool || !dbAvailable) {
    throw new Error('Database is currently unavailable. Please try again later.');
  }
  return pool.connect();
};

export default pool;
