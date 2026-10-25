/* GET /api/cron/reminders. Vercel Cron route for abandoned cart
   reminders. Vercel calls this route on the schedule in vercel.json
   and sends the CRON_SECRET as a Bearer token. The route processes
   every open cart once, sends only due reminders, and records each
   send, so nothing duplicates even when the route runs often. */

import { applyCors, sendJson, getHeader, safeEqual, handleDbError } from '../../lib/http.js'
import { processAllCarts } from '../../lib/reminderRunner.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return sendJson(res, 503, { error: 'Cron reminders are not configured. Set CRON_SECRET.' })
  }
  const auth = getHeader(req, 'authorization') || ''
  if (!safeEqual(auth, 'Bearer ' + cronSecret)) {
    return sendJson(res, 401, { error: 'Invalid cron secret.' })
  }
  try {
    const result = await processAllCarts(Date.now())
    return sendJson(res, 200, { ok: true, ...result })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/cron/reminders] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
