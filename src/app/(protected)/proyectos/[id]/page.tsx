import { getClientProject, updateClientProject, deleteClientProject } from '@/actions/client-projects'
import { ProjectForm } from '@/components/proyectos/project-form'
import { notFound, redirect } from 'next/navigation'
import type { ProjectModule, ProjectUpdate, GanttTask, ProjectContact, ProjectCommunication } from '@/actions/client-projects'

export default async function EditProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getClientProject(id)
  if (!project) notFound()

  async function handleUpdate(data: Parameters<typeof updateClientProject>[1]) {
    'use server'
    await updateClientProject(id, data)
    redirect('/proyectos')
  }

  async function handleDelete() {
    'use server'
    await deleteClientProject(id)
    redirect('/proyectos')
  }

  return (
    <ProjectForm
      mode="edit"
      initialData={{
        id:           project.id,
        accessCode:   project.accessCode,
        clientName:   project.clientName,
        projectName:  project.projectName,
        startDate:    project.startDate,
        estimatedEnd: project.estimatedEnd,
        modules:        project.modules        as unknown as ProjectModule[],
        updates:        project.updates        as unknown as ProjectUpdate[],
        gantt:          (project.gantt ?? [])  as unknown as GanttTask[],
        active:         project.active,
        contacts:       (project.contacts       ?? []) as unknown as ProjectContact[],
        communications: (project.communications ?? []) as unknown as ProjectCommunication[],
      }}
      onSubmit={handleUpdate}
      onDelete={handleDelete}
    />
  )
}
