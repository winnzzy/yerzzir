/* POST /api/webhooks/flutterwave. Handles Flutterwave payment events.
   Trust is earned in two steps, never from the webhook body alone:
   1. The verif-hash header must match FLUTTERWAVE_WEBHOOK_SECRET.
   2. The transaction is verified server side with Flutterwave, and the
      amount, currency, and tx_ref must match the stored order.
   Only then is the order marked paid, and the order confirmation email
   is sent. When the env vars are unset, the route changes nothing and
   returns an honest not-configured error. */

import { applyCors, sendJson, getBody, getHeader, safeEqual, handleDbError } from '../../lib/http.js'
import { getOrderByNumber, markOrderPaid } from '../../lib/db.js'
import { sendOrderConfirmation } from '../../lib/email.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!webhookSecret || !secretKey) {
    return sendJson(res, 503, { error: 'Flutterwave webhook is not configured.' })
  }
  const signature = getHeader(req, 'verif-hash')
  if (!safeEqual(signature || '', webhookSecret)) {
    return sendJson(res, 401, { error: 'Invalid webhook signature.' })
  }
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  const event = body.event
  if (event && event !== 'charge.completed') {
    return sendJson(res, 200, { ok: true, action: 'ignored-event' })
  }
  const data = body.data || {}
  const transactionId = data.id
  const txRef = data.tx_ref
  if (!transactionId || !txRef) {
    return sendJson(res, 400, { error: 'Invalid webhook payload.' })
  }
  try {
    const order = await getOrderByNumber(txRef)
    if (!order) {
      return sendJson(res, 200, { ok: true, action: 'order-not-found' })
    }
    if (order.paymentStatus === 'paid') {
      return sendJson(res, 200, {
        ok: true, action: 'already-paid', orderNumber: order.orderNumber,
      })
    }
    let verification
    try {
      const response = await fetch(
        'https://api.flutterwave.com/v3/transactions/'
          + encodeURIComponent(transactionId) + '/verify',
        {
          headers: {
            Authorization: 'Bearer ' + secretKey,
            'Content-Type': 'application/json',
          },
        },
      )
      verification = await response.json()
    } catch (err) {
      console.log('[webhook/flutterwave] verification request failed.')
      return sendJson(res, 502, { error: 'Could not verify transaction with Flutterwave.' })
    }
    const verified = verification && verification.data
    const matches = verified
      && verified.status === 'successful'
      && verified.tx_ref === order.orderNumber
      && Number(verified.amount) === Number(order.total)
      && verified.currency === 'NGN'
    if (!matches) {
      return sendJson(res, 200, { ok: true, action: 'not-successful' })
    }
    const paidOrder = await markOrderPaid(order.orderNumber, String(transactionId))
    const emailResult = await sendOrderConfirmation(paidOrder)
    console.log('[webhook/flutterwave] order marked paid. Email sent: '
      + (emailResult.sent ? 'yes' : 'no')
      + '. Reason: ' + (emailResult.reason || 'sent') + '.')
    return sendJson(res, 200, {
      ok: true, action: 'marked-paid', orderNumber: order.orderNumber,
    })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[webhook/flutterwave] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
