import { createHash, randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { letters, replies } from '@/lib/db/schema'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function serial(prefix: string) {
  return `${prefix}-${randomInt(1000, 10000)}`
}

async function deviceToken() {
  const store = await cookies()
  const existing = store.get('unsent_device')?.value
  if (existing) return existing
  const token = crypto.randomUUID()
  store.set('unsent_device', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365 })
  return token
}

export async function GET(request: Request) {
  const letterSerial = new URL(request.url).searchParams.get('letter')?.trim()
  if (!letterSerial) return NextResponse.json({ error: 'Letter serial is required.' }, { status: 400 })

  const [letter] = await db.select({ id: letters.id }).from(letters).where(eq(letters.serial, letterSerial)).limit(1)
  if (!letter) return NextResponse.json({ error: 'Letter not found.' }, { status: 404 })

  const rows = await db.select({ id: replies.id, serial: replies.serial, parentReplyId: replies.parentReplyId, body: replies.body, createdAt: replies.createdAt }).from(replies).where(eq(replies.letterId, letter.id)).orderBy(asc(replies.createdAt))
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const letterSerial = typeof payload?.letterSerial === 'string' ? payload.letterSerial.trim() : ''
  const body = typeof payload?.body === 'string' ? payload.body.trim() : ''
  const parentReplySerial = typeof payload?.parentReplySerial === 'string' ? payload.parentReplySerial.trim() : ''
  if (!letterSerial || body.length < 20 || body.length > 3000) return NextResponse.json({ error: 'Reply must be between 20 and 3,000 characters.' }, { status: 400 })

  const [letter] = await db.select({ id: letters.id }).from(letters).where(eq(letters.serial, letterSerial)).limit(1)
  if (!letter) return NextResponse.json({ error: 'Letter not found.' }, { status: 404 })

  let parentReplyId: string | null = null
  if (parentReplySerial) {
    const [parent] = await db.select({ id: replies.id, letterId: replies.letterId }).from(replies).where(eq(replies.serial, parentReplySerial)).limit(1)
    if (!parent || parent.letterId !== letter.id) return NextResponse.json({ error: 'Parent reply not found.' }, { status: 400 })
    parentReplyId = parent.id
  }

  const token = await deviceToken()
  const [created] = await db.insert(replies).values({ letterId: letter.id, parentReplyId, serial: serial('R'), body, deviceTokenHash: hashToken(token), status: 'published' }).returning({ id: replies.id, serial: replies.serial, parentReplyId: replies.parentReplyId, body: replies.body, createdAt: replies.createdAt })
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Replies are immutable.' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Replies are immutable.' }, { status: 405 })
}

export const dynamic = 'force-dynamic'
