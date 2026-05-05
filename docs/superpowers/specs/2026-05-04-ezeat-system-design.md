# EzEat Internal System — Design Spec
**Date:** 2026-05-04  
**Status:** Approved  
**Repo:** Ez-eat/EzEatSystem

---

## 1. Purpose

Internal team management system for Ez-eat / Que Fresa. Stores credentials, manages team tasks and accounts, and provides an admin panel for Ez-eat restaurants — all in one secure, self-hosted app.

---

## 2. Architecture

**Stack:**
- Next.js 14 (App Router) — fullstack, server components by default
- PostgreSQL + Prisma ORM — relational data
- NextAuth.js — session auth with httpOnly cookies
- AES-256-GCM — credential encryption (server-side only)
- Tailwind CSS + shadcn/ui — UI
- Nginx + PM2 on AWS EC2 — reverse proxy + process manager

**Deployment:** Single Next.js process on existing AWS EC2 instance behind Nginx. PostgreSQL on same instance (or RDS for scalability).

---

## 3. Modules

| Module | Route | Description |
|--------|-------|-------------|
| Auth | `/login` | Login only — no public registration |
| Dashboard | `/dashboard` | Overview: pending tasks, recent activity |
| Vault | `/vault` | Encrypted credential storage |
| Tasks | `/tasks` | Kanban task manager |
| Accounts | `/accounts` | Team member management (Admin only) |
| Restaurants | `/restaurants` | Ez-eat restaurant admin panel |
| Audit Log | `/audit` | Credential access log (Admin only) |

---

## 4. Database Schema (Prisma)

```prisma
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
  id           String       @id @default(cuid())
  email        String       @unique
  name         String
  role         Role         @default(DEV)
  passwordHash String
  active       Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  credentials  Credential[] @relation("CreatedCredentials")
  sharedCreds  Credential[] @relation("SharedCredentials")
  tasks        Task[]       @relation("AssignedTasks")
  createdTasks Task[]       @relation("CreatedTasks")
  auditLogs    AuditLog[]
}

model Credential {
  id             String             @id @default(cuid())
  name           String
  category       CredentialCategory
  encryptedValue String             // AES-256-GCM ciphertext (base64)
  iv             String             // Initialization vector (base64, unique per credential)
  tag            String             // GCM auth tag (base64)
  createdBy      User               @relation("CreatedCredentials", fields: [userId], references: [id])
  userId         String
  sharedWith     User[]             @relation("SharedCredentials")
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  assignedTo  User?        @relation("AssignedTasks", fields: [assignedToId], references: [id])
  assignedToId String?
  createdBy   User         @relation("CreatedTasks", fields: [createdById], references: [id])
  createdById String
  dueDate     DateTime?
  tags        String[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Restaurant {
  id          String   @id @default(cuid())
  name        String
  ezeatId     String   @unique  // ID in Ez-eat_QueFresa system
  status      String
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id           String   @id @default(cuid())
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  action       String   // e.g. "REVEAL_CREDENTIAL", "CREATE_CREDENTIAL"
  resourceType String   // e.g. "Credential", "Task"
  resourceId   String
  ip           String
  timestamp    DateTime @default(now())
}
```

---

## 5. Security

### OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|--------------|-----------|
| SQL Injection | Prisma ORM — all queries parameterized. `$queryRaw` forbidden without parameters. |
| XSS | Next.js escapes output by default. Strict CSP headers block inline scripts. |
| CSRF | NextAuth tokens + `SameSite=Strict` cookies. |
| Broken Auth | bcrypt rounds=12, rate limit 5 attempts → 15min block, sessions expire 8h. |
| Sensitive Data Exposure | AES-256-GCM vault, HTTPS enforced, credentials never logged. |
| Broken Access Control | Next.js middleware checks role on every protected route AND every Server Action. |
| Security Misconfiguration | Helmet-equivalent headers, strict CSP, no stack traces in production. |
| Insecure Deserialization | Zod validates ALL input at every boundary before touching DB. |
| Vulnerable Dependencies | `npm audit` in CI, Dependabot alerts enabled. |
| Logging & Monitoring | AuditLog for all credential access + Winston server logs. |

### Credential Vault Encryption

```
VAULT_KEY (32 random bytes, env only, never in DB)
  ↓
crypto.randomBytes(12) → IV (unique per credential)
  ↓
AES-256-GCM encrypt(plaintext, VAULT_KEY, IV) → { ciphertext, authTag }
  ↓
Store: encryptedValue (base64) + iv (base64) + tag (base64)
```

Reveal flow:
1. User clicks "Reveal" → Server Action called
2. Server Action checks session + role + sharedWith
3. Decrypt in server memory only
4. Return to server component (never JSON API response)
5. Auto-hide after 30 seconds (client timer)
6. Write AuditLog entry with userId + IP

### Input Validation (Zod — all endpoints)

```typescript
const createCredentialSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  value: z.string().min(1).max(5000),
  category: z.enum(['SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']),
  sharedWith: z.array(z.string().cuid()).max(20),
})
```

### Additional Security Measures

- No user enumeration: login errors always say "Invalid credentials"
- HTML stripped from all text inputs before storage
- Session revocation: Admin can invalidate any Dev session instantly
- Vault key rotation: utility script to re-encrypt all credentials with new key
- `NEXTAUTH_SECRET` rotated independently of `VAULT_KEY`
- `.env` in `.gitignore`, `.env.example` with placeholders only

---

## 6. UI Navigation

**Layout:** Left sidebar (module links) + top header (user info + role badge) + main content area.

```
/login              Login form (rate limited, no registration link)
/dashboard          Pending tasks widget + recent credential access + restaurant status
/vault              Credential list (values masked ••••••) + reveal button
  /vault/new        Add credential form
  /vault/[id]       View/edit + share with specific Dev users
/tasks              Kanban board: TODO | IN_PROGRESS | DONE | BLOCKED
  /tasks/new        Create task with priority, assignee, due date, tags
/accounts           Team list, create user, deactivate user (Admin only)
/restaurants        Restaurant list from Ez-eat API + cached status
  /restaurants/[id] Restaurant detail + admin actions
/audit              Credential access log table with filters (Admin only)
```

**Role visibility:**

| Feature | Admin | Dev |
|---------|-------|-----|
| All credentials | ✅ | Only shared |
| Audit log | ✅ | ❌ |
| Accounts management | ✅ | ❌ |
| Session revocation | ✅ | ❌ |
| Create/edit credentials | ✅ | ✅ |
| Tasks | ✅ | ✅ |
| Restaurants | ✅ | ✅ |

---

## 7. Ez-eat Integration

EzEatSystem communicates with Ez-eat_QueFresa via internal HTTP (server-to-server only):

```
EzEatSystem Server Action → EZEAT_API_URL (internal) → Ez-eat_QueFresa API
```

- Auth: `EZEAT_API_KEY` header (shared secret between systems)
- Ez-eat exposes internal endpoints: `GET /internal/restaurants`, `PATCH /internal/restaurants/:id`, `GET /internal/metrics`
- If Ez-eat is down: EzEatSystem shows last cached state from PostgreSQL `Restaurant` table
- Cache refreshes every 5 minutes via background cron (Next.js route handler)

---

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ezeat_system

# Auth
NEXTAUTH_URL=https://system.yourdomain.com
NEXTAUTH_SECRET=<32+ random bytes>

# Vault
VAULT_KEY=<exactly 32 random bytes, hex encoded>

# Ez-eat integration
EZEAT_API_URL=http://internal-ezeat-url
EZEAT_API_KEY=<shared secret>
```

---

## 9. Project Structure

```
EzEatSystem/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/login/
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── vault/
│   │   │   ├── tasks/
│   │   │   ├── accounts/
│   │   │   ├── restaurants/
│   │   │   └── audit/
│   │   └── api/                # NextAuth + internal API routes
│   ├── components/             # Shared UI components
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   ├── crypto.ts           # AES-256-GCM encrypt/decrypt
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── validation.ts       # Zod schemas
│   │   └── ezeat-client.ts     # Ez-eat API client
│   ├── middleware.ts            # Route protection + role checks
│   └── actions/                # Server Actions per module
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── superpowers/specs/
├── .env.example
├── .gitignore
└── package.json
```

---

## 10. Scalability Notes

- Stateless Next.js server → can add more EC2 instances behind load balancer
- PostgreSQL → migrate to RDS when team grows
- Vault key stored in env → migrate to AWS Secrets Manager / KMS when needed
- AuditLog → archive old entries to S3 after 90 days
