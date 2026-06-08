// src/controllers/exportController.js
// Exports cohort reports as streaming Excel files using exceljs.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const Excel = require('exceljs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

/**
 * Export cohort report for a given organization (tenant).
 * Expected query parameters:
 *   - tenantId: string (provided by tenantResolver middleware as req.tenantId)
 *   - format: optional, default "xlsx"
 */
async function exportCohortReport(req, res) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant identifier' });
    }

    // Streamed workbook with low memory footprint
    const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet('Cohort Report');

    // Define columns (customize as needed)
    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 36 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Joined At', key: 'joinedAt', width: 20 },
      { header: 'Last Active', key: 'lastActive', width: 20 }
    ];

    // Query users with their roles in a streaming fashion
    const usersCursor = prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: { roles: { include: { role: true } } },
      // Use cursor based pagination to avoid loading all rows at once
      // We'll fetch in batches of 1000 rows.
    });

    // Since Prisma does not currently support true streaming, we fetch in chunks.
    const BATCH_SIZE = 1000;
    let skip = 0;
    while (true) {
      const batch = await prisma.user.findMany({
        where: { tenant_id: tenantId },
        include: { roles: { include: { role: true } } },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' }
      });
      if (batch.length === 0) break;

      for (const user of batch) {
        const roleNames = user.roles.map(r => r.role.name).join(', ');
        worksheet.addRow({
          userId: user.id,
          email: user.email,
          role: roleNames,
          joinedAt: user.createdAt,
          lastActive: user.updatedAt || ''
        }).commit();
      }
      skip += batch.length;
    }

    await workbook.commit();
    logger.info('Cohort report exported', { tenantId });
  } catch (err) {
    logger.error('Error exporting cohort report', { error: err.message, stack: err.stack });
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { exportCohortReport };
