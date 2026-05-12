import { ProjectForm } from '@/components/proyectos/project-form'
import { createClientProject } from '@/actions/client-projects'
import { redirect } from 'next/navigation'

export default function NewProyectoPage() {
  async function handleCreate(data: Parameters<typeof createClientProject>[0] & { active?: boolean }) {
    'use server'
    await createClientProject(data)
    redirect('/proyectos')
  }

  return <ProjectForm mode="new" onSubmit={handleCreate} />
}
