/* POST /api/carts. Records an abandoned cart snapshot for later
   reminders. Only carts that include an email address are accepted,
   because the reminder sequence may only email addresses given at
   checkout or signup. See docs/emails/abandoned-cart.md. */

import { applyCors, sendJson, getBody, handleDbError } from '../lib/http.js'
import { isValidEmail, validateItems } from '../lib/validate.js'
import { createCart } from '../lib/db.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  const errors = []
  if (!isValidEmail(body.email)) errors.push('email')
  const itemsError = validateItems(body.items)
  if (itemsError) errors.push('items: ' + itemsError)
  if (errors.length > 0) {
    return sendJson(res, 400, { error: 'Validation failed.', fields: errors })
  }
  const items = body.items.map((item) => ({
    id: item.id || null,
    name: String(item.name).trim(),
    price: Math.round(Number(item.price)),
    qty: Number(item.qty),
    lineTotal: Math.round(Number(item.price)) * Number(item.qty),
  }))
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  try {
    const cart = await createCart({
      email: body.email.trim(),
      items,
      subtotal,
      total: subtotal,
    })
    return sendJson(res, 201, { id: cart.id, cart })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/carts] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
