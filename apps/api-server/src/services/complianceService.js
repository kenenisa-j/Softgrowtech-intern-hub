// apps/api-server/src/services/complianceService.js
// Service layer for GDPR Compliance and Retention controls (Right to be Forgotten and Data Portability).

const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

/**
 * 1. Soft-deletes tenant data by masking user accounts and resetting credit limits.
 * Runs in a transaction context.
 * 
 * @param {string} tenantId - The UUID of the organization/tenant
 * @returns {Promise<object>} Result of the soft delete operation
 */
async function softDeleteTenantData(tenantId) {
  logger.info(`Starting transaction-scoped soft deletion for tenant: ${tenantId}`);
  
  return await prisma.$transaction(async (tx) => {
    // Check if organization exists first
    const org = await tx.organization.findUnique({
      where: { id: tenantId }
    });
    if (!org) {
      throw new Error(`Organization '${tenantId}' not found for soft delete.`);
    }

    // Mask active tenant users by disabling accounts
    const userUpdate = await tx.user.updateMany({
      where: { tenant_id: tenantId },
      data: { is_active: false }
    });

    // Reset credit limit parameters to 0.00
    const creditUpdate = await tx.tenantCredits.upsert({
      where: { tenant_id: tenantId },
      update: {
        monthly_credit_limit: 0.00,
        credits_consumed: 0.00
      },
      create: {
        tenant_id: tenantId,
        monthly_credit_limit: 0.00,
        credits_consumed: 0.00
      }
    });

    logger.info(`Soft delete successfully completed for tenant: ${tenantId}`, {
      usersDisabled: userUpdate.count,
      creditsReset: true
    });

    return {
      success: true,
      tenantId,
      usersMasked: userUpdate.count,
      creditsReset: true
    };
  });
}

/**
 * 2. Unrecoverable, sequential cascade delete of all data related to a tenant.
 * Operates within a transaction to maintain integrity.
 * 
 * @param {string} tenantId - The UUID of the organization/tenant
 * @returns {Promise<object>} Result of the permanent erasure operation
 */
async function permanentErasure(tenantId) {
  logger.info(`Starting transaction-scoped permanent erasure cascade for tenant: ${tenantId}`);

  return await prisma.$transaction(async (tx) => {
    // Check if organization exists
    const org = await tx.organization.findUnique({
      where: { id: tenantId }
    });
    if (!org) {
      throw new Error(`Organization '${tenantId}' not found for permanent erasure.`);
    }

    // 1. Delete AnswerOptions (dependent on Questions -> Assessments)
    await tx.answerOption.deleteMany({
      where: {
        question: {
          assessment: {
            tenant_id: tenantId
          }
        }
      }
    });

    // 2. Delete Questions (dependent on Assessments)
    await tx.question.deleteMany({
      where: {
        assessment: {
          tenant_id: tenantId
        }
      }
    });

    // 3. Delete AssessmentAttempts
    await tx.assessmentAttempt.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 4. Delete Assessments
    await tx.assessment.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 5. Delete AttendanceRecords (dependent on Users or Sessions)
    await tx.attendanceRecord.deleteMany({
      where: {
        user: {
          tenant_id: tenantId
        }
      }
    });

    // 6. Delete AttendanceSessions
    await tx.attendanceSession.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 7. Delete NotificationPreferences (dependent on Users)
    await tx.notificationPreference.deleteMany({
      where: {
        user: {
          tenant_id: tenantId
        }
      }
    });

    // 8. Delete Notifications
    await tx.notification.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 9. Delete Invitations
    await tx.invitation.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 10. Delete UserRoles (dependent on Users or Roles)
    await tx.userRole.deleteMany({
      where: {
        user: {
          tenant_id: tenantId
        }
      }
    });

    // 11. Delete RolePermissions (dependent on Roles)
    await tx.rolePermission.deleteMany({
      where: {
        role: {
          tenant_id: tenantId
        }
      }
    });

    // 12. Delete Roles
    await tx.role.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 13. Delete Users
    await tx.user.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 14. Delete TenantFeatures
    await tx.tenantFeature.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 15. Delete AIUsageLedgers
    await tx.aIUsageLedger.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 16. Delete TenantCredits
    await tx.tenantCredits.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 17. Delete TenantSettings
    await tx.tenantSettings.deleteMany({
      where: {
        tenant_id: tenantId
      }
    });

    // 18. Delete the root Organization container itself
    await tx.organization.delete({
      where: { id: tenantId }
    });

    logger.info(`Unrecoverable permanent erasure successfully executed for tenant: ${tenantId}`);

    return {
      success: true,
      tenantId,
      message: 'All associated data models and the root organization have been permanently deleted.'
    };
  });
}

/**
 * 3. Compiles the complete configuration graph of the tenant to fulfill GDPR Data Portability.
 * 
 * @param {string} tenantId - The UUID of the organization/tenant
 * @returns {Promise<string>} Standardized JSON string of the tenant data graph
 */
async function compileComplianceExport(tenantId) {
  logger.info(`Compiling GDPR compliance export payload for tenant: ${tenantId}`);

  const tenantData = await prisma.organization.findUnique({
    where: { id: tenantId },
    include: {
      tenantSettings: true,
      tenantCredits: true,
      tenantFeatures: true,
      users: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          },
          attendanceRecords: {
            include: {
              session: true
            }
          },
          assessmentAttempts: {
            include: {
              assessment: true
            }
          },
          notificationPreferences: true
        }
      },
      roles: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      },
      invitations: {
        include: {
          role: true
        }
      },
      attendanceSessions: {
        include: {
          attendanceRecords: true
        }
      },
      assessments: {
        include: {
          questions: {
            include: {
              answerOptions: true
            }
          },
          attempts: true
        }
      },
      notifications: true,
      aiUsageLedgers: true
    }
  });

  if (!tenantData) {
    logger.warn(`GDPR compliance export failed: Tenant '${tenantId}' was not found`);
    throw new Error(`Tenant with ID '${tenantId}' not found.`);
  }

  // Format and serialize to a standardized JSON payload structure
  return JSON.stringify(tenantData, null, 2);
}

module.exports = {
  softDeleteTenantData,
  permanentErasure,
  compileComplianceExport
};
