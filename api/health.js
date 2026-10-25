/* GET /api/health. Reports which integrations are configured, as
   booleans only. No secret value is ever revealed here. */

import { applyCors, sendJson } from '../lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  return sendJson(res, 200, {
    ok: true,
    service: 'yerzzir-api',
    integrations: {
      database: Boolean(process.env.DATABASE_URL),
      flutterwave: Boolean(
        process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_WEBHOOK_SECRET,
      ),
      resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_DOMAIN),
      whatsapp: Boolean(
        process.env.WHATSAPP_TOKEN
        && process.env.WHATSAPP_PHONE_NUMBER_ID
        && process.env.WHATSAPP_VERIFY_TOKEN,
      ),
      admin: Boolean(process.env.ADMIN_TOKEN),
      cron: Boolean(process.env.CRON_SECRET),
    },
  })
}
