#!/usr/bin/env node
/**
 * create-superadmin.js
 * Run this once to create the Nextern superadmin account.
 *
 * Usage:
 *   node create-superadmin.js
 *   node create-superadmin.js --email admin@nextern.io --password MySecret123 --name "Super Admin"
 *
 * Or set env vars:
 *   SA_EMAIL=... SA_PASSWORD=... SA_NAME=... node create-superadmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const bcrypt  = require('bcryptjs')
const prisma  = require('./src/prisma/client')

// ── Config (override with CLI args or env vars) ─────────────────────────────
const args = process.argv.slice(2)
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : (process.env[flag.replace('--', 'SA_').toUpperCase()] || fallback)
}

const NAME     = getArg('--name',     process.env.SA_NAME     || 'Super Admin')
const EMAIL    = getArg('--email',    process.env.SA_EMAIL    || 'superadmin@nextern.io')
const PASSWORD = getArg('--password', process.env.SA_PASSWORD || 'Nextern@2024!')

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Nextern — Superadmin Setup\n')
  console.log(`   Name     : ${NAME}`)
  console.log(`   Email    : ${EMAIL}`)
  console.log(`   Password : ${'*'.repeat(PASSWORD.length)}\n`)

  // 1. Find or create the platform-level "system" tenant
  let systemTenant = await prisma.tenant.findFirst({
    where: { subdomain: 'system' }
  })

  if (!systemTenant) {
    console.log('ℹ️  No system tenant found. Creating one...')
    systemTenant = await prisma.tenant.create({
      data: {
        name:      'Nextern Platform',
        subdomain: 'system',
        tier:      'UNCAPPED',
        status:    'ACTIVE',
      }
    })
    console.log(`✅ System tenant created (id: ${systemTenant.id})\n`)
  } else {
    console.log(`✅ System tenant found (id: ${systemTenant.id})\n`)
  }

  // 2. Check if superadmin already exists
  const existing = await prisma.user.findFirst({
    where: { email: EMAIL, tenant_id: systemTenant.id }
  })

  if (existing) {
    console.log(`⚠️  A user with email "${EMAIL}" already exists in the system tenant.`)
    console.log('   To reset the password, update it directly in the database.')
    console.log('   Exiting.\n')
    process.exit(0)
  }

  // 3. Hash the password
  const salt         = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(PASSWORD, salt)

  // 4. Create the superadmin user
  const superadmin = await prisma.user.create({
    data: {
      name:          NAME,
      email:         EMAIL,
      password_hash: passwordHash,
      role:          'SUPERADMIN',
      domain:        'Platform',
      is_active:     true,
      tenant_id:     systemTenant.id,
    }
  })

  console.log('✅ Superadmin account created successfully!\n')
  console.log('   ─────────────────────────────────────────')
  console.log(`   ID       : ${superadmin.id}`)
  console.log(`   Name     : ${superadmin.name}`)
  console.log(`   Email    : ${superadmin.email}`)
  console.log(`   Role     : ${superadmin.role}`)
  console.log('   ─────────────────────────────────────────')
  console.log('\n🎉 You can now log in at http://localhost:5173/login')
  console.log(`   Email    : ${EMAIL}`)
  console.log(`   Password : ${PASSWORD}\n`)
}

main()
  .catch(err => {
    console.error('\n❌ Error creating superadmin:\n', err.message || err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
