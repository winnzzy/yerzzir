/* GET /api/orders/:orderNumber?phone=:phone. Looks up one order by
   order number plus phone, exactly like the storefront track page does
   today. A wrong phone returns the same not found response as a
   missing order, so the endpoint never reveals which numbers exist. */

import { applyCors, sendJson, handleDbError } from '../../lib/http.js'
import { findOrderByNumberAndPhone } from '../../lib/db.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const orderNumber = req.query && req.query.orderNumber
  const phone = req.query && req.query.phone
  if (!orderNumber) {
    return sendJson(res, 400, { error: 'Order number is required.' })
  }
  if (!phone) {
    return sendJson(res, 400, { error: 'phone query parameter is required.' })
  }
  try {
    const order = await findOrderByNumberAndPhone(orderNumber, phone)
    if (!order) return sendJson(res, 404, { error: 'Order not found.' })
    return sendJson(res, 200, { order })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/orders/lookup] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
