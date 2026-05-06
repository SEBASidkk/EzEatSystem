const BASE_URL = process.env.EZEAT_API_URL
const API_KEY = process.env.EZEAT_API_KEY

export interface EzEatRestaurant {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  createdAt: string
}

async function fetchEzEat<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL || !API_KEY) throw new Error('Ez-eat API not configured')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json', ...options?.headers },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Ez-eat API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getRestaurants(): Promise<EzEatRestaurant[]> {
  const res = await fetchEzEat<{ success: boolean; data: EzEatRestaurant[] }>('/internal/restaurants')
  return res.data ?? []
}

export async function getRestaurant(id: string): Promise<EzEatRestaurant> {
  return fetchEzEat<EzEatRestaurant>(`/internal/restaurants/${id}`)
}

export async function updateRestaurantStatus(id: string, status: string): Promise<void> {
  await fetchEzEat(`/internal/restaurants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    next: { revalidate: 0 },
  })
}
