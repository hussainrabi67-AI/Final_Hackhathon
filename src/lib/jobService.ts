import { supabase } from './supabase'
import type {
  ServiceRequestWithCategory, QuoteWithTechnician, BookingWithDetails, BookingReview,
} from '../types/job'

// ============================================================
// Service Requests (customer side)
// ============================================================

export async function fetchCustomerRequests(userId: string): Promise<ServiceRequestWithCategory[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      id, user_id, category_id, title, description, image_url, location, status,
      created_at, updated_at,
      service_categories!left(name, icon)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const requests = (data ?? []) as unknown as Array<{
    id: string
    user_id: string
    category_id: string | null
    title: string | null
    description: string | null
    image_url: string | null
    location: string | null
    status: string
    created_at: string
    updated_at: string
    service_categories: { name: string; icon: string | null } | null
  }>

  // Fetch AI diagnoses for requests that have them
  const requestIds = requests.map((r) => r.id)
  let diagnosisMap = new Map<string, { summary: string; urgency: string; professional: boolean }>()
  if (requestIds.length > 0) {
    const { data: diagnoses } = await supabase
      .from('ai_diagnoses')
      .select('request_id, problem_summary, urgency, professional_required')
      .in('request_id', requestIds)
    for (const d of diagnoses ?? []) {
      diagnosisMap.set(d.request_id, {
        summary: d.problem_summary,
        urgency: d.urgency,
        professional: d.professional_required,
      })
    }
  }

  return requests.map((r) => {
    const diag = diagnosisMap.get(r.id)
    return {
      id: r.id,
      user_id: r.user_id,
      category_id: r.category_id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      location: r.location,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category_name: r.service_categories?.name ?? null,
      category_icon: r.service_categories?.icon ?? null,
      diagnosis_summary: diag?.summary ?? null,
      diagnosis_urgency: diag?.urgency ?? null,
      diagnosis_professional: diag?.professional ?? null,
    }
  })
}

// ============================================================
// Service Requests (technician side)
// ============================================================

export async function fetchRequestsForTechnician(
  technicianId: string,
): Promise<ServiceRequestWithCategory[]> {
  // Get technician's service category IDs
  const { data: techServices, error: tsErr } = await supabase
    .from('technician_services')
    .select('service_category_id')
    .eq('technician_id', technicianId)

  if (tsErr) throw new Error(tsErr.message)
  if (!techServices || techServices.length === 0) return []

  const categoryIds = techServices.map((ts) => ts.service_category_id as string)

  // Fetch requests matching those categories with status 'requested' or 'matching' or 'quoted'
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      id, user_id, category_id, title, description, image_url, location, status,
      created_at, updated_at,
      service_categories!left(name, icon)
    `)
    .in('category_id', categoryIds)
    .in('status', ['requested', 'matching', 'quoted'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const requests = (data ?? []) as unknown as Array<{
    id: string
    user_id: string
    category_id: string | null
    title: string | null
    description: string | null
    image_url: string | null
    location: string | null
    status: string
    created_at: string
    updated_at: string
    service_categories: { name: string; icon: string | null } | null
  }>

  // Fetch AI diagnoses
  const requestIds = requests.map((r) => r.id)
  let diagnosisMap = new Map<string, { summary: string; urgency: string; professional: boolean }>()
  if (requestIds.length > 0) {
    const { data: diagnoses } = await supabase
      .from('ai_diagnoses')
      .select('request_id, problem_summary, urgency, professional_required')
      .in('request_id', requestIds)
    for (const d of diagnoses ?? []) {
      diagnosisMap.set(d.request_id, {
        summary: d.problem_summary,
        urgency: d.urgency,
        professional: d.professional_required,
      })
    }
  }

  return requests.map((r) => {
    const diag = diagnosisMap.get(r.id)
    return {
      id: r.id,
      user_id: r.user_id,
      category_id: r.category_id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      location: r.location,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category_name: r.service_categories?.name ?? null,
      category_icon: r.service_categories?.icon ?? null,
      diagnosis_summary: diag?.summary ?? null,
      diagnosis_urgency: diag?.urgency ?? null,
      diagnosis_professional: diag?.professional ?? null,
    }
  })
}

// ============================================================
// Quotes
// ============================================================

export async function fetchQuotesForRequest(requestId: string): Promise<QuoteWithTechnician[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id, request_id, technician_id, amount, message, status, created_at
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const quotes = (data ?? []) as Array<{
    id: string
    request_id: string
    technician_id: string
    amount: number | null
    message: string | null
    status: string
    created_at: string
  }>

  if (quotes.length === 0) return []

  // Fetch technician details from public_technicians
  const technicianIds = [...new Set(quotes.map((q) => q.technician_id))]
  const { data: techs } = await supabase
    .from('public_technicians')
    .select('id, name, avatar_url, profession, experience_years, service_area, average_rating, review_count, completed_jobs')
    .in('id', technicianIds)

  const techMap = new Map<string, Record<string, unknown>>()
  for (const t of techs ?? []) {
    techMap.set(t.id, t)
  }

  return quotes.map((q) => {
    const t = techMap.get(q.technician_id) ?? {}
    return {
      id: q.id,
      request_id: q.request_id,
      technician_id: q.technician_id,
      amount: q.amount,
      message: q.message,
      status: q.status,
      created_at: q.created_at,
      technician_name: (t.name as string) ?? null,
      technician_avatar: (t.avatar_url as string) ?? null,
      technician_profession: (t.profession as string) ?? null,
      technician_experience: (t.experience_years as number) ?? null,
      technician_service_area: (t.service_area as string) ?? null,
      technician_rating: (t.average_rating as number) ?? null,
      technician_review_count: (t.review_count as number) ?? 0,
      technician_completed_jobs: (t.completed_jobs as number) ?? 0,
    }
  })
}

export async function fetchQuotesByTechnician(
  technicianId: string,
): Promise<QuoteWithTechnician[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id, request_id, technician_id, amount, message, status, created_at
    `)
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const quotes = (data ?? []) as Array<{
    id: string
    request_id: string
    technician_id: string
    amount: number | null
    message: string | null
    status: string
    created_at: string
  }>

  if (quotes.length === 0) return []

  return quotes.map((q) => ({
    id: q.id,
    request_id: q.request_id,
    technician_id: q.technician_id,
    amount: q.amount,
    message: q.message,
    status: q.status,
    created_at: q.created_at,
    technician_name: null,
    technician_avatar: null,
    technician_profession: null,
    technician_experience: null,
    technician_service_area: null,
    technician_rating: null,
    technician_review_count: 0,
    technician_completed_jobs: 0,
  }))
}

export async function createQuote(params: {
  requestId: string
  technicianId: string
  amount: number
  message: string
}): Promise<string | null> {
  // Check for existing active quote from this technician for this request
  const { data: existing } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('request_id', params.requestId)
    .eq('technician_id', params.technicianId)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing) {
    throw new Error('You already have an active quote for this request.')
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      request_id: params.requestId,
      technician_id: params.technicianId,
      amount: params.amount,
      message: params.message,
      status: 'pending',
    })
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.id ?? null
}

export async function rejectRequestByTechnician(
  requestId: string,
  technicianId: string,
): Promise<void> {
  // Insert a rejected quote record to track the rejection
  const { error } = await supabase
    .from('quotes')
    .insert({
      request_id: requestId,
      technician_id: technicianId,
      amount: 0,
      message: '',
      status: 'rejected',
    })

  if (error) throw new Error(error.message)
}

// ============================================================
// Accept Quote (atomic, via RPC)
// ============================================================

export async function acceptQuote(quoteId: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_quote', { p_quote_id: quoteId })

  if (error) throw new Error(error.message)
  return data as string
}

// ============================================================
// Bookings
// ============================================================

export async function fetchCustomerBookings(userId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, request_id, user_id, technician_id, scheduled_at, location, notes,
      status, created_at, updated_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return enrichBookings(data ?? [])
}

export async function fetchTechnicianBookings(technicianId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, request_id, user_id, technician_id, scheduled_at, location, notes,
      status, created_at, updated_at
    `)
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return enrichBookings(data ?? [])
}

export async function fetchBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, request_id, user_id, technician_id, scheduled_at, location, notes,
      status, created_at, updated_at
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const enriched = await enrichBookings([data])
  return enriched[0] ?? null
}

async function enrichBookings(
  bookings: Array<Record<string, unknown>>,
): Promise<BookingWithDetails[]> {
  if (bookings.length === 0) return []

  const requestIds = [...new Set(bookings.map((b) => b.request_id as string))]
  const technicianIds = [...new Set(bookings.map((b) => b.technician_id as string))]

  // Fetch request details
  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, title, description, image_url, category_id, service_categories!left(name, icon)')
    .in('id', requestIds)

  const reqMap = new Map<string, Record<string, unknown>>()
  for (const r of requests ?? []) {
    reqMap.set(r.id, r)
  }

  // Fetch technician details
  const { data: techs } = await supabase
    .from('public_technicians')
    .select('id, name, avatar_url, profession')
    .in('id', technicianIds)

  const techMap = new Map<string, Record<string, unknown>>()
  for (const t of techs ?? []) {
    techMap.set(t.id, t)
  }

  // Fetch accepted quote amounts
  const { data: quotes } = await supabase
    .from('quotes')
    .select('request_id, technician_id, amount, message, status')
    .eq('status', 'accepted')
    .in('request_id', requestIds)

  const quoteMap = new Map<string, { amount: number; message: string }>()
  for (const q of quotes ?? []) {
    const key = `${q.request_id}_${q.technician_id}`
    quoteMap.set(key, { amount: q.amount, message: q.message })
  }

  return bookings.map((b) => {
    const req = reqMap.get(b.request_id as string) ?? {}
    const tech = techMap.get(b.technician_id as string) ?? {}
    const quoteKey = `${b.request_id}_${b.technician_id}`
    const quote = quoteMap.get(quoteKey)

    const cat = req.service_categories as { name: string; icon: string | null } | null | undefined

    return {
      id: b.id as string,
      request_id: b.request_id as string,
      user_id: b.user_id as string,
      technician_id: b.technician_id as string,
      scheduled_at: b.scheduled_at as string | null,
      location: b.location as string | null,
      notes: b.notes as string | null,
      status: b.status as string,
      created_at: b.created_at as string,
      updated_at: b.updated_at as string,
      request_title: (req.title as string) ?? null,
      request_description: (req.description as string) ?? null,
      request_image: (req.image_url as string) ?? null,
      request_category_name: cat?.name ?? null,
      request_category_icon: cat?.icon ?? null,
      technician_name: (tech.name as string) ?? null,
      technician_avatar: (tech.avatar_url as string) ?? null,
      technician_profession: (tech.profession as string) ?? null,
      quote_amount: quote?.amount ?? null,
      quote_message: quote?.message ?? null,
    }
  })
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string,
): Promise<void> {
  // Fetch current status to validate transition
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .maybeSingle()

  if (fetchErr) throw new Error(fetchErr.message)
  if (!booking) throw new Error('Booking not found.')

  const currentStatus = booking.status as string

  // Validate transition
  const { data: valid, error: transErr } = await supabase.rpc('valid_booking_status_transition', {
    p_current: currentStatus,
    p_new: newStatus,
  })

  if (transErr) throw new Error(transErr.message)
  if (!valid) {
    throw new Error(`Cannot change status from "${currentStatus}" to "${newStatus}".`)
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  // If completed, also update the service request
  if (newStatus === 'completed') {
    const { data: b } = await supabase
      .from('bookings')
      .select('request_id')
      .eq('id', bookingId)
      .maybeSingle()

    if (b) {
      await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', b.request_id)
    }
  }
}

export async function updateBookingScheduledAt(
  bookingId: string,
  scheduledAt: string,
  location: string,
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ scheduled_at: scheduledAt, location, status: 'scheduled' })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)
}

// ============================================================
// Reviews
// ============================================================

export async function fetchReviewForBooking(bookingId: string): Promise<BookingReview | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as BookingReview | null
}

export async function createReview(params: {
  bookingId: string
  userId: string
  technicianId: string
  rating: number
  comment: string
}): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId,
      user_id: params.userId,
      technician_id: params.technicianId,
      rating: params.rating,
      comment: params.comment,
    })

  if (error) throw new Error(error.message)
}
