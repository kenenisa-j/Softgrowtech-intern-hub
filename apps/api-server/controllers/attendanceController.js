// apps/api-server/controllers/attendanceController.js
// Handles daily check-in, check-out, fetching logs, and mentor approvals for attendance.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

/**
 * Daily Check-In for Interns
 */
const checkIn = async (req, res, next) => {
  try {
    const internId = req.user.id;
    const tenantId = req.tenantId;

    if (req.user.role !== 'INTERN') {
      return res.status(403).json({ message: 'Only interns can check in.' });
    }

    // Generate date component representing today at UTC midnight
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Check if check-in already exists for today
    const existingRecord = await prisma.attendance.findUnique({
      where: {
        intern_id_date: {
          intern_id: internId,
          date: todayDate,
        },
      },
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in for today.' });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        tenant_id: tenantId,
        intern_id: internId,
        date: todayDate,
        check_in: new Date(),
        status: 'PENDING',
      },
    });

    // Create notification for mentors of this domain
    const mentors = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        role: 'MENTOR',
        domain: req.user.domain,
      },
    });

    for (const mentor of mentors) {
      await prisma.notification.create({
        data: {
          tenant_id: tenantId,
          user_id: mentor.id,
          type: 'ATTENDANCE_CHECK_IN',
          content: `${req.user.name} has checked in for today and is awaiting approval.`,
        },
      });
    }

    logger.info({ msg: 'Intern checked in successfully', internId, tenantId, date: todayStr });

    return res.status(201).json({
      message: 'Check-in successful.',
      attendance,
    });
  } catch (error) {
    logger.error('Error during intern check-in', { error: error.message });
    next(error);
  }
};

/**
 * Daily Check-Out for Interns
 */
const checkOut = async (req, res, next) => {
  try {
    const internId = req.user.id;

    if (req.user.role !== 'INTERN') {
      return res.status(403).json({ message: 'Only interns can check out.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Find today's record
    const attendance = await prisma.attendance.findUnique({
      where: {
        intern_id_date: {
          intern_id: internId,
          date: todayDate,
        },
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: 'You must check in first before checking out.' });
    }

    if (attendance.check_out) {
      return res.status(400).json({ message: 'You have already checked out for today.' });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out: new Date(),
      },
    });

    logger.info({ msg: 'Intern checked out successfully', internId, date: todayStr });

    return res.json({
      message: 'Check-out successful.',
      attendance: updatedAttendance,
    });
  } catch (error) {
    logger.error('Error during intern check-out', { error: error.message });
    next(next);
  }
};

/**
 * Retrieve Scoped Attendance Logs
 */
const getAttendanceLogs = async (req, res, next) => {
  try {
    const { id: userId, role, domain } = req.user;
    const tenantId = req.tenantId;

    let whereClause = { tenant_id: tenantId };

    if (role === 'INTERN') {
      whereClause.intern_id = userId;
    } else if (role === 'MENTOR') {
      // Mentors view check-ins for interns within their domain track
      whereClause.intern = {
        domain: domain,
      };
    }

    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        intern: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true,
          },
        },
        approver: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return res.json({ logs });
  } catch (error) {
    logger.error('Error retrieving attendance logs', { error: error.message });
    next(error);
  }
};

/**
 * Approve or Reject Attendance (Mentors & Org Admins)
 */
const approveAttendance = async (req, res, next) => {
  try {
    const { id: recordId } = req.params;
    const { status } = req.body;
    const approverId = req.user.id;
    const tenantId = req.tenantId;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    if (!['MENTOR', 'ORG_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or organization admins can approve attendance.' });
    }

    // Find the record
    const record = await prisma.attendance.findFirst({
      where: {
        id: recordId,
        tenant_id: tenantId,
      },
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    const updatedRecord = await prisma.attendance.update({
      where: { id: recordId },
      data: {
        status,
        approved_by: approverId,
      },
    });

    // Notify the intern
    await prisma.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: record.intern_id,
        type: 'ATTENDANCE_VERIFICATION',
        content: `Your attendance record for ${record.date.toISOString().split('T')[0]} has been ${status.toLowerCase()}.`,
      },
    });

    logger.info({ msg: 'Attendance record status updated', recordId, status, approverId });

    return res.json({
      message: `Attendance successfully ${status.toLowerCase()}.`,
      attendance: updatedRecord,
    });
  } catch (error) {
    logger.error('Error approving attendance', { error: error.message });
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceLogs,
  approveAttendance,
};
