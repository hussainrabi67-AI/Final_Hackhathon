import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { serviceCategories } from '../data/serviceCategories'

export default function ServiceCategories() {
  return (
    <section className="section py-16 sm:py-20">
      <div className="text-center">
        <p className="eyebrow">Browse Services</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          What do you need help with?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink/60">
          Pick a category to find verified professionals near you.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {serviceCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/technicians?name=${encodeURIComponent(cat.name)}`}
            className="group card flex flex-col items-center gap-3 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-2xl shadow-soft`}
            >
              {cat.emoji}
            </div>
            <div>
              <p className="font-semibold text-ink">{cat.name}</p>
              <p className="mt-0.5 text-xs text-ink/55">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/services" className="btn-secondary">
          View All Services
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
