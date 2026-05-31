import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('SEED_ADMIN_EMAIL/PASSWORD no definidos — saltando creación de admin')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
    },
  })
  console.log(`Admin user created: ${email}`)
}

/**
 * Opción A multi-instancia: registra los restaurantes + sus backends propios.
 */
async function seedBackends() {
  const INTERNAL_KEY = process.env.EZEAT_API_KEY || 'ezeat-internal-secret-2026'

  const instances = [
    {
      name: 'QueFresa',
      ezeatId: '69bb8331ce58d760c4324a9d',
      domain: 'quefresa.ezeat.com.mx',
      backend: {
        label: 'QueFresa',
        baseUrl: process.env.SEED_QUEFRESA_URL || 'https://quefresa.ezeat.com.mx',
        apiKey: INTERNAL_KEY,
        port: 3000,
      },
    },
    {
      name: "Tacos Habanna's",
      ezeatId: '6a1bc491bc163d2432e3ea1a',
      domain: 'tacoshabanas.ezeat.com.mx',
      backend: {
        label: 'Habanas',
        baseUrl: process.env.SEED_HABANAS_URL || 'https://tacoshabanas.ezeat.com.mx',
        apiKey: INTERNAL_KEY,
        port: 3002,
      },
    },
  ]

  for (const inst of instances) {
    const restaurant = await prisma.restaurant.upsert({
      where: { ezeatId: inst.ezeatId },
      update: { name: inst.name, domain: inst.domain, status: 'ACTIVE' },
      create: { name: inst.name, ezeatId: inst.ezeatId, domain: inst.domain, status: 'ACTIVE' },
    })

    await prisma.backend.upsert({
      where: { restaurantId: restaurant.id },
      update: { ...inst.backend, active: true },
      create: { restaurantId: restaurant.id, ...inst.backend, active: true },
    })

    console.log(`Backend registrado: ${inst.backend.label} → ${inst.backend.baseUrl}`)
  }
}

main()
  .then(seedBackends)
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
