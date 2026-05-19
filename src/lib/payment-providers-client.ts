const BASE_URL = process.env.EZEAT_API_URL
const API_KEY = process.env.EZEAT_API_KEY

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

export async function getPaymentProviders(restaurantId: string): Promise<PaymentProviderInfo[]> {
  const res = await fetchEzEat<{ success: boolean; data: PaymentProviderInfo[] }>(
    `/internal/restaurants/${restaurantId}/payment-providers`
  )
  return res.data ?? []
}

export async function updatePaymentProvider(
  restaurantId: string,
  provider: PaymentProviderName,
  data: UpdatePaymentProviderInput
): Promise<void> {
  await fetchEzEat(`/internal/restaurants/${restaurantId}/payment-providers/${provider}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
