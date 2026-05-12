'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Database, Cloud, CreditCard, Box,
  Building2, Save, ArrowLeft, ShieldCheck, Lock,
  KeyRound, Info, RefreshCw, Copy,
} from 'lucide-react'
import { createCredential } from '@/actions/vault'

interface Restaurant { id: string; name: string }

const CATEGORIES = [
  {
    value: 'SERVICE',
    label: 'Servicio',
    desc: 'APIs, infraestructura, SaaS',
    icon: Database,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    tip: 'Guarda aquí llaves de API, tokens OAuth, credenciales de servicios como Stripe, AWS, Twilio.',
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurante',
    desc: 'Accesos del negocio',
    icon: Cloud,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-purple-50',
    tip: 'Credenciales ligadas directamente a un restaurante o negocio afiliado.',
  },
  {
    value: 'ACCOUNT',
    label: 'Cuenta',
    desc: 'Correo + contraseña',
    icon: CreditCard,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-50',
    tip: 'Cuentas de usuario: correo electrónico, contraseñas de plataformas, paneles de administración.',
  },
  {
    value: 'OTHER',
    label: 'Otro',
    desc: 'Misc / sin categoría',
    icon: Box,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    activeBorder: 'border-slate-400',
    activeBg: 'bg-slate-50',
    tip: 'Cualquier secreto que no encaje en las categorías anteriores.',
  },
]

// ─── simple password generator ───────────────────────────────────────────────
function generatePassword(len = 24) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length])
    .join('')
}

// ─── component ───────────────────────────────────────────────────────────────

export function NewCredentialForm({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showValue, setShowValue]    = useState(false)
  const [category, setCategory]      = useState('SERVICE')
  const [valueText, setValueText]    = useState('')
  const [copied, setCopied]          = useState(false)

  const selectedCat = CATEGORIES.find(c => c.value === category)!

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

  function handleGenerate() {
    const pw = generatePassword()
    setValueText(pw)
    setShowValue(true)
  }

  async function handleCopy() {
    if (!valueText) return
    await navigator.clipboard.writeText(valueText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Nueva credencial</h1>
          <p className="text-sm text-slate-500 mt-0.5">Almacenada con cifrado AES-256-GCM</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full shrink-0">
          <ShieldCheck size={13} />
          Cifrado activo
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Left: main form (2 cols) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Category selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? cat.bg : 'bg-slate-100'}`}>
                        <Icon size={20} className={active ? cat.color : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-600'}`}>{cat.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{cat.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" name="category" value={category} />
            </div>

            {/* Main fields card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

              {/* Name */}
              <div className="px-6 py-5 border-b border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Nombre de la credencial
                </label>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="ej. Stripe API Key — Producción"
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-slate-300 transition-shadow"
                />
              </div>

              {/* Email (ACCOUNT only) */}
              {category === 'ACCOUNT' && (
                <div className="px-6 py-5 border-b border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Correo electrónico
                    <span className="ml-2 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      placeholder:text-slate-300 transition-shadow"
                  />
                </div>
              )}

              {/* Value / Secret */}
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Lock size={11} /> Valor / Secreto
                  </label>
                  <div className="flex items-center gap-2">
                    {valueText && (
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Copy size={12} />
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-medium"
                    >
                      <RefreshCw size={12} /> Generar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowValue(!showValue)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      {showValue ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showValue ? 'Ocultar' : 'Mostrar'}
                    </button>
                    {valueText.length > 0 && (
                      <span className="text-[10px] text-slate-400 tabular-nums">{valueText.length} chars</span>
                    )}
                  </div>
                </div>
                <textarea
                  name="value"
                  required
                  rows={showValue ? 5 : 3}
                  value={valueText}
                  onChange={e => setValueText(e.target.value)}
                  placeholder={showValue ? 'Pega o escribe el valor de la credencial…' : '••••••••••••••••••••••••••••••••'}
                  className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    resize-none transition-shadow ${showValue ? 'text-slate-900 font-mono' : 'text-slate-400 font-mono tracking-widest'}`}
                  style={!showValue ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : undefined}
                />
              </div>

              {/* Restaurant selector */}
              <div className="px-6 py-5 border-b border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Negocio asociado
                  <span className="ml-2 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="restaurantId"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      appearance-none cursor-pointer"
                  >
                    <option value="">Sin negocio asociado</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="px-6 py-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Notas internas
                  <span className="ml-2 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Contexto de uso, fecha de vencimiento, instrucciones, URL de panel…"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900
                    placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    resize-none transition-shadow"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
              >
                <Save size={15} />
                {isPending ? 'Guardando…' : 'Guardar credencial'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Security card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={16} className="text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Seguridad</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {[
                  'Cifrado AES-256-GCM antes de guardar',
                  'IV único por credencial',
                  'Solo admins pueden revelar el valor',
                  'Cada acceso queda registrado en auditoría',
                  'Nunca se transmite en texto claro',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Category tip */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${selectedCat.bg} rounded-lg flex items-center justify-center`}>
                  <selectedCat.icon size={16} className={selectedCat.color} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{selectedCat.label}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{selectedCat.tip}</p>
            </div>

            {/* Best practices */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-amber-600" />
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Buenas prácticas</p>
              </div>
              <ul className="space-y-2 text-xs text-amber-700">
                <li>• Usa nombres descriptivos que incluyan el entorno (prod/staging)</li>
                <li>• Registra la fecha de vencimiento en las notas</li>
                <li>• Usa el generador para contraseñas nuevas</li>
                <li>• No reutilices secretos entre clientes</li>
              </ul>
            </div>

            {/* Generator tip */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={15} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">Generador</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Genera contraseñas de 24 caracteres con símbolos, mayúsculas, minúsculas y números.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} /> Generar contraseña
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
