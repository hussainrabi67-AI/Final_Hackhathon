import { supabase } from './supabase'
import type {
  PublicTechnician, ServiceCategoryDB, ReviewWithUser, TechnicianServiceItem,
} from '../types/technician'

export async function fetchServiceCategories(): Promise<ServiceCategoryDB[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, description, icon, image_url, is_active')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceCategoryDB[]
}

export async function fetchVerifiedTechnicians(categoryId?: string | null): Promise<PublicTechnician[]> {
  let query = supabase
    .from('public_technicians')
    .select('*')
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw new Error(error.message)

  let technicians = (data ?? []) as PublicTechnician[]

  // Filter by category in application since the view returns services as JSON
  if (categoryId) {
    technicians = technicians.filter((t) =>
      t.services.some((s) => s.id === categoryId),
    )
  }

  return technicians
}

export async function fetchTechnicianById(id: string): Promise<PublicTechnician | null> {
  const { data, error } = await supabase
    .from('public_technicians')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as PublicTechnician | null
}

export async function fetchReviewsForTechnician(technicianId: string): Promise<ReviewWithUser[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const reviews = (data ?? []) as Array<{
    id: string
    rating: number
    comment: string | null
    created_at: string
    user_id: string
  }>

  // Fetch reviewer names from profiles
  const userIds = [...new Set(reviews.map((r) => r.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name')
    .in('user_id', userIds)

  const nameMap = new Map<string, string | null>(
    (profiles ?? []).map((p) => [p.user_id, p.name]),
  )

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    user_name: nameMap.get(r.user_id) ?? null,
  }))
}

export async function fetchOwnTechnicianRecord(profileId: string) {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function fetchOwnTechnicianServices(technicianId: string): Promise<TechnicianServiceItem[]> {
  const { data, error } = await supabase
    .from('technician_services')
    .select(`
      service_category_id,
      service_categories!inner(id, name, icon)
    `)
    .eq('technician_id', technicianId)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const cat = row.service_categories as unknown as { id: string; name: string; icon: string | null }
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
    }
  })
}

export async function updateTechnicianProfile(
  technicianId: string,
  fields: {
    profession?: string | null
    bio?: string | null
    experience_years?: number | null
    service_area?: string | null
    whatsapp_number?: string | null
    availability?: string
    avatar_url?: string | null
  },
): Promise<void> {
  const { error } = await supabase
    .from('technicians')
    .update(fields)
    .eq('id', technicianId)

  if (error) throw new Error(error.message)
}

export async function setTechnicianServices(
  technicianId: string,
  categoryIds: string[],
): Promise<void> {
  // Fetch current services
  const { data: current, error: fetchErr } = await supabase
    .from('technician_services')
    .select('id, service_category_id')
    .eq('technician_id', technicianId)

  if (fetchErr) throw new Error(fetchErr.message)

  const currentIds = new Set((current ?? []).map((r) => r.service_category_id as string))
  const newIds = new Set(categoryIds)

  // Delete removed
  const toDelete = (current ?? []).filter((r) => !newIds.has(r.service_category_id))
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('technician_services')
      .delete()
      .in('id', toDelete.map((r) => r.id))
    if (delErr) throw new Error(delErr.message)
  }

  // Insert new
  const toInsert = categoryIds.filter((id) => !currentIds.has(id))
  if (toInsert.length > 0) {
    const { error: insErr } = await supabase
      .from('technician_services')
      .insert(toInsert.map((categoryId) => ({ technician_id: technicianId, service_category_id: categoryId })))
    if (insErr) throw new Error(insErr.message)
  }
}

export async function uploadTechnicianAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/avatar-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('problem-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('problem-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function findCategoryIdByName(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (error) return null
  return data?.id ?? null
}
