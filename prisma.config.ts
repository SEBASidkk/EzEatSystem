import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

config({ path: '.env' })

const databaseUrl = process.env['DATABASE_URL']
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: { url: databaseUrl },
})
