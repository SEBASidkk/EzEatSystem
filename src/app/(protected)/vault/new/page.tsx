import { prisma } from '@/lib/db'
import { NewCredentialForm } from '@/components/vault/new-credential-form'

export default async function NewCredentialPage() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <NewCredentialForm restaurants={restaurants} />
}
