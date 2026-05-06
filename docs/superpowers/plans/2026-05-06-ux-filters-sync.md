# EzEatSystem — UX, Filtros, Delete, Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restaurant sync from QueFresa AWS, credential delete UI, skeleton loaders, toast notifications, client-side filters on 4 pages, and CSS micro-animations.

**Architecture:** QueFresa gets a new `/internal/restaurants` endpoint (Express, API-key gated). EzEatSystem fetches from that endpoint; filter state lives in client wrapper components that receive server-fetched data as props. Toast context wraps the protected layout.

**Tech Stack:** Next.js 15, TypeScript, Tailwind 3.4, React context, Express.js (QueFresa), Prisma, Lucide icons

---

## File Map

### QueFresa (`/home/sebas/Ez-eat_QueFresa/src`)
| Action | Path |
|--------|------|
| Create | `middleware/internalAuth.js` |
| Create | `routes/internal.routes.js` |
| Modify | `app.js` (mount internal routes) |
| Modify | `.env` (add INTERNAL_API_KEY) |

### EzEatSystem (`/home/sebas/Ez-eat/EzEatSystem/src`)
| Action | Path |
|--------|------|
| Modify | `.env` |
| Modify | `app/globals.css` |
| Create | `components/ui/skeleton.tsx` |
| Create | `lib/toast-context.tsx` |
| Create | `components/ui/toast.tsx` |
| Modify | `app/(protected)/layout.tsx` |
| Create | `components/vault/delete-credential-button.tsx` |
| Modify | `components/vault/credential-card.tsx` |
| Modify | `app/(protected)/vault/page.tsx` |
| Create | `components/vault/vault-list.tsx` |
| Create | `app/(protected)/vault/loading.tsx` |
| Create | `components/restaurants/restaurant-list.tsx` |
| Modify | `app/(protected)/restaurants/page.tsx` |
| Create | `app/(protected)/restaurants/loading.tsx` |
| Modify | `components/tasks/kanban-board.tsx` |
| Create | `app/(protected)/tasks/loading.tsx` |
| Create | `components/accounts/account-list.tsx` |
| Modify | `app/(protected)/accounts/page.tsx` |
| Create | `app/(protected)/accounts/loading.tsx` |
| Create | `app/(protected)/audit/loading.tsx` |

---

## Task 1: QueFresa — Internal Auth Middleware

**Files:**
- Create: `/home/sebas/Ez-eat_QueFresa/src/middleware/internalAuth.js`
- Modify: `/home/sebas/Ez-eat_QueFresa/.env`

- [ ] **Step 1: Add INTERNAL_API_KEY to QueFresa .env**

Open `/home/sebas/Ez-eat_QueFresa/.env` and add:
```
INTERNAL_API_KEY=ezeat-internal-secret-2026
```

- [ ] **Step 2: Create internalAuth middleware**

Create `/home/sebas/Ez-eat_QueFresa/src/middleware/internalAuth.js`:
```javascript
export function internalAuth(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}
```

- [ ] **Step 3: Verify middleware file exists**

Run:
```bash
cat /home/sebas/Ez-eat_QueFresa/src/middleware/internalAuth.js
```
Expected: file content printed without error.

---

## Task 2: QueFresa — Internal Routes

**Files:**
- Create: `/home/sebas/Ez-eat_QueFresa/src/routes/internal.routes.js`

- [ ] **Step 1: Check Restaurant model fields available**

Run:
```bash
head -100 /home/sebas/Ez-eat_QueFresa/src/models/Restaurant.js
```
Confirm fields: `_id`, `name`, `slug`, `status` (or similar), `plan` (or subscription), `createdAt`.

- [ ] **Step 2: Create internal routes file**

Create `/home/sebas/Ez-eat_QueFresa/src/routes/internal.routes.js`:
```javascript
import { Router } from 'express'
import { internalAuth } from '../middleware/internalAuth.js'
import Restaurant from '../models/Restaurant.js'

const router = Router()

router.use(internalAuth)

router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .select('_id name slug status plan createdAt')
      .sort({ createdAt: -1 })
      .lean()

    const data = restaurants.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug ?? '',
      status: r.status ?? 'unknown',
      plan: r.plan ?? 'unknown',
      createdAt: r.createdAt,
    }))

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
```

> **Note:** If the Restaurant model uses different field names for status/plan, adjust the `.select()` and mapping accordingly based on Step 1 output.

---

## Task 3: QueFresa — Mount Routes + Update EzEatSystem .env

**Files:**
- Modify: `/home/sebas/Ez-eat_QueFresa/src/app.js`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/.env`

- [ ] **Step 1: Import and mount internal routes in app.js**

Open `/home/sebas/Ez-eat_QueFresa/src/app.js`. Find the line:
```javascript
app.use('/api/restaurants', restaurantRoutes);
```

Add AFTER that line (before the 404 handler block):
```javascript
import internalRoutes from './routes/internal.routes.js';
```
Add the import at the top with other imports, then after the restaurant routes line add:
```javascript
app.use('/internal', internalRoutes);
```

- [ ] **Step 2: Verify no syntax errors**

Run from QueFresa directory:
```bash
cd /home/sebas/Ez-eat_QueFresa && node --input-type=module --check < src/app.js 2>&1 || echo "check done"
```

- [ ] **Step 3: Update EzEatSystem .env**

Open `/home/sebas/Ez-eat/EzEatSystem/.env`. Update:
```
EZEAT_API_URL=https://quefresa.ezeat.com.mx
EZEAT_API_KEY=ezeat-internal-secret-2026
```
The `EZEAT_API_KEY` value must match `INTERNAL_API_KEY` in QueFresa .env.

- [ ] **Step 4: Update ezeat-client.ts to unwrap response envelope**

The new endpoint returns `{ success: true, data: [...] }`. Open `/home/sebas/Ez-eat/EzEatSystem/src/lib/ezeat-client.ts` and update `getRestaurants`:
```typescript
export async function getRestaurants(): Promise<EzEatRestaurant[]> {
  const res = await fetchEzEat<{ success: boolean; data: EzEatRestaurant[] }>('/internal/restaurants')
  return res.data ?? []
}
```
Also update the `EzEatRestaurant` interface if it doesn't have `slug` and `plan`:
```typescript
export interface EzEatRestaurant {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  createdAt: string
}
```

- [ ] **Step 5: Deploy QueFresa to AWS**

From the QueFresa project directory, deploy using whatever method is configured (e.g., `git push` to trigger CI, or manual deploy script). Verify at:
```
https://quefresa.ezeat.com.mx/internal/restaurants
```
Should return `401 Unauthorized` (no API key). With header `x-api-key: ezeat-internal-secret-2026` should return JSON.

---

## Task 4: Animations in globals.css

**Files:**
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/app/globals.css`

- [ ] **Step 1: Add keyframes and animation utilities**

Open `/home/sebas/Ez-eat/EzEatSystem/src/app/globals.css` and replace entire content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-slide {
  animation: fadeSlideIn 0.2s ease-out both;
}

.animate-pulse-soft {
  animation: pulse-soft 1.5s ease-in-out infinite;
}

.animate-toast-in {
  animation: toastIn 0.25s ease-out both;
}
```

- [ ] **Step 2: Verify dev server compiles without error**

Check terminal running `npm run dev` — no CSS parse errors should appear.

---

## Task 5: Skeleton Loader Component

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/ui/skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

Create `/home/sebas/Ez-eat/EzEatSystem/src/components/ui/skeleton.tsx`:
```tsx
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse-soft ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonKanbanCard() {
  return (
    <div className="bg-white rounded border p-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create loading.tsx for vault**

Create `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/vault/loading.tsx`:
```tsx
import { SkeletonCard } from '@/components/ui/skeleton'

export default function VaultLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse-soft" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create loading.tsx for restaurants**

Create `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/restaurants/loading.tsx`:
```tsx
import { SkeletonRow } from '@/components/ui/skeleton'

export default function RestaurantsLoading() {
  return (
    <div>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft mb-6" />
      <div className="bg-white border rounded-lg divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create loading.tsx for tasks**

Create `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/tasks/loading.tsx`:
```tsx
import { SkeletonKanbanCard } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 bg-gray-200 rounded animate-pulse-soft" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse-soft" />
      </div>
      <div className="grid grid-cols-4 gap-4 flex-1">
        {['Por hacer', 'En progreso', 'Bloqueado', 'Hecho'].map((col) => (
          <div key={col} className="bg-gray-100 rounded-lg p-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse-soft mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonKanbanCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create loading.tsx for accounts**

Create `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/accounts/loading.tsx`:
```tsx
import { SkeletonRow } from '@/components/ui/skeleton'

export default function AccountsLoading() {
  return (
    <div>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse-soft" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse-soft" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse-soft mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg">
              <SkeletonRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create loading.tsx for audit**

Create `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/audit/loading.tsx`:
```tsx
import { SkeletonRow } from '@/components/ui/skeleton'

export default function AuditLoading() {
  return (
    <div>
      <div className="h-7 w-36 bg-gray-200 rounded animate-pulse-soft mb-6" />
      <div className="bg-white border rounded-lg divide-y">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
```

---

## Task 6: Toast Notification System

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/lib/toast-context.tsx`
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/ui/toast.tsx`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/layout.tsx`

- [ ] **Step 1: Create toast context**

Create `/home/sebas/Ez-eat/EzEatSystem/src/lib/toast-context.tsx`:
```tsx
'use client'
import { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ message, type }: { message: string; type: ToastType }) {
  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
  }
  return (
    <div className={`animate-toast-in px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${colors[type]}`}>
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Add ToastProvider to protected layout**

Open `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/layout.tsx` and update:
```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ToastProvider } from '@/lib/toast-context'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  const role = (session.user as { role?: string })?.role ?? 'DEV'

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
```

- [ ] **Step 3: Verify dev compiles**

Check dev server terminal — no TypeScript errors.

---

## Task 7: Credential Delete Button

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/delete-credential-button.tsx`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/credential-card.tsx`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/vault/page.tsx`

- [ ] **Step 1: Create DeleteCredentialButton**

Create `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/delete-credential-button.tsx`:
```tsx
'use client'
import { Trash2 } from 'lucide-react'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCredential } from '@/actions/vault'
import { useToast } from '@/lib/toast-context'

export function DeleteCredentialButton({ credentialId }: { credentialId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCredential(credentialId)
      if (result?.error) {
        toast(result.error, 'error')
      } else {
        toast('Credencial eliminada', 'success')
        router.refresh()
      }
      setShowConfirm(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-gray-400 hover:text-red-500 transition-colors active:scale-95 transition-transform p-1 rounded"
        aria-label="Eliminar credencial"
      >
        <Trash2 size={14} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 animate-fade-slide">
          <div className="bg-white rounded-xl p-6 shadow-xl w-80 space-y-4">
            <p className="font-semibold text-gray-900">¿Eliminar credencial?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Check deleteCredential return type**

Open `/home/sebas/Ez-eat/EzEatSystem/src/actions/vault.ts` and verify what `deleteCredential` returns. If it throws on error (no return value), update the action to return `{ error: string } | void`:

In `vault.ts`, find `deleteCredential` and ensure it returns an error object on failure instead of throwing. If it currently throws, update the try/catch:
```typescript
export async function deleteCredential(id: string): Promise<{ error: string } | void> {
  try {
    const session = await requireSession()
    if (session.user.role !== 'ADMIN') return { error: 'Sin permisos' }
    // ... existing delete logic ...
  } catch {
    return { error: 'No se pudo eliminar' }
  }
}
```

- [ ] **Step 3: Update CredentialCard to accept isAdmin + show delete button**

Replace `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/credential-card.tsx`:
```tsx
'use client'
import { RevealButton } from './reveal-button'
import { DeleteCredentialButton } from './delete-credential-button'

interface CredentialCardProps {
  id: string
  name: string
  category: string
  updatedAt: Date
  isAdmin?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  SERVICE: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-green-100 text-green-700',
  ACCOUNT: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export function CredentialCard({ id, name, category, updatedAt, isAdmin }: CredentialCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3 animate-fade-slide hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Actualizado {new Date(updatedAt).toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700'}`}>
            {category}
          </span>
          {isAdmin && <DeleteCredentialButton credentialId={id} />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-400">••••••••••••</span>
        <RevealButton credentialId={id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Pass role to vault page and cards**

Replace `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/vault/page.tsx`:
```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listCredentials } from '@/actions/vault'
import { auth } from '@/lib/auth'
import { VaultList } from '@/components/vault/vault-list'

export default async function VaultPage() {
  const [credentials, session] = await Promise.all([listCredentials(), auth()])
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vault de Credenciales</h1>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Nueva credencial
        </Link>
      </div>
      <VaultList credentials={credentials} isAdmin={isAdmin} />
    </div>
  )
}
```

---

## Task 8: Vault Filters Client Component

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/vault-list.tsx`

- [ ] **Step 1: Create VaultList with search + category filter**

Create `/home/sebas/Ez-eat/EzEatSystem/src/components/vault/vault-list.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { CredentialCard } from './credential-card'

interface Credential {
  id: string
  name: string
  category: string
  updatedAt: Date
}

const CATEGORIES = ['ALL', 'SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']

export function VaultList({ credentials, isAdmin }: { credentials: Credential[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const filtered = credentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || c.category === category
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar credencial..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'ALL' ? 'Todas las categorías' : c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <div key={c.id} style={{ animationDelay: `${i * 30}ms` }}>
              <CredentialCard id={c.id} name={c.name} category={c.category} updatedAt={c.updatedAt} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify vault page loads and filters work**

Open browser at `http://localhost:3000/vault`. Verify:
- Credentials grid loads with skeleton while fetching
- Search input filters cards in real-time
- Category dropdown filters correctly
- Admin sees trash icon on cards; DEV does not

---

## Task 9: Restaurant Filters

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/restaurants/restaurant-list.tsx`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/restaurants/page.tsx`

- [ ] **Step 1: Create RestaurantList client component**

Create `/home/sebas/Ez-eat/EzEatSystem/src/components/restaurants/restaurant-list.tsx`:
```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Restaurant {
  id?: string
  ezeatId?: string
  name: string
  status: string
  plan?: string
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  unknown: 'bg-yellow-100 text-yellow-700',
}

const STATUSES = ['ALL', 'active', 'inactive', 'suspended', 'unknown']

export function RestaurantList({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const plans = ['ALL', ...Array.from(new Set(restaurants.map((r) => r.plan ?? 'unknown').filter(Boolean)))]

  const [plan, setPlan] = useState('ALL')

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'ALL' || r.status === status
    const matchPlan = plan === 'ALL' || (r.plan ?? 'unknown') === plan
    return matchSearch && matchStatus && matchPlan
  })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurante..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'Todos los status' : s}</option>
          ))}
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {plans.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'Todos los planes' : p}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} restaurante{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin resultados.</p>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {filtered.map((r, i) => (
            <Link
              key={r.id ?? r.ezeatId}
              href={`/restaurants/${r.id ?? r.ezeatId}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 animate-fade-slide transition-colors"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div>
                <span className="font-medium text-sm text-gray-900">{r.name}</span>
                {r.plan && r.plan !== 'unknown' && (
                  <span className="ml-2 text-xs text-gray-400">{r.plan}</span>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? STATUS_COLOR.unknown}`}>
                {r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update restaurants page**

Replace `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/restaurants/page.tsx`:
```tsx
import { listRestaurants } from '@/actions/restaurants'
import { RestaurantList } from '@/components/restaurants/restaurant-list'

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Restaurantes Ez-eat</h1>
      <RestaurantList restaurants={restaurants as Parameters<typeof RestaurantList>[0]['restaurants']} />
    </div>
  )
}
```

---

## Task 10: Task Filters in KanbanBoard

**Files:**
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/components/tasks/kanban-board.tsx`

- [ ] **Step 1: Add search + priority filter to KanbanBoard**

Replace `/home/sebas/Ez-eat/EzEatSystem/src/components/tasks/kanban-board.tsx`:
```tsx
'use client'
import { updateTaskStatus } from '@/actions/tasks'
import { useTransition, useState } from 'react'
import { Search } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

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

const PRIORITIES = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']

interface Task {
  id: string
  title: string
  priority: string
  status: string
  assignedTo: { id: string; name: string } | null
  dueDate: Date | null
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('ALL')

  const assignees = ['ALL', ...Array.from(new Set(tasks.map((t) => t.assignedTo?.name).filter(Boolean)))] as string[]
  const [assignee, setAssignee] = useState('ALL')

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === 'ALL' || t.priority === priority
    const matchAssignee = assignee === 'ALL' || t.assignedTo?.name === assignee
    return matchSearch && matchPriority && matchAssignee
  })

  function moveTask(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      toast('Tarea actualizada', 'info')
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarea..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'Todas las prioridades' : p}</option>
          ))}
        </select>
        {assignees.length > 1 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {assignees.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'Todos los asignados' : a}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className={`${col.color} rounded-lg p-3 overflow-y-auto`}>
              <h3 className="font-medium text-sm text-gray-700 mb-3 sticky top-0">
                {col.label}
                <span className="ml-1 text-xs text-gray-400">({colTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {colTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="bg-white rounded border p-3 text-sm shadow-sm animate-fade-slide hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <p className="font-medium text-gray-900 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority] ?? ''}`}>
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(task.dueDate).toLocaleDateString('es-MX')}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveTask(task.id, c.id)}
                          className="text-xs text-blue-600 hover:underline active:scale-95 transition-transform"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## Task 11: Account Filters

**Files:**
- Create: `/home/sebas/Ez-eat/EzEatSystem/src/components/accounts/account-list.tsx`
- Modify: `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/accounts/page.tsx`

- [ ] **Step 1: Create AccountList client component**

Create `/home/sebas/Ez-eat/EzEatSystem/src/components/accounts/account-list.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { toggleUserActive } from '@/actions/accounts'
import { useTransition } from 'react'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export function AccountList({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = role === 'ALL' || u.role === role
    const matchActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'active' && u.active) ||
      (activeFilter === 'inactive' && !u.active)
    return matchSearch && matchRole && matchActive
  })

  function handleToggle(userId: string) {
    startTransition(async () => {
      await toggleUserActive(userId)
      toast('Usuario actualizado', 'info')
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DEV">Dev</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((user, i) => (
          <div
            key={user.id}
            className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between animate-fade-slide"
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <div>
              <p className="font-medium text-sm text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
            </div>
            <button
              onClick={() => handleToggle(user.id)}
              disabled={isPending}
              className={`text-xs px-2 py-1 rounded font-medium active:scale-95 transition-transform disabled:opacity-50 ${
                user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {user.active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm">Sin resultados.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update accounts page to use AccountList**

Replace `/home/sebas/Ez-eat/EzEatSystem/src/app/(protected)/accounts/page.tsx`:
```tsx
import { listUsers, createUser } from '@/actions/accounts'
import { AccountList } from '@/components/accounts/account-list'

export default async function AccountsPage() {
  const users = await listUsers()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Cuentas del Equipo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Agregar miembro</h2>
          <form action={createUser} className="space-y-3">
            <input name="name" placeholder="Nombre" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input name="password" type="password" placeholder="Contraseña (mín. 8 chars)" required minLength={8} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <select name="role" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="DEV">Dev</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 active:scale-95 transition-transform">
              Crear
            </button>
          </form>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Miembros</h2>
          <AccountList users={users} />
        </div>
      </div>
    </div>
  )
}
```

---

## Task 12: Final Verification

- [ ] **Step 1: TypeScript check**

```bash
cd /home/sebas/Ez-eat/EzEatSystem && npx tsc --noEmit 2>&1 | head -40
```
Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 2: Test vault delete flow**

1. Open browser at `/vault`
2. Log in as admin
3. Click trash icon on a credential
4. Confirm dialog appears
5. Click "Eliminar"
6. Toast appears "Credencial eliminada"
7. Card disappears from grid

- [ ] **Step 3: Test filters**

- Vault: type in search box → cards filter instantly
- Restaurants: change status dropdown → list filters
- Tasks: type in search → cards filter across all columns
- Accounts: type name/email → list filters

- [ ] **Step 4: Test skeletons**

Hard-refresh each page — skeleton should flash briefly before content loads.

- [ ] **Step 5: Build check**

```bash
cd /home/sebas/Ez-eat/EzEatSystem && npm run build 2>&1 | tail -20
```
Expected: `Route (app)` table printed, no build errors.
