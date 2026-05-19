'use client'
import { useState, useTransition } from 'react'
import { saveProvider } from '@/actions/payment-providers'
import type { PaymentProviderInfo, PaymentProviderName } from '@/lib/payment-providers-client'
import { CreditCard, Wallet, Building2, Zap, Check, X } from 'lucide-react'

const PROVIDER_META: Record<PaymentProviderName, {
  label: string
  description: string
  icon: React.ReactNode
  color: string
  fields: Array<{ name: 'apiKey'|'secretKey'|'webhookSecret'|'publicKey'; label: string; placeholder: string; required?: boolean }>
}> = {
  clip: {
    label: 'Clip',
    description: 'Pasarela mexicana — checkout hospedado, tarjetas + Apple/Google Pay',
    icon: <CreditCard size={18} className="text-orange-500" />,
    color: 'border-orange-200',
    fields: [
      { name: 'apiKey', label: 'API Key', placeholder: 'pk_live_...', required: true },
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' },
    ],
  },
  mercadopago: {
    label: 'Mercado Pago',
    description: 'Checkout Pro — tarjetas, OXXO, cuenta MP',
    icon: <Wallet size={18} className="text-sky-500" />,
    color: 'border-sky-200',
    fields: [
      { name: 'secretKey', label: 'Access Token', placeholder: 'APP_USR-...', required: true },
      { name: 'publicKey', label: 'Public Key', placeholder: 'APP_USR-...' },
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: '(opcional)' },
    ],
  },
  stripe: {
    label: 'Stripe',
    description: 'Tarjetas internacionales, Apple Pay, Google Pay',
    icon: <Zap size={18} className="text-indigo-500" />,
    color: 'border-indigo-200',
    fields: [
      { name: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...', required: true },
      { name: 'publicKey', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' },
    ],
  },
  conekta: {
    label: 'Conekta SPEI',
    description: 'Transferencias bancarias mexicanas (CLABE dinámica, 48h)',
    icon: <Building2 size={18} className="text-emerald-500" />,
    color: 'border-emerald-200',
    fields: [
      { name: 'apiKey', label: 'API Key', placeholder: 'key_live_...', required: true },
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: '(opcional)' },
    ],
  },
}

export function PaymentProvidersForm({
  restaurantId,
  providers,
}: {
  restaurantId: string
  providers: PaymentProviderInfo[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {providers.map(p => (
        <ProviderCard key={p.provider} restaurantId={restaurantId} info={p} />
      ))}
    </div>
  )
}

function ProviderCard({ restaurantId, info }: { restaurantId: string; info: PaymentProviderInfo }) {
  const meta = PROVIDER_META[info.provider]
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [enabled, setEnabled] = useState(info.enabled)

  async function action(formData: FormData) {
    setMsg(null)
    formData.set('enabled', enabled ? 'on' : '')
    startTransition(async () => {
      const result = await saveProvider(restaurantId, info.provider, formData)
      if (result.ok) {
        setMsg({ ok: true, text: 'Guardado correctamente' })
      } else {
        setMsg({ ok: false, text: result.error })
      }
    })
  }

  return (
    <form action={action} className={`bg-white border-2 ${meta.color} rounded-xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
            {meta.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">{meta.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          aria-label="Habilitado"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-3 mt-4">
        <Field name="displayName" label="Nombre mostrado al cliente" defaultValue={info.displayName} placeholder={meta.label} />
        <Field name="sortOrder" label="Orden de aparición" defaultValue={String(info.sortOrder)} type="number" />

        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Credenciales</p>
          {meta.fields.map(f => (
            <Field
              key={f.name}
              name={f.name}
              label={f.label}
              defaultValue={info.credentialsMasked[f.name]}
              placeholder={f.placeholder}
              mono
              required={f.required && !info.credentialsMasked[f.name]}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        {msg && (
          <span className={`flex items-center gap-1 text-xs font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.ok ? <Check size={14} /> : <X size={14} />}
            {msg.text}
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Los campos con <code className="bg-slate-100 px-1 rounded">****xxxx</code> conservan el valor actual al guardar.
        Solo escribe el valor completo si quieres reemplazarlo.
      </p>
    </form>
  )
}

function Field({
  name, label, defaultValue, placeholder, type = 'text', mono = false, required = false,
}: {
  name: string; label: string; defaultValue?: string; placeholder?: string
  type?: string; mono?: boolean; required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue || ''}
        placeholder={placeholder}
        required={required}
        className={`w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
          mono ? 'font-mono text-xs' : ''
        }`}
      />
    </label>
  )
}
