import { useState, useRef, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Mic, Camera, Sparkles, User, ShieldAlert, Wrench, ArrowRight,
  Search, AlertCircle, CheckCircle2, X, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  uploadProblemImage, createServiceRequest, diagnoseProblem, markRequestSolved,
} from '../lib/aiService'
import type { AIDiagnosis, ChatMessage } from '../types/ai'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AIAssistantPage() {
  const { session, loading } = useAuth()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function toggleVoice() {
    setRecording((r) => !r)
    setTimeout(() => setRecording(false), 3000)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!input.trim() && !imageFile) {
      setError('Please describe your problem or upload a photo.')
      return
    }

    setBusy(true)

    try {
      const userId = session!.user.id

      // Upload image if provided
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadProblemImage(imageFile, userId)
      }

      // Create service request
      const requestId = await createServiceRequest({
        userId,
        description: input.trim(),
        imageUrl,
      })

      if (!requestId) {
        throw new Error('Could not create your service request. Please try again.')
      }
      setCurrentRequestId(requestId)

      // Add user message
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: input.trim(),
        imageUrl: imageUrl ?? undefined,
      }
      setMessages((m) => [...m, userMsg])

      // Get diagnosis
      const diagnosis = await diagnoseProblem({
        description: input.trim(),
        imageUrl: imageUrl ?? undefined,
        requestId,
      })

      const aiMsg: ChatMessage = {
        id: uid(),
        role: 'ai',
        text: diagnosis.problem_summary,
        diagnosis,
      }
      setMessages((m) => [...m, aiMsg])

      // Reset form
      setInput('')
      clearImage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSolved() {
    if (currentRequestId) {
      await markRequestSolved(currentRequestId)
    }
    setSolved(true)
  }

  return (
    <div className="section py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow">FixMate AI</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Ask FixMate AI
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-ink/60">
            Describe your problem, upload a photo, and get safe AI guidance.
          </p>
        </div>

        {/* Input card */}
        <div className="mt-8 card p-5">
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-primary/15">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell us what's wrong..."
                rows={3}
                className="w-full resize-none bg-transparent text-base text-ink placeholder:text-ink/40 focus:outline-none"
                disabled={busy}
              />
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-3 inline-block">
                <img src={imagePreview} alt="Problem" className="h-24 w-24 rounded-2xl object-cover ring-1 ring-primary/15" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-white shadow-soft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                className={`btn-secondary text-sm ${recording ? 'ring-2 ring-error' : ''}`}
                disabled={busy}
              >
                <Mic className="h-4 w-4" /> {recording ? 'Listening...' : 'Speak'}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary text-sm"
                disabled={busy}
              >
                <Camera className="h-4 w-4" /> Upload Photo
              </button>
              <button
                type="submit"
                className="btn-primary ml-auto text-sm"
                disabled={busy}
              >
                {busy ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Ask FixMate AI</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Conversation */}
        {messages.length > 0 && (
          <div className="mt-8 space-y-4">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="flex max-w-[85%] items-start gap-3 rounded-3xl rounded-tr-md bg-primary px-5 py-4 text-white shadow-soft">
                    <User className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
                    <div>
                      <p className="text-base">{msg.text}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Problem"
                          className="mt-2 h-32 w-full max-w-xs rounded-2xl object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <DiagnosisCard key={msg.id} message={msg} />
              ),
            )}

            {/* Resolution buttons */}
            {messages.length >= 2 && messages[messages.length - 1].role === 'ai' && !solved && (
              <div className="rounded-3xl bg-primary-light/60 p-5 text-center">
                <p className="text-lg font-semibold text-ink">Did this solve your problem?</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button onClick={handleSolved} className="btn-primary">
                    <CheckCircle2 className="h-5 w-5" /> Yes, it's fixed
                  </button>
                  <Link to="/technicians" className="btn-secondary">
                    <Wrench className="h-5 w-5" /> No, find a technician
                  </Link>
                </div>
              </div>
            )}

            {solved && (
              <div className="rounded-3xl bg-success/10 p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
                <p className="mt-2 font-semibold text-ink">Glad we could help!</p>
                <Link to="/dashboard" className="btn-secondary mt-4">
                  Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        {messages.length === 0 && !busy && (
          <div className="mt-10 rounded-3xl bg-primary-light/40 p-6 text-center">
            <Search className="mx-auto h-10 w-10 text-primary/40" />
            <p className="mt-3 text-sm text-ink/50">
              Try describing your problem above. For example: "My AC is running but it isn't cooling."
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DiagnosisCard({ message }: { message: ChatMessage }) {
  const d = message.diagnosis!

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-3xl rounded-tl-md bg-white p-5 shadow-card ring-1 ring-primary/5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">FixMate AI</span>
        </div>

        <div className="mt-4 space-y-4 text-left">
          {/* Possible Problem */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Search className="h-4 w-4 text-primary" /> Possible Problem
            </p>
            <p className="mt-1 text-base text-ink/80">{d.problem_summary}</p>
          </div>

          {/* Possible causes */}
          {d.possible_causes?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink/60">Possible causes:</p>
              <ul className="mt-1 space-y-1">
                {d.possible_causes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/70">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Try This First */}
          {d.safe_steps?.length > 0 && (
            <div className="rounded-2xl bg-primary-light/40 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Wrench className="h-4 w-4 text-primary" /> Try This First
              </p>
              <ul className="mt-2 space-y-2">
                {d.safe_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Warning */}
          {d.safety_warning && (
            <div className="flex items-start gap-2 rounded-2xl bg-warning/10 p-3 text-sm text-ink/80">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-warning">Safety Warning</p>
                <p className="mt-0.5">{d.safety_warning}</p>
              </div>
            </div>
          )}

          {/* Professional Help */}
          {d.professional_required && (
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Wrench className="h-4 w-4 text-primary" /> Recommended Professional
              </p>
              {d.recommended_category && (
                <p className="mt-2 text-base text-ink">
                  Recommended Service:{' '}
                  <span className="font-bold text-primary">{d.recommended_category}</span>
                </p>
              )}
              <Link
                to={`/technicians?name=${encodeURIComponent(d.recommended_category || '')}`}
                className="btn-primary mt-3 text-sm"
              >
                Find {d.recommended_category ? d.recommended_category.replace(' / HVAC', '') : 'a'} Technician{' '}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {!d.professional_required && (
            <div className="flex items-start gap-2 rounded-2xl bg-success/10 p-3 text-sm text-ink/80">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p>This looks like something you can handle safely with the steps above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
