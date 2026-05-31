import { resolveBackendByEzeatId, fetchBackend } from '@/lib/backend-registry'

export type PaymentProviderName = 'clip' | 'mercadopago' | 'stripe' | 'conekta'

export interface PaymentProviderInfo {
  provider: PaymentProviderName
  enabled: boolean
  displayName: string
  sortOrder: number
  credentialsMasked: {
    apiKey: string
    secretKey: string
    webhookSecret: string
    publicKey: string
  }
  hasCredentials: boolean
}

export interface UpdatePaymentProviderInput {
  enabled?: boolean
  displayName?: string
  sortOrder?: number
  credentials?: Partial<{
    apiKey: string
    secretKey: string
    webhookSecret: string
    publicKey: string
  }>
}

export async function getPaymentProviders(ezeatId: string): Promise<PaymentProviderInfo[]> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  const res = await fetchBackend<{ success: boolean; data: PaymentProviderInfo[] }>(
    backend, `/internal/restaurants/${ezeatId}/payment-providers`
  )
  return res.data ?? []
}

export async function updatePaymentProvider(
  ezeatId: string,
  provider: PaymentProviderName,
  data: UpdatePaymentProviderInput
): Promise<void> {
  const backend = await resolveBackendByEzeatId(ezeatId)
  await fetchBackend(backend, `/internal/restaurants/${ezeatId}/payment-providers/${provider}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
