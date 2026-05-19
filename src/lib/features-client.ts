const BASE_URL = process.env.EZEAT_API_URL
const API_KEY = process.env.EZEAT_API_KEY

export type FeatureCategory =
  | 'core' | 'pos' | 'operations' | 'finance' | 'analytics' | 'marketing' | 'admin'

export interface FeatureFlag {
  key: string
  label: string
  description: string
  category: FeatureCategory
  enabled: boolean
  price?: number
}

export interface PlanPreset {
  key: string
  label: string
  price: number
  features: string[]
  featureCount: number
}

async function fetchEzEat<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL || !API_KEY) throw new Error('Ez-eat API not configured')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Ez-eat API ${res.status}: ${txt.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export async function getFeatures(restaurantId: string): Promise<FeatureFlag[]> {
  const res = await fetchEzEat<{ success: boolean; data: FeatureFlag[] }>(
    `/internal/restaurants/${restaurantId}/features`
  )
  return res.data ?? []
}

export async function updateFeatures(
  restaurantId: string,
  features: Record<string, boolean>
): Promise<FeatureFlag[]> {
  const res = await fetchEzEat<{ success: boolean; data: FeatureFlag[] }>(
    `/internal/restaurants/${restaurantId}/features`,
    { method: 'PUT', body: JSON.stringify({ features }) }
  )
  return res.data ?? []
}

export async function getPlans(): Promise<PlanPreset[]> {
  const res = await fetchEzEat<{ success: boolean; plans: PlanPreset[] }>(`/internal/plans`)
  return res.plans ?? []
}

export async function applyPlanPreset(
  restaurantId: string,
  planKey: string
): Promise<FeatureFlag[]> {
  const res = await fetchEzEat<{ success: boolean; data: FeatureFlag[] }>(
    `/internal/restaurants/${restaurantId}/apply-plan-preset`,
    { method: 'POST', body: JSON.stringify({ planKey }) }
  )
  return res.data ?? []
}
