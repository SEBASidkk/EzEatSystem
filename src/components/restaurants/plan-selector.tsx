'use client'
import { useState, useTransition } from 'react'
import { applyPreset } from '@/actions/features'
import type { PlanPreset, FeatureFlag } from '@/lib/features-client'
import { Zap, Check, Loader2, AlertTriangle } from 'lucide-react'

const PLAN_COLORS: Record<string, string> = {
  'food-truck':   'border-orange-300 bg-orange-50',
  'emprendedor':  'border-sky-300 bg-sky-50',
  'dark-kitchen': 'border-slate-400 bg-slate-100',
  'escalamiento': 'border-purple-300 bg-purple-50',
  'hoteles':      'border-amber-300 bg-amber-50',
  'corporativo':  'border-emerald-300 bg-emerald-50',
}

export function PlanSelector({
  restaurantId,
  prismaRestaurantId,
  plans,
  onApplied,
}: {
  restaurantId: string
  prismaRestaurantId: string
  plans: PlanPreset[]
  onApplied?: (data: FeatureFlag[]) => void
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function applyPlan(planKey: string) {
    setMsg(null)
    startTransition(async () => {
      const result = await applyPreset(restaurantId, planKey, prismaRestaurantId)
      setConfirming(null)
      if (result.ok) {
        setMsg({ ok: true, text: `Plan aplicado: ${plans.find(p => p.key === planKey)?.label}` })
        onApplied?.(result.data)
      } else {
        setMsg({ ok: false, text: result.error })
      }
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Zap size={16} className="text-amber-500" />
        <h2 className="text-sm font-semibold text-slate-800">Aplicar Plan Preconfigurado</h2>
        <span className="text-xs text-slate-400">— sobrescribe todas las funciones</span>
      </div>

      {msg && (
        <div className={`mx-6 mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
          msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6">
        {plans.map(plan => (
          <div
            key={plan.key}
            className={`border-2 rounded-xl p-3 transition-all ${PLAN_COLORS[plan.key] || 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">{plan.label}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              {plan.price > 0 ? (
                <><strong className="text-base text-slate-900">${plan.price.toLocaleString()}</strong> MXN/mes</>
              ) : (
                <em>Personalizado</em>
              )}
            </p>
            <p className="text-[10px] text-slate-500 mb-3">{plan.featureCount} funciones</p>

            {confirming === plan.key ? (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-700 leading-tight">
                  Esto reemplazará TODAS las funciones actuales. ¿Continuar?
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => applyPlan(plan.key)}
                    disabled={pending}
                    className="flex-1 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Sí, aplicar
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(plan.key)}
                disabled={pending}
                className="w-full px-2 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-medium rounded transition-colors disabled:opacity-50"
              >
                Aplicar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
