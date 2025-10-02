const sql = require('mssql');
const { config } = require('./environment');

// MSSQL Database Configuration
const dbConfig = {
  server: config.database.host || 'db.jsdevdemo.com',
  port: config.database.port || 7400,
  user: config.database.username || 'sadb',
  password: config.database.password || 'jss0905!!',
  database: config.database.name || 'COF',
  options: {
    encrypt: true, // Use encryption for Azure
    trustServerCertificate: true, // Trust self-signed certificates
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create a connection pool
let pool = null;

/**
 * Get database connection pool
 */
const getPool = async () => {
  try {
    if (pool) {
      return pool;
    }

    pool = await sql.connect(dbConfig);
    console.log('✅ Database connected successfully');
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
      pool = null;
    });

    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Execute a query
 */
const query = async (queryString, params = {}) => {
  try {
    const dbPool = await getPool();
    const request = dbPool.request();

    // Add parameters to request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(queryString);
    return result;
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  }
};

/**
 * Execute a stored procedure
 */
const executeProcedure = async (procedureName, params = {}) => {
  try {
    const dbPool = await getPool();
    const request = dbPool.request();

    // Add parameters to request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error('❌ Procedure execution error:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const dbPool = await getPool();
    await dbPool.request().query('SELECT 1 as test');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Export database functions
module.exports = {
  getPool,
  query,
  executeProcedure,
  closeConnection,
  testConnection,
  sql, // Export sql types for use in other files
};
