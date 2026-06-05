const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_NAME || 'intern_management',
  port: parseInt(process.env.DB_PORT, 10) || 8889,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on file import (will log to console when server starts)
pool.getConnection()
  .then(connection => {
    console.log('Database connection pool established successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

module.exports = pool;
