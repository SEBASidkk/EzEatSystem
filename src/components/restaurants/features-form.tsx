'use client'
import { useState, useTransition } from 'react'
import { saveFeatures } from '@/actions/features'
import type { FeatureFlag, FeatureCategory } from '@/lib/features-client'
import {
  Zap, Monitor, Truck, Boxes, Receipt, BarChart3, Sparkles,
  Tag, Users, Settings, Check, X, ShoppingBag, CreditCard,
} from 'lucide-react'

const CATEGORY_META: Record<FeatureCategory, { label: string; icon: React.ReactNode; color: string }> = {
  core:        { label: 'Esenciales',  icon: <ShoppingBag size={14} />, color: 'text-slate-700 bg-slate-100' },
  pos:         { label: 'Punto de venta', icon: <Monitor size={14} />,  color: 'text-blue-700 bg-blue-100' },
  operations:  { label: 'Operaciones', icon: <Truck size={14} />,       color: 'text-orange-700 bg-orange-100' },
  finance:     { label: 'Finanzas',    icon: <Receipt size={14} />,     color: 'text-emerald-700 bg-emerald-100' },
  analytics:   { label: 'Analítica',   icon: <BarChart3 size={14} />,   color: 'text-purple-700 bg-purple-100' },
  marketing:   { label: 'Marketing',   icon: <Tag size={14} />,         color: 'text-pink-700 bg-pink-100' },
  admin:       { label: 'Administración', icon: <Users size={14} />,    color: 'text-amber-700 bg-amber-100' },
}

const CATEGORY_ORDER: FeatureCategory[] = ['core', 'pos', 'operations', 'finance', 'analytics', 'marketing', 'admin']

export function FeaturesForm({
  restaurantId,
  prismaRestaurantId,
  initialFeatures,
}: {
  restaurantId: string
  prismaRestaurantId: string
  initialFeatures: FeatureFlag[]
}) {
  const [features, setFeatures] = useState(initialFeatures)
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function toggle(key: string) {
    setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
    setDirty(prev => {
      const next = { ...prev }
      const original = initialFeatures.find(f => f.key === key)?.enabled
      const current = !features.find(f => f.key === key)?.enabled
      if (current === original) delete next[key]
      else next[key] = current
      return next
    })
    setMsg(null)
  }

  function save() {
    if (Object.keys(dirty).length === 0) return
    setMsg(null)
    startTransition(async () => {
      const result = await saveFeatures(restaurantId, dirty, prismaRestaurantId)
      if (result.ok) {
        setMsg({ ok: true, text: `${Object.keys(dirty).length} función(es) actualizadas` })
        setDirty({})
      } else {
        setMsg({ ok: false, text: result.error })
      }
    })
  }

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    features: features.filter(f => f.category === cat),
  })).filter(g => g.features.length > 0)

  const dirtyCount = Object.keys(dirty).length

  return (
    <div className="space-y-6">
      {dirtyCount > 0 && (
        <div className="sticky top-0 z-10 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
          <p className="text-sm text-amber-900">
            <strong>{dirtyCount}</strong> cambio(s) sin guardar
          </p>
          <button
            onClick={save}
            disabled={pending}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.ok ? <Check size={16} /> : <X size={16} />}
          {msg.text}
        </div>
      )}

      {grouped.map(g => {
        const meta = CATEGORY_META[g.category]
        return (
          <div key={g.category} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                {meta.icon} {meta.label}
              </span>
              <span className="text-xs text-slate-400">{g.features.length} función(es)</span>
            </div>
            <div className="divide-y divide-slate-50">
              {g.features.map(f => (
                <FeatureRow key={f.key} feature={f} dirty={dirty[f.key] !== undefined} onToggle={() => toggle(f.key)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FeatureRow({
  feature, dirty, onToggle,
}: {
  feature: FeatureFlag; dirty: boolean; onToggle: () => void
}) {
  return (
    <div className={`flex items-start gap-3 px-6 py-4 ${dirty ? 'bg-amber-50/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{feature.label}</p>
          {dirty && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">MODIFICADO</span>}
          <code className="text-[10px] text-slate-400 font-mono">{feature.key}</code>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          feature.enabled ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
        aria-label={feature.label}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            feature.enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
