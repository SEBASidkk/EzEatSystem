import { auth, signOut } from '@/lib/auth'
import { LogOut } from 'lucide-react'

export async function Header() {
  const session = await auth()
  const user = session?.user as { name?: string; role?: string } | undefined

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {user?.role}
        </span>
        <form action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}>
          <button type="submit" className="p-1.5 text-gray-400 hover:text-gray-700">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  )
}
