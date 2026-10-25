/* Email sending for the Yerzzir Store backend, through Resend. The
   templates here mirror docs/emails/order-confirmation.md and
   docs/emails/abandoned-cart.md. When RESEND_API_KEY or
   EMAIL_FROM_DOMAIN is unset, every send returns a not-configured
   result and nothing is sent. No key, domain, or address is hardcoded
   anywhere in this file. Server logs record only the subject and the
   result, never recipient addresses or message bodies. */

import { formatNaira } from './validate.js'

const RESEND_URL = 'https://api.resend.com/emails'

/* Delivery fees below mirror src/config/site.js. If the store changes
   its delivery fees, update both places. */
const STANDARD_FEE = 3000
const EXPRESS_FEE = 5000

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_DOMAIN)
}

function storeUrl() {
  return (process.env.STORE_URL || '').trim()
}

async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    console.log('[email] not configured, skipping send. Subject: ' + subject)
    return { sent: false, reason: 'not-configured' }
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Yerzzir Store <orders@' + process.env.EMAIL_FROM_DOMAIN + '>',
        to: [to],
        subject,
        html,
        text,
      }),
    })
    if (!response.ok) {
      console.log('[email] Resend request failed. Status: ' + response.status)
      return { sent: false, reason: 'resend-error' }
    }
    const data = await response.json()
    console.log('[email] sent. Subject: ' + subject + '. Resend id: ' + (data.id || 'unknown'))
    return { sent: true, id: data.id || null }
  } catch (err) {
    console.log('[email] send failed. Error: ' + err.message)
    return { sent: false, reason: 'send-failed' }
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function deliveryEstimateText(deliveryMethod) {
  return deliveryMethod === 'express'
    ? '1 to 2 working days'
    : '3 to 5 working days'
}

function cartItemsText(items) {
  return items.map((item) => {
    const lineTotal = Number(item.price) * Number(item.qty)
    return item.name + ' x ' + item.qty + ' - ' + formatNaira(lineTotal)
  }).join('\n')
}

function cartItemsHtml(items) {
  return '<ul>' + items.map((item) => {
    const lineTotal = Number(item.price) * Number(item.qty)
    return '<li>' + escapeHtml(item.name) + ' x ' + item.qty + ' - '
      + escapeHtml(formatNaira(lineTotal)) + '</li>'
  }).join('') + '</ul>'
}

/* Order confirmation email. For this Flutterwave only store it goes out
   once payment is confirmed, not when an unpaid order is created, so
   customers are never emailed about orders that were never paid. One
   email per order. */
export async function sendOrderConfirmation(order) {
  const contact = order.contact || {}
  const shipping = order.shipping || {}
  const addressLines = [
    shipping.street || '',
    [shipping.city || '', shipping.state || ''].filter(Boolean).join(', ')
      + (shipping.postal ? ', ' + shipping.postal : ''),
  ].filter(Boolean).join('\n')
  const subject = 'Your Yerzzir Store order ' + order.orderNumber + ' is confirmed'
  const itemsText = cartItemsText(order.items || [])
  const deliveryFeeText = order.deliveryFee === 0
    ? 'Free'
    : formatNaira(order.deliveryFee)
  const trackLine = storeUrl()
    ? 'Track your order here: ' + storeUrl() + '/#/track\n'
      + 'You need your order number and phone number to track it.'
    : 'Track your order on the Track order page using your order number '
      + 'and phone number.'
  const text = 'Hi ' + (contact.fullName || 'there') + ',\n\n'
    + 'Thank you for your order. Your order ' + order.orderNumber + ' is confirmed.\n\n'
    + 'Items:\n' + itemsText + '\n\n'
    + 'Subtotal: ' + formatNaira(order.subtotal) + '\n'
    + 'Delivery: ' + deliveryFeeText + '\n'
    + 'Total: ' + formatNaira(order.total) + '\n\n'
    + 'Payment method: Flutterwave\n'
    + 'Delivery address:\n' + addressLines + '\n\n'
    + 'Estimated delivery: ' + deliveryEstimateText(order.deliveryMethod) + '\n\n'
    + trackLine + '\n\n'
    + 'Your payment was processed through Flutterwave, which emails you a '
    + 'payment receipt after a successful payment.\n\n'
    + 'Thank you for shopping with Yerzzir Store.'
  const html = '<!doctype html><html><head><meta charset="utf-8">'
    + '<title>Your order is confirmed</title></head><body>'
    + '<p>Hi ' + escapeHtml(contact.fullName || 'there') + ',</p>'
    + '<p>Thank you for your order. Your order ' + escapeHtml(order.orderNumber)
    + ' is confirmed.</p>'
    + cartItemsHtml(order.items || [])
    + '<p>Subtotal: ' + escapeHtml(formatNaira(order.subtotal)) + '<br>'
    + 'Delivery: ' + escapeHtml(deliveryFeeText) + '<br>'
    + 'Total: ' + escapeHtml(formatNaira(order.total)) + '</p>'
    + '<p>Payment method: Flutterwave</p>'
    + '<p>Delivery address:<br>' + escapeHtml(addressLines).replace(/\n/g, '<br>') + '</p>'
    + '<p>Estimated delivery: ' + escapeHtml(deliveryEstimateText(order.deliveryMethod)) + '</p>'
    + '<p>Your payment was processed through Flutterwave, which emails you a '
    + 'payment receipt after a successful payment.</p>'
    + '<p>Thank you for shopping with Yerzzir Store.</p>'
    + '</body></html>'
  return sendEmail({ to: contact.email, subject, html, text })
}

const ABANDONED_SUBJECTS = {
  1: 'You left something in your cart at Yerzzir Store',
  2: 'Still thinking it over? Your cart is waiting',
  3: 'Last call: your Yerzzir Store cart',
}

/* Abandoned cart email for one step of the documented sequence.
   Step 1 goes 1 hour after abandonment, step 2 after 24 hours, and
   step 3 after 72 hours. */
export async function sendAbandonedCartEmail(cart, step) {
  const subject = ABANDONED_SUBJECTS[step] || ABANDONED_SUBJECTS[1]
  const itemsText = cartItemsText(cart.items || [])
  const shopLine = storeUrl()
    ? 'Complete your order here: ' + storeUrl() + '/#/shop'
    : 'Return to Yerzzir Store to complete your order.'
  let text = 'Hi there,\n\n'
  if (step === 1) {
    text += 'You left items in your cart at Yerzzir Store. They are still waiting '
      + 'for you:\n\n' + itemsText + '\n\n' + shopLine + '\n\n'
      + 'If you have a question about delivery or payment, reply to this email '
      + 'and the store will help.'
  } else if (step === 2) {
    text += 'Your cart at Yerzzir Store is still waiting for you:\n\n' + itemsText + '\n\n'
      + 'Standard delivery costs ' + formatNaira(STANDARD_FEE) + ' and takes 3 to 5 working '
      + 'days. Express delivery costs ' + formatNaira(EXPRESS_FEE) + ' and takes 1 to 2 working '
      + 'days.\n\n' + shopLine + '\n\n'
      + 'If you no longer want these items, you can ignore this email and your '
      + 'cart will simply expire.'
  } else {
    text += 'This is the last reminder about your cart at Yerzzir Store:\n\n' + itemsText + '\n\n'
      + shopLine + '\n\n'
      + 'After this email, the store will not contact you again about this '
      + 'cart. If you want to hear about new products later, you can sign up '
      + 'on the store site.'
  }
  const html = '<!doctype html><html><head><meta charset="utf-8">'
    + '<title>' + escapeHtml(subject) + '</title></head><body>'
    + '<p>' + escapeHtml(text).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'
    + '</body></html>'
  return sendEmail({ to: cart.email, subject, html, text })
}
