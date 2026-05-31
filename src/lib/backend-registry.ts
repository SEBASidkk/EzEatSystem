import { prisma } from '@/lib/db'

/**
 * Opción A multi-instancia.
 * Cada restaurante corre su propio backend Ez-eat (URL + INTERNAL_API_KEY).
 * Este registry resuelve a qué instancia pegar según el restaurante.
 *
 * Fallback: si no hay registro Backend para el restaurante, usa las vars
 * EZEAT_API_URL / EZEAT_API_KEY (compatibilidad con instancia única).
 */
export interface BackendConfig {
  baseUrl: string
  apiKey: string
  label: string
}

const ENV_FALLBACK: BackendConfig | null =
  process.env.EZEAT_API_URL && process.env.EZEAT_API_KEY
    ? { baseUrl: process.env.EZEAT_API_URL, apiKey: process.env.EZEAT_API_KEY, label: 'env-fallback' }
    : null

/**
 * Resuelve la config de backend para un restaurante (por id de Postgres).
 * @throws si no hay backend registrado ni fallback de env.
 */
export async function resolveBackend(restaurantId: string): Promise<BackendConfig> {
  const backend = await prisma.backend.findUnique({ where: { restaurantId } })
  if (backend && backend.active) {
    return { baseUrl: backend.baseUrl, apiKey: backend.apiKey, label: backend.label }
  }
  if (ENV_FALLBACK) return ENV_FALLBACK
  throw new Error(`No hay backend configurado para el restaurante ${restaurantId}`)
}

/**
 * Resuelve backend usando ezeatId (id Mongo del restaurante en el backend).
 * El dashboard a veces opera con ezeatId en vez del id de Postgres.
 */
export async function resolveBackendByEzeatId(ezeatId: string): Promise<BackendConfig> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ezeatId },
    include: { backend: true },
  })
  if (restaurant?.backend && restaurant.backend.active) {
    const b = restaurant.backend
    return { baseUrl: b.baseUrl, apiKey: b.apiKey, label: b.label }
  }
  if (ENV_FALLBACK) return ENV_FALLBACK
  throw new Error(`No hay backend configurado para ezeatId ${ezeatId}`)
}

/**
 * fetch contra una instancia de backend específica.
 */
export async function fetchBackend<T>(
  cfg: BackendConfig,
  path: string,
  options?: RequestInit & { revalidate?: number }
): Promise<T> {
  const { revalidate, ...rest } = options ?? {}
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...rest,
    headers: {
      'x-api-key': cfg.apiKey,
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Backend ${cfg.label} ${res.status}: ${txt.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}
