'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Database, Cloud, CreditCard, Box,
  Building2, Save, ArrowLeft, ShieldCheck, Lock,
} from 'lucide-react'
import { createCredential } from '@/actions/vault'

interface Restaurant { id: string; name: string }

const CATEGORIES = [
  { value: 'SERVICE',    label: 'Servicio',     desc: 'APIs, infraestructura',   icon: Database,    color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',   activeBorder: 'border-blue-500',   activeBg: 'bg-blue-50'   },
  { value: 'RESTAURANT', label: 'Restaurante',  desc: 'Credenciales del negocio', icon: Cloud,       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', activeBorder: 'border-purple-500', activeBg: 'bg-purple-50' },
  { value: 'ACCOUNT',    label: 'Cuenta',       desc: 'Accesos de usuario',       icon: CreditCard,  color: 'text-teal-600',  bg: 'bg-teal-50',   border: 'border-teal-200',   activeBorder: 'border-teal-500',   activeBg: 'bg-teal-50'   },
  { value: 'OTHER',      label: 'Otro',         desc: 'Misc / sin categoría',     icon: Box,         color: 'text-slate-600', bg: 'bg-slate-50',  border: 'border-slate-200',  activeBorder: 'border-slate-400',  activeBg: 'bg-slate-50'  },
]

export function NewCredentialForm({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showValue, setShowValue]   = useState(false)
  const [category, setCategory]     = useState('SERVICE')
  const [valueLength, setValueLength] = useState(0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('category', category)
    startTransition(async () => {
      await createCredential(fd)
      router.push('/vault')
      router.refresh()
    })
  }

  const selectedCat = CATEGORIES.find(c => c.value === category)!

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva credencial</h1>
          <p className="text-sm text-slate-500 mt-0.5">Almacenada con cifrado AES-256-GCM</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
          <ShieldCheck size={13} />
          Cifrado activo
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-3">
            Categoría
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer text-center ${
                    active
                      ? `${cat.activeBorder} ${cat.activeBg} shadow-sm`
                      : `${cat.border} bg-white hover:bg-slate-50`
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? cat.bg : 'bg-slate-100'}`}>
                    <Icon size={18} className={active ? cat.color : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{cat.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <input type="hidden" name="category" value={category} />
        </div>

        {/* Main fields card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Name */}
          <div className="px-5 py-4 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
              Nombre de la credencial
            </label>
            <input
              name="name"
              required
              autoFocus
              placeholder="ej. Stripe API Key Producción"
              className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 border-0 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Email (ACCOUNT only) */}
          {category === 'ACCOUNT' && (
            <div className="px-5 py-4 border-b border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
                Correo electrónico
                <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 border-0 focus:outline-none focus:ring-0"
              />
            </div>
          )}

          {/* Value */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest">
                Valor / Secreto
              </label>
              <div className="flex items-center gap-3">
                {valueLength > 0 && (
                  <span className="text-[10px] text-slate-400">{valueLength} caracteres</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {showValue ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showValue ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                name="value"
                required
                rows={showValue ? 4 : 3}
                onChange={(e) => setValueLength(e.target.value.length)}
                placeholder={showValue ? 'Ingresa el valor de la credencial...' : '••••••••••••••••••••••••••••••••'}
                className={`w-full px-0 py-1 bg-transparent text-sm border-0 focus:outline-none focus:ring-0 resize-none ${
                  showValue ? 'text-slate-900 font-mono' : 'text-slate-400 font-mono tracking-widest'
                }`}
                style={!showValue ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : undefined}
              />
              {!showValue && valueLength === 0 && (
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                  <Lock size={13} className="text-slate-300" />
                </div>
              )}
            </div>
          </div>

          {/* Restaurant selector */}
          <div className="px-5 py-4 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
              Negocio asociado
              <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                name="restaurantId"
                className="w-full pl-5 pr-3 py-1 bg-transparent text-sm text-slate-900 border-0 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="">Sin negocio asociado</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
              Notas internas
              <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Contexto, instrucciones de uso, fecha de vencimiento..."
              className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 border-0 focus:outline-none focus:ring-0 resize-none"
            />
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
          <ShieldCheck size={15} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            El valor se cifra con <span className="font-semibold text-slate-700">AES-256-GCM</span> antes de guardarse.
            Solo admins pueden verlo; otros usuarios necesitan que se les comparta explícitamente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors duration-150 cursor-pointer"
          >
            <Save size={15} />
            {isPending ? 'Guardando...' : 'Guardar credencial'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
          >
            Cancelar
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${selectedCat.bg} ${selectedCat.color} border`} style={{ backgroundColor: undefined }}>
              <div className={`w-full h-full rounded-full ${selectedCat.bg}`} />
            </div>
            <span className="text-xs text-slate-400">{selectedCat.label}</span>
          </div>
        </div>
      </form>
    </div>
  )
}
