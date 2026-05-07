# EzEat System — Implementación Completa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer funcionales todas las características del sistema administrativo Ez-eat, traducir a español y agregar soporte responsive (desktop + tablet).

**Architecture:** Next.js 14 App Router con server actions, Prisma/PostgreSQL, NextAuth v5 JWT. Se agrega: asociación credencial→restaurante, TOTP 2FA por usuario, SystemSettings para idle timeout, edición de tareas/usuarios, notificaciones desde audit log, export CSV del dashboard.

**Tech Stack:** Next.js 14, Prisma 7, NextAuth 5 beta, otplib, qrcode, Tailwind CSS, TypeScript

---

## Archivos a crear/modificar

**Crear:**
- `src/lib/totp.ts` — utilidades TOTP (generate secret, verify, QR URI)
- `src/actions/notifications.ts` — últimas entradas de audit como notificaciones
- `src/components/header-notifications.tsx` — dropdown de notificaciones (client)
- `src/app/(protected)/settings/page.tsx` — página de configuración de usuario

**Modificar:**
- `prisma/schema.prisma` — añadir restaurantId a Credential, 2FA fields a User, modelo SystemSettings
- `src/lib/validation.ts` — nuevos schemas: updateUserSchema, systemSettingSchema
- `src/lib/auth.ts` — verificar TOTP en authorize si twoFactorEnabled
- `src/lib/auth.config.ts` — propagar twoFactorEnabled al token JWT
- `src/app/(auth)/login/page.tsx` — campo TOTP opcional
- `src/actions/vault.ts` — aceptar/retornar restaurantId en credenciales
- `src/actions/accounts.ts` — añadir updateUser, 2FA actions, SystemSettings actions
- `src/actions/tasks.ts` — añadir updateTask
- `src/actions/restaurants.ts` — añadir updateRestaurant
- `src/components/vault/vault-list.tsx` — columna + filtro de restaurante, español
- `src/app/(protected)/vault/new/page.tsx` — selector de restaurante
- `src/components/accounts/account-list.tsx` — modal editar usuario, toggle 2FA funcional, guardar idle timeout, español
- `src/components/tasks/kanban-board.tsx` — modal editar tarea, español
- `src/components/header.tsx` — NotificationBell, botón lock funcional, botón settings, español
- `src/app/(protected)/restaurants/[id]/page.tsx` — formulario de edición completo
- `src/app/(protected)/dashboard/page.tsx` — export CSV funcional, español
- `src/components/sidebar.tsx` — colapsable en tablet, español
- `src/app/(protected)/layout.tsx` — responsive sidebar toggle

---

## Task 1: Schema Prisma + Migración

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Actualizar schema.prisma**

```prisma
// En model User, añadir después de `active Boolean @default(true)`:
twoFactorEnabled Boolean @default(false)
twoFactorSecret  String?

// En model Credential, añadir después de `notes String?`:
restaurantId String?
restaurant   Restaurant? @relation(fields: [restaurantId], references: [id])

// En model Restaurant, añadir relación inversa después de `updatedAt`:
credentials  Credential[]

// Añadir nuevo modelo al final:
model SystemSettings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

El schema completo de `model Credential` queda:
```prisma
model Credential {
  id             String             @id @default(cuid())
  name           String
  category       CredentialCategory
  encryptedValue String
  iv             String
  tag            String
  notes          String?
  restaurantId   String?
  restaurant     Restaurant?        @relation(fields: [restaurantId], references: [id])
  userId         String
  createdBy      User               @relation("CreatedCredentials", fields: [userId], references: [id])
  sharedWith     User[]             @relation("SharedCredentials")
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([userId])
  @@index([category])
  @@index([restaurantId])
}
```

El schema completo de `model User` queda:
```prisma
model User {
  id                 String       @id @default(cuid())
  email              String       @unique
  name               String
  role               Role         @default(DEV)
  passwordHash       String
  active             Boolean      @default(true)
  twoFactorEnabled   Boolean      @default(false)
  twoFactorSecret    String?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  createdCredentials Credential[] @relation("CreatedCredentials")
  sharedCredentials  Credential[] @relation("SharedCredentials")
  assignedTasks      Task[]       @relation("AssignedTasks")
  createdTasks       Task[]       @relation("CreatedTasks")
  auditLogs          AuditLog[]
}
```

- [ ] **Step 2: Correr migración**

```bash
cd /home/sebas/Ez-eat/EzEatSystem
npx prisma migrate dev --name add_2fa_restaurant_settings
```

Esperado: `The following migration(s) have been applied` sin errores.

- [ ] **Step 3: Generar cliente**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add 2FA fields, credential-restaurant link, SystemSettings model"
```

---

## Task 2: Instalar paquetes + lib/totp.ts

**Files:**
- Create: `src/lib/totp.ts`

- [ ] **Step 1: Instalar dependencias**

```bash
cd /home/sebas/Ez-eat/EzEatSystem
npm install otplib qrcode
npm install --save-dev @types/qrcode
```

- [ ] **Step 2: Crear src/lib/totp.ts**

```typescript
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function generateTotpUri(secret: string, email: string): string {
  return authenticator.keyuri(email, 'Ez-eat Admin', secret)
}

export async function generateQrDataUrl(otpUri: string): Promise<string> {
  return QRCode.toDataURL(otpUri)
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/totp.ts package.json package-lock.json
git commit -m "feat: add TOTP utilities and qrcode dependencies"
```

---

## Task 3: Actualizar validation.ts

**Files:**
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Añadir schemas nuevos**

Reemplazar el contenido completo de `src/lib/validation.ts`:

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
})

export const createCredentialSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  value: z.string().min(1).max(5000),
  category: z.enum(['SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']),
  restaurantId: z.string().optional(),
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

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'DEV']).optional(),
})

export const systemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
})

export const sanitizeText = (text: string): string =>
  text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: extend validation schemas for updateUser, systemSettings, TOTP login, restaurantId"
```

---

## Task 4: 2FA en autenticación (auth.ts + login page)

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth.config.ts`
- Modify: `src/app/(auth)/login/page.tsx` (ruta real: `src/app/\(auth\)/login/page.tsx`)

- [ ] **Step 1: Actualizar auth.ts para verificar TOTP**

Reemplazar `src/lib/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { authConfig } from '@/lib/auth.config'
import { verifyTotpToken } from '@/lib/totp'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = parsed.data.totpCode ?? ''
          const totpValid = verifyTotpToken(code, user.twoFactorSecret)
          if (!totpValid) return null
        }

        resetRateLimit(rateLimitKey)
        return { id: user.id, email: user.email, name: user.name, role: user.role, twoFactorEnabled: user.twoFactorEnabled }
      },
    }),
  ],
})
```

- [ ] **Step 2: Actualizar auth.config.ts para propagar twoFactorEnabled**

Reemplazar `src/lib/auth.config.ts`:

```typescript
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).role = (user as Record<string, unknown>).role
        ;(token as Record<string, unknown>).twoFactorEnabled = (user as Record<string, unknown>).twoFactorEnabled
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.sub
        ;(session.user as unknown as Record<string, unknown>).role = (token as Record<string, unknown>).role
        ;(session.user as unknown as Record<string, unknown>).twoFactorEnabled = (token as Record<string, unknown>).twoFactorEnabled
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
}
```

- [ ] **Step 3: Actualizar login page con campo TOTP opcional**

Leer primero: `src/app/(auth)/login/page.tsx` y añadir campo TOTP al formulario. La página completa:

```tsx
'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showTotp, setShowTotp] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      totpCode: fd.get('totpCode') ?? '',
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Credenciales inválidas. Si tienes 2FA activo, ingresa el código.')
      setShowTotp(true)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ez-eat Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de gestión interna</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="admin@ezeat.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {showTotp && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                <ShieldCheck size={12} className="inline mr-1" />
                Código 2FA (autenticador)
              </label>
              <input
                name="totpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-800 border border-blue-500 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all tracking-widest text-center text-lg"
                placeholder="000000"
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-200"
          >
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.config.ts src/app/
git commit -m "feat: add TOTP 2FA verification in auth flow and login page"
```

---

## Task 5: actions/accounts.ts — updateUser, 2FA, SystemSettings

**Files:**
- Modify: `src/actions/accounts.ts`

- [ ] **Step 1: Reemplazar src/actions/accounts.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createUserSchema, updateUserSchema, systemSettingSchema, sanitizeText } from '@/lib/validation'
import { generateTotpSecret, generateTotpUri, generateQrDataUrl, verifyTotpToken } from '@/lib/totp'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')
  return user
}

export async function listUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, twoFactorEnabled: true, createdAt: true, updatedAt: true },
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
  await prisma.user.create({
    data: { email: parsed.email, name: parsed.name, role: parsed.role, passwordHash },
  })
  revalidatePath('/accounts')
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin()
  const parsed = updateUserSchema.parse({
    name: formData.get('name') ? sanitizeText(formData.get('name') as string) : undefined,
    email: formData.get('email') as string | undefined,
    role: formData.get('role') as string | undefined,
  })
  await prisma.user.update({ where: { id: userId }, data: parsed })
  revalidatePath('/accounts')
}

export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/accounts')
}

export async function setup2FA(userId: string): Promise<{ qrDataUrl: string; secret: string }> {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  const secret = generateTotpSecret()
  const uri = generateTotpUri(secret, user.email)
  const qrDataUrl = await generateQrDataUrl(uri)
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret, twoFactorEnabled: false } })
  return { qrDataUrl, secret }
}

export async function confirm2FA(userId: string, token: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.twoFactorSecret) return { success: false }
  const valid = verifyTotpToken(token, user.twoFactorSecret)
  if (!valid) return { success: false }
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } })
  revalidatePath('/accounts')
  return { success: true }
}

export async function disable2FA(userId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  revalidatePath('/accounts')
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  await requireAdmin()
  const settings = await prisma.systemSettings.findMany()
  return Object.fromEntries(settings.map((s) => [s.key, s.value]))
}

export async function updateSystemSetting(key: string, value: string) {
  await requireAdmin()
  systemSettingSchema.parse({ key, value })
  await prisma.systemSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  revalidatePath('/accounts')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/accounts.ts
git commit -m "feat: add updateUser, 2FA setup/confirm/disable, SystemSettings actions"
```

---

## Task 6: actions/tasks.ts — updateTask

**Files:**
- Modify: `src/actions/tasks.ts`

- [ ] **Step 1: Leer el archivo actual y añadir updateTask**

Leer `src/actions/tasks.ts` para ver su contenido actual, luego añadir al final:

```typescript
export async function updateTask(taskId: string, formData: FormData) {
  const user = await requireSession()
  const raw = {
    title: formData.get('title') as string | undefined,
    description: (formData.get('description') as string) || undefined,
    priority: formData.get('priority') as string | undefined,
    assignedToId: (formData.get('assignedToId') as string) || undefined,
    dueDate: (formData.get('dueDate') as string) || undefined,
  }
  const parsed = updateTaskSchema.parse({
    ...raw,
    title: raw.title ? sanitizeText(raw.title) : undefined,
    description: raw.description ? sanitizeText(raw.description) : undefined,
    dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString() : undefined,
  })
  await prisma.task.update({ where: { id: taskId }, data: parsed })
  revalidatePath('/tasks')
}
```

Asegurarse de importar `updateTaskSchema` si no está importado (ya debe estarlo desde validation.ts).

También añadir al encabezado de imports si no existe: `import { createTaskSchema, updateTaskSchema, sanitizeText } from '@/lib/validation'`

- [ ] **Step 2: Commit**

```bash
git add src/actions/tasks.ts
git commit -m "feat: add updateTask server action"
```

---

## Task 7: actions/vault.ts — restaurantId

**Files:**
- Modify: `src/actions/vault.ts`

- [ ] **Step 1: Reemplazar src/actions/vault.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { createCredentialSchema, sanitizeText } from '@/lib/validation'
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
  const select = {
    id: true,
    name: true,
    category: true,
    notes: true,
    restaurantId: true,
    restaurant: { select: { id: true, name: true } },
    createdAt: true,
    updatedAt: true,
    userId: true,
  }
  if (user.role === 'ADMIN') {
    return prisma.credential.findMany({ select, orderBy: { updatedAt: 'desc' } })
  }
  return prisma.credential.findMany({
    where: { sharedWith: { some: { id: user.id } } },
    select,
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createCredential(formData: FormData) {
  const user = await requireSession()
  const raw = {
    name: formData.get('name') as string,
    value: formData.get('value') as string,
    category: formData.get('category') as string,
    restaurantId: (formData.get('restaurantId') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    sharedWith: [] as string[],
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
      restaurantId: parsed.restaurantId ?? null,
    },
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

export async function deleteCredential(id: string): Promise<{ error: string } | void> {
  try {
    const user = await requireSession()
    if (user.role !== 'ADMIN') throw new Error('Forbidden')
    await prisma.credential.delete({ where: { id } })
    await writeAuditLog(user.id, 'DELETE_CREDENTIAL', 'Credential', id)
    revalidatePath('/vault')
  } catch {
    return { error: 'No se pudo eliminar' }
  }
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

- [ ] **Step 2: Commit**

```bash
git add src/actions/vault.ts
git commit -m "feat: add restaurantId support to credential vault actions"
```

---

## Task 8: actions/restaurants.ts — updateRestaurant

**Files:**
- Modify: `src/actions/restaurants.ts`

- [ ] **Step 1: Leer y añadir updateRestaurant**

Leer `src/actions/restaurants.ts`, luego añadir al final:

```typescript
export async function updateRestaurant(id: string, formData: FormData) {
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')

  const notes = formData.get('notes') as string | null
  await prisma.restaurant.update({
    where: { id },
    data: { notes: notes ?? undefined },
  })
  revalidatePath(`/restaurants/${id}`)
  revalidatePath('/restaurants')
}
```

Asegurarse de que `auth`, `prisma`, `revalidatePath` están importados.

- [ ] **Step 2: Commit**

```bash
git add src/actions/restaurants.ts
git commit -m "feat: add updateRestaurant action"
```

---

## Task 9: actions/notifications.ts — notificaciones

**Files:**
- Create: `src/actions/notifications.ts`

- [ ] **Step 1: Crear src/actions/notifications.ts**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface Notification {
  id: string
  action: string
  resourceType: string
  timestamp: Date
  userName: string
}

const ACTION_LABEL: Record<string, string> = {
  CREATE_CREDENTIAL: 'Credencial creada',
  REVEAL_CREDENTIAL: 'Credencial revelada',
  DELETE_CREDENTIAL: 'Credencial eliminada',
  SHARE_CREDENTIAL: 'Credencial compartida',
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth()
  if (!session?.user) return []
  const logs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true } } },
  })
  return logs.map((l) => ({
    id: l.id,
    action: ACTION_LABEL[l.action] ?? l.action,
    resourceType: l.resourceType,
    timestamp: l.timestamp,
    userName: l.user.name,
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/notifications.ts
git commit -m "feat: add getNotifications server action from audit log"
```

---

## Task 10: components/header-notifications.tsx + Header actualizado

**Files:**
- Create: `src/components/header-notifications.tsx`
- Modify: `src/components/header.tsx`

- [ ] **Step 1: Crear src/components/header-notifications.tsx**

```tsx
'use client'
import { useState, useTransition, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications, type Notification } from '@/actions/notifications'

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && notifications.length === 0) {
      startTransition(async () => {
        const data = await getNotifications()
        setNotifications(data)
      })
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Actividad reciente</p>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Sistema</span>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-medium text-slate-800">{n.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.userName} — {n.resourceType}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Actualizar src/components/header.tsx**

Reemplazar el contenido:

```tsx
import { auth, signOut } from '@/lib/auth'
import { Lock, Settings, Search } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from './header-notifications'

function getInitials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export async function Header() {
  const session = await auth()
  const user = session?.user as { name?: string; role?: string } | undefined
  const initials = getInitials(user?.name)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
        <span className="font-bold text-slate-900 text-base tracking-tight hidden lg:block">Ez-eat</span>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-44 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title="Bloquear sesión"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Lock size={18} />
          </button>
        </form>
        <Link
          href="/settings"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          title="Configuración"
        >
          <Settings size={18} />
        </Link>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title={`${user?.name ?? 'Usuario'} — clic para cerrar sesión`}
            className="w-8 h-8 rounded-full text-white text-xs font-bold ml-1 hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{ backgroundColor: '#0F172A' }}
          >
            {initials}
          </button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/header.tsx src/components/header-notifications.tsx
git commit -m "feat: add functional notification bell, wire lock button, settings link in header"
```

---

## Task 11: src/app/(protected)/settings/page.tsx

**Files:**
- Create: `src/app/(protected)/settings/page.tsx`

- [ ] **Step 1: Crear página de configuración**

```tsx
import { auth } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await auth()
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Preferencias de tu cuenta.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Información de cuenta</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Nombre</p>
            <p className="text-sm text-slate-900">{user?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Correo</p>
            <p className="text-sm text-slate-900">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Rol</p>
            <p className="text-sm text-slate-900">{user?.role === 'ADMIN' ? 'Administrador' : 'Desarrollador'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          Para cambiar tu información, contacta a un administrador.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(protected)/settings/"
git commit -m "feat: add user settings page"
```

---

## Task 12: vault-list.tsx — columna + filtro restaurante + español

**Files:**
- Modify: `src/components/vault/vault-list.tsx`
- Modify: `src/app/(protected)/vault/new/page.tsx`

- [ ] **Step 1: Actualizar interfaz y tabla en vault-list.tsx**

Reemplazar el contenido completo de `src/components/vault/vault-list.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal, Database, CreditCard, Cloud, Box, Building2 } from 'lucide-react'
import { RevealButton } from './reveal-button'
import { DeleteCredentialButton } from './delete-credential-button'

interface Restaurant { id: string; name: string }

interface Credential {
  id: string
  name: string
  category: string
  updatedAt: Date
  restaurant?: Restaurant | null
}

const CATEGORIES = ['ALL', 'SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']

const CAT_LABEL: Record<string, string> = {
  SERVICE: 'Servicio',
  RESTAURANT: 'Restaurante',
  ACCOUNT: 'Cuenta',
  OTHER: 'Otro',
}

const CAT_ICON: Record<string, React.ReactNode> = {
  SERVICE:    <Database size={16} className="text-slate-500" />,
  RESTAURANT: <Cloud size={16} className="text-slate-500" />,
  ACCOUNT:    <CreditCard size={16} className="text-slate-500" />,
  OTHER:      <Box size={16} className="text-slate-500" />,
}

function credentialStatus(updatedAt: Date) {
  const daysOld = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld > 90) return { label: 'Alerta Admin', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: '#F59E0B' }
  return { label: 'Verificada', cls: 'bg-green-50 text-green-700 border border-green-200', dot: '#10B981' }
}

export function VaultList({ credentials, isAdmin }: { credentials: Credential[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [restaurantFilter, setRestaurantFilter] = useState('ALL')

  const restaurants = Array.from(
    new Map(
      credentials
        .filter((c) => c.restaurant)
        .map((c) => [c.restaurant!.id, c.restaurant!])
    ).values()
  )

  const filtered = credentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || c.category === category
    const matchRest = restaurantFilter === 'ALL' || c.restaurant?.id === restaurantFilter
    return matchSearch && matchCat && matchRest
  })

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">Credenciales del sistema</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas las categorías</option>
            {CATEGORIES.filter(c => c !== 'ALL').map((c) => (
              <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>
            ))}
          </select>
          {restaurants.length > 0 && (
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los negocios</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar credenciales..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-slate-100">
            <tr>
              {['Nombre', 'Categoría', 'Negocio', 'Valor', 'Estado', 'Último acceso', 'Acciones'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Sin credenciales.</td>
              </tr>
            ) : (
              filtered.map((c) => {
                const status = credentialStatus(c.updatedAt)
                const icon = CAT_ICON[c.category] ?? CAT_ICON.OTHER
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{CAT_LABEL[c.category] ?? c.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.restaurant ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-600">{c.restaurant.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-xs tracking-widest">••••••••••••</span>
                        <RevealButton credentialId={c.id} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(c.updatedAt).toLocaleString('es-MX', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {isAdmin && <DeleteCredentialButton credentialId={c.id} />}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Mostrando {filtered.length} de {credentials.length} credenciales
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar vault/new/page.tsx para incluir selector de restaurante**

Leer `src/app/(protected)/vault/new/page.tsx`, luego reemplazar con versión que incluya campo restaurantId. La página actual probablemente renderiza un formulario. Añadir:

```tsx
// En la parte superior del componente de página (server component):
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Obtener lista de restaurantes para el selector:
const restaurants = await prisma.restaurant.findMany({
  select: { id: true, name: true },
  orderBy: { name: 'asc' },
})

// En el formulario, añadir campo:
<div>
  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
    Negocio (opcional)
  </label>
  <select
    name="restaurantId"
    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
  >
    <option value="">Sin negocio asociado</option>
    {restaurants.map((r) => (
      <option key={r.id} value={r.id}>{r.name}</option>
    ))}
  </select>
</div>
```

**IMPORTANTE:** Leer el archivo completo de vault/new/page.tsx antes de reescribir para preservar la estructura existente.

- [ ] **Step 3: Commit**

```bash
git add src/components/vault/ "src/app/(protected)/vault/"
git commit -m "feat: vault shows restaurant column, filter by business, Spanish labels"
```

---

## Task 13: kanban-board.tsx — modal de edición de tarea + español

**Files:**
- Modify: `src/components/tasks/kanban-board.tsx`

- [ ] **Step 1: Reemplazar kanban-board.tsx con versión completa**

Reemplazar `src/components/tasks/kanban-board.tsx` con:

```tsx
'use client'
import { updateTaskStatus, updateTask } from '@/actions/tasks'
import { useTransition, useState } from 'react'
import { Search, Calendar, MoreHorizontal, AlertTriangle, X, Save } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { id: 'BACKLOG',      label: 'Cola / Backlog',    statuses: ['TODO', 'BLOCKED'],  headerCls: 'text-slate-700' },
  { id: 'IN_PROGRESS',  label: 'En Progreso',        statuses: ['IN_PROGRESS'],      headerCls: 'text-blue-600'  },
  { id: 'DONE',         label: 'Verificado / Cerrado', statuses: ['DONE'],           headerCls: 'text-teal-600'  },
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  URGENT: { label: 'Prioridad Alta',   bg: 'bg-red-50',    text: 'text-red-600'    },
  HIGH:   { label: 'Prioridad Alta',   bg: 'bg-red-50',    text: 'text-red-600'    },
  MEDIUM: { label: 'Prioridad Media',  bg: 'bg-amber-50',  text: 'text-amber-600'  },
  LOW:    { label: 'Prioridad Baja',   bg: 'bg-slate-100', text: 'text-slate-500'  },
}

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' }

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate: Date | null
  assignedTo: { id: string; name: string } | null
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function isOverdue(dueDate: Date | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function getColumnId(status: string) {
  if (status === 'TODO' || status === 'BLOCKED') return 'BACKLOG'
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS'
  return 'DONE'
}

interface EditModalProps {
  task: Task
  onClose: () => void
  onSave: () => void
}

function EditTaskModal({ task, onClose, onSave }: EditModalProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTask(task.id, fd)
      toast('Tarea actualizada', 'success')
      onSave()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Editar tarea</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Título</label>
            <input
              name="title"
              defaultValue={task.title}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Descripción</label>
            <textarea
              name="description"
              defaultValue={task.description ?? ''}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Prioridad</label>
            <select
              name="priority"
              defaultValue={task.priority}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Fecha límite</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [priority, setPriority] = useState('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const assignees = ['ALL', ...Array.from(new Set(tasks.map((t) => t.assignedTo?.name).filter((n): n is string => !!n)))]
  const [assignee, setAssignee] = useState('ALL')

  const filtered = tasks.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === 'ALL' || t.priority === priority
    const matchAssignee = assignee === 'ALL' || t.assignedTo?.name === assignee
    return matchSearch && matchPriority && matchAssignee
  })

  function moveTask(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      toast('Tarea actualizada', 'info')
      setOpenMenu(null)
      router.refresh()
    })
  }

  const STATUS_TARGETS: Record<string, { label: string; status: string }[]> = {
    BACKLOG:     [{ label: 'Mover a En Progreso', status: 'IN_PROGRESS' }, { label: 'Cerrar', status: 'DONE' }],
    IN_PROGRESS: [{ label: 'Regresar a Backlog', status: 'TODO' }, { label: 'Verificar y Cerrar', status: 'DONE' }],
    DONE:        [{ label: 'Reabrir', status: 'TODO' }],
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={() => { setEditTask(null); router.refresh() }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todas las prioridades</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        {assignees.length > 1 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assignees.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'Todos los asignados' : a}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => getColumnId(t.status) === col.id)
          const isDone = col.id === 'DONE'
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.headerCls}`}>{col.label}</h3>
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>
              <div className={`h-1 rounded-full mb-3 ${isDone ? 'bg-teal-500' : col.id === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <div className="space-y-3 overflow-y-auto flex-1">
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Vacío</p>
                )}
                {colTasks.map((task) => {
                  const pcfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.LOW
                  const overdue = isOverdue(task.dueDate) && !isDone
                  const initials = task.assignedTo ? getInitials(task.assignedTo.name) : null
                  const targets = STATUS_TARGETS[col.id] ?? []
                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-lg border p-4 relative cursor-pointer hover:shadow-md transition-all duration-150 ${
                        isDone ? 'opacity-70 border-slate-200' : overdue ? 'border-red-200' : 'border-slate-200'
                      }`}
                      onClick={() => setEditTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${pcfg.bg} ${pcfg.text}`}>
                          {pcfg.label}
                        </span>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenu === task.id && (
                            <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48">
                              <button
                                onClick={() => { setEditTask(task); setOpenMenu(null) }}
                                className="w-full px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                              >
                                Editar tarea
                              </button>
                              {targets.map((t) => (
                                <button
                                  key={t.status}
                                  onClick={() => moveTask(task.id, t.status)}
                                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className={`font-semibold text-sm mb-1.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2">{task.description}</p>
                      )}
                      {col.id === 'IN_PROGRESS' && (
                        <div className="w-full h-1 bg-slate-100 rounded-full mb-2.5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={11} />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
                            : '—'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {overdue && (
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} />
                              Vencida
                            </span>
                          )}
                          {initials && (
                            <div
                              className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                              title={task.assignedTo!.name}
                              style={{ backgroundColor: '#0F172A' }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>
                      </div>
                      {isDone && (
                        <div className="absolute top-3 left-3 opacity-30">
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">✓ Verificado</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tasks/kanban-board.tsx
git commit -m "feat: add task edit modal, Spanish labels, responsive kanban columns"
```

---

## Task 14: accounts/account-list.tsx — edit modal, 2FA funcional, idle timeout, español

**Files:**
- Modify: `src/components/accounts/account-list.tsx`

- [ ] **Step 1: Reemplazar account-list.tsx completo**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { Search, UserPlus, Pencil, Ban, RefreshCw, ShieldCheck, Clock, AlertTriangle, X, Save, QrCode, Check } from 'lucide-react'
import { toggleUserActive, updateUser, setup2FA, confirm2FA, disable2FA, updateSystemSetting } from '@/actions/accounts'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: 'Admin',        cls: 'border border-slate-300 text-slate-700 bg-white' },
  DEV:   { label: 'Desarrollador', cls: 'border border-slate-300 text-slate-700 bg-white' },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(name: string) {
  const colors = ['#0F172A', '#2563EB', '#0D9488', '#7C3AED', '#DC2626']
  return colors[name.charCodeAt(0) % colors.length]
}

interface Props {
  users: User[]
  createUser: (formData: FormData) => Promise<void>
  idleTimeoutMinutes: string
}

export function AccessControlClient({ users, createUser, idleTimeoutMinutes }: Props) {
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('ALL')
  const [statusFilter, setStatus]     = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editUser, setEditUser]       = useState<User | null>(null)
  const [twoFaUser, setTwoFaUser]     = useState<User | null>(null)
  const [qrData, setQrData]           = useState<{ qrDataUrl: string; secret: string } | null>(null)
  const [totpCode, setTotpCode]       = useState('')
  const [idleTimeout, setIdleTimeout] = useState(idleTimeoutMinutes)
  const [isPending, startTransition]  = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const filtered = users.filter((u) => {
    const matchSearch  = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole    = roleFilter === 'ALL' || u.role === roleFilter
    const matchStatus  = statusFilter === 'ALL' || (statusFilter === 'active' && u.active) || (statusFilter === 'inactive' && !u.active)
    return matchSearch && matchRole && matchStatus
  })

  function handleToggle(userId: string) {
    startTransition(async () => {
      await toggleUserActive(userId)
      toast('Usuario actualizado', 'info')
      router.refresh()
    })
  }

  function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editUser) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateUser(editUser.id, fd)
      toast('Usuario actualizado', 'success')
      setEditUser(null)
      router.refresh()
    })
  }

  function handleSetup2FA(user: User) {
    setTwoFaUser(user)
    setQrData(null)
    setTotpCode('')
    startTransition(async () => {
      const data = await setup2FA(user.id)
      setQrData(data)
    })
  }

  function handleConfirm2FA() {
    if (!twoFaUser) return
    startTransition(async () => {
      const result = await confirm2FA(twoFaUser.id, totpCode)
      if (result.success) {
        toast('2FA activado correctamente', 'success')
        setTwoFaUser(null)
        setQrData(null)
        router.refresh()
      } else {
        toast('Código inválido, intenta de nuevo', 'error')
      }
    })
  }

  function handleDisable2FA(userId: string) {
    startTransition(async () => {
      await disable2FA(userId)
      toast('2FA desactivado', 'info')
      router.refresh()
    })
  }

  function handleSaveIdleTimeout() {
    startTransition(async () => {
      await updateSystemSetting('idle_timeout_minutes', idleTimeout)
      toast('Timeout actualizado', 'success')
    })
  }

  const suspendedCount = users.filter((u) => !u.active).length

  return (
    <div className="space-y-5">
      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Editar usuario</p>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Nombre</label>
                <input
                  name="name"
                  defaultValue={editUser.name}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Correo</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editUser.email}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Rol</label>
                <select
                  name="role"
                  defaultValue={editUser.role}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="DEV">Desarrollador</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <Save size={14} />
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA setup modal */}
      {twoFaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Configurar 2FA — {twoFaUser.name}</p>
              <button onClick={() => setTwoFaUser(null)} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {!qrData ? (
                <p className="text-sm text-slate-500 text-center py-4">Generando código QR...</p>
              ) : (
                <>
                  <p className="text-xs text-slate-600">
                    Escanea el código QR con Google Authenticator o Authy, luego ingresa el código de 6 dígitos para confirmar.
                  </p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrData.qrDataUrl} alt="QR 2FA" className="w-48 h-48 rounded-lg border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Código de verificación</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    onClick={handleConfirm2FA}
                    disabled={isPending || totpCode.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors"
                  >
                    <Check size={14} />
                    {isPending ? 'Verificando...' : 'Activar 2FA'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Policy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 2FA */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Autenticación</p>
            <ShieldCheck size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Autenticación de Dos Factores</p>
          <p className="text-xs text-slate-500 mb-4">Configura 2FA por usuario desde la tabla de abajo.</p>
          <div className="border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-blue-600">
              {users.filter(u => u.twoFactorEnabled).length}/{users.length} usuarios con 2FA activo
            </span>
          </div>
        </div>

        {/* Session Control */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Control de Sesión</p>
            <Clock size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Tiempo de Inactividad</p>
          <p className="text-xs text-slate-500 mb-4">Terminar sesiones inactivas automáticamente.</p>
          <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
            <input
              type="number"
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(e.target.value)}
              className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1440"
            />
            <span className="text-sm text-slate-500">minutos</span>
            <button
              onClick={handleSaveIdleTimeout}
              disabled={isPending}
              className="ml-auto text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Policy Alert */}
        <div className="rounded-lg p-5 text-white" style={{ backgroundColor: '#0F172A' }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alerta de Política</p>
            <AlertTriangle size={18} className="text-blue-400" />
          </div>
          <p className="font-semibold text-white mb-1.5">Rotación de Contraseñas</p>
          <p className="text-xs text-slate-400 mb-5">
            {suspendedCount > 0
              ? `${suspendedCount} cuenta${suspendedCount !== 1 ? 's' : ''} suspendida${suspendedCount !== 1 ? 's' : ''}.`
              : 'Todas las cuentas están activas.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#2563EB' }}
          >
            Revisar Cuentas
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <p className="text-sm font-semibold text-slate-900">Usuarios del sistema</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DEV">Desarrollador</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Suspendidos</option>
            </select>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0F172A' }}
            >
              <UserPlus size={14} />
              Nuevo usuario
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-3">Nuevo usuario del sistema</p>
            <form
              action={async (fd) => {
                await createUser(fd)
                setShowAddForm(false)
                router.refresh()
              }}
              className="grid grid-cols-1 md:grid-cols-5 gap-3"
            >
              <input name="name"     placeholder="Nombre completo"       required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="email"    type="email" placeholder="Correo"   required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="password" type="password" placeholder="Contraseña (mín 8)" required minLength={8} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <select name="role" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="DEV">Desarrollador</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#2563EB' }}>Crear</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-100">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-slate-100">
              <tr>
                {['Identidad', 'Rol', 'Estado', '2FA', 'Último acceso', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">Sin usuarios.</td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] ?? { label: 'Viewer', cls: 'border border-slate-300 text-slate-700 bg-white' }
                  const initials = getInitials(user.name)
                  const avatarBg = avatarColor(user.name)
                  const statusCls = user.active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
                  const statusLabel = user.active ? 'Activo' : 'Suspendido'
                  const statusDot = user.active ? '#10B981' : '#94A3B8'

                  return (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarBg }}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                            <p className="text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${roleCfg.cls}`}>{roleCfg.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCls}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDot }} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                            <Check size={10} /> Activo
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Inactivo</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(user.updatedAt).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditUser(user)} title="Editar" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => user.twoFactorEnabled ? handleDisable2FA(user.id) : handleSetup2FA(user)}
                            disabled={isPending}
                            title={user.twoFactorEnabled ? 'Desactivar 2FA' : 'Configurar 2FA'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${user.twoFactorEnabled ? 'text-teal-500 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(user.id)}
                            disabled={isPending}
                            title={user.active ? 'Suspender' : 'Restaurar'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${user.active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                          >
                            {user.active ? <Ban size={14} /> : <RefreshCw size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Mostrando {filtered.length} de {users.length} usuarios</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar accounts/page.tsx para pasar idleTimeoutMinutes**

Leer `src/app/(protected)/accounts/page.tsx`, añadir carga de SystemSettings y pasarla al componente:

```typescript
// En la página, añadir:
import { getSystemSettings } from '@/actions/accounts'

// Antes del return:
const settings = await getSystemSettings()
const idleTimeoutMinutes = settings['idle_timeout_minutes'] ?? '480'

// En el componente, pasar la prop:
<AccessControlClient users={users} createUser={createUser} idleTimeoutMinutes={idleTimeoutMinutes} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/accounts/ "src/app/(protected)/accounts/"
git commit -m "feat: accounts page — edit user modal, 2FA setup/QR, idle timeout save, Spanish, responsive"
```

---

## Task 15: Restaurant detail + export dashboard + sidebar español

**Files:**
- Modify: `src/app/(protected)/restaurants/[id]/page.tsx`
- Modify: `src/app/(protected)/dashboard/page.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Actualizar restaurant detail page**

Reemplazar `src/app/(protected)/restaurants/[id]/page.tsx`:

```tsx
import { patchRestaurantStatus, getRestaurantDetail, updateRestaurant } from '@/actions/restaurants'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const restaurant = await getRestaurantDetail(id).catch(() => null)

  const credentials = await prisma.credential.findMany({
    where: { restaurantId: restaurant?.id },
    select: { id: true, name: true, category: true, updatedAt: true },
  })

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Restaurante no encontrado o Ez-eat no disponible.</p>
      </div>
    )
  }

  const STATUS_LABELS: Record<string, string> = {
    active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido', UNKNOWN: 'Desconocido',
    ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{restaurant.name}</h1>
        <p className="text-sm text-slate-500 mt-0.5">ID externo: {restaurant.ezeatId}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Información del negocio</h2>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Estado actual</p>
          <p className="text-sm text-slate-900">{STATUS_LABELS[restaurant.status] ?? restaurant.status}</p>
        </div>

        {role === 'ADMIN' && (
          <>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'active',    label: 'Activo',     cls: 'bg-teal-600 hover:bg-teal-700' },
                  { key: 'inactive',  label: 'Inactivo',   cls: 'bg-slate-600 hover:bg-slate-700' },
                  { key: 'suspended', label: 'Suspendido', cls: 'bg-red-600 hover:bg-red-700' },
                ].map((s) => (
                  <form key={s.key} action={async () => {
                    'use server'
                    await patchRestaurantStatus(restaurant.ezeatId!, s.key)
                  }}>
                    <button
                      type="submit"
                      className={`text-sm px-4 py-2 rounded-lg text-white font-medium transition-colors ${s.cls}`}
                    >
                      {s.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            <form action={async (fd) => {
              'use server'
              await updateRestaurant(restaurant.id, fd)
            }} className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notas internas</p>
              <textarea
                name="notes"
                defaultValue={restaurant.notes ?? ''}
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Notas internas del negocio..."
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Guardar notas
              </button>
            </form>
          </>
        )}
      </div>

      {credentials.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Credenciales asociadas ({credentials.length})</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {credentials.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-900 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{c.category}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(c.updatedAt).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Actualizar sidebar a español**

Reemplazar `src/components/sidebar.tsx` con versión en español y colapsable en tablet:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users2, KeyRound, ClipboardCheck,
  ShieldCheck, History, Plus, Menu, X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',   label: 'Panel General',       icon: LayoutDashboard, adminOnly: false },
  { href: '/restaurants', label: 'Negocios Afiliados',  icon: Users2,          adminOnly: false },
  { href: '/vault',       label: 'Bóveda de Accesos',   icon: KeyRound,        adminOnly: false },
  { href: '/tasks',       label: 'Gestor de Tareas',    icon: ClipboardCheck,  adminOnly: false },
  { href: '/accounts',    label: 'Control de Acceso',   icon: ShieldCheck,     adminOnly: true  },
]

const bottomItems = [
  { href: '/audit', label: 'Auditoría', icon: History, adminOnly: true },
]

interface SidebarProps { role: string }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'
  const visibleNav    = navItems.filter((i) => !i.adminOnly || isAdmin)
  const visibleBottom = bottomItems.filter((i) => !i.adminOnly || isAdmin)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <aside className="w-60 flex flex-col h-full" style={{ backgroundColor: '#0F172A' }}>
      <div className="px-5 pt-6 pb-5 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center text-white font-bold text-sm">E</div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Ez-eat Admin</p>
            <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase mt-0.5">Sistema Seguro</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3">
        <div className="space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium tracking-wide uppercase transition-all ${
                  active
                    ? 'bg-slate-700/70 text-white border-l-2 border-blue-500 pl-[10px]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-slate-700/50 pt-3">
        <div className="space-y-0.5 mb-3">
          {visibleBottom.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium uppercase tracking-wide transition-all ${
                  active ? 'text-white bg-slate-700/70' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </div>
        <Link
          href="/tasks/new"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-medium text-white transition-colors hover:bg-slate-600"
          style={{ backgroundColor: '#1e293b' }}
        >
          <Plus size={15} />
          Nueva solicitud
        </Link>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex">{sidebarContent}</div>

      {/* Mobile/tablet hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3.5 left-3.5 z-40 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile/tablet drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="flex-shrink-0">{sidebarContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Actualizar dashboard/page.tsx — español + export CSV**

El dashboard es un server component. Para el export, crear un client wrapper o usar una Route Handler. La forma más simple es crear un API endpoint para el CSV y hacer el botón un link.

Crear `src/app/api/export/route.ts`:

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const [credentials, tasks, restaurants] = await Promise.all([
    prisma.credential.findMany({ select: { name: true, category: true, createdAt: true, updatedAt: true } }),
    prisma.task.findMany({ select: { title: true, status: true, priority: true, dueDate: true } }),
    prisma.restaurant.findMany({ select: { name: true, ezeatId: true, status: true } }),
  ])

  const lines: string[] = [
    'Tipo,Nombre,Estado,Categoría/Prioridad,Fecha',
    ...credentials.map((c) => `Credencial,"${c.name}",,"${c.category}","${c.createdAt.toISOString()}"`),
    ...tasks.map((t) => `Tarea,"${t.title}","${t.status}","${t.priority}","${t.dueDate?.toISOString() ?? ''}"`),
    ...restaurants.map((r) => `Negocio,"${r.name}","${r.status}",,`),
  ]

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ezeat-reporte-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
```

Luego en `dashboard/page.tsx`, cambiar el botón de Export a un link:

```tsx
// Reemplazar el botón:
// <button className="..."><Download /> Export Report</button>
// Por:
<a
  href="/api/export"
  className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
  download
>
  <Download size={15} />
  Exportar reporte
</a>
```

También traducir strings en dashboard:
- `'Executive Overview'` → `'Panel General'`
- `'System-wide metrics...'` → `'Métricas del sistema y alertas administrativas críticas.'`
- `'NETWORK CREDENTIALS'` → `'CREDENCIALES'`
- `'+3 this week'` → `'+3 esta semana'`
- `'ACTIVE TASKS'` → `'TAREAS ACTIVAS'`
- `'Processing across modules'` → `'En proceso'`
- `'REGISTERED AFFILIATES'` → `'NEGOCIOS AFILIADOS'`
- `'SYSTEM STATUS'` → `'ESTADO DEL SISTEMA'`
- `'All services verified'` → `'Todos los servicios verificados'`
- `'Optimal'` → `'Óptimo'`, `'Alert'` → `'Alerta'`, `'Active'` → `'Activo'`
- `'Flagged Tasks — Review Required'` → `'Tareas Marcadas — Revisión Requerida'`
- `'Filter ID...'` → `'Filtrar ID...'`
- `'Load More Entries'` → `'Cargar más'`
- `'System Activity'` → `'Actividad del Sistema'`
- `'View All'` → `'Ver todo'`
- `'No flagged tasks.'` → `'Sin tareas marcadas.'`
- `'No recent activity.'` → `'Sin actividad reciente.'`
- Activity labels en `activityLabel()` → español

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx "src/app/(protected)/restaurants/" "src/app/(protected)/dashboard/" src/app/api/
git commit -m "feat: restaurant edit, collapsible sidebar, dashboard Spanish + CSV export"
```

---

## Task 16: Verificación y limpieza final

**Files:**
- Varios

- [ ] **Step 1: Verificar build**

```bash
cd /home/sebas/Ez-eat/EzEatSystem
npm run build
```

Esperado: build exitoso sin errores TypeScript. Si hay errores, corregirlos.

- [ ] **Step 2: Verificar que vault/new/page.tsx tiene el selector de restaurante**

Leer el archivo y confirmar que renderiza `<select name="restaurantId">`. Si la página original era un server component, asegurarse de que se hace la consulta de restaurantes y se pasa correctamente.

- [ ] **Step 3: Seed SystemSettings inicial**

Si la base de datos no tiene el setting, ejecutar:

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "SystemSettings" (key, value, "updatedAt")
VALUES ('idle_timeout_minutes', '480', NOW())
ON CONFLICT (key) DO NOTHING;
SQL
```

- [ ] **Step 4: Iniciar dev server y verificar funcionalidad**

```bash
npm run dev
```

Abrir `http://localhost:3000` y verificar:
- [ ] Login con TOTP (si hay usuario con 2FA)
- [ ] Dashboard muestra en español, botón exportar descarga CSV
- [ ] Vault muestra columna de negocio, filtro por negocio funciona
- [ ] Vault/new tiene selector de restaurante
- [ ] Kanban permite editar tareas (click en tarjeta abre modal)
- [ ] Cuentas: editar usuario funciona, configurar 2FA muestra QR, guardar timeout funciona
- [ ] Restaurante detail: notas editables, status buttons en español
- [ ] Sidebar muestra labels en español, hamburger aparece en tablet
- [ ] Header: campana de notificaciones abre dropdown, botón lock cierra sesión

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat: complete EzEat admin system — Spanish, responsive, all features functional"
```
