import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, AlertCircle, CheckCircle2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import { supabase } from '../lib/supabase'
import { serviceCategories } from '../data/serviceCategories'

export default function TechnicianRegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profession, setProfession] = useState('')
  const [experience, setExperience] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bio, setBio] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): string | null {
    if (!name.trim()) return 'Please enter your name.'
    if (!email.trim()) return 'Please enter your email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email.'
    if (!phone.trim()) return 'Please enter your phone number.'
    if (!profession) return 'Please select your profession.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    return null
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    // 1. Create auth account with role = technician
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'technician' },
      },
    })

    if (authError) {
      setLoading(false)
      setError(
        authError.message.includes('already registered')
          ? 'This email is already registered. Try logging in.'
          : authError.message,
      )
      return
    }

    if (!data.user) {
      setLoading(false)
      setError('Something went wrong. Please try again.')
      return
    }

    // 2. Update the profile with phone (trigger created the base profile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', profile.id)

      // 3. Create technician record
      await supabase.from('technicians').insert({
        profile_id: profile.id,
        profession,
        experience_years: experience ? parseInt(experience, 10) : null,
        service_area: serviceArea || null,
        whatsapp_number: whatsapp || null,
        bio: bio || null,
        verification_status: 'pending',
      })

      // Notify admins of new registration awaiting verification
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'admin')

        for (const admin of admins ?? []) {
          await supabase.from('notifications').insert({
            user_id: admin.user_id,
            type: 'technician_registered',
            title: 'New Technician Registration',
            message: `${name || 'A technician'} (${profession || 'Specialist'}) registered and is awaiting verification.`,
            read: false,
          })
        }
      } catch {
        // Ignore notification error
      }
    }

    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <PageShell
        title="Registration submitted"
        subtitle=""
        icon={<CheckCircle2 className="h-8 w-8" />}
      >
        <div className="rounded-3xl bg-primary-light/60 p-6 text-center">
          <p className="text-lg font-semibold text-ink">
            Your technician profile is pending verification.
          </p>
          <p className="mt-2 text-sm text-ink/60">
            We will review your details and notify you once your account is verified.
          </p>
          <Link to="/login" className="btn-primary mt-5">
            Proceed to Login
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Join as a Technician"
      subtitle="Create your professional profile and start receiving service requests."
      icon={<Wrench className="h-8 w-8" />}
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4 text-left" onSubmit={handleRegister}>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Profession</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a category</option>
            {serviceCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Experience (years)</label>
            <input
              type="number"
              min="0"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="5"
              className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Service area</label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="City / Area"
              className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">WhatsApp number</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp contact number"
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short description of your skills and experience"
            rows={3}
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-2xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating profile...' : 'Create Technician Profile'}
        </button>
        <p className="text-center text-sm text-ink/60">
          Just looking?{' '}
          <Link to="/technician" className="font-semibold text-primary hover:underline">
            Back to technician info
          </Link>
        </p>
      </form>
    </PageShell>
  )
}
