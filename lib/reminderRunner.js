/* Runs abandoned cart reminders. The Vercel Cron route and the manual
   remind route both use these functions, so a cart can never receive
   the same step twice and never receives two steps on the same day.
   Every send is recorded in the database before the run reports it. */

import {
  listOpenCarts,
  sentReminders,
  recordReminder,
  markCartConverted,
  hasOrderFromEmailSince,
} from './db.js'
import { sendAbandonedCartEmail } from './email.js'
import { nextDueStep } from './reminders.js'

/* Processes one cart. Returns { sent, step } or { sent: false, reason }.
   Reasons: converted, opted-out, none-due, not-configured, not-sent. */
export async function processSingleCart(cart, nowMs) {
  if (!cart) return { sent: false, reason: 'not-found' }
  if (cart.converted) return { sent: false, reason: 'converted' }
  if (cart.optedOut) return { sent: false, reason: 'opted-out' }
  if (await hasOrderFromEmailSince(cart.email, cart.createdAt)) {
    await markCartConverted(cart.id)
    return { sent: false, reason: 'converted' }
  }
  const sent = await sentReminders(cart.id)
  const step = nextDueStep(cart, sent, nowMs)
  if (!step) return { sent: false, reason: 'none-due' }
  const result = await sendAbandonedCartEmail(cart, step)
  if (!result.sent) return { sent: false, reason: result.reason || 'not-sent' }
  await recordReminder(cart.id, step)
  return { sent: true, step }
}

/* Processes every open cart once. Logs counts only, never addresses
   or message bodies. */
export async function processAllCarts(nowMs) {
  const carts = await listOpenCarts()
  let sent = 0
  let skipped = 0
  for (const cart of carts) {
    const result = await processSingleCart(cart, nowMs)
    if (result.sent) sent += 1
    else skipped += 1
  }
  console.log('[reminders] tick finished. Checked: ' + carts.length
    + '. Sent: ' + sent + '. Skipped: ' + skipped + '.')
  return { checked: carts.length, sent, skipped }
}
