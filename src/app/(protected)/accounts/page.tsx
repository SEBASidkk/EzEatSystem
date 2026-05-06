import { listUsers, createUser } from '@/actions/accounts'
import { AccessControlClient } from '@/components/accounts/account-list'

export default async function AccountsPage() {
  const users = await listUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account &amp; Access Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage system users, roles, and global security policies.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border border-teal-200 rounded-lg bg-teal-50">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Encryption Level</span>
          <span className="text-xs font-semibold text-teal-800">AES-256 Active</span>
        </div>
      </div>
      <AccessControlClient users={users} createUser={createUser} />
    </div>
  )
}
