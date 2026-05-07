import { patchRestaurantStatus, updateRestaurant } from '@/actions/restaurants'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ArrowLeft, Globe, Mail, Phone, CreditCard, Calendar, KeyRound, Database, Box } from 'lucide-react'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  ACTIVE:    { label: 'Activo',     dot: '#10B981', bg: 'bg-teal-50',   text: 'text-teal-700'  },
  active:    { label: 'Activo',     dot: '#10B981', bg: 'bg-teal-50',   text: 'text-teal-700'  },
  INACTIVE:  { label: 'Inactivo',   dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600' },
  inactive:  { label: 'Inactivo',   dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600' },
  SUSPENDED: { label: 'Suspendido', dot: '#EF4444', bg: 'bg-red-50',    text: 'text-red-600'   },
  suspended: { label: 'Suspendido', dot: '#EF4444', bg: 'bg-red-50',    text: 'text-red-600'   },
  UNKNOWN:   { label: 'Sin datos',  dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-500' },
}

const CAT_ICON: Record<string, React.ReactNode> = {
  SERVICE:    <Database size={13} className="text-blue-500" />,
  RESTAURANT: <Globe size={13} className="text-purple-500" />,
  ACCOUNT:    <CreditCard size={13} className="text-teal-500" />,
  OTHER:      <Box size={13} className="text-slate-400" />,
}

const CAT_LABEL: Record<string, string> = {
  SERVICE: 'Servicio', RESTAURANT: 'Restaurante', ACCOUNT: 'Cuenta', OTHER: 'Otro',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{value || <span className="text-slate-400">—</span>}</p>
    </div>
  )
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { role?: string })?.role

  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id }, { ezeatId: id }] },
  })

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500 text-sm">Restaurante no encontrado.</p>
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

  const statusCfg = STATUS_MAP[restaurant.status] ?? { label: 'Sin datos', dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-500' }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/restaurants"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{restaurant.name}</h1>
          {restaurant.ezeatId && (
            <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {restaurant.ezeatId}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
          {statusCfg.label}
        </span>
      </div>

      {/* Info + Contact card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Información del negocio</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado" value={statusCfg.label} />
            <Field label="Registrado" value={new Date(restaurant.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })} />
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Dominio</p>
              {restaurant.domain ? (
                <a href={`https://${restaurant.domain}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline font-mono">
                  {restaurant.domain}
                </a>
              ) : <p className="text-sm text-slate-400">—</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Próximo pago</p>
              <p className="text-sm text-slate-900">
                {restaurant.paymentDate
                  ? new Date(restaurant.paymentDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                  : <span className="text-slate-400">—</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Contacto</p>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Correo</p>
              {restaurant.contactEmail ? (
                <a href={`mailto:${restaurant.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                  {restaurant.contactEmail}
                </a>
              ) : <p className="text-sm text-slate-400">—</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Teléfono</p>
              <p className="text-sm text-slate-900">{restaurant.contactPhone || <span className="text-slate-400">—</span>}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Notas internas</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {restaurant.notes || <span className="text-slate-400">Sin notas.</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound size={15} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">Credenciales asignadas</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {credentials.length}
          </span>
        </div>
        {credentials.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <KeyRound size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Sin credenciales asignadas.</p>
            <Link href="/vault/new" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              Agregar credencial
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                {['Nombre', 'Categoría', 'Última actualización'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      {CAT_ICON[c.category] ?? CAT_ICON.OTHER}
                      {CAT_LABEL[c.category] ?? c.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(c.updatedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin section */}
      {role === 'ADMIN' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Administración</p>

          {/* Status change */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'active',    label: 'Activo',     cls: 'bg-teal-600 hover:bg-teal-700' },
                { key: 'inactive',  label: 'Inactivo',   cls: 'bg-slate-500 hover:bg-slate-600' },
                { key: 'suspended', label: 'Suspendido', cls: 'bg-red-600 hover:bg-red-700' },
              ].map((s) => (
                <form key={s.key} action={async () => {
                  'use server'
                  await patchRestaurantStatus(restaurant.ezeatId, s.key)
                }}>
                  <button type="submit"
                    className={`text-sm px-4 py-2 rounded-lg text-white font-medium transition-colors cursor-pointer ${s.cls}`}>
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {/* Edit metadata */}
          <form action={async (fd) => {
            'use server'
            await updateRestaurant(restaurant.id, fd)
          }} className="space-y-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Editar información</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Dominio
                </label>
                <input
                  name="domain"
                  defaultValue={restaurant.domain ?? ''}
                  placeholder="ejemplo.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Fecha de pago
                </label>
                <input
                  name="paymentDate"
                  type="date"
                  defaultValue={restaurant.paymentDate ? restaurant.paymentDate.toISOString().split('T')[0] : ''}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Correo de contacto
                </label>
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={restaurant.contactEmail ?? ''}
                  placeholder="contacto@negocio.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Teléfono
                </label>
                <input
                  name="contactPhone"
                  defaultValue={restaurant.contactPhone ?? ''}
                  placeholder="+52 555 000 0000"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                Notas internas
              </label>
              <textarea
                name="notes"
                defaultValue={restaurant.notes ?? ''}
                rows={3}
                placeholder="Observaciones, instrucciones, historial..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <button type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer">
              Guardar cambios
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
