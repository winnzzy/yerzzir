/* POST /api/orders creates an order. GET /api/orders lists orders for
   the store operator and requires the admin token. An order is stored
   with payment status pending until Flutterwave confirms payment. The
   server generates the order number in the existing TIN-YYYYMMDD-XXXX
   format and is authoritative for the subtotal and total. */

import { applyCors, sendJson, getBody, requireAdmin, handleDbError } from '../lib/http.js'
import {
  isValidNigerianPhone,
  isValidEmail,
  isNonEmptyString,
  validateItems,
  generateOrderNumber,
} from '../lib/validate.js'
import { createOrder, listOrders, getOrderByNumber, markCartsConverted } from '../lib/db.js'

function validateOrderPayload(body) {
  const errors = []
  const contact = body.contact || {}
  const shipping = body.shipping || {}
  if (!isNonEmptyString(contact.fullName)) errors.push('contact.fullName')
  if (!isValidNigerianPhone(contact.phone)) errors.push('contact.phone')
  if (!isValidEmail(contact.email)) errors.push('contact.email')
  if (!isNonEmptyString(shipping.street)) errors.push('shipping.street')
  if (!isNonEmptyString(shipping.city)) errors.push('shipping.city')
  if (!isNonEmptyString(shipping.state)) errors.push('shipping.state')
  const itemsError = validateItems(body.items)
  if (itemsError) errors.push('items: ' + itemsError)
  const deliveryMethod = body.deliveryMethod || 'standard'
  if (deliveryMethod !== 'standard' && deliveryMethod !== 'express') {
    errors.push('deliveryMethod')
  }
  const paymentMethod = body.paymentMethod || 'flutterwave'
  if (paymentMethod !== 'flutterwave') {
    errors.push('paymentMethod: only Flutterwave payments are accepted')
  }
  let deliveryFee = 0
  if (body.deliveryFee !== undefined && body.deliveryFee !== null) {
    if (!Number.isFinite(Number(body.deliveryFee)) || Number(body.deliveryFee) < 0) {
      errors.push('deliveryFee')
    } else {
      deliveryFee = Math.round(Number(body.deliveryFee))
    }
  }
  if (errors.length > 0) return { errors }
  const items = body.items.map((item) => ({
    id: item.id || null,
    name: String(item.name).trim(),
    price: Math.round(Number(item.price)),
    qty: Number(item.qty),
    lineTotal: Math.round(Number(item.price)) * Number(item.qty),
  }))
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  return {
    value: {
      contact: {
        fullName: contact.fullName.trim(),
        phone: String(contact.phone).trim(),
        email: contact.email.trim(),
      },
      shipping: {
        street: shipping.street.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        postal: shipping.postal ? String(shipping.postal).trim() : '',
      },
      deliveryMethod,
      deliveryFee,
      items,
      subtotal,
      total: subtotal + deliveryFee,
      paymentMethod,
    },
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  try {
    if (req.method === 'POST') {
      const body = getBody(req)
      if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
      const { errors, value } = validateOrderPayload(body)
      if (errors) {
        return sendJson(res, 400, { error: 'Validation failed.', fields: errors })
      }
      let orderNumber = generateOrderNumber()
      for (let attempt = 0; attempt < 10; attempt++) {
        const existing = await getOrderByNumber(orderNumber)
        if (!existing) break
        orderNumber = generateOrderNumber()
      }
      const order = await createOrder({
        ...value,
        orderNumber,
        paymentStatus: 'pending',
        status: 'placed',
        flutterwaveTransactionId: null,
      })
      await markCartsConverted(value.contact.email)
      return sendJson(res, 201, { orderNumber: order.orderNumber, order })
    }
    if (req.method === 'GET') {
      if (!requireAdmin(req, res)) return
      const orders = await listOrders(req.query && req.query.limit)
      return sendJson(res, 200, { orders })
    }
    return sendJson(res, 405, { error: 'Method not allowed.' })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/orders] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
