/* Shared validation helpers for the Yerzzir Store backend. These mirror
   the storefront rules in src/lib/shop.js so the server and the site
   agree on what counts as a valid order. */

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('234')) return '0' + digits.slice(3)
  return digits
}

export function isValidNigerianPhone(phone) {
  return /^0[789][01]\d{8}$/.test(normalizePhone(phone))
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function generateOrderNumber() {
  const now = new Date()
  const date = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return 'TIN-' + date + '-' + random
}

export function formatNaira(amount) {
  const n = Number(amount || 0)
  return '₦' + n.toLocaleString('en-NG')
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/* Validates cart or order items. Each item needs a name, a price above
   zero, and an integer quantity above zero. Returns an error string,
   or null when the items are valid. */
export function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'items must be a non-empty list'
  }
  for (const item of items) {
    if (!item || !isNonEmptyString(item.name)) return 'each item needs a name'
    if (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) {
      return 'each item needs a price above zero'
    }
    if (!Number.isInteger(Number(item.qty)) || Number(item.qty) <= 0) {
      return 'each item needs an integer quantity above zero'
    }
  }
  return null
}
