'use client'
import { useState, useTransition } from 'react'
import { revealCredential } from '@/actions/vault'
import { Eye, EyeOff, Copy } from 'lucide-react'

export function RevealButton({ credentialId }: { credentialId: string }) {
  const [value, setValue] = useState<string | null>(null)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [isPending, startTransition] = useTransition()

  function hide() {
    setValue(null)
    if (timer) clearTimeout(timer)
  }

  function reveal() {
    startTransition(async () => {
      const v = await revealCredential(credentialId)
      setValue(v)
      const t = setTimeout(hide, 30_000)
      setTimer(t)
    })
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono break-all">{value}</code>
        <button onClick={() => navigator.clipboard.writeText(value)} title="Copiar">
          <Copy size={14} className="text-gray-500 hover:text-gray-700" />
        </button>
        <button onClick={hide} title="Ocultar">
          <EyeOff size={14} className="text-gray-500 hover:text-gray-700" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={reveal}
      disabled={isPending}
      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
    >
      <Eye size={14} />
      {isPending ? 'Cargando...' : 'Revelar'}
    </button>
  )
}
