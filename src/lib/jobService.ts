import { supabase } from './supabase'
import type {
  ServiceRequestWithCategory, QuoteWithTechnician, BookingWithDetails, BookingReview,
} from '../types/job'
export { fetchOwnTechnicianRecord } from './technicianService'

// ============================================================
// Service Requests (customer side)
// ============================================================

export async function fetchCustomerRequests(userId: string): Promise<ServiceRequestWithCategory[]> {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        id, user_id, category_id, title, description, image_url, location, status,
        created_at, updated_at,
        service_categories!left(name, icon)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    const requests = data as unknown as Array<{
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
      try {
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
      } catch {
        // Continue without diagnoses
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
  } catch {
    return []
  }
}

// ============================================================
// Service Requests (technician side)
// ============================================================

export async function fetchRequestsForTechnician(
  technicianId: string,
): Promise<ServiceRequestWithCategory[]> {
  try {
    const { data: techServices, error: tsErr } = await supabase
      .from('technician_services')
      .select('service_category_id')
      .eq('technician_id', technicianId)

    if (tsErr || !techServices || techServices.length === 0) return []

    const categoryIds = techServices.map((ts) => ts.service_category_id as string)

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

    if (error || !data) return []

    const requests = data as unknown as Array<{
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

    const requestIds = requests.map((r) => r.id)
    let diagnosisMap = new Map<string, { summary: string; urgency: string; professional: boolean }>()
    if (requestIds.length > 0) {
      try {
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
      } catch {
        // ignore
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
  } catch {
    return []
  }
}

// ============================================================
// Quotes
// ============================================================

export async function fetchQuotesForRequest(requestId: string): Promise<QuoteWithTechnician[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, request_id, technician_id, amount, message, status, created_at
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return []

    const quotes = data as Array<{
      id: string
      request_id: string
      technician_id: string
      amount: number | null
      message: string | null
      status: string
      created_at: string
    }>

    const technicianIds = [...new Set(quotes.map((q) => q.technician_id))]
    let techMap = new Map<string, Record<string, unknown>>()
    try {
      const { data: techs } = await supabase
        .from('public_technicians')
        .select('id, name, avatar_url, profession, experience_years, service_area, average_rating, review_count, completed_jobs')
        .in('id', technicianIds)

      for (const t of techs ?? []) {
        techMap.set(t.id, t)
      }
    } catch {
      // ignore
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
  } catch {
    return []
  }
}

export async function fetchQuotesByTechnician(
  technicianId: string,
): Promise<QuoteWithTechnician[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, request_id, technician_id, amount, message, status, created_at
      `)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return []

    const quotes = data as Array<{
      id: string
      request_id: string
      technician_id: string
      amount: number | null
      message: string | null
      status: string
      created_at: string
    }>

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
  } catch {
    return []
  }
}

export async function createQuote(params: {
  requestId: string
  technicianId: string
  amount: number
  message: string
}): Promise<string | null> {
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

  // Notify customer of new quote
  try {
    const { data: req } = await supabase
      .from('service_requests')
      .select('user_id, title')
      .eq('id', params.requestId)
      .maybeSingle()

    if (req?.user_id) {
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: 'new_quote',
        title: 'New Quote Received',
        message: `You received a quote of Rs ${params.amount} for your request.`,
        read: false,
      })
    }
  } catch {
    // Ignore notification error
  }

  return data?.id ?? null
}

export async function rejectRequestByTechnician(
  requestId: string,
  technicianId: string,
): Promise<void> {
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

export async function acceptQuote(quoteId: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_quote', { p_quote_id: quoteId })

  if (error) throw new Error(error.message)
  const bookingId = data as string

  // Notify customer and technician
  try {
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('amount, request_id, technician_id, service_requests(user_id), technicians(profile_id, profiles(user_id))')
      .eq('id', quoteId)
      .maybeSingle()

    if (quoteData) {
      const q = quoteData as any
      const customerUserId = q.service_requests?.user_id
      const techUserId = q.technicians?.profiles?.user_id

      if (customerUserId) {
        await supabase.from('notifications').insert({
          user_id: customerUserId,
          type: 'quote_accepted',
          title: 'Booking Confirmed',
          message: `Your booking has been confirmed for Rs ${q.amount}.`,
          read: false,
        })
      }

      if (techUserId) {
        await supabase.from('notifications').insert({
          user_id: techUserId,
          type: 'quote_accepted_technician',
          title: 'Quote Accepted!',
          message: `A customer accepted your quote of Rs ${q.amount}! Check your jobs to schedule the visit.`,
          read: false,
        })
      }
    }
  } catch {
    // Ignore notification error
  }

  return bookingId
}

// ============================================================
// Bookings
// ============================================================

export async function fetchCustomerBookings(userId: string): Promise<BookingWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, request_id, user_id, technician_id, scheduled_at, location, notes,
        status, created_at, updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return enrichBookings(data)
  } catch {
    return []
  }
}

export async function fetchTechnicianBookings(technicianId: string): Promise<BookingWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, request_id, user_id, technician_id, scheduled_at, location, notes,
        status, created_at, updated_at
      `)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return enrichBookings(data)
  } catch {
    return []
  }
}

export async function fetchBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, request_id, user_id, technician_id, scheduled_at, location, notes,
        status, created_at, updated_at
      `)
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !data) return null

    const enriched = await enrichBookings([data])
    return enriched[0] ?? null
  } catch {
    return null
  }
}

async function enrichBookings(
  bookings: Array<Record<string, unknown>>,
): Promise<BookingWithDetails[]> {
  if (bookings.length === 0) return []

  const requestIds = [...new Set(bookings.map((b) => b.request_id as string))]
  const technicianIds = [...new Set(bookings.map((b) => b.technician_id as string))]

  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, title, description, image_url, category_id, service_categories!left(name, icon)')
    .in('id', requestIds)

  const reqMap = new Map<string, Record<string, unknown>>()
  for (const r of requests ?? []) {
    reqMap.set(r.id, r)
  }

  const { data: techs } = await supabase
    .from('public_technicians')
    .select('id, name, avatar_url, profession')
    .in('id', technicianIds)

  const techMap = new Map<string, Record<string, unknown>>()
  for (const t of techs ?? []) {
    techMap.set(t.id, t)
  }

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
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .maybeSingle()

  if (fetchErr) throw new Error(fetchErr.message)
  if (!booking) throw new Error('Booking not found.')

  const currentStatus = booking.status as string

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

  if (newStatus === 'completed') {
    const { data: b } = await supabase
      .from('bookings')
      .select('request_id, user_id')
      .eq('id', bookingId)
      .maybeSingle()

    if (b) {
      await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', b.request_id)

      // Notify customer of completion and send review reminder
      try {
        await supabase.from('notifications').insert([
          {
            user_id: b.user_id,
            type: 'job_completed',
            title: 'Job Completed',
            message: 'Your service job has been marked as completed.',
            read: false,
          },
          {
            user_id: b.user_id,
            type: 'review_reminder',
            title: 'How was your service?',
            message: 'Please leave a review and rating for your technician.',
            read: false,
          },
        ])
      } catch {
        // ignore notification error
      }
    }
  } else {
    // Notify customer of intermediate status changes
    try {
      const { data: b } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (b?.user_id) {
        const titleMap: Record<string, string> = {
          scheduled: 'Job Scheduled',
          on_the_way: 'Technician On The Way',
          in_progress: 'Job In Progress',
          cancelled: 'Booking Cancelled',
        }
        const msgMap: Record<string, string> = {
          scheduled: 'Your job has been scheduled by the technician.',
          on_the_way: 'Your technician is now on the way to your location.',
          in_progress: 'Your repair job is currently in progress.',
          cancelled: 'The booking has been cancelled.',
        }

        if (titleMap[newStatus]) {
          await supabase.from('notifications').insert({
            user_id: b.user_id,
            type: 'booking_status_updated',
            title: titleMap[newStatus],
            message: msgMap[newStatus],
            read: false,
          })
        }
      }
    } catch {
      // ignore notification error
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

export async function fetchReviewForBooking(bookingId: string): Promise<BookingReview | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (error) return null
    return data as BookingReview | null
  } catch {
    return null
  }
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
