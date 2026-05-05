# EzEat Internal System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure internal team management system with credential vault, task manager, account management, and Ez-eat restaurant admin panel.

**Architecture:** Next.js 14 App Router fullstack on AWS EC2, PostgreSQL + Prisma for data, NextAuth.js for sessions, AES-256-GCM for credential encryption. All sensitive operations happen in Server Actions — credentials never reach the client as JSON.

**Tech Stack:** Next.js 14, TypeScript, PostgreSQL, Prisma, NextAuth.js, Zod, Tailwind CSS, shadcn/ui, Jest, @testing-library/react

---

## File Map

```
EzEatSystem/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # Root layout
│   │   ├── (auth)/login/page.tsx               # Login page
│   │   ├── (protected)/
│   │   │   ├── layout.tsx                      # Auth guard + sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── vault/page.tsx
│   │   │   ├── vault/new/page.tsx
│   │   │   ├── vault/[id]/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── tasks/new/page.tsx
│   │   │   ├── accounts/page.tsx
│   │   │   ├── restaurants/page.tsx
│   │   │   ├── restaurants/[id]/page.tsx
│   │   │   └── audit/page.tsx
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── vault/credential-card.tsx
│   │   ├── vault/credential-form.tsx
│   │   ├── vault/reveal-button.tsx
│   │   └── tasks/kanban-board.tsx
│   ├── lib/
│   │   ├── auth.ts                             # NextAuth config
│   │   ├── crypto.ts                           # AES-256-GCM
│   │   ├── db.ts                               # Prisma singleton
│   │   ├── validation.ts                       # Zod schemas
│   │   ├── rate-limit.ts                       # Login rate limiter
│   │   └── ezeat-client.ts                     # Ez-eat HTTP client
│   ├── middleware.ts                            # Route protection
│   └── actions/
│       ├── vault.ts
│       ├── tasks.ts
│       ├── accounts.ts
│       └── restaurants.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── __tests__/
│   ├── lib/crypto.test.ts
│   ├── lib/validation.test.ts
│   ├── actions/vault.test.ts
│   └── actions/tasks.test.ts
├── .env.example
├── .gitignore
├── jest.config.ts
├── next.config.ts
└── package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `jest.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /home/sebas/Ez-eat/EzEatSystem
npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-git --import-alias "@/*"
```

Expected: project files created, no errors.

- [ ] **Step 2: Install dependencies**

```bash
npm install @prisma/client @auth/prisma-adapter next-auth@beta bcryptjs zod
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select lucide-react class-variance-authority clsx tailwind-merge
npm install -D prisma @types/bcryptjs jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
```

- [ ] **Step 3: Write jest.config.ts**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}

export default createJestConfig(config)
```

- [ ] **Step 4: Write jest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Write .env.example**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ezeat_system
NEXTAUTH_URL=https://system.yourdomain.com
NEXTAUTH_SECRET=
VAULT_KEY=
EZEAT_API_URL=http://localhost:3001
EZEAT_API_KEY=
```

- [ ] **Step 6: Write .gitignore**

```
node_modules/
.next/
.env
.env.local
dist/
*.log
```

- [ ] **Step 7: Write next.config.ts**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default config
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with security headers"
```

---

## Task 2: Database Schema + Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  DEV
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum CredentialCategory {
  SERVICE
  RESTAURANT
  ACCOUNT
  OTHER
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         Role     @default(DEV)
  passwordHash String
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdCredentials Credential[] @relation("CreatedCredentials")
  sharedCredentials  Credential[] @relation("SharedCredentials")
  assignedTasks      Task[]       @relation("AssignedTasks")
  createdTasks       Task[]       @relation("CreatedTasks")
  auditLogs          AuditLog[]
}

model Credential {
  id             String             @id @default(cuid())
  name           String
  category       CredentialCategory
  encryptedValue String
  iv             String
  tag            String
  notes          String?
  userId         String
  createdBy      User               @relation("CreatedCredentials", fields: [userId], references: [id])
  sharedWith     User[]             @relation("SharedCredentials")
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model Task {
  id           String       @id @default(cuid())
  title        String
  description  String?
  status       TaskStatus   @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  assignedToId String?
  assignedTo   User?        @relation("AssignedTasks", fields: [assignedToId], references: [id])
  createdById  String
  createdBy    User         @relation("CreatedTasks", fields: [createdById], references: [id])
  dueDate      DateTime?
  tags         String[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Restaurant {
  id        String   @id @default(cuid())
  name      String
  ezeatId   String   @unique
  status    String   @default("unknown")
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  action       String
  resourceType String
  resourceId   String
  ip           String
  timestamp    DateTime @default(now())
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration applied, Prisma client generated.

- [ ] **Step 4: Write prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 12)
  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL! },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL!,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
    },
  })
  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Add to package.json scripts:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

Add to .env.example:
```
SEED_ADMIN_EMAIL=admin@ezeat.com
SEED_ADMIN_PASSWORD=
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema and seed"
```

---

## Task 3: Crypto Module

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `__tests__/lib/crypto.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/lib/crypto.test.ts
import { encrypt, decrypt } from '@/lib/crypto'

const VAULT_KEY = '0'.repeat(64) // 32 bytes hex

describe('crypto', () => {
  it('encrypts and decrypts correctly', () => {
    const plaintext = 'super-secret-password-123'
    const encrypted = encrypt(plaintext, VAULT_KEY)
    expect(encrypted.encryptedValue).toBeDefined()
    expect(encrypted.iv).toBeDefined()
    expect(encrypted.tag).toBeDefined()
    expect(encrypted.encryptedValue).not.toBe(plaintext)
    const decrypted = decrypt(encrypted, VAULT_KEY)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext for same plaintext (unique IV)', () => {
    const plaintext = 'same-text'
    const a = encrypt(plaintext, VAULT_KEY)
    const b = encrypt(plaintext, VAULT_KEY)
    expect(a.iv).not.toBe(b.iv)
    expect(a.encryptedValue).not.toBe(b.encryptedValue)
  })

  it('throws on tampered ciphertext', () => {
    const plaintext = 'data'
    const encrypted = encrypt(plaintext, VAULT_KEY)
    const tampered = { ...encrypted, encryptedValue: 'AAAAAA' + encrypted.encryptedValue }
    expect(() => decrypt(tampered, VAULT_KEY)).toThrow()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/lib/crypto.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/crypto'"

- [ ] **Step 3: Implement src/lib/crypto.ts**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

interface Encrypted {
  encryptedValue: string
  iv: string
  tag: string
}

export function encrypt(plaintext: string, vaultKeyHex: string): Encrypted {
  const key = Buffer.from(vaultKeyHex, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encryptedValue: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decrypt(data: Encrypted, vaultKeyHex: string): string {
  const key = Buffer.from(vaultKeyHex, 'hex')
  const iv = Buffer.from(data.iv, 'base64')
  const tag = Buffer.from(data.tag, 'base64')
  const ciphertext = Buffer.from(data.encryptedValue, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest __tests__/lib/crypto.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/crypto.ts __tests__/lib/crypto.test.ts
git commit -m "feat: add AES-256-GCM crypto module"
```

---

## Task 4: Validation Schemas

**Files:**
- Create: `src/lib/validation.ts`
- Create: `__tests__/lib/validation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/validation.test.ts
import {
  loginSchema,
  createCredentialSchema,
  createTaskSchema,
  createUserSchema,
} from '@/lib/validation'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'pass' })).not.toThrow()
  })
  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-email', password: 'pass' })).toThrow()
  })
})

describe('createCredentialSchema', () => {
  it('accepts valid credential', () => {
    const data = { name: 'Stripe Key', value: 'sk_live_xyz', category: 'SERVICE', sharedWith: [] }
    expect(() => createCredentialSchema.parse(data)).not.toThrow()
  })
  it('rejects empty name', () => {
    const data = { name: '', value: 'sk_live_xyz', category: 'SERVICE', sharedWith: [] }
    expect(() => createCredentialSchema.parse(data)).toThrow()
  })
  it('rejects invalid category', () => {
    const data = { name: 'Test', value: 'val', category: 'INVALID', sharedWith: [] }
    expect(() => createCredentialSchema.parse(data)).toThrow()
  })
})

describe('createTaskSchema', () => {
  it('accepts valid task', () => {
    const data = { title: 'Fix bug', priority: 'HIGH', status: 'TODO' }
    expect(() => createTaskSchema.parse(data)).not.toThrow()
  })
  it('rejects empty title', () => {
    expect(() => createTaskSchema.parse({ title: '', priority: 'HIGH', status: 'TODO' })).toThrow()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest __tests__/lib/validation.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement src/lib/validation.ts**

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const createCredentialSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  value: z.string().min(1).max(5000),
  category: z.enum(['SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']),
  sharedWith: z.array(z.string()).max(20).default([]),
  notes: z.string().max(500).optional(),
})

export const updateCredentialSchema = createCredentialSchema.partial().extend({
  sharedWith: z.array(z.string()).max(20).optional(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).trim(),
  role: z.enum(['ADMIN', 'DEV']).default('DEV'),
  password: z.string().min(8).max(100),
})

export const sanitizeText = (text: string): string =>
  text.replace(/<[^>]*>/g, '').trim()
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest __tests__/lib/validation.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts __tests__/lib/validation.test.ts
git commit -m "feat: add Zod validation schemas"
```

---

## Task 5: Prisma Client + Rate Limiter

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Write src/lib/db.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Write src/lib/rate-limit.ts**

```typescript
const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count }
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts src/lib/rate-limit.ts
git commit -m "feat: add Prisma client and rate limiter"
```

---

## Task 6: NextAuth Configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Write src/lib/auth.ts**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
        const rateLimitKey = `login:${ip}`
        const { allowed } = checkRateLimit(rateLimitKey)
        if (!allowed) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, active: true },
        })

        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        resetRateLimit(rateLimitKey)
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
})
```

- [ ] **Step 2: Write src/app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/
git commit -m "feat: configure NextAuth with credentials + rate limiting"
```

---

## Task 7: Middleware (Route Protection)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write src/middleware.ts**

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ADMIN_ONLY = ['/accounts', '/audit']
const PUBLIC = ['/login']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    if (session) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = (session.user as any)?.role
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add route protection middleware with role checks"
```

---

## Task 8: Layout + Sidebar

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/header.tsx`

- [ ] **Step 1: Write src/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EzEat System',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Write src/components/sidebar.tsx**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, CheckSquare, Users, Store, ScrollText } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/vault', label: 'Vault', icon: KeyRound, adminOnly: false },
  { href: '/tasks', label: 'Tareas', icon: CheckSquare, adminOnly: false },
  { href: '/restaurants', label: 'Restaurantes', icon: Store, adminOnly: false },
  { href: '/accounts', label: 'Cuentas', icon: Users, adminOnly: true },
  { href: '/audit', label: 'Auditoría', icon: ScrollText, adminOnly: true },
]

interface SidebarProps { role: string }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = navItems.filter((i) => !i.adminOnly || role === 'ADMIN')

  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="font-bold text-lg">EzEat System</span>
      </div>
      <nav className="flex-1 py-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Write src/components/header.tsx**

```tsx
import { auth, signOut } from '@/lib/auth'
import { LogOut } from 'lucide-react'

export async function Header() {
  const session = await auth()
  const user = session?.user as any

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {user?.role}
        </span>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
          <button type="submit" className="p-1.5 text-gray-400 hover:text-gray-700">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Write src/app/(protected)/layout.tsx**

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  const role = (session.user as any)?.role ?? 'DEV'

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/(protected)/layout.tsx src/components/
git commit -m "feat: add app layout, sidebar, and header"
```

---

## Task 9: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Write src/app/(auth)/login/page.tsx**

```tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Credenciales incorrectas')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">EzEat System</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/
git commit -m "feat: add login page"
```

---

## Task 10: Vault — Server Actions

**Files:**
- Create: `src/actions/vault.ts`
- Create: `__tests__/actions/vault.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/actions/vault.test.ts
import { encrypt, decrypt } from '@/lib/crypto'

const VAULT_KEY = '0'.repeat(64)

describe('vault crypto round-trip', () => {
  it('stores and retrieves credential value', () => {
    const value = 'sk_live_stripe_key_123456'
    const encrypted = encrypt(value, VAULT_KEY)
    const decrypted = decrypt(encrypted, VAULT_KEY)
    expect(decrypted).toBe(value)
  })

  it('handles special characters', () => {
    const value = 'p@$$w0rd!#%^&*()'
    const encrypted = encrypt(value, VAULT_KEY)
    expect(decrypt(encrypted, VAULT_KEY)).toBe(value)
  })
})
```

- [ ] **Step 2: Run — expect PASS (reuses crypto)**

```bash
npx jest __tests__/actions/vault.test.ts
```

Expected: PASS

- [ ] **Step 3: Write src/actions/vault.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { createCredentialSchema, updateCredentialSchema, sanitizeText } from '@/lib/validation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getVaultKey(): string {
  const key = process.env.VAULT_KEY
  if (!key || key.length !== 64) throw new Error('VAULT_KEY missing or invalid')
  return key
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

async function writeAuditLog(userId: string, action: string, resourceType: string, resourceId: string) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  await prisma.auditLog.create({ data: { userId, action, resourceType, resourceId, ip } })
}

export async function listCredentials() {
  const user = await requireSession()
  if (user.role === 'ADMIN') {
    return prisma.credential.findMany({
      select: { id: true, name: true, category: true, createdAt: true, updatedAt: true, userId: true },
      orderBy: { updatedAt: 'desc' },
    })
  }
  return prisma.credential.findMany({
    where: { sharedWith: { some: { id: user.id } } },
    select: { id: true, name: true, category: true, createdAt: true, updatedAt: true, userId: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createCredential(formData: FormData) {
  const user = await requireSession()
  const raw = {
    name: formData.get('name') as string,
    value: formData.get('value') as string,
    category: formData.get('category') as string,
    notes: formData.get('notes') as string | undefined,
    sharedWith: [],
  }
  const parsed = createCredentialSchema.parse({
    ...raw,
    name: sanitizeText(raw.name),
    notes: raw.notes ? sanitizeText(raw.notes) : undefined,
  })
  const encrypted = encrypt(parsed.value, getVaultKey())
  const credential = await prisma.credential.create({
    data: {
      name: parsed.name,
      category: parsed.category,
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      tag: encrypted.tag,
      userId: user.id,
      notes: parsed.notes,
    } as any,
  })
  await writeAuditLog(user.id, 'CREATE_CREDENTIAL', 'Credential', credential.id)
  revalidatePath('/vault')
}

export async function revealCredential(id: string): Promise<string> {
  const user = await requireSession()
  const credential = await prisma.credential.findUnique({
    where: { id },
    include: { sharedWith: { select: { id: true } } },
  })
  if (!credential) throw new Error('Not found')
  if (user.role !== 'ADMIN' && !credential.sharedWith.some((u) => u.id === user.id)) {
    throw new Error('Forbidden')
  }
  await writeAuditLog(user.id, 'REVEAL_CREDENTIAL', 'Credential', id)
  return decrypt(
    { encryptedValue: credential.encryptedValue, iv: credential.iv, tag: credential.tag },
    getVaultKey(),
  )
}

export async function deleteCredential(id: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await prisma.credential.delete({ where: { id } })
  await writeAuditLog(user.id, 'DELETE_CREDENTIAL', 'Credential', id)
  revalidatePath('/vault')
}

export async function shareCredential(credentialId: string, userId: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await prisma.credential.update({
    where: { id: credentialId },
    data: { sharedWith: { connect: { id: userId } } },
  })
  await writeAuditLog(user.id, 'SHARE_CREDENTIAL', 'Credential', credentialId)
  revalidatePath(`/vault/${credentialId}`)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/actions/vault.ts __tests__/actions/vault.test.ts
git commit -m "feat: add vault server actions with AES-256-GCM and audit logging"
```

---

## Task 11: Vault — UI Pages

**Files:**
- Create: `src/app/(protected)/vault/page.tsx`
- Create: `src/app/(protected)/vault/new/page.tsx`
- Create: `src/app/(protected)/vault/[id]/page.tsx`
- Create: `src/components/vault/credential-card.tsx`
- Create: `src/components/vault/reveal-button.tsx`

- [ ] **Step 1: Write src/components/vault/reveal-button.tsx**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { revealCredential } from '@/actions/vault'
import { Eye, EyeOff, Copy } from 'lucide-react'

export function RevealButton({ credentialId }: { credentialId: string }) {
  const [value, setValue] = useState<string | null>(null)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const [isPending, startTransition] = useTransition()

  function hide() {
    setValue(null)
    if (timer) clearTimeout(timer)
  }

  function reveal() {
    startTransition(async () => {
      const v = await revealCredential(credentialId)
      setValue(v)
      const t = setTimeout(hide, 30_000)
      setTimer(t)
    })
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono break-all">{value}</code>
        <button onClick={() => navigator.clipboard.writeText(value)} title="Copiar">
          <Copy size={14} className="text-gray-500 hover:text-gray-700" />
        </button>
        <button onClick={hide} title="Ocultar">
          <EyeOff size={14} className="text-gray-500 hover:text-gray-700" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={reveal}
      disabled={isPending}
      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
    >
      <Eye size={14} />
      {isPending ? 'Cargando...' : 'Revelar'}
    </button>
  )
}
```

- [ ] **Step 2: Write src/components/vault/credential-card.tsx**

```tsx
import { RevealButton } from './reveal-button'

interface CredentialCardProps {
  id: string
  name: string
  category: string
  updatedAt: Date
}

const CATEGORY_COLORS: Record<string, string> = {
  SERVICE: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-green-100 text-green-700',
  ACCOUNT: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export function CredentialCard({ id, name, category, updatedAt }: CredentialCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Actualizado {new Date(updatedAt).toLocaleDateString('es-MX')}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category]}`}>
          {category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-400">••••••••••••</span>
        <RevealButton credentialId={id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write src/app/(protected)/vault/page.tsx**

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listCredentials } from '@/actions/vault'
import { CredentialCard } from '@/components/vault/credential-card'

export default async function VaultPage() {
  const credentials = await listCredentials()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vault de Credenciales</h1>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} />
          Nueva credencial
        </Link>
      </div>
      {credentials.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay credenciales.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((c) => (
            <CredentialCard key={c.id} id={c.id} name={c.name} category={c.category} updatedAt={c.updatedAt} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write src/app/(protected)/vault/new/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createCredential } from '@/actions/vault'

export default function NewCredentialPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    await createCredential(formData)
    redirect('/vault')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Credencial</h1>
      <form action={handleCreate} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input name="name" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor / Contraseña</label>
          <textarea name="value" required rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select name="category" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="SERVICE">Servicio (Stripe, AWS, etc.)</option>
            <option value="RESTAURANT">Restaurante</option>
            <option value="ACCOUNT">Cuenta</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea name="notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          Guardar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/vault/ src/components/vault/
git commit -m "feat: add vault UI pages and reveal button"
```

---

## Task 12: Tasks — Server Actions + Kanban UI

**Files:**
- Create: `src/actions/tasks.ts`
- Create: `src/app/(protected)/tasks/page.tsx`
- Create: `src/app/(protected)/tasks/new/page.tsx`
- Create: `src/components/tasks/kanban-board.tsx`

- [ ] **Step 1: Write src/actions/tasks.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTaskSchema, updateTaskSchema, sanitizeText } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

export async function listTasks() {
  await requireSession()
  return prisma.task.findMany({
    include: { assignedTo: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createTask(formData: FormData) {
  const user = await requireSession()
  const parsed = createTaskSchema.parse({
    title: sanitizeText(formData.get('title') as string),
    description: formData.get('description') ? sanitizeText(formData.get('description') as string) : undefined,
    priority: formData.get('priority') || 'MEDIUM',
    status: 'TODO',
    assignedToId: formData.get('assignedToId') || undefined,
    tags: [],
  })
  await prisma.task.create({ data: { ...parsed, createdById: user.id } })
  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, status: string) {
  await requireSession()
  const parsed = updateTaskSchema.parse({ status })
  await prisma.task.update({ where: { id: taskId }, data: parsed })
  revalidatePath('/tasks')
}

export async function deleteTask(taskId: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/tasks')
}
```

- [ ] **Step 2: Write src/components/tasks/kanban-board.tsx**

```tsx
'use client'
import { updateTaskStatus } from '@/actions/tasks'
import { useTransition } from 'react'

const COLUMNS = [
  { id: 'TODO', label: 'Por hacer', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'En progreso', color: 'bg-blue-50' },
  { id: 'BLOCKED', label: 'Bloqueado', color: 'bg-red-50' },
  { id: 'DONE', label: 'Hecho', color: 'bg-green-50' },
]

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
}

interface Task {
  id: string; title: string; priority: string; status: string
  assignedTo: { name: string } | null; dueDate: Date | null
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()

  function moveTask(taskId: string, status: string) {
    startTransition(() => updateTaskStatus(taskId, status))
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {COLUMNS.map((col) => (
        <div key={col.id} className={`${col.color} rounded-lg p-3`}>
          <h3 className="font-medium text-sm text-gray-700 mb-3">
            {col.label}
            <span className="ml-1 text-xs text-gray-400">
              ({tasks.filter((t) => t.status === col.id).length})
            </span>
          </h3>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === col.id)
              .map((task) => (
                <div key={task.id} className="bg-white rounded border p-3 text-sm shadow-sm">
                  <p className="font-medium text-gray-900 mb-2">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.assignedTo && (
                      <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => moveTask(task.id, c.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write src/app/(protected)/tasks/page.tsx**

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listTasks } from '@/actions/tasks'
import { KanbanBoard } from '@/components/tasks/kanban-board'

export default async function TasksPage() {
  const tasks = await listTasks()
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tareas</h1>
        <Link href="/tasks/new" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          <Plus size={16} /> Nueva tarea
        </Link>
      </div>
      <KanbanBoard tasks={tasks as any} />
    </div>
  )
}
```

- [ ] **Step 4: Write src/app/(protected)/tasks/new/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createTask } from '@/actions/tasks'
import { prisma } from '@/lib/db'

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } })

  async function handleCreate(formData: FormData) {
    'use server'
    await createTask(formData)
    redirect('/tasks')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Tarea</h1>
      <form action={handleCreate} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input name="title" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select name="priority" className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
          <select name="assignedToId" className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Sin asignar</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          Crear tarea
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/tasks.ts src/app/(protected)/tasks/ src/components/tasks/
git commit -m "feat: add task manager with kanban board"
```

---

## Task 13: Accounts Management

**Files:**
- Create: `src/actions/accounts.ts`
- Create: `src/app/(protected)/accounts/page.tsx`

- [ ] **Step 1: Write src/actions/accounts.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createUserSchema, sanitizeText } from '@/lib/validation'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')
  return user
}

export async function listUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createUser(formData: FormData) {
  await requireAdmin()
  const parsed = createUserSchema.parse({
    email: formData.get('email') as string,
    name: sanitizeText(formData.get('name') as string),
    role: formData.get('role') as string,
    password: formData.get('password') as string,
  })
  const passwordHash = await bcrypt.hash(parsed.password, 12)
  await prisma.user.create({ data: { email: parsed.email, name: parsed.name, role: parsed.role, passwordHash } })
  revalidatePath('/accounts')
}

export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/accounts')
}
```

- [ ] **Step 2: Write src/app/(protected)/accounts/page.tsx**

```tsx
import { listUsers, toggleUserActive, createUser } from '@/actions/accounts'

export default async function AccountsPage() {
  const users = await listUsers()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Cuentas del Equipo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Agregar miembro</h2>
          <form action={createUser} className="space-y-3">
            <input name="name" placeholder="Nombre" required className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input name="password" type="password" placeholder="Contraseña (mín. 8 chars)" required minLength={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <select name="role" className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="DEV">Dev</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium">Crear</button>
          </form>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Miembros</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
                </div>
                <form action={async () => { 'use server'; await toggleUserActive(user.id) }}>
                  <button type="submit" className={`text-xs px-2 py-1 rounded font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/actions/accounts.ts src/app/(protected)/accounts/
git commit -m "feat: add accounts management (Admin only)"
```

---

## Task 14: Ez-eat Client + Restaurants

**Files:**
- Create: `src/lib/ezeat-client.ts`
- Create: `src/actions/restaurants.ts`
- Create: `src/app/(protected)/restaurants/page.tsx`
- Create: `src/app/(protected)/restaurants/[id]/page.tsx`

- [ ] **Step 1: Write src/lib/ezeat-client.ts**

```typescript
const BASE_URL = process.env.EZEAT_API_URL
const API_KEY = process.env.EZEAT_API_KEY

interface EzEatRestaurant {
  id: string; name: string; status: string; plan: string; createdAt: string
}

async function fetchEzEat<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL || !API_KEY) throw new Error('Ez-eat API not configured')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json', ...options?.headers },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Ez-eat API error: ${res.status}`)
  return res.json()
}

export async function getRestaurants(): Promise<EzEatRestaurant[]> {
  return fetchEzEat<EzEatRestaurant[]>('/internal/restaurants')
}

export async function getRestaurant(id: string): Promise<EzEatRestaurant> {
  return fetchEzEat<EzEatRestaurant>(`/internal/restaurants/${id}`)
}

export async function updateRestaurantStatus(id: string, status: string): Promise<void> {
  await fetchEzEat(`/internal/restaurants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    next: { revalidate: 0 },
  })
}
```

- [ ] **Step 2: Write src/actions/restaurants.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRestaurants, updateRestaurantStatus } from '@/lib/ezeat-client'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

export async function listRestaurants() {
  await requireSession()
  try {
    const restaurants = await getRestaurants()
    for (const r of restaurants) {
      await prisma.restaurant.upsert({
        where: { ezeatId: r.id },
        update: { name: r.name, status: r.status },
        create: { ezeatId: r.id, name: r.name, status: r.status },
      })
    }
    return restaurants
  } catch {
    return prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  }
}

export async function patchRestaurantStatus(ezeatId: string, status: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await updateRestaurantStatus(ezeatId, status)
  await prisma.restaurant.update({ where: { ezeatId }, data: { status } })
  revalidatePath('/restaurants')
}
```

- [ ] **Step 3: Write src/app/(protected)/restaurants/page.tsx**

```tsx
import { listRestaurants } from '@/actions/restaurants'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  unknown: 'bg-yellow-100 text-yellow-700',
}

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Restaurantes Ez-eat</h1>
      <div className="bg-white border rounded-lg divide-y">
        {(restaurants as any[]).map((r) => (
          <Link key={r.id ?? r.ezeatId} href={`/restaurants/${r.id ?? r.ezeatId}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <span className="font-medium text-sm text-gray-900">{r.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? STATUS_COLOR.unknown}`}>
              {r.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write src/app/(protected)/restaurants/[id]/page.tsx**

```tsx
import { patchRestaurantStatus } from '@/actions/restaurants'
import { getRestaurant } from '@/lib/ezeat-client'
import { auth } from '@/lib/auth'

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const restaurant = await getRestaurant(params.id).catch(() => null)

  if (!restaurant) return <p className="text-gray-500">Restaurante no encontrado o Ez-eat no disponible.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
      <p className="text-sm text-gray-500 mb-6">ID: {restaurant.id}</p>
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-700">Estado actual: </span>
          <span className="text-sm text-gray-900">{restaurant.status}</span>
        </div>
        {role === 'ADMIN' && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Cambiar estado:</p>
            <div className="flex flex-wrap gap-2">
              {['active', 'inactive', 'suspended'].map((s) => (
                <form key={s} action={async () => { 'use server'; await patchRestaurantStatus(restaurant.id, s) }}>
                  <button type="submit" className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    {s}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/ezeat-client.ts src/actions/restaurants.ts src/app/(protected)/restaurants/
git commit -m "feat: add Ez-eat restaurant integration with fallback cache"
```

---

## Task 15: Dashboard + Audit Log

**Files:**
- Create: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/(protected)/audit/page.tsx`

- [ ] **Step 1: Write src/app/(protected)/dashboard/page.tsx**

```tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as any

  const [pendingTasks, myTasks, recentAudit] = await Promise.all([
    prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } } }),
    prisma.task.count({ where: { assignedToId: user?.id, status: { not: 'DONE' } } }),
    user?.role === 'ADMIN'
      ? prisma.auditLog.findMany({
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Tareas pendientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
          <Link href="/tasks" className="text-xs text-blue-600 mt-2 block hover:underline">Ver tareas →</Link>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Mis tareas activas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{myTasks}</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Acceso rápido</p>
          <div className="mt-2 space-y-1">
            <Link href="/vault/new" className="text-xs text-blue-600 block hover:underline">+ Nueva credencial</Link>
            <Link href="/tasks/new" className="text-xs text-blue-600 block hover:underline">+ Nueva tarea</Link>
          </div>
        </div>
      </div>
      {recentAudit.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Actividad reciente en Vault</h2>
          <div className="bg-white border rounded-lg divide-y">
            {recentAudit.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">{log.user.name} — {log.action}</span>
                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('es-MX')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write src/app/(protected)/audit/page.tsx**

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function AuditPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Log de Auditoría</h1>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Recurso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{log.user.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{log.resourceType}:{log.resourceId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{log.ip}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/dashboard/ src/app/(protected)/audit/
git commit -m "feat: add dashboard and audit log"
```

---

## Task 16: Run All Tests + Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx jest --coverage
```

Expected: All tests pass. Coverage report generated.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Add to Ez-eat API — internal endpoints**

In `/home/sebas/Ez-eat_QueFresa/src/app.js` (or routes), add:

```javascript
// Internal API middleware — only accepts requests with valid INTERNAL_API_KEY
router.use('/internal', (req, res, next) => {
  const key = req.headers['x-api-key']
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

router.get('/internal/restaurants', async (req, res) => {
  const restaurants = await Restaurant.find({}, 'name status plan createdAt')
  res.json(restaurants)
})

router.patch('/internal/restaurants/:id', async (req, res) => {
  const { status } = req.body
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!restaurant) return res.status(404).json({ error: 'Not found' })
  res.json(restaurant)
})
```

Add to Ez-eat .env:
```
INTERNAL_API_KEY=<same value as EZEAT_API_KEY in EzEatSystem>
```

- [ ] **Step 4: Generate VAULT_KEY**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output → put in EzEatSystem `.env` as `VAULT_KEY`.

- [ ] **Step 5: Seed admin user**

```bash
SEED_ADMIN_EMAIL=admin@ezeat.com SEED_ADMIN_PASSWORD=<strong-password> npx prisma db seed
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete EzEat internal system MVP"
```

---

## Deploy Checklist (AWS EC2)

```bash
# On EC2
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart ezeat-system || pm2 start npm --name "ezeat-system" -- start

# Nginx config (add to sites-available)
server {
    listen 443 ssl;
    server_name system.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
    }
}
```
