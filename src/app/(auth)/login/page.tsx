'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import { checkCredentials } from '@/actions/auth-check'

type Step = 'credentials' | 'totp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [savedEmail, setSavedEmail] = useState('')
  const [savedPassword, setSavedPassword] = useState('')
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
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
      const res = await signIn('credentials', { email, password, totpCode: '', redirect: false })
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
        email: savedEmail,
        password: savedPassword,
        totpCode,
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ez-eat Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de gestión interna</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@ezeat.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-200"
            >
              {isPending ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError('') }}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-2"
            >
              <ArrowLeft size={15} />
              Volver
            </button>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
              <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-0.5">Sesión para</p>
              <p className="text-sm text-white font-medium">{savedEmail}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                <ShieldCheck size={12} className="inline mr-1" />
                Código de autenticación
              </label>
              <input
                name="totpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                required
                className="w-full px-4 py-3 bg-slate-800 border border-blue-500 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all tracking-widest text-center text-lg"
                placeholder="000000"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Abre Google Authenticator o Authy e ingresa el código de 6 dígitos.</p>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-200"
            >
              {isPending ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
