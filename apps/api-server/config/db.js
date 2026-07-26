// config/db.js
// MySQL pool is no longer used — the app uses Prisma with PostgreSQL (Neon).
// This file is kept as a stub for backward compatibility with any legacy imports.

const stub = {
  query: () => Promise.resolve([[], []]),
  execute: () => Promise.resolve([[], []]),
  getConnection: () => Promise.resolve({ release: () => {} }),
};

module.exports = stub;
