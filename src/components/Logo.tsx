import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
        <Wrench className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-xl text-ink">
        Fix<span className="text-primary">Mate</span>
      </span>
    </Link>
  )
}
