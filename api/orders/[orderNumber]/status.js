/* PATCH /api/orders/:orderNumber/status. Updates the delivery status
   of one order. Requires the admin token. */

import { applyCors, sendJson, getBody, requireAdmin, handleDbError } from '../../../lib/http.js'
import { updateOrderStatus } from '../../../lib/db.js'

const ALLOWED_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!requireAdmin(req, res)) return
  const orderNumber = req.query && req.query.orderNumber
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  if (!ALLOWED_STATUSES.includes(body.status)) {
    return sendJson(res, 400, {
      error: 'status must be one of: ' + ALLOWED_STATUSES.join(', ') + '.',
    })
  }
  try {
    const order = await updateOrderStatus(orderNumber, body.status)
    if (!order) return sendJson(res, 404, { error: 'Order not found.' })
    return sendJson(res, 200, { order })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/orders/status] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
