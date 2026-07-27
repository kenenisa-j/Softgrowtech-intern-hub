// Vercel serverless entry point — must export the Express app, NOT the http.Server
const app = require('../src/app');

module.exports = app;
