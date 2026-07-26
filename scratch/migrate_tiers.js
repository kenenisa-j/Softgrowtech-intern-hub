// scratch/migrate_tiers.js
// Script to migrate existing organizations to the new subscription tiers.

const prisma = require('../apps/api-server/src/prisma/client');

async function migrate() {
  console.log('🚀 Starting subscription tier migration for organizations...');
  
  try {
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} organizations in database.\n`);

    for (const tenant of tenants) {
      let newTier = 'FREE';
      let maxLimit = 5;

      const oldTier = tenant.tier;
      if (oldTier === 'FREE_25') {
        newTier = 'FREE';
        maxLimit = 5;
      } else if (oldTier === 'GROWTH_50') {
        newTier = 'STANDARD';
        maxLimit = 100;
      } else if (oldTier === 'ENTERPRISE_100') {
        newTier = 'ENTERPRISE';
        maxLimit = 999999;
      } else if (oldTier === 'UNCAPPED') {
        newTier = 'ENTERPRISE';
        maxLimit = 999999;
      } else {
        // If it's already one of the new ones, skip or match
        newTier = oldTier;
        maxLimit = oldTier === 'FREE' ? 5 : (oldTier === 'STANDARD' ? 100 : 999999);
      }

      console.log(`Tenant: "${tenant.name}" (${tenant.subdomain})`);
      console.log(`  Current tier in DB: ${oldTier}`);
      console.log(`  Migrating to: ${newTier} (Max Intern Limit: ${maxLimit})`);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          tier: newTier,
          maxInternLimit: maxLimit
        }
      });
      console.log('  ✅ Updated successfully.\n');
    }

    console.log('🎉 Subscription tier migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
