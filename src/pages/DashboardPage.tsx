import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Sparkles, Wrench, LogOut, User, Loader2,
  AlertCircle, Clock, MapPin, CheckCircle2, ArrowRight, ClipboardList,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageShell from '../components/PageShell'
import {
  fetchCustomerRequests, fetchCustomerBookings,
} from '../lib/jobService'
import {
  REQUEST_STATUS_LABELS, BOOKING_STATUS_LABELS, BOOKING_STEPS,
} from '../types/job'
import type { ServiceRequestWithCategory, BookingWithDetails } from '../types/job'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const [requests, setRequests] = useState<ServiceRequestWithCategory[]>([])
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    let cancelled = false

    async function load() {
      try {
        const [reqs, books] = await Promise.all([
          fetchCustomerRequests(profile!.id),
          fetchCustomerBookings(profile!.id),
        ])
        if (!cancelled) {
          setRequests(reqs)
          setBookings(books)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [profile])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Active bookings (not completed/cancelled)
  const activeBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled',
  )
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled',
  )

  return (
    <div className="section py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Welcome, {profile?.name || 'there'}
            </h1>
          </div>
          <button onClick={signOut} className="btn-secondary text-sm">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to="/ai-assistant" className="card p-5 text-left transition-all hover:shadow-lift">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold text-ink">Ask FixMate AI</p>
            <p className="text-sm text-ink/55">Get help with a new problem.</p>
          </Link>
          <Link to="/technicians" className="card p-5 text-left transition-all hover:shadow-lift">
            <Wrench className="h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold text-ink">Find a Technician</p>
            <p className="text-sm text-ink/55">Browse verified professionals.</p>
          </Link>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active bookings (job tracking) */}
        {activeBookings.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Clock className="h-5 w-5 text-primary" /> Active Jobs
            </h2>
            <div className="mt-3 space-y-3">
              {activeBookings.map((b) => (
                <ActiveJobCard key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}

        {/* Service requests */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <ClipboardList className="h-5 w-5 text-primary" /> Your Service Requests
          </h2>

          {requests.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-primary-light/30 p-6 text-center">
              <p className="text-sm text-ink/50">
                No service requests yet. Ask FixMate AI or find a technician to get started.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>

        {/* Past bookings */}
        {pastBookings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Past Jobs</h2>
            <div className="mt-3 space-y-3">
              {pastBookings.map((b) => (
                <div key={b.id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-ink">{b.request_category_name || 'Booking'}</p>
                    <p className="text-sm text-ink/60">{b.technician_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      b.status === 'completed' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                    <Link to={`/bookings/${b.id}`} className="btn-secondary text-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActiveJobCard({ booking }: { booking: BookingWithDetails }) {
  const currentStepIndex = BOOKING_STEPS.indexOf(booking.status as typeof BOOKING_STEPS[number])

  return (
    <Link to={`/bookings/${booking.id}`} className="card block p-5 transition-all hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {booking.request_category_icon && <span>{booking.request_category_icon}</span>}
            <p className="font-semibold text-ink">{booking.request_category_name || 'Service'}</p>
          </div>
          <p className="mt-0.5 text-sm text-ink/60">{booking.technician_name}</p>
        </div>
        {booking.quote_amount !== null && (
          <p className="text-lg font-bold text-primary">Rs {booking.quote_amount}</p>
        )}
      </div>

      {/* Mini progress tracker */}
      <div className="mt-4 flex items-center gap-1">
        {BOOKING_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              idx < currentStepIndex ? 'bg-success text-white' :
              idx === currentStepIndex ? 'bg-primary text-white' :
              'bg-background text-ink/30 ring-1 ring-primary/10'
            }`}>
              {idx < currentStepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            {idx < BOOKING_STEPS.length - 1 && (
              <div className={`h-0.5 w-4 ${idx < currentStepIndex ? 'bg-success' : 'bg-primary/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-primary">
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
        <span className="flex items-center gap-1 text-sm text-primary">
          Track <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function RequestCard({ request }: { request: ServiceRequestWithCategory }) {
  const hasQuotes = request.status === 'quoted' || request.status === 'matching'

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {request.category_icon && <span>{request.category_icon}</span>}
          <p className="font-semibold text-ink">{request.category_name || 'Service'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          request.status === 'completed' ? 'bg-success/10 text-success' :
          request.status === 'booked' ? 'bg-primary-light text-primary-dark' :
          request.status === 'quoted' ? 'bg-amber-100 text-amber-700' :
          request.status === 'cancelled' ? 'bg-error/10 text-error' :
          'bg-primary-light text-primary-dark'
        }`}>
          {REQUEST_STATUS_LABELS[request.status] || request.status}
        </span>
      </div>

      {request.description && (
        <p className="mt-2 text-sm text-ink/70 line-clamp-2">{request.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-ink/50">
          <Clock className="h-3.5 w-3.5" />
          {new Date(request.created_at).toLocaleDateString()}
        </span>
        {hasQuotes && (
          <Link to={`/requests/${request.id}/quotes`} className="text-sm font-medium text-primary">
            View Quotes <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
