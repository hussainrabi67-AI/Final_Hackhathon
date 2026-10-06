import { Link } from 'react-router-dom'
import { Wrench, LogOut, Shield } from 'lucide-react'
import PageShell from '../components/PageShell'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { profile, signOut } = useAuth()

  return (
    <PageShell
      title="Admin Panel"
      subtitle="Manage technicians, service requests, and platform settings."
      icon={<Shield className="h-8 w-8" />}
    >
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-primary-light/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-ink">{profile?.name || 'Admin'}</p>
          <p className="text-sm text-ink/55">{profile?.email}</p>
        </div>
      </div>

      <div className="card p-5 text-left">
        <Wrench className="h-6 w-6 text-primary" />
        <p className="mt-2 font-semibold text-ink">Platform Management</p>
        <p className="text-sm text-ink/55">
          Admin tools for managing technicians and platform data are coming soon.
        </p>
      </div>

      <button onClick={signOut} className="btn-secondary mt-6 w-full">
        <LogOut className="h-4 w-4" /> Log out
      </button>

      <Link to="/" className="mt-3 block text-center text-sm text-primary hover:underline">
        Back to Home
      </Link>
    </PageShell>
  )
}
