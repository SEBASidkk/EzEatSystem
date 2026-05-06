# EzEatSystem — UX, Filtros, Delete, Sync Design

**Date:** 2026-05-06  
**Status:** Approved

## Scope

1. Restaurant sync via QueFresa API (AWS)
2. Credential delete UI
3. Skeleton loaders
4. Toast notifications
5. Client-side filters on 4 pages
6. CSS animations

---

## 1. Restaurant Sync

**QueFresa** (https://quefresa.ezeat.com.mx) needs a new internal endpoint:

- `GET /internal/restaurants` — returns all restaurants
- Protected by `x-api-key` header matching `process.env.INTERNAL_API_KEY`
- Response: `[{ id, name, slug, status, plan, createdAt }]`
- New file: `src/routes/internal.routes.js`
- New middleware: `src/middleware/internalAuth.js`
- Mounted in `app.js` before 404 handler at `/internal`

**EzEatSystem** `.env` update:
- `EZEAT_API_URL=https://quefresa.ezeat.com.mx`
- `EZEAT_API_KEY` must match `INTERNAL_API_KEY` in QueFresa

---

## 2. Credential Delete UI

- Add delete button to `CredentialCard` (visible only when `role === 'ADMIN'`)
- Confirmation: native `<dialog>` element with "¿Eliminar credencial?" + confirm/cancel
- On confirm: call `deleteCredential(id)` server action + refresh
- Shows spinner during deletion

---

## 3. Skeleton Loaders

- New `src/components/ui/skeleton.tsx` — base pulse animation component
- New `src/components/ui/skeleton-card.tsx` — credential/restaurant card shape
- Add `loading.tsx` to each route: vault, restaurants, tasks, accounts, audit
- Skeleton matches actual content layout (same grid/columns)

---

## 4. Toast Notifications

- New `src/components/ui/toast.tsx` + `src/hooks/use-toast.ts`
- No external deps — pure React state + auto-dismiss (3s)
- Positioned: top-right, stacks up to 3
- Types: success (green), error (red), info (gray)
- Trigger on: create credential, delete credential, reveal credential, status change, create task, create user

---

## 5. Client-Side Filters

All filters work on data already loaded server-side. No extra DB calls.

| Page | Component | Filters |
|------|-----------|---------|
| `/vault` | `VaultFilters` | text search (name) + category dropdown |
| `/restaurants` | `RestaurantFilters` | text search (name) + status dropdown + plan dropdown |
| `/tasks` | `TaskFilters` | text search (title) + priority dropdown + assignee dropdown |
| `/accounts` | `AccountFilters` | text search (name/email) + role dropdown + active toggle |

Filter state lives in client component wrapping each page's data list.
Pages remain server components — data passed as props to client filter wrapper.

---

## 6. Animations

- Cards: `animate-in fade-in-0 slide-in-from-bottom-2 duration-200` on mount
- List items: staggered delay via `style={{ animationDelay: `${i * 30}ms` }}`
- Sidebar links: `transition-colors duration-150`
- Buttons: `active:scale-95 transition-transform`
- Modals: `animate-in fade-in-0 zoom-in-95 duration-150`

---

## Architecture Notes

- QueFresa: Express.js (JavaScript), MongoDB
- EzEatSystem: Next.js 15, TypeScript, PostgreSQL/Prisma
- Filter components are pure client components receiving server-fetched data as props
- Toast hook uses React context — wrap in root protected layout
- No new npm packages required
