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
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
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
