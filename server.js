const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database pool to trigger database connection test
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);

// Root endpoint status check
app.get('/', (req, res) => {
  res.json({ message: 'Internship Management System API is running successfully.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error details:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
