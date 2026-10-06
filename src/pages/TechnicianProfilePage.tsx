import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom'
import {
  Star, MapPin, Briefcase, CheckCircle2, Wrench, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, MessageSquare, CheckCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  fetchTechnicianById, fetchReviewsForTechnician,
} from '../lib/technicianService'
import { createServiceRequest } from '../lib/aiService'
import type { PublicTechnician, ReviewWithUser } from '../types/technician'

export default function TechnicianProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()

  const [technician, setTechnician] = useState<PublicTechnician | null>(null)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')

  const showRequestForm = searchParams.get('request') === '1'

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const [tech, revs] = await Promise.all([
          fetchTechnicianById(id!),
          fetchReviewsForTechnician(id!),
        ])
        if (!cancelled) {
          setTechnician(tech)
          setReviews(revs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load this profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  async function handleRequestService() {
    if (!session || !technician) return
    setRequesting(true)
    setRequestError('')

    try {
      const firstService = technician.services[0]
      const requestId = await createServiceRequest({
        userId: session.user.id,
        description: `Service request for ${technician.profession || technician.name || 'technician'}`,
        categoryId: firstService?.id ?? null,
      })

      if (!requestId) {
        throw new Error('Could not create your service request. Please try again.')
      }

      setRequestSuccess(true)
      setSearchParams({})
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="section py-16">
        <div className="mx-auto max-w-md rounded-2xl bg-error/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-error" />
          <p className="text-sm text-error">{error}</p>
          <Link to="/technicians" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to technicians
          </Link>
        </div>
      </div>
    )
  }

  if (!technician) {
    return <Navigate to="/technicians" replace />
  }

  const initials = (technician.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="section py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/technicians" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to technicians
        </Link>

        {/* Profile header */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {technician.avatar_url ? (
              <img
                src={technician.avatar_url}
                alt={technician.name || 'Technician'}
                className="h-20 w-20 rounded-3xl object-cover ring-1 ring-primary/10"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-light text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-ink">{technician.name || 'Technician'}</h1>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="mt-1 text-ink/60">{technician.profession || 'Professional'}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink/70">
                {technician.average_rating !== null && technician.review_count > 0 ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-ink">{technician.average_rating}</span>
                    <span className="text-ink/50">({technician.review_count} reviews)</span>
                  </span>
                ) : (
                  <span className="text-sm text-ink/50">New Technician</span>
                )}
                {technician.experience_years !== null && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-ink/40" />
                    {technician.experience_years} year{technician.experience_years !== 1 ? 's' : ''} experience
                  </span>
                )}
                {technician.service_area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-ink/40" />
                    {technician.service_area}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {technician.bio && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink/60">About</p>
              <p className="mt-1 text-base text-ink/80">{technician.bio}</p>
            </div>
          )}

          {/* Services */}
          {technician.services.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink/60">Services</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {technician.services.map((s) => (
                  <Link
                    key={s.id}
                    to={`/technicians?category=${s.id}`}
                    className="rounded-full bg-primary-light px-3.5 py-1.5 text-sm font-medium text-primary-dark transition-colors hover:bg-primary hover:text-white"
                  >
                    {s.icon} {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed jobs */}
          {technician.completed_jobs > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary-light/40 p-3">
              <Wrench className="h-5 w-5 text-primary" />
              <p className="text-sm text-ink/80">
                <span className="font-semibold">{technician.completed_jobs}</span> completed job{technician.completed_jobs !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 border-t border-primary/10 pt-6">
            {requestSuccess ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-success/10 p-5 text-center">
                <CheckCircle className="h-10 w-10 text-success" />
                <p className="font-semibold text-ink">Service request submitted!</p>
                <p className="text-sm text-ink/60">Your request has been created. You can track it from your dashboard.</p>
                <Link to="/dashboard" className="btn-primary">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : !session ? (
              <div className="rounded-2xl bg-primary-light/40 p-4 text-center">
                <p className="text-sm text-ink/70">Log in to request this technician's service.</p>
                <Link to="/login" className="btn-primary mt-3">
                  Login to Continue
                </Link>
              </div>
            ) : (
              <div>
                {requestError && (
                  <div className="mb-3 flex items-start gap-2 rounded-2xl bg-error/10 p-3 text-sm text-error">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}
                {showRequestForm ? (
                  <div className="rounded-2xl bg-primary-light/30 p-5">
                    <p className="font-semibold text-ink">Request this technician's service?</p>
                    <p className="mt-1 text-sm text-ink/60">
                      We'll create a service request for {technician.name || 'this technician'}.
                      They'll be notified and can respond with a quote.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleRequestService}
                        disabled={requesting}
                        className="btn-primary flex-1"
                      >
                        {requesting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          <><Wrench className="h-5 w-5" /> Confirm Request</>
                        )}
                      </button>
                      <button
                        onClick={() => setSearchParams({})}
                        className="btn-secondary"
                        disabled={requesting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchParams({ request: '1' })}
                    className="btn-primary w-full"
                  >
                    <Wrench className="h-5 w-5" /> Request Service
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <MessageSquare className="h-5 w-5 text-primary" /> Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-primary-light/30 p-6 text-center">
              <p className="text-sm text-ink/50">No reviews yet. This technician is new to FixMate.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{review.user_name || 'Customer'}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-ink/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-ink/70">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-ink/40">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
