'use client'
// Print/PDF page — opened in a new tab, user clicks "Imprimir" to save as PDF
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Module { name: string; status: 'pendiente' | 'en_progreso' | 'completado'; progress: number }
interface Update  { date: string; message: string }
interface ProjectData {
  projectName: string
  clientName: string
  startDate: string
  estimatedEnd: string
  modules: Module[]
  updates: Update[]
}

const STATUS_LABEL: Record<string, string> = {
  completado:  'Completado',
  en_progreso: 'En progreso',
  pendiente:   'Pendiente',
}

function overallProgress(modules: Module[]) {
  if (!modules.length) return 0
  return Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function barColor(pct: number) {
  return pct >= 80 ? '#10b981' : pct >= 40 ? '#3b82f6' : '#0f172a'
}

export default function PrintPage() {
  const params = useParams<{ code: string }>()
  const code   = params.code
  const [data, setData] = useState<ProjectData | null>(null)
  const [err,  setErr]  = useState(false)

  useEffect(() => {
    fetch(`/api/progreso/${code}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: ProjectData) => setData(d))
      .catch(() => setErr(true))
  }, [code])

  if (err) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Proyecto no encontrado.</div>
  if (!data) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando…</div>

  const overall = overallProgress(data.modules)

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b', background: 'white', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Print button — hidden when printing */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={{ position: 'fixed', top: 20, right: 20 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🖨 Imprimir / Guardar PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: 4 }}>Ez-eat System — Reporte de proyecto</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{data.projectName}</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{data.clientName}</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 12, color: '#64748b' }}>
            <span>Inicio: {fmt(data.startDate)}</span>
            <span>Entrega est.: {fmt(data.estimatedEnd)}</span>
            <span>Generado: {fmt(new Date())}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: barColor(overall) }}>{overall}%</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>avance general</div>
        </div>
      </div>

      {/* Overall bar */}
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ height: '100%', borderRadius: 9999, width: `${overall}%`, backgroundColor: barColor(overall) }} />
      </div>

      {/* Modules */}
      <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 16 }}>Módulos del sistema</h2>
      {data.modules.map((mod, i) => (
        <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>{mod.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 9999,
              background: mod.status === 'completado' ? '#ecfdf5' : mod.status === 'en_progreso' ? '#eff6ff' : '#f8fafc',
              color: mod.status === 'completado' ? '#059669' : mod.status === 'en_progreso' ? '#2563eb' : '#94a3b8',
            }}>
              {STATUS_LABEL[mod.status]}
            </span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 9999, width: `${mod.progress}%`,
              backgroundColor: mod.status === 'completado' ? '#10b981' : mod.status === 'en_progreso' ? '#3b82f6' : '#cbd5e1',
            }} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 4 }}>{mod.progress}%</div>
        </div>
      ))}

      {/* Updates */}
      {data.updates.length > 0 && (
        <>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: '32px 0 16px' }}>Actualizaciones</h2>
          {[...data.updates].reverse().map((u, i) => (
            <div key={i} style={{ borderLeft: '3px solid #3b82f6', padding: '10px 14px', marginBottom: 10, background: '#f8fafc', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{fmt(u.date)}</p>
              <p>{u.message}</p>
            </div>
          ))}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 16, fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>Ez-eat System — Portal de progreso</span>
        <span>Código: {code}</span>
      </div>
    </div>
  )
}
