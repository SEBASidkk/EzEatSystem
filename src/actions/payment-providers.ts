'use server'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  getPaymentProviders,
  updatePaymentProvider,
  type PaymentProviderName,
  type PaymentProviderInfo,
} from '@/lib/payment-providers-client'

async function requireSession() {
  const session = await auth()
  if (!session) throw new Error('Not authenticated')
  return session
}

export async function fetchProviders(restaurantId: string): Promise<PaymentProviderInfo[]> {
  await requireSession()
  return getPaymentProviders(restaurantId)
}

export async function saveProvider(
  restaurantId: string,
  provider: PaymentProviderName,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireSession()
    const enabled = formData.get('enabled') === 'on'
    const displayName = String(formData.get('displayName') || '')
    const sortOrder = Number(formData.get('sortOrder') || 0)

    const credentials: Record<string, string> = {}
    for (const field of ['apiKey', 'secretKey', 'webhookSecret', 'publicKey'] as const) {
      const v = String(formData.get(field) || '')
      if (v && !v.startsWith('****')) credentials[field] = v
    }

    await updatePaymentProvider(restaurantId, provider, {
      enabled,
      displayName,
      sortOrder,
      credentials,
    })
    revalidatePath(`/restaurants/${restaurantId}/payments`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
