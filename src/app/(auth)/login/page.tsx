'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Utensils, Lock, Mail } from 'lucide-react'
import { checkCredentials } from '@/actions/auth-check'

type Step = 'credentials' | 'totp'

export default function LoginPage() {
  const router = useRouter()
  const [step,          setStep]          = useState<Step>('credentials')
  const [savedEmail,    setSavedEmail]    = useState('')
  const [savedPassword, setSavedPassword] = useState('')
  const [rememberMe,    setRememberMe]    = useState(true)
  const [error,         setError]         = useState('')
  const [showPass,      setShowPass]      = useState(false)
  const [isPending,     startTransition]  = useTransition()

  function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const email    = fd.get('email')    as string
    const password = fd.get('password') as string

    startTransition(async () => {
      const result = await checkCredentials(email, password)
      if (!result.ok) {
        setError(result.error ?? 'Credenciales inválidas')
        return
      }
      setSavedEmail(email)
      setSavedPassword(password)
      if (result.needs2FA) {
        setStep('totp')
        return
      }
      const res = await signIn('credentials', {
        email,
        password,
        totpCode: '',
        rememberMe: rememberMe.toString(),
        redirect: false,
      })
      if (res?.error) {
        setError('Error al iniciar sesión')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  function handleTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const totpCode = fd.get('totpCode') as string

    startTransition(async () => {
      const res = await signIn('credentials', {
        email:    savedEmail,
        password: savedPassword,
        totpCode,
        rememberMe: rememberMe.toString(),
        redirect: false,
      })
      if (res?.error) {
        setError('Código inválido. Intenta de nuevo.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Left panel: branding ───────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-slate-900 border-r border-slate-800 p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Utensils size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Ez-eat</p>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">Admin System</p>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-6">
          <p className="text-2xl font-bold text-white leading-snug">
            Gestiona tu operación<br />
            <span className="text-blue-400">en un solo lugar</span>
          </p>
          <div className="space-y-4">
            {[
              { title: 'Credenciales cifradas', desc: 'AES-256-GCM, acceso con auditoría completa' },
              { title: 'Portales de cliente', desc: 'Gantt en tiempo real, actualizaciones por proyecto' },
              { title: 'Tablero Kanban', desc: 'Tareas por prioridad, asignación de equipo' },
              { title: 'Directorio de negocios', desc: 'Control de estado, contactos y pagos' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck size={13} className="text-teal-600" />
            <span>Sesión protegida con JWT + 2FA opcional</span>
          </div>
          <p className="text-xs text-slate-700">© 2025 Ez-eat. Sistema de uso interno.</p>
        </div>
      </div>

      {/* ── Right panel: form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Utensils size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Ez-eat Admin</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Sistema interno</p>
            </div>
          </div>

          {step === 'credentials' ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
                <p className="text-slate-400 text-sm mt-1">Acceso exclusivo para el equipo Ez-eat</p>
              </div>

              <form onSubmit={handleCredentials} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="admin@ezeat.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm
                        placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    <input
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm
                        placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-transparent border-slate-700 group-hover:border-slate-500'
                    }`}>
                      {rememberMe && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300 font-medium">Mantenerme logueado</p>
                    <p className="text-[10px] text-slate-600">
                      {rememberMe ? 'Sesión activa por 24 horas' : 'Sesión de 4 horas (más seguro)'}
                    </p>
                  </div>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-red-950/60 border border-red-800/60 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Verificando…
                    </span>
                  ) : 'Continuar →'}
                </button>

                {/* Security note */}
                <p className="text-center text-[10px] text-slate-700 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={11} className="text-teal-700" />
                  Conexión cifrada · Máx. {rememberMe ? '24h' : '4h'} de sesión
                </p>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError('') }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8"
              >
                <ArrowLeft size={15} /> Volver
              </button>

              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Verificación en dos pasos</h1>
                <p className="text-slate-400 text-sm mt-1">Tu cuenta requiere un código de autenticación</p>
              </div>

              <form onSubmit={handleTotp} className="space-y-5">
                {/* Account badge */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck size={15} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Sesión para</p>
                    <p className="text-sm text-white font-medium truncate">{savedEmail}</p>
                  </div>
                </div>

                {/* TOTP input */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Código de autenticación
                  </label>
                  <input
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="000 000"
                    className="w-full px-4 py-4 bg-slate-900 border border-blue-500/50 rounded-xl text-white text-2xl
                      font-mono tracking-[0.5em] text-center
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      placeholder-slate-700 transition-all"
                  />
                  <p className="text-[11px] text-slate-600 mt-2 text-center">
                    Abre Google Authenticator o Authy — código de 6 dígitos
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-red-950/60 border border-red-800/60 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
                >
                  {isPending ? 'Verificando…' : 'Iniciar sesión →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
