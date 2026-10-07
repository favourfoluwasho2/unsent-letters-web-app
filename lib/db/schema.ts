import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const letters = pgTable('letters', {
  id: uuid('id').defaultRandom().primaryKey(),
  serial: varchar('serial', { length: 12 }).notNull().unique(),
  body: text('body').notNull(),
  writtenDate: timestamp('written_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deviceTokenHash: text('device_token_hash').notNull(),
  status: varchar('status', { length: 20 }).default('published').notNull(),
})

export const replies = pgTable('replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  letterId: uuid('letter_id').notNull(),
  serial: varchar('serial', { length: 12 }).notNull().unique(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deviceTokenHash: text('device_token_hash').notNull(),
  status: varchar('status', { length: 20 }).default('published').notNull(),
})

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const postingLimits = pgTable('posting_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceTokenHash: text('device_token_hash').notNull().unique(),
  windowStartedAt: timestamp('window_started_at', { withTimezone: true }).defaultNow().notNull(),
  postCount: integer('post_count').default(0).notNull(),
})
