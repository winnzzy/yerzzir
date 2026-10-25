/* Abandoned cart reminder rules for Yerzzir Store. These rules mirror
   docs/emails/abandoned-cart.md: three steps at 1 hour, 24 hours, and
   72 hours after abandonment, at most one email per step, never two
   steps on the same day, and never a send for a cart that converted to
   an order or opted out. The cron route and the manual remind route
   both use nextDueStep, so they can never double send. */

export const REMINDER_STEPS = [
  { step: 1, afterHours: 1 },
  { step: 2, afterHours: 24 },
  { step: 3, afterHours: 72 },
]

function dayString(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

/* Returns the next reminder step due for a cart, or null. sentReminders
   is a list of { step, sentAt } records. A cart that already received
   a reminder today gets no second reminder today, even when a later
   step is also due. */
export function nextDueStep(cart, sentReminders, nowMs) {
  const createdMs = new Date(cart.createdAt).getTime()
  const ageHours = (nowMs - createdMs) / 3600000
  const sentSteps = sentReminders.map((r) => r.step)
  const sentToday = sentReminders.some(
    (r) => dayString(new Date(r.sentAt).getTime()) === dayString(nowMs),
  )
  if (sentToday) return null
  for (const s of REMINDER_STEPS) {
    if (!sentSteps.includes(s.step) && ageHours >= s.afterHours) return s.step
  }
  return null
}
