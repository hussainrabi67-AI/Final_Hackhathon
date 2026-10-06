export interface AIDiagnosis {
  problem_summary: string
  possible_causes: string[]
  safe_steps: string[]
  safety_warning: string
  urgency: string
  professional_required: boolean
  recommended_category: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  diagnosis?: AIDiagnosis
  imageUrl?: string
}
