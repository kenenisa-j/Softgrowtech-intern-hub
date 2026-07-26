// apps/api-server/controllers/chatController.js
// Handles message history retrieval and contact list resolution for the multi-tenant chat system.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

/**
 * Get Chat History between the logged-in user and another user
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const { otherUserId } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ message: 'otherUserId query parameter is required.' });
    }

    // Mark all unread messages from otherUserId to current user as read
    await prisma.message.updateMany({
      where: {
        tenant_id: tenantId,
        sender_id: otherUserId,
        receiver_id: userId,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    // Fetch message logs
    const messages = await prisma.message.findMany({
      where: {
        tenant_id: tenantId,
        OR: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId }
        ]
      },
      orderBy: {
        created_at: 'asc'
      },
      include: {
        sender: {
          select: { name: true, role: true }
        }
      }
    });

    return res.json({ messages });
  } catch (error) {
    logger.error('Error fetching chat history', { error: error.message });
    next(error);
  }
};

/**
 * Get List of Chat Contacts (Role-based discovery)
 */
const getChatContacts = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const tenantId = req.tenantId;

    let whereClause = {
      tenant_id: tenantId,
      id: { not: userId },
      is_active: true
    };

    // Filter contacts based on role rules:
    // - Intern: can chat with Org Admins and Mentors
    // - Mentor: can chat with Org Admins and Interns
    // - Org Admin: can chat with all Mentors and Interns
    if (role === 'INTERN') {
      whereClause.role = { in: ['ORG_ADMIN', 'MENTOR'] };
    } else if (role === 'MENTOR') {
      whereClause.role = { in: ['ORG_ADMIN', 'INTERN'] };
    } else if (role === 'ORG_ADMIN') {
      whereClause.role = { in: ['MENTOR', 'INTERN'] };
    } else {
      // Superadmins can chat with all tenant admins
      whereClause.role = 'ORG_ADMIN';
    }

    const contacts = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        domain: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({ contacts });
  } catch (error) {
    logger.error('Error fetching chat contacts', { error: error.message });
    next(error);
  }
};

module.exports = {
  getChatHistory,
  getChatContacts
};
