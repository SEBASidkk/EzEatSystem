import { prisma } from '@/lib/db'
import { NewTaskForm } from '@/components/tasks/new-task-form'

export const dynamic = 'force-dynamic'

export default async function NewTaskPage() {
  const members = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <NewTaskForm members={members} />
}
