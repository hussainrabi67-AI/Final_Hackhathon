import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

import NotificationBell from './NotificationBell'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Find Technicians', to: '/technicians' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'For Technicians', to: '/technician' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const dashboardLink =
    profile?.role === 'technician' ? '/technician' : profile?.role === 'admin' ? '/admin' : '/dashboard'

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/90 backdrop-blur-md">
      <div className="section flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-ink/70 hover:text-primary hover:bg-primary-light'
                }`
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <NotificationBell />
              <Link to={dashboardLink} className="btn-ghost text-sm">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="btn-secondary text-sm">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {session && <NotificationBell />}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-ink transition-colors hover:bg-primary-light"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-primary/10 bg-background md:hidden">
          <div className="section flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-primary-light hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {session ? (
                <>
                  <Link to={dashboardLink} onClick={() => setOpen(false)} className="btn-secondary">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="btn-primary">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
