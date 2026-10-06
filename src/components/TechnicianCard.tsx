import { Link } from 'react-router-dom'
import { Star, MapPin, Briefcase, CheckCircle2, Wrench, ArrowRight } from 'lucide-react'
import type { PublicTechnician } from '../types/technician'

export default function TechnicianCard({ technician }: { technician: PublicTechnician }) {
  const initials = (technician.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="card flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
      {/* Header: avatar + name + verified */}
      <div className="flex items-start gap-3">
        {technician.avatar_url ? (
          <img
            src={technician.avatar_url}
            alt={technician.name || 'Technician'}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-primary/10"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-lg font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-ink">{technician.name || 'Technician'}</p>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          </div>
          <p className="text-sm text-ink/60">{technician.profession || 'Professional'}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink/70">
        {technician.average_rating !== null && technician.review_count > 0 ? (
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-ink">{technician.average_rating}</span>
            <span className="text-ink/50">({technician.review_count})</span>
          </span>
        ) : (
          <span className="text-sm text-ink/50">New Technician</span>
        )}
        {technician.experience_years !== null && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4 text-ink/40" />
            {technician.experience_years} yr{technician.experience_years !== 1 ? 's' : ''}
          </span>
        )}
        {technician.service_area && (
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-ink/40" />
            {technician.service_area}
          </span>
        )}
      </div>

      {/* Completed jobs */}
      {technician.completed_jobs > 0 && (
        <p className="mt-3 text-sm text-ink/60">
          <Wrench className="mr-1 inline h-3.5 w-3.5 text-primary" />
          {technician.completed_jobs} completed job{technician.completed_jobs !== 1 ? 's' : ''}
        </p>
      )}

      {/* Services */}
      {technician.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {technician.services.slice(0, 3).map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark"
            >
              {s.icon} {s.name}
            </span>
          ))}
          {technician.services.length > 3 && (
            <span className="rounded-full bg-background px-2.5 py-1 text-xs text-ink/50">
              +{technician.services.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-5 flex gap-2 pt-1">
        <Link
          to={`/technicians/${technician.id}`}
          className="btn-secondary flex-1 text-sm"
        >
          View Profile
        </Link>
        <Link
          to={`/technicians/${technician.id}?request=1`}
          className="btn-primary flex-1 text-sm"
        >
          Request Service <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
