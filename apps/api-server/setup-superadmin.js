#!/usr/bin/env node
/**
 * setup-superadmin.js  —  Nextern Platform
 * Creates the system tenant + superadmin user.
 *
 * Usage:
 *   node setup-superadmin.js
 *   node setup-superadmin.js --email me@example.com --password MyPass123 --name "Admin"
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const bcrypt = require('bcryptjs')
const prisma  = require('./src/prisma/client')

const args = process.argv.slice(2)
const arg  = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : fallback
}

const NAME     = arg('--name',     'Super Admin')
const EMAIL    = arg('--email',    'superadmin@nextern.io')
const PASSWORD = arg('--password', 'Nextern@2024!')

async function main () {
  console.log('\n🚀  Nextern — Superadmin Setup\n')
  console.log(`   Name     : ${NAME}`)
  console.log(`   Email    : ${EMAIL}`)
  console.log(`   Password : ${'*'.repeat(PASSWORD.length)}\n`)

  // ── 1. Create / find system tenant ──────────────────────────────────────
  let systemTenant = await prisma.tenant.findFirst({
    where: { subdomain: 'system' }
  })

  if (!systemTenant) {
    console.log('ℹ️  Creating system tenant...')
    systemTenant = await prisma.tenant.create({
      data: {
        name:             'Nextern Platform',
        subdomain:        'system',
        tier:             'UNCAPPED',
        isBillingActive:  true,
        isPaymentActive:  true,
        maxInternLimit:   9999,
        is_verified:      true,
      }
    })
    console.log(`✅ System tenant created (id: ${systemTenant.id})\n`)
  } else {
    console.log(`✅ System tenant found   (id: ${systemTenant.id})\n`)
  }

  // ── 2. Check if user already exists ─────────────────────────────────────
  const existing = await prisma.user.findFirst({
    where: { email: EMAIL, tenant_id: systemTenant.id }
  })

  if (existing) {
    // Update the password instead
    console.log(`⚠️  User "${EMAIL}" already exists — resetting password...`)
    const hash = await bcrypt.hash(PASSWORD, 12)
    await prisma.user.update({
      where: { id: existing.id },
      data:  { password_hash: hash, role: 'SUPERADMIN', is_active: true }
    })
    console.log('✅ Password reset and role set to SUPERADMIN.\n')
    printSummary(existing)
    return
  }

  // ── 3. Hash password & create superadmin ────────────────────────────────
  const hash = await bcrypt.hash(PASSWORD, 12)

  const admin = await prisma.user.create({
    data: {
      name:          NAME,
      email:         EMAIL,
      password_hash: hash,
      role:          'SUPERADMIN',
      domain:        'Platform',
      is_active:     true,
      tenant_id:     systemTenant.id,
    }
  })

  console.log('✅ Superadmin account created!\n')
  printSummary(admin)
}

function printSummary (user) {
  console.log('   ─────────────────────────────────────────')
  console.log(`   Email    : ${EMAIL}`)
  console.log(`   Password : ${PASSWORD}`)
  console.log('   ─────────────────────────────────────────')
  console.log('\n🎉 Login at → http://localhost:5173/login\n')
}

main()
  .catch(err => {
    console.error('\n❌ Error:', err.message || err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
