'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRestaurants, updateRestaurantStatus } from '@/lib/ezeat-client'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

export async function listRestaurants() {
  await requireSession()
  try {
    const restaurants = await getRestaurants()
    for (const r of restaurants) {
      await prisma.restaurant.upsert({
        where: { ezeatId: r.id },
        update: { name: r.name, status: r.status },
        create: { ezeatId: r.id, name: r.name, status: r.status },
      })
    }
    return restaurants
  } catch {
    return prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  }
}

export async function patchRestaurantStatus(ezeatId: string, status: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await updateRestaurantStatus(ezeatId, status)
  await prisma.restaurant.update({ where: { ezeatId }, data: { status } })
  revalidatePath('/restaurants')
}
