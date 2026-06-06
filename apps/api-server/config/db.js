const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup to verify settings
pool.getConnection()
  .then(connection => {
    console.log('Database connection pool established successfully (Production MySQL).');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err.message);
  });

module.exports = pool;
