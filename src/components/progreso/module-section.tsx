'use client'
import { useState, useTransition } from 'react'
import { CheckCircle2, Zap, Circle, ThumbsUp, ThumbsDown, MessageSquare, Send, X } from 'lucide-react'
import type { ProjectComment, ProjectApproval } from '@/actions/client-projects'

interface Module {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

const STATUS_CFG = {
  completado:  { label: 'Completado',  Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: '#10B981' },
  en_progreso: { label: 'En progreso', Icon: Zap,           color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',    bar: '#3B82F6' },
  pendiente:   { label: 'Pendiente',   Icon: Circle,         color: 'text-slate-400',  bg: 'bg-slate-50',   border: 'border-slate-200',   bar: '#CBD5E1' },
} satisfies Record<string, { label: string; Icon: React.ElementType; color: string; bg: string; border: string; bar: string }>

interface Props {
  accessCode: string
  modules: Module[]
  comments: ProjectComment[]
  approvals: ProjectApproval[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ModuleSection({ accessCode, modules, comments, approvals }: Props) {
  const [localComments, setLocalComments] = useState<ProjectComment[]>(comments)
  const [localApprovals, setLocalApprovals] = useState<ProjectApproval[]>(approvals)
  const [openComment, setOpenComment] = useState<number | null>(null)
  const [authorName, setAuthorName] = useState('')
  const [message, setMessage] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [pendingApprove, setPendingApprove] = useState<{ idx: number; status: 'approved' | 'rejected' } | null>(null)
  const [approvalAuthor, setApprovalAuthor] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function moduleComments(idx: number) {
    return localComments.filter(c => c.moduleIndex === idx).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  function moduleApproval(idx: number) {
    return localApprovals.find(a => a.moduleIndex === idx) ?? null
  }

  function submitComment(moduleIndex: number) {
    if (!authorName.trim() || !message.trim()) return
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/progreso/${accessCode}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIndex, authorName, message }),
      })
      if (!res.ok) { setError('Error al enviar. Intenta de nuevo.'); return }
      const newComment = await res.json() as ProjectComment
      setLocalComments(prev => [...prev, newComment])
      setMessage('')
      setOpenComment(null)
    })
  }

  function submitApproval(moduleIndex: number, status: 'approved' | 'rejected') {
    if (!approvalAuthor.trim()) return
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/progreso/${accessCode}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIndex, status, note: approvalNote, authorName: approvalAuthor }),
      })
      if (!res.ok) { setError('Error al enviar. Intenta de nuevo.'); return }
      const newApproval = await res.json() as ProjectApproval
      setLocalApprovals(prev => [...prev.filter(a => a.moduleIndex !== moduleIndex), newApproval])
      setPendingApprove(null)
      setApprovalNote('')
      setApprovalAuthor('')
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}

      {modules.map((mod, i) => {
        const cfg      = STATUS_CFG[mod.status] ?? STATUS_CFG.pendiente
        const Icon     = cfg.Icon
        const modCom   = moduleComments(i)
        const approval = moduleApproval(i)
        const isOpen   = openComment === i
        const isApprovePending = pendingApprove?.idx === i

        return (
          <div key={i} className={`bg-white rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${approval ? (approval.status === 'approved' ? 'border-emerald-200' : 'border-red-200') : cfg.border}`}>
            {/* Module card header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <span className="font-semibold text-slate-800 text-sm truncate">{mod.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {approval && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      approval.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {approval.status === 'approved' ? '✓ Aprobado' : '✗ Rechazado'}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Avance</span>
                  <span className="font-semibold tabular-nums" style={{ color: cfg.bar }}>{mod.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${mod.progress}%`, backgroundColor: cfg.bar }}
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                {/* Comment button */}
                <button
                  type="button"
                  onClick={() => setOpenComment(isOpen ? null : i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare size={12} />
                  {modCom.length > 0 ? `${modCom.length} comentario${modCom.length !== 1 ? 's' : ''}` : 'Comentar'}
                </button>

                {/* Approve/reject — only for completed modules */}
                {mod.status === 'completado' && !approval && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPendingApprove(isApprovePending ? null : { idx: i, status: 'approved' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <ThumbsUp size={12} /> Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingApprove(isApprovePending ? null : { idx: i, status: 'rejected' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <ThumbsDown size={12} /> Rechazar
                    </button>
                  </>
                )}

                {/* Re-evaluate if already approved/rejected */}
                {mod.status === 'completado' && approval && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalApprovals(prev => prev.filter(a => a.moduleIndex !== i))
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 ml-auto"
                  >
                    Cambiar decisión
                  </button>
                )}
              </div>
            </div>

            {/* Approval form */}
            {isApprovePending && (
              <div className={`px-5 pb-5 pt-2 border-t ${pendingApprove.status === 'approved' ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                <p className={`text-xs font-semibold mb-3 ${pendingApprove.status === 'approved' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {pendingApprove.status === 'approved' ? '✓ Confirmar aprobación' : '✗ Confirmar rechazo'}
                </p>
                <div className="space-y-2">
                  <input
                    value={approvalAuthor}
                    onChange={e => setApprovalAuthor(e.target.value)}
                    placeholder="Tu nombre *"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                  />
                  <textarea
                    value={approvalNote}
                    onChange={e => setApprovalNote(e.target.value)}
                    placeholder="Nota (opcional) — observaciones, condiciones, qué falta..."
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!approvalAuthor.trim() || isPending}
                      onClick={() => submitApproval(i, pendingApprove.status)}
                      className={`flex-1 py-2.5 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
                        pendingApprove.status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isPending ? 'Enviando…' : pendingApprove.status === 'approved' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingApprove(null)}
                      className="px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Approval details */}
            {approval && (
              <div className={`px-5 py-3 border-t text-xs ${approval.status === 'approved' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                <span className={approval.status === 'approved' ? 'text-emerald-700' : 'text-red-600'}>
                  {approval.status === 'approved' ? 'Aprobado' : 'Rechazado'} por <strong>{approval.authorName}</strong>
                  {' · '}{fmtDate(approval.date)}
                </span>
                {approval.note && <p className="text-slate-500 mt-1 italic">&ldquo;{approval.note}&rdquo;</p>}
              </div>
            )}

            {/* Comments section */}
            {isOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-3">
                {/* Existing comments */}
                {modCom.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {modCom.map(c => (
                      <div key={c.id} className="bg-white border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">{c.authorName}</span>
                          <span className="text-[10px] text-slate-400">{fmtDate(c.date)}</span>
                        </div>
                        <p className="text-sm text-slate-600">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* New comment form */}
                <div className="space-y-2">
                  <input
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Tu nombre *"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                  />
                  <div className="flex gap-2">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Escribe tu comentario sobre este módulo..."
                      rows={2}
                      className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 resize-none"
                    />
                    <button
                      type="button"
                      disabled={!authorName.trim() || !message.trim() || isPending}
                      onClick={() => submitComment(i)}
                      className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold self-end"
                    >
                      <Send size={12} />
                      {isPending ? '…' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
