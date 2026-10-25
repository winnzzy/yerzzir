/* All database access for the Yerzzir Store backend lives in this one
   module, behind small functions. The database is Postgres, reached
   through the single DATABASE_URL env var, so the same code works with
   Supabase (use its pooled transaction mode connection string) or
   Neon. Route handlers in api/ call these functions and never touch
   SQL directly. Swapping providers means changing DATABASE_URL only.
   When DATABASE_URL is unset, every data function throws an error with
   code DB_NOT_CONFIGURED, and routes turn that into an honest 503. */

import pg from 'pg'

import { normalizePhone } from './validate.js'

const { Pool } = pg

let pool = null
let schemaPromise = null

export function getPool() {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  const sslOff = process.env.DATABASE_SSL === 'false'
  pool = new Pool({
    connectionString: url,
    ssl: sslOff ? false : { rejectUnauthorized: false },
    max: 5,
  })
  return pool
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  contact_json JSONB NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone_normalized TEXT NOT NULL,
  shipping_json JSONB NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_fee INTEGER NOT NULL,
  items_json JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL,
  flutterwave_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  items_json JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cart_reminders (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL,
  step INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, step)
);
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'site',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(contact_email);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
`

export async function ensureSchema() {
  const p = getPool()
  if (!p) {
    const err = new Error('Database is not configured. Set DATABASE_URL.')
    err.code = 'DB_NOT_CONFIGURED'
    throw err
  }
  if (!schemaPromise) {
    schemaPromise = p.query(SCHEMA).catch((err) => {
      schemaPromise = null
      throw err
    })
  }
  return schemaPromise
}

function iso(value) {
  if (!value) return value
  if (value instanceof Date) return value.toISOString()
  return value
}

function orderFromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    orderNumber: row.order_number,
    contact: row.contact_json,
    shipping: row.shipping_json,
    deliveryMethod: row.delivery_method,
    deliveryFee: row.delivery_fee,
    items: row.items_json,
    subtotal: row.subtotal,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    flutterwaveTransactionId: row.flutterwave_transaction_id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function cartFromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    items: row.items_json,
    subtotal: row.subtotal,
    total: row.total,
    converted: row.converted === true,
    optedOut: row.opted_out === true,
    createdAt: iso(row.created_at),
  }
}

function conversationFromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    source: row.source,
    createdAt: iso(row.created_at),
  }
}

function messageFromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    body: row.body,
    createdAt: iso(row.created_at),
  }
}

export async function createOrder(data) {
  await ensureSchema()
  const p = getPool()
  const result = await p.query(
    `INSERT INTO orders (
      order_number, contact_json, contact_email, contact_phone_normalized,
      shipping_json, delivery_method, delivery_fee, items_json, subtotal,
      total, payment_method, payment_status, status,
      flutterwave_transaction_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      data.orderNumber,
      JSON.stringify(data.contact),
      data.contact.email.trim(),
      normalizePhone(data.contact.phone),
      JSON.stringify(data.shipping),
      data.deliveryMethod,
      data.deliveryFee,
      JSON.stringify(data.items),
      data.subtotal,
      data.total,
      data.paymentMethod,
      data.paymentStatus,
      data.status,
      data.flutterwaveTransactionId || null,
    ],
  )
  return orderFromRow(result.rows[0])
}

export async function getOrderByNumber(orderNumber) {
  await ensureSchema()
  const result = await getPool().query(
    'SELECT * FROM orders WHERE order_number = $1',
    [orderNumber],
  )
  return orderFromRow(result.rows[0] || null)
}

export async function findOrderByNumberAndPhone(orderNumber, phone) {
  const order = await getOrderByNumber(orderNumber)
  if (!order) return null
  if (order.contact && normalizePhone(order.contact.phone) === normalizePhone(phone)) {
    return order
  }
  return null
}

export async function listOrders(limit) {
  await ensureSchema()
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)
  const result = await getPool().query(
    'SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT $1',
    [safeLimit],
  )
  return result.rows.map(orderFromRow)
}

export async function updateOrderStatus(orderNumber, status) {
  await ensureSchema()
  const result = await getPool().query(
    `UPDATE orders SET status = $1, updated_at = NOW()
     WHERE order_number = $2 RETURNING *`,
    [status, orderNumber],
  )
  return orderFromRow(result.rows[0] || null)
}

export async function markOrderPaid(orderNumber, transactionId) {
  await ensureSchema()
  const result = await getPool().query(
    `UPDATE orders SET payment_status = 'paid',
     flutterwave_transaction_id = $1, updated_at = NOW()
     WHERE order_number = $2 RETURNING *`,
    [transactionId, orderNumber],
  )
  return orderFromRow(result.rows[0] || null)
}

export async function hasOrderFromEmailSince(email, sinceIso) {
  await ensureSchema()
  const result = await getPool().query(
    `SELECT COUNT(*) AS n FROM orders
     WHERE contact_email = $1 AND created_at >= $2`,
    [email.trim(), sinceIso],
  )
  return Number(result.rows[0].n) > 0
}

export async function createCart(data) {
  await ensureSchema()
  const result = await getPool().query(
    `INSERT INTO carts (email, items_json, subtotal, total)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.email.trim(), JSON.stringify(data.items), data.subtotal, data.total],
  )
  return cartFromRow(result.rows[0])
}

export async function getCart(id) {
  await ensureSchema()
  const result = await getPool().query('SELECT * FROM carts WHERE id = $1', [id])
  return cartFromRow(result.rows[0] || null)
}

export async function listOpenCarts() {
  await ensureSchema()
  const result = await getPool().query(
    'SELECT * FROM carts WHERE converted = FALSE AND opted_out = FALSE ORDER BY created_at ASC',
  )
  return result.rows.map(cartFromRow)
}

export async function markCartsConverted(email) {
  await ensureSchema()
  const result = await getPool().query(
    'UPDATE carts SET converted = TRUE WHERE email = $1 AND converted = FALSE',
    [email.trim()],
  )
  return result.rowCount
}

export async function markCartConverted(id) {
  await ensureSchema()
  await getPool().query('UPDATE carts SET converted = TRUE WHERE id = $1', [id])
}

export async function sentReminders(cartId) {
  await ensureSchema()
  const result = await getPool().query(
    'SELECT step, sent_at FROM cart_reminders WHERE cart_id = $1 ORDER BY step ASC',
    [cartId],
  )
  return result.rows.map((row) => ({ step: row.step, sentAt: iso(row.sent_at) }))
}

export async function recordReminder(cartId, step) {
  await ensureSchema()
  try {
    await getPool().query(
      'INSERT INTO cart_reminders (cart_id, step) VALUES ($1, $2)',
      [cartId, step],
    )
    return true
  } catch (err) {
    if (err && err.code === '23505') return false
    throw err
  }
}

export async function createConversation(data) {
  await ensureSchema()
  const result = await getPool().query(
    `INSERT INTO conversations (customer_name, phone, source)
     VALUES ($1, $2, $3) RETURNING *`,
    [data.customerName || null, data.phone || null, data.source || 'site'],
  )
  return conversationFromRow(result.rows[0])
}

export async function getConversation(id) {
  await ensureSchema()
  const result = await getPool().query(
    'SELECT * FROM conversations WHERE id = $1',
    [id],
  )
  return conversationFromRow(result.rows[0] || null)
}

export async function findConversationByPhone(phone) {
  if (!phone) return null
  await ensureSchema()
  const result = await getPool().query(
    'SELECT * FROM conversations WHERE phone = $1 ORDER BY id DESC LIMIT 1',
    [phone],
  )
  return conversationFromRow(result.rows[0] || null)
}

export async function addMessage(conversationId, sender, body) {
  await ensureSchema()
  const result = await getPool().query(
    `INSERT INTO messages (conversation_id, sender, body)
     VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, sender, body],
  )
  return messageFromRow(result.rows[0])
}

export async function listMessages(conversationId) {
  await ensureSchema()
  const result = await getPool().query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY id ASC',
    [conversationId],
  )
  return result.rows.map(messageFromRow)
}
