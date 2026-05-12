import { listClientProjects } from '@/actions/client-projects'
import { Plus, MonitorSmartphone, ExternalLink, CheckCircle2, Clock, Circle, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import type { ProjectModule } from '@/actions/client-projects'

function overallProgress(modules: ProjectModule[]) {
  if (!modules.length) return 0
  return Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)
}

export default async function ProyectosPage() {
  const projects = await listClientProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-slate-900" />
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Ez-eat</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Portales de Cliente</h1>
            <p className="text-sm text-slate-500">Gestiona el progreso visible para cada cliente.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <MonitorSmartphone size={14} className="text-slate-400" />
            <span className="font-semibold">{projects.length}</span> portales
          </div>
          <Link
            href="/proyectos/analytics"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <BarChart2 size={15} />
            Analíticas
          </Link>
          <Link
            href="/proyectos/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F172A' }}
          >
            <Plus size={15} />
            Nuevo portal
          </Link>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <MonitorSmartphone size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin portales creados</p>
          <p className="text-sm text-slate-400 mt-1">Crea el primero para compartirlo con un cliente.</p>
          <Link
            href="/proyectos/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#0F172A' }}
          >
            <Plus size={14} /> Crear portal
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {projects.map(p => {
          const modules  = p.modules as unknown as ProjectModule[]
          const progress = overallProgress(modules)
          const done     = modules.filter(m => m.status === 'completado').length
          const inProg   = modules.filter(m => m.status === 'en_progreso').length
          const pending  = modules.filter(m => m.status === 'pendiente').length

          return (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-5 transition-shadow hover:shadow-md ${p.active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-semibold text-slate-900">{p.projectName}</h2>
                    {!p.active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase">Inactivo</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{p.clientName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{p.accessCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/progreso/${p.accessCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver como cliente"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <Link
                    href={`/proyectos/${p.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Editar
                  </Link>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progreso general</span>
                  <span className="font-semibold text-slate-700">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress >= 80 ? '#10B981' : progress >= 40 ? '#3B82F6' : '#0F172A',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>{done} listo{done !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-blue-500" />
                  <span>{inProg} en progreso</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle size={12} className="text-slate-300" />
                  <span>{pending} pendiente{pending !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
