'use server'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getFeatures, updateFeatures, getPlans, applyPlanPreset, type FeatureFlag, type PlanPreset } from '@/lib/features-client'

async function requireSession() {
  const session = await auth()
  if (!session) throw new Error('Not authenticated')
  return session
}

export async function fetchFeatures(restaurantId: string): Promise<FeatureFlag[]> {
  await requireSession()
  return getFeatures(restaurantId)
}

export async function saveFeatures(
  restaurantId: string,
  features: Record<string, boolean>,
  prismaRestaurantId: string
): Promise<{ ok: true; data: FeatureFlag[] } | { ok: false; error: string }> {
  try {
    await requireSession()
    const data = await updateFeatures(restaurantId, features)
    revalidatePath(`/restaurants/${prismaRestaurantId}/features`)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function fetchPlans(): Promise<PlanPreset[]> {
  await requireSession()
  return getPlans()
}

export async function applyPreset(
  restaurantId: string,
  planKey: string,
  prismaRestaurantId: string
): Promise<{ ok: true; data: FeatureFlag[] } | { ok: false; error: string }> {
  try {
    await requireSession()
    const data = await applyPlanPreset(restaurantId, planKey)
    revalidatePath(`/restaurants/${prismaRestaurantId}/features`)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
