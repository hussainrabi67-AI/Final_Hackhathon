import { supabase } from './supabase'
import type { AIDiagnosis } from '../types/ai'

export function ruleBasedDiagnosis(description: string): AIDiagnosis {
  const text = description.toLowerCase()

  const rules: Array<{
    keywords: string[]
    category: string
    problem: string
    causes: string[]
    steps: string[]
    warning: string
  }> = [
    {
      keywords: ['ac', 'air conditioner', 'cooling', 'cool', 'hvac', 'compressor'],
      category: 'AC / HVAC',
      problem: 'Possible AC cooling or airflow restriction issue',
      causes: ['Clogged air filter', 'Blocked airflow around the unit', 'Low refrigerant level or coil icing'],
      steps: ['Check and clean the air filter.', 'Ensure vents and outdoor unit are completely unobstructed.'],
      warning: 'Do not open the refrigerant system or electrical components yourself.',
    },
    {
      keywords: ['pipe', 'leak', 'tap', 'faucet', 'water', 'drain', 'toilet', 'sink', 'flush', 'plumb'],
      category: 'Plumber',
      problem: 'Possible plumbing leak or drainage blockage',
      causes: ['Loose fitting or worn washer', 'Pipe corrosion or joint seal failure', 'Clogged drain line'],
      steps: ['Turn off the water isolation valve to the affected fixture.', 'Check if any visible joint can be safely hand-tightened.'],
      warning: 'Do not pour harsh caustic drain chemicals onto old or cracked pipes.',
    },
    {
      keywords: ['electric', 'wiring', 'switch', 'socket', 'power', 'light', 'short', 'breaker', 'spark', 'fuse'],
      category: 'Electrician',
      problem: 'Possible electrical circuit or fixture fault',
      causes: ['Loose wire connection', 'Tripped circuit breaker or overloaded circuit', 'Faulty wall switch or receptacle'],
      steps: ['Turn off the breaker switch for the affected circuit.', 'Check for overloaded multi-plug adapters.'],
      warning: 'Never touch exposed wires or electrical panels with wet hands or bare metal tools.',
    },
    {
      keywords: ['car', 'engine', 'brake', 'tyre', 'tire', 'battery', 'motor', 'clutch', 'transmission'],
      category: 'Car Workshop',
      problem: 'Possible automotive mechanical or electrical issue',
      causes: ['Worn component requiring replacement', 'Low engine oil or coolant fluid', 'Weak 12V battery'],
      steps: ['Check for active dashboard warning lights.', 'Safely inspect fluid levels after engine cools down.'],
      warning: 'Do not work under a vehicle supported only by a portable jack.',
    },
    {
      keywords: ['bike', 'motorcycle', 'scooter', 'chain', 'spark plug'],
      category: 'Bike Mechanic',
      problem: 'Possible two-wheeler mechanical issue',
      causes: ['Slack or unlubricated chain', 'Worn brake shoes or pads', 'Carburetor / fuel delivery blockage'],
      steps: ['Inspect chain tension and lubricate properly.', 'Check tire pressures and oil level.'],
      warning: 'Never adjust or lubricate drive chain while engine is running.',
    },
    {
      keywords: ['washing', 'fridge', 'refrigerator', 'microwave', 'oven', 'machine', 'appliance', 'dishwasher', 'dryer'],
      category: 'Appliance Repair',
      problem: 'Possible appliance electrical or mechanical malfunction',
      causes: ['Power supply issue', 'Clogged lint/drain filter', 'Internal heating or motor element fault'],
      steps: ['Unplug the appliance before inspecting.', 'Check inlet hose, lint filter, and power cord.'],
      warning: 'Do not disassemble appliances while connected to mains power.',
    },
    {
      keywords: ['wood', 'door', 'lock', 'cabinet', 'hinge', 'table', 'chair', 'furniture', 'carpenter'],
      category: 'Carpenter',
      problem: 'Possible woodworking, alignment or hardware issue',
      causes: ['Loose hinge screws', 'Humidity swelling wood frame', 'Latch misalignment'],
      steps: ['Inspect hinge screws and tighten with screwdriver.', 'Check where friction occurs along frame.'],
      warning: 'Always wear safety goggles when sawing or using power tools.',
    },
    {
      keywords: ['solar', 'inverter', 'panel', 'battery system'],
      category: 'Solar',
      problem: 'Possible solar power system generation drop',
      causes: ['Dust or debris on panels', 'Inverter error code', 'Tripped DC breaker'],
      steps: ['Check inverter display panel for error codes.', 'Visually inspect panels for dirt accumulation.'],
      warning: 'High DC voltage remains active during daylight even if main switches are turned off.',
    },
  ]

  const match = rules.find((r) => r.keywords.some((k) => text.includes(k)))

  if (match) {
    return {
      problem_summary: match.problem,
      possible_causes: match.causes,
      safe_steps: match.steps,
      safety_warning: match.warning,
      urgency: 'medium',
      professional_required: true,
      recommended_category: match.category,
    }
  }

  return {
    problem_summary: 'General repair issue',
    possible_causes: ['General wear and tear', 'Loose or damaged mechanical part', 'Environmental wear'],
    safe_steps: ['Carefully inspect the area for visible damage.', 'Take photos and note when the problem began.'],
    safety_warning: 'If you smell gas, see sparks, or hear unusual loud sounds, stop immediately and contact a certified technician.',
    urgency: 'medium',
    professional_required: true,
    recommended_category: 'General Maintenance',
  }
}

export async function uploadProblemImage(file: File, userId: string): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('problem-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) {
      // Return object URL as fallback for preview
      return URL.createObjectURL(file)
    }

    const { data } = supabase.storage.from('problem-images').getPublicUrl(fileName)
    return data.publicUrl
  } catch {
    return URL.createObjectURL(file)
  }
}

export async function createServiceRequest(params: {
  userId: string
  description: string
  categoryId?: string | null
  imageUrl?: string | null
  location?: string | null
}): Promise<string | null> {
  try {
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

    if (error || !data) {
      return `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    }

    // Customer notification
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: 'service_request_created',
      title: 'Service Request Created',
      message: `Your request "${params.description.slice(0, 50)}..." has been created and sent to technicians.`,
      read: false,
    })

    return data.id ?? null
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }
}

export async function diagnoseProblem(params: {
  description: string
  categoryId?: string
  imageUrl?: string
  requestId?: string
}): Promise<AIDiagnosis> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      const apiUrl = `${supabaseUrl}/functions/v1/ai-diagnose`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          description: params.description,
          categoryId: params.categoryId,
          imageUrl: params.imageUrl,
          requestId: params.requestId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.diagnosis && data.diagnosis.problem_summary) {
          return data.diagnosis as AIDiagnosis
        }
      }
    } catch {
      // Fall through to rule-based diagnosis
    }
  }

  // Built-in intelligent diagnosis fallback
  return ruleBasedDiagnosis(params.description)
}

export async function markRequestSolved(requestId: string): Promise<void> {
  try {
    await supabase
      .from('service_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
  } catch {
    // Graceful no-op in local fallback
  }
}
