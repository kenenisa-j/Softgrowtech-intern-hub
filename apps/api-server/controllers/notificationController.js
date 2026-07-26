// apps/api-server/controllers/notificationController.js
// Handles retrieval and read-status updates for the user notification center.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

/**
 * Retrieve current user notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenantId;

    const notifications = await prisma.notification.findMany({
      where: {
        tenant_id: tenantId,
        user_id: userId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ notifications });
  } catch (error) {
    logger.error('Error fetching notifications', { error: error.message });
    next(error);
  }
};

/**
 * Mark a single notification or all notifications as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const { id } = req.body;

    if (id) {
      // Mark a single notification as read
      const notification = await prisma.notification.findFirst({
        where: { id, user_id: userId, tenant_id: tenantId }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found.' });
      }

      await prisma.notification.update({
        where: { id },
        data: { is_read: true }
      });
    } else {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: { user_id: userId, tenant_id: tenantId, is_read: false },
        data: { is_read: true }
      });
    }

    return res.json({ message: 'Notifications updated successfully.' });
  } catch (error) {
    logger.error('Error updating notification read status', { error: error.message });
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
