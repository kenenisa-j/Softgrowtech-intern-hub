const prisma = require('./prisma');
const logger = require('./logger');

/**
 * Highly optimized internal helper function to check if a user has a specific permission.
 * It traverses the UserRole -> Role -> RolePermission -> Permission graph.
 * 
 * @param {string} userId - The unique ID (UUID) of the User.
 * @param {string} requiredPermission - The name of the required permission (e.g., 'task:create').
 * @returns {Promise<boolean>} Resolves to true if the permission is present, otherwise false.
 */
async function hasPermission(userId, requiredPermission) {
  if (!userId || !requiredPermission) {
    logger.warn('RBAC hasPermission checked with missing userId or requiredPermission', { userId, requiredPermission });
    return false;
  }

  try {
    // Highly optimized query checking if there exists a UserRole where the Role has a RolePermission
    // associated with the required Permission name.
    const count = await prisma.userRole.count({
      where: {
        user_id: userId,
        role: {
          permissions: {
            some: {
              permission: {
                name: requiredPermission,
              },
            },
          },
        },
      },
    });

    return count > 0;
  } catch (error) {
    logger.error('Error verifying RBAC permissions in hasPermission helper', {
      userId,
      requiredPermission,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

module.exports = {
  hasPermission,
};
