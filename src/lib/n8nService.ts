export interface N8nServiceRequestPayload {
  request_id: string
  user_id: string
  category_id: string | null
  category_name: string | null
  title: string | null
  description: string
  location: string | null
  urgency: string
  professional_required: boolean
}

/**
 * Sends a newly created service request payload to the configured n8n webhook.
 * Fails safely and non-blockingly if n8n is offline or unreachable.
 */
export async function sendServiceRequestToN8n(
  payload: N8nServiceRequestPayload,
): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_N8N_NEW_SERVICE_REQUEST_WEBHOOK as string

  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.trim()) {
    return false
  }

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: payload.request_id,
        user_id: payload.user_id,
        category_id: payload.category_id,
        category_name: payload.category_name,
        title: payload.title,
        description: payload.description,
        location: payload.location,
        urgency: payload.urgency || 'medium',
        professional_required: typeof payload.professional_required === 'boolean'
          ? payload.professional_required
          : true,
      }),
    })

    if (!response.ok) {
      console.warn(`[n8n Webhook] Received status ${response.status}`)
      return false
    }

    return true
  } catch (err) {
    console.warn('[n8n Webhook] Error sending payload (service request unaffected):', err)
    return false
  }
}
