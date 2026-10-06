import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Loader2, Wrench, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import {
  fetchServiceCategories, fetchVerifiedTechnicians, findCategoryIdByName,
} from '../lib/technicianService'
import type { PublicTechnician, ServiceCategoryDB } from '../types/technician'
import TechnicianCard from '../components/TechnicianCard'

export default function FindTechniciansPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<ServiceCategoryDB[]>([])
  const [technicians, setTechnicians] = useState<PublicTechnician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedCategory = searchParams.get('category') || ''
  const categoryName = searchParams.get('name') || ''

  useEffect(() => {
    fetchServiceCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    async function load() {
      try {
        let categoryId: string | null = selectedCategory || null

        // If we have a category name but no ID, resolve it
        if (!categoryId && categoryName) {
          categoryId = await findCategoryIdByName(categoryName)
        }

        const techs = await fetchVerifiedTechnicians(categoryId)
        if (!cancelled) {
          setTechnicians(techs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load technicians.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedCategory, categoryName])

  const selectedCat = categories.find((c) => c.id === selectedCategory)

  function selectCategory(id: string) {
    if (id) {
      setSearchParams({ category: id })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="section py-8 sm:py-12">
      {/* Header */}
      <div className="text-center">
        <p className="eyebrow">Find a Technician</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {selectedCat ? `${selectedCat.name} Technicians` : 'Verified Professionals'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink/60">
          {selectedCat
            ? `Browse verified ${selectedCat.name.toLowerCase()} professionals ready to help.`
            : 'Choose a service category to find verified professionals near you.'}
        </p>
      </div>

      {/* Category filter */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => selectCategory('')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-primary text-white shadow-soft'
              : 'bg-white text-ink/70 ring-1 ring-primary/15 hover:bg-primary-light'
          }`}
        >
          All Services
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-white shadow-soft'
                : 'bg-white text-ink/70 ring-1 ring-primary/15 hover:bg-primary-light'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl bg-error/10 p-4 text-center text-sm text-error">
            <AlertCircle className="mx-auto mb-2 h-6 w-6" />
            {error}
          </div>
        ) : technicians.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink/60">
              {technicians.length} technician{technicians.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {technicians.map((tech) => (
                <TechnicianCard key={tech.id} technician={tech} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Back link */}
      <div className="mt-10 text-center">
        <Link to="/services" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Browse all services
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-primary-light/40 p-8 text-center">
      <Search className="mx-auto h-12 w-12 text-primary/40" />
      <p className="mt-4 text-lg font-semibold text-ink">
        We couldn't find a verified technician for this service yet.
      </p>
      <p className="mt-2 text-sm text-ink/60">
        New professionals are joining FixMate regularly. Try another service category.
      </p>
      <Link to="/services" className="btn-primary mt-6">
        <Wrench className="h-5 w-5" /> Try another service
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
