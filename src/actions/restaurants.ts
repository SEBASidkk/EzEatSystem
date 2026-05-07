'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRestaurants, updateRestaurantStatus } from '@/lib/ezeat-client'
import { RestaurantStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

function toDbStatus(s: string): RestaurantStatus {
  const map: Record<string, RestaurantStatus> = {
    active: RestaurantStatus.ACTIVE,
    inactive: RestaurantStatus.INACTIVE,
    suspended: RestaurantStatus.SUSPENDED,
  }
  return map[s.toLowerCase()] ?? RestaurantStatus.UNKNOWN
}

export async function listRestaurants() {
  await requireSession()
  try {
    const restaurants = await getRestaurants()
    for (const r of restaurants) {
      await prisma.restaurant.upsert({
        where: { ezeatId: r.id },
        update: { name: r.name, status: toDbStatus(r.status) },
        create: { ezeatId: r.id, name: r.name, status: toDbStatus(r.status) },
      })
    }
    return restaurants
  } catch {
    return prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  }
}

export async function getRestaurantDetail(ezeatId: string) {
  await requireSession()
  return prisma.restaurant.findFirst({ where: { ezeatId } })
}

export async function patchRestaurantStatus(ezeatId: string, status: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await updateRestaurantStatus(ezeatId, status).catch(() => null)
  await prisma.restaurant.update({ where: { ezeatId }, data: { status: toDbStatus(status) } })
  revalidatePath('/restaurants')
}

export async function updateRestaurant(id: string, formData: FormData) {
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')

  const notes        = (formData.get('notes') as string) || null
  const domain       = (formData.get('domain') as string) || null
  const contactEmail = (formData.get('contactEmail') as string) || null
  const contactPhone = (formData.get('contactPhone') as string) || null
  const rawDate      = formData.get('paymentDate') as string | null
  const paymentDate  = rawDate ? new Date(rawDate) : null

  await prisma.restaurant.update({
    where: { id },
    data: { notes, domain, contactEmail, contactPhone, paymentDate },
  })
  revalidatePath(`/restaurants/${id}`)
  revalidatePath('/restaurants')
}

export async function createRestaurant(formData: FormData) {
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')

  const name  = (formData.get('name') as string)?.trim()
  const notes = (formData.get('notes') as string) || null
  if (!name) throw new Error('Nombre requerido')

  const ezeatId = `manual-${Date.now()}`
  await prisma.restaurant.create({
    data: { name, ezeatId, status: RestaurantStatus.ACTIVE, notes },
  })
  revalidatePath('/restaurants')
}
