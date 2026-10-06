import { Link } from 'react-router-dom'
import { Mic, Camera, Sparkles, Search, ShieldCheck } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-primary-light blur-3xl" />

      <div className="section relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        {/* left: copy + input */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary-dark">
            <Sparkles className="h-4 w-4" /> AI-powered repair help
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            What's wrong? <br />
            We'll help you <span className="text-primary">fix it.</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/65">
            Describe your problem, get simple AI guidance, and find a trusted
            professional when you need one.
          </p>

          {/* AI input card */}
          <div className="mt-8 card p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 ring-1 ring-primary/15">
              <input
                type="text"
                placeholder="Tell us what's wrong..."
                className="w-full bg-transparent text-base text-ink placeholder:text-ink/40 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button className="btn-secondary text-sm" type="button">
                <Mic className="h-4 w-4" /> Speak
              </button>
              <button className="btn-secondary text-sm" type="button">
                <Camera className="h-4 w-4" /> Upload Photo
              </button>
              <Link to="/ai-assistant" className="btn-primary ml-auto text-sm">
                <Sparkles className="h-4 w-4" /> Ask FixMate AI
              </Link>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/ai-assistant" className="btn-primary text-base">
              <Sparkles className="h-5 w-5" /> Ask FixMate AI
            </Link>
            <Link to="/services" className="btn-secondary text-base">
              <Search className="h-5 w-5" /> Find a Technician
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-ink/50">
            <ShieldCheck className="h-4 w-4 text-success" />
            Verified professionals & safe AI guidance
          </div>
        </div>

        {/* right: illustration */}
        <div className="relative hidden lg:block">
          <div className="animate-float card mx-auto flex max-w-md items-center justify-center p-10">
            <Illustration />
          </div>
        </div>
      </div>
    </section>
  )
}

function Illustration() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="140" r="120" fill="#F3E8FF" />
      {/* robot head */}
      <rect x="110" y="70" width="100" height="90" rx="24" fill="#8B5CF6" />
      <rect x="110" y="70" width="100" height="90" rx="24" fill="url(#g)" fillOpacity="0.3" />
      <circle cx="140" cy="110" r="10" fill="#fff" />
      <circle cx="180" cy="110" r="10" fill="#fff" />
      <circle cx="140" cy="110" r="4" fill="#1F2937" />
      <circle cx="180" cy="110" r="4" fill="#1F2937" />
      <path d="M140 135 Q160 148 180 135" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* antenna */}
      <line x1="160" y1="70" x2="160" y2="48" stroke="#5B21B6" strokeWidth="5" strokeLinecap="round" />
      <circle cx="160" cy="42" r="8" fill="#22C55E" />
      {/* wrench */}
      <rect x="210" y="150" width="60" height="18" rx="9" fill="#F59E0B" transform="rotate(35 240 159)" />
      <rect x="60" y="150" width="60" height="18" rx="9" fill="#F59E0B" transform="rotate(-35 90 159)" />
      {/* base */}
      <rect x="120" y="170" width="80" height="50" rx="20" fill="#5B21B6" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
