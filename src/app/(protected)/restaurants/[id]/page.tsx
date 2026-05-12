import { patchRestaurantStatus, updateRestaurant } from '@/actions/restaurants'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  ArrowLeft, Globe, Mail, Phone, CreditCard, Calendar,
  KeyRound, Database, Box, Building2, Clock, ExternalLink,
  ShieldAlert, Pencil,
} from 'lucide-react'
import Link from 'next/link'

// ─── config ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  ACTIVE:    { label: 'Activo',     dot: '#10B981', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'  },
  active:    { label: 'Activo',     dot: '#10B981', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'  },
  INACTIVE:  { label: 'Inactivo',   dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-200' },
  inactive:  { label: 'Inactivo',   dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-200' },
  SUSPENDED: { label: 'Suspendido', dot: '#EF4444', bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'   },
  suspended: { label: 'Suspendido', dot: '#EF4444', bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'   },
}

const CAT_ICON: Record<string, React.ReactNode> = {
  SERVICE:    <Database size={13} className="text-blue-500" />,
  RESTAURANT: <Globe    size={13} className="text-purple-500" />,
  ACCOUNT:    <CreditCard size={13} className="text-teal-500" />,
  OTHER:      <Box      size={13} className="text-slate-400" />,
}

const CAT_LABEL: Record<string, string> = {
  SERVICE: 'Servicio', RESTAURANT: 'Restaurante', ACCOUNT: 'Cuenta', OTHER: 'Otro',
}

// ─── sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        placeholder:text-slate-300 transition-shadow disabled:bg-slate-50 disabled:text-slate-400"
    />
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { role?: string })?.role

  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id }, { ezeatId: id }] },
  })

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 size={36} className="text-slate-200 mb-3" />
        <p className="text-slate-500 font-medium">Restaurante no encontrado</p>
        <Link href="/restaurants" className="mt-3 text-xs text-blue-600 hover:underline">
          Volver al directorio
        </Link>
      </div>
    )
  }

  const credentials = await prisma.credential.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true, name: true, category: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const statusCfg = STATUS_MAP[restaurant.status] ?? {
    label: 'Sin datos', dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200',
  }

  const isPaymentSoon = restaurant.paymentDate
    ? (restaurant.paymentDate.getTime() - Date.now()) < 7 * 86_400_000
    : false

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          href="/restaurants"
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 truncate">{restaurant.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
              {statusCfg.label}
            </span>
          </div>
          {restaurant.ezeatId && (
            <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {restaurant.ezeatId}</p>
          )}
        </div>
        {restaurant.domain && (
          <a
            href={`https://${restaurant.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <ExternalLink size={13} /> Ver sitio
          </a>
        )}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: info + credentials (2 cols) ──────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Business info card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Información del negocio</p>
            </div>
            <div className="px-6">
              <InfoRow icon={<Globe size={15} className="text-blue-500" />} label="Dominio / Sitio web">
                {restaurant.domain ? (
                  <a href={`https://${restaurant.domain}`} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono flex items-center gap-1.5">
                    {restaurant.domain} <ExternalLink size={12} />
                  </a>
                ) : <span className="text-slate-400">—</span>}
              </InfoRow>

              <InfoRow icon={<Calendar size={15} className={isPaymentSoon ? 'text-amber-500' : 'text-slate-400'} />} label="Próximo pago">
                {restaurant.paymentDate ? (
                  <span className={isPaymentSoon ? 'text-amber-600 font-semibold' : ''}>
                    {restaurant.paymentDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {isPaymentSoon && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Próximo</span>}
                  </span>
                ) : <span className="text-slate-400">—</span>}
              </InfoRow>

              <InfoRow icon={<Clock size={15} className="text-slate-400" />} label="Registrado">
                {restaurant.createdAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </InfoRow>
            </div>
          </div>

          {/* Contact card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <Phone size={15} className="text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Contacto</p>
            </div>
            <div className="px-6">
              <InfoRow icon={<Mail size={15} className="text-teal-500" />} label="Correo electrónico">
                {restaurant.contactEmail ? (
                  <a href={`mailto:${restaurant.contactEmail}`} className="text-blue-600 hover:underline">
                    {restaurant.contactEmail}
                  </a>
                ) : <span className="text-slate-400">—</span>}
              </InfoRow>

              <InfoRow icon={<Phone size={15} className="text-slate-400" />} label="Teléfono">
                {restaurant.contactPhone ? (
                  <a href={`tel:${restaurant.contactPhone}`} className="hover:text-blue-600 transition-colors">
                    {restaurant.contactPhone}
                  </a>
                ) : <span className="text-slate-400">—</span>}
              </InfoRow>

              {restaurant.notes && (
                <InfoRow icon={<Pencil size={15} className="text-slate-400" />} label="Notas internas">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{restaurant.notes}</p>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Credentials table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <KeyRound size={15} className="text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Credenciales asignadas</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {credentials.length}
                </span>
                <Link
                  href="/vault/new"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  + Agregar
                </Link>
              </div>
            </div>
            {credentials.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <KeyRound size={28} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-400">Sin credenciales asignadas</p>
                <p className="text-xs text-slate-300 mt-1 mb-4">Agrega credenciales de este negocio al vault</p>
                <Link
                  href="/vault/new"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
                >
                  <KeyRound size={12} /> Agregar credencial
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    {['Nombre', 'Categoría', 'Última actualización'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 1 ? 'bg-slate-50/20' : ''}`}
                    >
                      <td className="px-6 py-3.5 font-medium text-slate-900">{c.name}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          {CAT_ICON[c.category] ?? CAT_ICON.OTHER}
                          {CAT_LABEL[c.category] ?? c.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">
                        {c.updatedAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Quick stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Resumen</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">Estado</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusCfg.text}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">Credenciales</span>
                <span className="text-xs font-semibold text-slate-800">{credentials.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">Registrado</span>
                <span className="text-xs text-slate-600">
                  {restaurant.createdAt.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              {restaurant.paymentDate && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-500">Próximo pago</span>
                  <span className={`text-xs font-semibold ${isPaymentSoon ? 'text-amber-600' : 'text-slate-600'}`}>
                    {restaurant.paymentDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin: status change */}
          {role === 'ADMIN' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={14} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Estado del negocio</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'active',    label: 'Marcar Activo',     dot: '#10B981', cls: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100' },
                  { key: 'inactive',  label: 'Marcar Inactivo',   dot: '#94A3B8', cls: 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100' },
                  { key: 'suspended', label: 'Suspender',          dot: '#EF4444', cls: 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' },
                ].map((s) => (
                  <form key={s.key} action={async () => {
                    'use server'
                    await patchRestaurantStatus(restaurant.ezeatId, s.key)
                  }}>
                    <button
                      type="submit"
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border rounded-xl transition-colors cursor-pointer ${s.cls}`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                      {s.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Admin: edit form */}
          {role === 'ADMIN' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Pencil size={14} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Editar información</p>
              </div>
              <form
                action={async (fd) => {
                  'use server'
                  await updateRestaurant(restaurant.id, fd)
                }}
                className="p-5 space-y-4"
              >
                <div>
                  <FieldLabel>Dominio</FieldLabel>
                  <InputField name="domain" defaultValue={restaurant.domain ?? ''} placeholder="ejemplo.com" />
                </div>
                <div>
                  <FieldLabel>Correo de contacto</FieldLabel>
                  <InputField name="contactEmail" type="email" defaultValue={restaurant.contactEmail ?? ''} placeholder="contacto@negocio.com" />
                </div>
                <div>
                  <FieldLabel>Teléfono</FieldLabel>
                  <InputField name="contactPhone" defaultValue={restaurant.contactPhone ?? ''} placeholder="+52 555 000 0000" />
                </div>
                <div>
                  <FieldLabel>Fecha de pago</FieldLabel>
                  <InputField
                    name="paymentDate"
                    type="date"
                    defaultValue={restaurant.paymentDate ? restaurant.paymentDate.toISOString().split('T')[0] : ''}
                  />
                </div>
                <div>
                  <FieldLabel>Notas internas</FieldLabel>
                  <textarea
                    name="notes"
                    defaultValue={restaurant.notes ?? ''}
                    rows={3}
                    placeholder="Observaciones, instrucciones, historial…"
                    className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      placeholder:text-slate-300 resize-none transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Guardar cambios
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
