import { site } from '../config/site.js'

export function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG')
}

/* Delivery fee rule, kept in step with the rule documented in site.js.
   Lagos orders with a subtotal at or above the threshold ship free.
   Otherwise Standard costs the standard fee and Express costs the
   express fee. */
export function getDeliveryFee(method, state, subtotal) {
  const { standardFee, expressFee, freeLagosThreshold, freeLagosState } = site.delivery
  if (state === freeLagosState && subtotal >= freeLagosThreshold) return 0
  return method === 'express' ? expressFee : standardFee
}

export function generateOrderNumber() {
  const now = new Date()
  const date = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return 'TIN-' + date + '-' + random
}

function addBusinessDays(from, days) {
  const date = new Date(from)
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) added += 1
  }
  return date
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

/* Delivery estimate text for the success page, based on the chosen
   method and the day the order was placed. */
export function deliveryEstimate(method, placedAt) {
  const { standardDaysMin, standardDaysMax, expressDaysMin, expressDaysMax } = site.delivery
  const min = method === 'express' ? expressDaysMin : standardDaysMin
  const max = method === 'express' ? expressDaysMax : standardDaysMax
  const start = addBusinessDays(new Date(placedAt), min)
  const end = addBusinessDays(new Date(placedAt), max)
  return formatShortDate(start) + ' to ' + formatShortDate(end)
}

/* Phone handling. Numbers are compared by digits only, and a leading
   234 country code is converted to the local 0 form, so 08031234567
   and +2348031234567 match as the same number. */
export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('234')) return '0' + digits.slice(3)
  return digits
}

export function isValidNigerianPhone(phone) {
  const digits = normalizePhone(phone)
  return /^0[789][01]\d{8}$/.test(digits)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}
