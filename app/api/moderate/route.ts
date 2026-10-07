import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json().catch(() => ({ text: '' }))
  if (typeof text !== 'string' || text.trim().length < 1) return NextResponse.json({ allowed: false, reason: 'Please write something first.' }, { status: 400 })
  try {
    const result = await generateText({
      model: 'alibaba/qwen-3-14b',
      temperature: 0,
      system: 'You moderate anonymous peer-support letters. Return JSON only with keys allowed (boolean), category ("contact_details" | "self_harm" | "ok"), message (string). Block any personal names, emails, phone numbers, URLs, social handles, or language suggesting self-harm. For contact details, tell the writer exactly what kind of detail to remove. For self-harm, respond warmly and encourage a trusted person or local crisis helpline. Otherwise message is empty.',
      prompt: text,
    })
    const parsed = JSON.parse(result.text.replace(/^```json\s*|\s*```$/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ allowed: false, category: 'ok', message: 'We could not complete the safety check. Please try again.' }, { status: 503 })
  }
}
