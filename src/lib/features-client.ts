import { resolveBackendByEzeatId, fetchBackend } from '@/lib/backend-registry'

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

export async function getFeatures(ezeatId: string): Promise<FeatureFlag[]> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  const res = await fetchBackend<{ success: boolean; data: FeatureFlag[] }>(
    backend, `/internal/restaurants/${ezeatId}/features`
  )
  return res.data ?? []
}

export async function updateFeatures(
  ezeatId: string,
  features: Record<string, boolean>
): Promise<FeatureFlag[]> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  const res = await fetchBackend<{ success: boolean; data: FeatureFlag[] }>(
    backend, `/internal/restaurants/${ezeatId}/features`,
    { method: 'PUT', body: JSON.stringify({ features }) }
  )
  return res.data ?? []
}

export async function getPlans(ezeatId: string): Promise<PlanPreset[]> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  const res = await fetchBackend<{ success: boolean; plans: PlanPreset[] }>(backend, `/internal/plans`)
  return res.plans ?? []
}

export async function applyPlanPreset(
  ezeatId: string,
  planKey: string
): Promise<FeatureFlag[]> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  const res = await fetchBackend<{ success: boolean; data: FeatureFlag[] }>(
    backend, `/internal/restaurants/${ezeatId}/apply-plan-preset`,
    { method: 'POST', body: JSON.stringify({ planKey }) }
  )
  return res.data ?? []
}
