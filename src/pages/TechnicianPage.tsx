import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench, LogOut, Clock, User, Camera, CheckCircle2, Loader2,
  AlertCircle, Star, MapPin, Briefcase, Save, ClipboardList,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  fetchServiceCategories, fetchOwnTechnicianRecord, fetchOwnTechnicianServices,
  updateTechnicianProfile, setTechnicianServices, uploadTechnicianAvatar,
} from '../lib/technicianService'
import { fetchTechnicianBookings } from '../lib/jobService'
import { BOOKING_STATUS_LABELS } from '../types/job'
import type { BookingWithDetails } from '../types/job'
import TechnicianRequests from '../components/TechnicianRequests'
import type { ServiceCategoryDB } from '../types/technician'

export default function TechnicianPage() {
  const { profile, signOut } = useAuth()

  if (profile?.role !== 'technician') {
    return (
      <div className="section py-12 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">For Technicians</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Grow your business with FixMate
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink/60">
              Join FixMate to get more customers through AI-assisted service requests. Create your
              professional profile and receive requests from people near you.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Create your professional profile',
                'Receive service requests from nearby customers',
                'Build your reputation with customer reviews',
                'Customer access stays free',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-ink/80">
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
            <Link to="/technician/register" className="btn-primary mt-8">
              <Wrench className="h-5 w-5" /> Join as a Technician
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="mx-auto flex max-w-xs items-center justify-center rounded-4xl bg-gradient-to-br from-primary to-primary-dark p-10 text-white shadow-lift">
              <div className="text-center">
                <Wrench className="mx-auto h-20 w-20" strokeWidth={1.5} />
                <p className="mt-4 text-xl font-bold">Be the expert</p>
                <p className="mt-1 text-sm text-white/70">your neighbours trust</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <TechnicianDashboard profile={profile} onSignOut={signOut} />
}

function TechnicianDashboard({
  profile, onSignOut,
}: {
  profile: { id: string; name: string | null; email: string | null }
  onSignOut: () => Promise<void>
}) {
  const [technician, setTechnician] = useState<Record<string, unknown> | null>(null)
  const [categories, setCategories] = useState<ServiceCategoryDB[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'jobs'>('profile')
  const [jobs, setJobs] = useState<BookingWithDetails[]>([])

  // Form fields
  const [profession, setProfession] = useState('')
  const [bio, setBio] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [availability, setAvailability] = useState('available')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const cats = await fetchServiceCategories()
        setCategories(cats)

        if (profile?.id) {
          const tech = await fetchOwnTechnicianRecord(profile.id)
          if (tech) {
            setTechnician(tech)
            setProfession(tech.profession || '')
            setBio(tech.bio || '')
            setExperienceYears(tech.experience_years?.toString() || '')
            setServiceArea(tech.service_area || '')
            setWhatsappNumber(tech.whatsapp_number || '')
            setAvailability(tech.availability || 'available')
            setAvatarUrl(tech.avatar_url || null)

            const [services, techBookings] = await Promise.all([
              fetchOwnTechnicianServices(tech.id),
              fetchTechnicianBookings(tech.id),
            ])
            setSelectedServices(new Set(services.map((s) => s.id)))
            setJobs(techBookings)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile])

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      const url = await uploadTechnicianAvatar(file, profile.id)
      setAvatarUrl(url)
      if (technician) {
        await updateTechnicianProfile(technician.id as string, { avatar_url: url })
      }
      setSuccess('Profile photo updated.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.')
    }
  }

  async function handleSave() {
    if (!technician) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateTechnicianProfile(technician.id as string, {
        profession: profession.trim() || null,
        bio: bio.trim() || null,
        experience_years: experienceYears ? parseInt(experienceYears, 10) : null,
        service_area: serviceArea.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        availability,
      })

      await setTechnicianServices(technician.id as string, Array.from(selectedServices))

      setSuccess('Profile saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const verificationStatus = technician?.verification_status as string || 'pending'

  return (
    <div className="section py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Technician Dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Your Profile
            </h1>
          </div>
          <button onClick={onSignOut} className="btn-secondary text-sm">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        {/* Verification status */}
        <div className={`mt-6 flex items-center gap-3 rounded-2xl p-4 ${
          verificationStatus === 'approved' ? 'bg-success/10' :
          verificationStatus === 'rejected' ? 'bg-error/10' :
          'bg-warning/10'
        }`}>
          {verificationStatus === 'approved' ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : verificationStatus === 'rejected' ? (
            <AlertCircle className="h-5 w-5 text-error" />
          ) : (
            <Clock className="h-5 w-5 text-warning" />
          )}
          <div>
            <p className="font-semibold text-ink">
              Verification: {verificationStatus === 'approved' ? 'Approved' : verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
            </p>
            <p className="text-sm text-ink/60">
              {verificationStatus === 'approved'
                ? 'Your profile is live in the marketplace.'
                : verificationStatus === 'rejected'
                ? 'Please contact support for help with your verification.'
                : 'Your profile is being reviewed. You will appear in the marketplace once approved.'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab switcher */}
        {technician && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-ink/70 ring-1 ring-primary/15 hover:bg-primary-light'
              }`}
            >
              <User className="h-4 w-4" /> My Profile
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'requests'
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-ink/70 ring-1 ring-primary/15 hover:bg-primary-light'
              }`}
            >
              <ClipboardList className="h-4 w-4" /> Service Requests
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-ink/70 ring-1 ring-primary/15 hover:bg-primary-light'
              }`}
            >
              <Briefcase className="h-4 w-4" /> My Jobs {jobs.length > 0 && `(${jobs.length})`}
            </button>
          </div>
        )}

        {/* Profile form */}
        {!technician ? (
          <div className="mt-6 rounded-2xl bg-primary-light/40 p-6 text-center">
            <p className="text-ink/70">You haven't created a technician profile yet.</p>
            <Link to="/technician/register" className="btn-primary mt-4">
              <Wrench className="h-5 w-5" /> Create Technician Profile
            </Link>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="mt-6 space-y-6">
            {/* Avatar */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink/60">Profile Photo</p>
              <div className="mt-3 flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-primary/10" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm">
                  <Camera className="h-4 w-4" /> Upload Photo
                </button>
              </div>
            </div>

            {/* Profile fields */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink/60">Profile Details</p>
              <div className="mt-4 space-y-4">
                <Field label="Name (from your account)">
                  <input
                    value={profile.name || ''}
                    disabled
                    className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink/50 ring-1 ring-primary/10"
                  />
                </Field>
                <Field label="Profession">
                  <input
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Plumber, Electrician"
                    className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </Field>
                <Field label="Bio">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell customers about your experience and skills..."
                    rows={3}
                    className="w-full resize-none rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Experience (years)">
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="5"
                      min="0"
                      className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </Field>
                  <Field label="Service Area">
                    <input
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. Downtown, North Side"
                      className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </Field>
                </div>
                <Field label="WhatsApp Number">
                  <input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </Field>
                <Field label="Availability">
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-xl bg-background px-4 py-3 text-base text-ink ring-1 ring-primary/15 focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Services */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink/60">Your Services</p>
              <p className="mt-1 text-sm text-ink/50">Select the services you offer. Customers will find you by these categories.</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleService(cat.id)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      selectedServices.has(cat.id)
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-background text-ink/70 ring-1 ring-primary/10 hover:bg-primary-light'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-left">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-5 w-5" /> Save Profile</>
              )}
            </button>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="mt-6">
            <TechnicianRequests technicianId={technician.id as string} />
          </div>
        ) : (
          <div className="mt-6">
            {jobs.length === 0 ? (
              <div className="rounded-2xl bg-primary-light/30 p-6 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-primary/40" />
                <p className="mt-3 text-sm text-ink/50">
                  No accepted jobs yet. Submit quotes on service requests to win jobs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/bookings/${job.id}`}
                    className="card block p-5 transition-all hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {job.request_category_icon && <span>{job.request_category_icon}</span>}
                          <p className="font-semibold text-ink">{job.request_category_name || 'Service Job'}</p>
                        </div>
                        <p className="mt-1 text-sm text-ink/70 line-clamp-1">{job.request_title || job.request_description}</p>
                        {job.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {job.quote_amount !== null && (
                          <p className="text-base font-bold text-primary">Rs {job.quote_amount}</p>
                        )}
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          job.status === 'completed' ? 'bg-success/10 text-success' :
                          job.status === 'cancelled' ? 'bg-error/10 text-error' :
                          'bg-primary-light text-primary-dark'
                        }`}>
                          {BOOKING_STATUS_LABELS[job.status] || job.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
