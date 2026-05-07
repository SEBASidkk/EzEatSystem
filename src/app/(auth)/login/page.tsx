'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showTotp, setShowTotp] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      totpCode: fd.get('totpCode') ?? '',
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Credenciales inválidas. Si tienes 2FA activo, ingresa el código.')
      setShowTotp(true)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {showTotp && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                <ShieldCheck size={12} className="inline mr-1" />
                Código 2FA (autenticador)
              </label>
              <input
                name="totpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-800 border border-blue-500 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all tracking-widest text-center text-lg"
                placeholder="000000"
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-200"
          >
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
