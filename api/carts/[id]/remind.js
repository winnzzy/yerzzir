/* POST /api/carts/:id/remind. Sends the next due reminder for one cart,
   using the same rules as the cron route: at most one email per step,
   never two steps on the same day, and never a send for a cart that
   converted to an order or opted out. Returns the outcome honestly
   when nothing is due. */

import { applyCors, sendJson, handleDbError } from '../../../lib/http.js'
import { getCart } from '../../../lib/db.js'
import { processSingleCart } from '../../../lib/reminderRunner.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const id = Number(req.query && req.query.id)
  if (!Number.isInteger(id)) {
    return sendJson(res, 400, { error: 'Valid cart id is required.' })
  }
  try {
    const cart = await getCart(id)
    if (!cart) return sendJson(res, 404, { error: 'Cart not found.' })
    const result = await processSingleCart(cart, Date.now())
    return sendJson(res, 200, { cartId: cart.id, ...result })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/carts/remind] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
