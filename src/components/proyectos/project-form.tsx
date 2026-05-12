'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Plus, Trash2, Link2, AlertCircle,
  ChevronDown, ChevronUp, Calendar, User, Hash,
  Phone, Mail, MessageCircle, Video, Hash as SlackIcon, Globe,
} from 'lucide-react'
import type { ProjectModule, ProjectUpdate, GanttTask, ProjectContact, ProjectCommunication } from '@/actions/client-projects'
import { GanttEditor } from './gantt-editor'

const STATUS_OPTIONS = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#94A3B8' },
  { value: 'en_progreso', label: 'En progreso', color: '#3B82F6' },
  { value: 'completado',  label: 'Completado',  color: '#10B981' },
]

const COMM_TYPES: { value: ProjectCommunication['type']; label: string; icon: React.ElementType; placeholder: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+52 555 000 0000' },
  { value: 'email',    label: 'Email',    icon: Mail,          placeholder: 'equipo@ezeat.com'  },
  { value: 'phone',    label: 'Teléfono', icon: Phone,         placeholder: '+52 555 000 0000'  },
  { value: 'slack',    label: 'Slack',    icon: SlackIcon,     placeholder: '#canal o @usuario' },
  { value: 'meet',     label: 'Meet',     icon: Video,         placeholder: 'https://meet.google.com/...' },
  { value: 'teams',    label: 'Teams',    icon: Video,         placeholder: 'https://teams.microsoft.com/...' },
  { value: 'other',    label: 'Otro',     icon: Globe,         placeholder: 'URL o dato de contacto' },
]

interface Props {
  mode: 'new' | 'edit'
  initialData?: {
    id: string
    accessCode: string
    clientName: string
    projectName: string
    startDate: Date
    estimatedEnd: Date
    modules: ProjectModule[]
    updates: ProjectUpdate[]
    gantt: GanttTask[]
    active: boolean
    contacts: ProjectContact[]
    communications: ProjectCommunication[]
  }
  onSubmit: (data: {
    accessCode: string
    clientName: string
    projectName: string
    startDate: string
    estimatedEnd: string
    modules: ProjectModule[]
    updates: ProjectUpdate[]
    gantt: GanttTask[]
    active: boolean
    contacts: ProjectContact[]
    communications: ProjectCommunication[]
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

function toInputDate(d: Date) {
  return new Date(d).toISOString().substring(0, 10)
}

function FieldLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      {children}
    </label>
  )
}

function InputField({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
        transition-shadow ${props.className ?? ''}`}
    />
  )
}

export function ProjectForm({ mode, initialData, onSubmit, onDelete }: Props) {
  const router = useRouter()
  const [isPending,  startTransition] = useTransition()
  const [isDeleting, startDelete]     = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [accessCode,      setAccessCode]      = useState(initialData?.accessCode   ?? '')
  const [clientName,      setClientName]      = useState(initialData?.clientName   ?? '')
  const [projectName,     setProjectName]     = useState(initialData?.projectName  ?? '')
  const [startDate,       setStartDate]       = useState(initialData ? toInputDate(initialData.startDate)    : '')
  const [estimatedEnd,    setEstimatedEnd]    = useState(initialData ? toInputDate(initialData.estimatedEnd) : '')
  const [active,          setActive]          = useState(initialData?.active ?? true)
  const [modules,         setModules]         = useState<ProjectModule[]>(initialData?.modules ?? [])
  const [updates,         setUpdates]         = useState<ProjectUpdate[]>(initialData?.updates ?? [])
  const [gantt,           setGantt]           = useState<GanttTask[]>(initialData?.gantt ?? [])
  const [contacts,        setContacts]        = useState<ProjectContact[]>(initialData?.contacts ?? [])
  const [communications,  setCommunications]  = useState<ProjectCommunication[]>(initialData?.communications ?? [])

  function addModule() {
    setModules(prev => [...prev, { name: '', status: 'pendiente', progress: 0 }])
  }
  function updateModule(i: number, patch: Partial<ProjectModule>) {
    setModules(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  }
  function removeModule(i: number) {
    setModules(prev => prev.filter((_, idx) => idx !== i))
  }
  function moveModule(i: number, dir: -1 | 1) {
    const next = [...modules]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    setModules(next)
  }

  function addUpdate() {
    setUpdates(prev => [{ date: new Date().toISOString(), message: '' }, ...prev])
  }
  function updateEntry(i: number, patch: Partial<ProjectUpdate>) {
    setUpdates(prev => prev.map((u, idx) => idx === i ? { ...u, ...patch } : u))
  }
  function removeUpdate(i: number) {
    setUpdates(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await onSubmit({ accessCode, clientName, projectName, startDate, estimatedEnd, modules, updates, gantt, active, contacts, communications })
      router.push('/proyectos')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!onDelete) return
    startDelete(async () => {
      await onDelete()
      router.push('/proyectos')
      router.refresh()
    })
  }

  const publicUrl = accessCode ? `/progreso/${accessCode}` : null

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'new' ? 'Nuevo portal de cliente' : 'Editar portal de cliente'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {mode === 'new'
              ? 'Genera un link de acceso personalizado para tu cliente'
              : 'Actualiza el progreso y los módulos del proyecto'}
          </p>
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Portal</span>
            <button
              type="button"
              onClick={() => setActive(v => !v)}
              className={`relative rounded-full transition-colors shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
              style={{ height: '26px', width: '48px' }}
            >
              <span className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-[22px]' : ''}`} />
            </button>
            <span className={`text-xs font-semibold ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
              {active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN — main info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sección: Información básica */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Información del proyecto</p>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <FieldLabel icon={<Hash size={12} />}>Código de acceso</FieldLabel>
                  <InputField
                    required
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase().replace(/\s/g, '-'))}
                    placeholder="ej. QUEFRESA-2026"
                    disabled={mode === 'edit'}
                  />
                  {publicUrl && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      <Link2 size={11} />
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}${publicUrl}`}
                    </a>
                  )}
                </div>

                <div>
                  <FieldLabel icon={<User size={12} />}>Nombre del cliente</FieldLabel>
                  <InputField
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="ej. QueFresa"
                  />
                </div>

                <div>
                  <FieldLabel>Nombre del proyecto</FieldLabel>
                  <InputField
                    required
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="ej. Portal Operativo"
                  />
                </div>

                <div>
                  <FieldLabel icon={<Calendar size={12} />}>Fecha de inicio</FieldLabel>
                  <InputField
                    required
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel icon={<Calendar size={12} />}>Entrega estimada</FieldLabel>
                  <InputField
                    required
                    type="date"
                    value={estimatedEnd}
                    onChange={e => setEstimatedEnd(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>
            </section>

            {/* Sección: Módulos */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Módulos del proyecto</p>
                  <p className="text-xs text-slate-400 mt-0.5">Cada módulo representa una funcionalidad entregable</p>
                </div>
                <button
                  type="button"
                  onClick={addModule}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} />
                  Agregar módulo
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Plus size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Sin módulos todavía</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega los módulos que forman el proyecto</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {modules.map((mod, i) => {
                    const statusCfg = STATUS_OPTIONS.find(s => s.value === mod.status) ?? STATUS_OPTIONS[0]!
                    return (
                      <div key={i} className="p-6 space-y-4">
                        {/* Module header */}
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2 h-2 rounded-full mt-2 shrink-0 transition-colors"
                            style={{ backgroundColor: statusCfg.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              required
                              value={mod.name}
                              onChange={e => updateModule(i, { name: e.target.value })}
                              placeholder="Nombre del módulo"
                              className="w-full text-base font-semibold text-slate-900 bg-transparent border-0
                                focus:outline-none placeholder:text-slate-300 focus:placeholder:text-slate-200"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveModule(i, -1)}
                              disabled={i === 0}
                              className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveModule(i, 1)}
                              disabled={i === modules.length - 1}
                              className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeModule(i)}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors ml-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Status + Progress */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-5">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Estado</label>
                            <div className="flex gap-2">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => updateModule(i, { status: opt.value as ProjectModule['status'] })}
                                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                                    mod.status === opt.value
                                      ? 'text-white border-transparent shadow-sm'
                                      : 'text-slate-500 border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                  style={mod.status === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Avance</label>
                              <span
                                className="text-sm font-bold tabular-nums"
                                style={{ color: statusCfg.color }}
                              >
                                {mod.progress}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={mod.progress}
                              onChange={e => updateModule(i, { progress: Number(e.target.value) })}
                              className="w-full h-2 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: statusCfg.color }}
                            />
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${mod.progress}%`, backgroundColor: statusCfg.color }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Sección: Actualizaciones */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Actualizaciones para el cliente</p>
                  <p className="text-xs text-slate-400 mt-0.5">El cliente verá estas notas en su portal</p>
                </div>
                <button
                  type="button"
                  onClick={addUpdate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} />
                  Nueva actualización
                </button>
              </div>

              {updates.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Sin actualizaciones</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega notas de progreso para que el cliente vea el avance</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {updates.map((u, i) => (
                    <div key={i} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-1 bg-blue-400 rounded-full self-stretch shrink-0 min-h-[60px]" />
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="date"
                              value={u.date.split('T')[0]}
                              onChange={e => updateEntry(i, { date: new Date(e.target.value + 'T12:00:00').toISOString() })}
                              className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200
                                rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <textarea
                            required
                            rows={3}
                            value={u.message}
                            onChange={e => updateEntry(i, { message: e.target.value })}
                            placeholder="Describe qué avanzó, qué se entregó o qué viene..."
                            className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl
                              px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              placeholder:text-slate-400 resize-y min-h-[80px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUpdate(i)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1 shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Sección: Contactos del cliente ─────────────────── */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Contactos del cliente</p>
                  <p className="text-xs text-slate-400 mt-0.5">Personas del lado del cliente que siguen el proyecto</p>
                </div>
                <button
                  type="button"
                  onClick={() => setContacts(prev => [...prev, { name: '', email: '', phone: '', role: '' }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} /> Agregar contacto
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <User size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin contactos registrados</p>
                  <p className="text-xs text-slate-300 mt-1">Agrega las personas clave del lado del cliente</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contacts.map((c, i) => (
                    <div key={i} className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Contacto {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Nombre *</label>
                          <input
                            required
                            value={c.name}
                            onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                            placeholder="Nombre completo"
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300 transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Rol / Cargo</label>
                          <input
                            value={c.role ?? ''}
                            onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))}
                            placeholder="ej. CEO, Project Manager"
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300 transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Correo</label>
                          <input
                            type="email"
                            value={c.email ?? ''}
                            onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))}
                            placeholder="correo@empresa.com"
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300 transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Teléfono / WhatsApp</label>
                          <input
                            value={c.phone ?? ''}
                            onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))}
                            placeholder="+52 555 000 0000"
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300 transition-shadow"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Sección: Formas de contacto Ez-eat ─────────────── */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Contacto con el equipo Ez-eat</p>
                  <p className="text-xs text-slate-400 mt-0.5">El cliente verá estos canales en su portal para comunicarse</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCommunications(prev => [...prev, { type: 'whatsapp', label: 'WhatsApp', value: '' }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} /> Agregar canal
                </button>
              </div>

              {communications.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <MessageCircle size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin canales configurados</p>
                  <p className="text-xs text-slate-300 mt-1">Agrega cómo puede contactar el cliente al equipo</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {communications.map((comm, i) => {
                    const typeCfg = COMM_TYPES.find(t => t.value === comm.type) ?? COMM_TYPES[0]!
                    const Icon = typeCfg.icon
                    return (
                      <div key={i} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Icon size={18} className="text-slate-500" />
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Canal</label>
                              <select
                                value={comm.type}
                                onChange={e => {
                                  const t = COMM_TYPES.find(x => x.value === e.target.value) ?? COMM_TYPES[0]!
                                  setCommunications(prev => prev.map((x, idx) => idx === i ? { ...x, type: t.value, label: t.label } : x))
                                }}
                                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                              >
                                {COMM_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Etiqueta visible</label>
                              <input
                                value={comm.label}
                                onChange={e => setCommunications(prev => prev.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                                placeholder="ej. Soporte Ez-eat"
                                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Valor / Link</label>
                              <input
                                required
                                value={comm.value}
                                onChange={e => setCommunications(prev => prev.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                                placeholder={typeCfg.placeholder}
                                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCommunications(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6 shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Gantt */}
            <GanttEditor tasks={gantt} onChange={setGantt} />
          </div>

          {/* RIGHT COLUMN — sidebar de contexto */}
          <div className="space-y-6">

            {/* Actions card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                  text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800
                  disabled:opacity-60 transition-colors"
              >
                <Save size={16} />
                {isPending ? 'Guardando...' : mode === 'new' ? 'Crear portal' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full px-5 py-3 rounded-xl text-sm font-medium text-slate-600
                  border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              {onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                    text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar portal
                </button>
              )}
              {showDeleteConfirm && (
                <div className="border border-red-200 rounded-xl bg-red-50 p-4 space-y-3">
                  <p className="text-xs text-red-700 font-medium">¿Eliminar este portal? Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                    >
                      {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">Resumen</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Módulos</span>
                  <span className="font-semibold text-slate-900">{modules.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Completados</span>
                  <span className="font-semibold text-emerald-600">
                    {modules.filter(m => m.status === 'completado').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">En progreso</span>
                  <span className="font-semibold text-blue-600">
                    {modules.filter(m => m.status === 'en_progreso').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Actualizaciones</span>
                  <span className="font-semibold text-slate-900">{updates.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tareas Gantt</span>
                  <span className="font-semibold text-slate-900">{gantt.length}</span>
                </div>
                {modules.length > 0 && (
                  <>
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Avance total</span>
                        <span className="font-bold text-slate-900">
                          {Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Link público */}
            {publicUrl && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Link del cliente</p>
                <p className="text-xs text-blue-600 font-mono break-all">{publicUrl}</p>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  <Link2 size={11} />
                  Abrir vista de cliente
                </a>
              </div>
            )}

            {mode === 'edit' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Portal activo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {active ? 'El cliente puede ver su progreso' : 'El cliente verá error 404'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(v => !v)}
                    className={`relative rounded-full transition-colors shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    style={{ height: '26px', width: '48px' }}
                  >
                    <span className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-[22px]' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
