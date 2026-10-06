import { supabase } from './supabase'
import type { AIDiagnosis } from '../types/ai'

export async function uploadProblemImage(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('problem-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('problem-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function createServiceRequest(params: {
  userId: string
  description: string
  categoryId?: string | null
  imageUrl?: string | null
  location?: string | null
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      user_id: params.userId,
      title: params.description.slice(0, 80),
      description: params.description,
      category_id: params.categoryId ?? null,
      image_url: params.imageUrl ?? null,
      location: params.location ?? null,
      status: 'requested',
    })
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.id ?? null
}

export async function diagnoseProblem(params: {
  description: string
  categoryId?: string
  imageUrl?: string
  requestId?: string
}): Promise<AIDiagnosis> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnose`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      description: params.description,
      categoryId: params.categoryId,
      imageUrl: params.imageUrl,
      requestId: params.requestId,
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    throw new Error(errBody.error || `Request failed (${response.status})`)
  }

  const data = await response.json()

  if (!data.diagnosis || !data.diagnosis.problem_summary) {
    throw new Error('Received an invalid AI response. Please try again.')
  }

  return data.diagnosis as AIDiagnosis
}

export async function markRequestSolved(requestId: string): Promise<void> {
  await supabase
    .from('service_requests')
    .update({ status: 'completed' })
    .eq('id', requestId)
}
