import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { fetchServiceCategories } from '../lib/technicianService'
import type { ServiceCategoryDB } from '../types/technician'

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategoryDB[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServiceCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="section py-12 sm:py-16">
      <div className="text-center">
        <p className="eyebrow">Services</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Find the right professional
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink/60">
          Pick a category to browse verified technicians ready to help.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/technicians?category=${cat.id}`}
              className="group card flex flex-col items-center gap-3 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-2xl shadow-soft">
                {cat.icon}
              </div>
              <div>
                <p className="font-semibold text-ink">{cat.name}</p>
                <p className="mt-0.5 text-xs text-ink/55">{cat.description}</p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Find technicians <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-3xl bg-primary-light/60 p-8 text-center">
        <p className="text-lg font-semibold text-ink">Not sure which service you need?</p>
        <p className="mt-1 text-sm text-ink/60">Let FixMate AI help you figure it out.</p>
        <Link to="/ai-assistant" className="btn-primary mt-4">
          Ask FixMate AI <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
