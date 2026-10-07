import { createHash, randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { letters } from '@/lib/db/schema'

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

export async function GET() {
  const rows = await db.select({ serial: letters.serial, body: letters.body, writtenDate: letters.writtenDate }).from(letters).where(eq(letters.status, 'published')).orderBy(desc(letters.createdAt)).limit(20)
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const body = typeof payload?.body === 'string' ? payload.body.trim() : ''
  if (body.length < 20 || body.length > 5000) return NextResponse.json({ error: 'Letter must be between 20 and 5,000 characters.' }, { status: 400 })

  const token = await deviceToken()
  const [created] = await db.insert(letters).values({ serial: serial('L'), body, writtenDate: payload?.dated ? new Date() : null, deviceTokenHash: hashToken(token), status: 'published' }).returning({ serial: letters.serial })
  return NextResponse.json(created, { status: 201 })
}
