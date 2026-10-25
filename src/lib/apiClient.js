/* API client for the Yerzzir Store backend. When apiBaseUrl is set,
   orders and chat go through the backend with fetch. When it is null,
   every function falls back to the existing localStorage behavior, so
   the storefront works exactly as today. Nothing in the storefront
   imports this module yet: wiring it in is a separate step, described
   in api/README.md. */

import { apiBaseUrl } from '../config/api.js'

const OrdersKey = 'techimport_orders_v1'
const ChatKey = 'techimport_chat_v1'

export function isApiEnabled() {
  return apiBaseUrl !== null && apiBaseUrl !== undefined
}

function apiUrl(path) {
  return apiBaseUrl + path
}

async function apiFetch(path, options) {
  const opts = options || {}
  const response = await fetch(apiUrl(path), {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((data && data.error) || 'API request failed.')
  }
  return data
}

function readLocal(key) {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch (err) {
    return []
  }
}

function writeLocal(key, value) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('234')) return '0' + digits.slice(3)
  return digits
}

function generateOrderNumber() {
  const now = new Date()
  const date = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return 'TIN-' + date + '-' + random
}

/* Creates an order. Through the API it returns { orderNumber, order }.
   Locally it stores the order in the same localStorage key the
   storefront uses today and returns the same shape. */
export async function createOrder(order) {
  if (!isApiEnabled()) {
    const orders = readLocal(OrdersKey)
    const stored = {
      ...order,
      orderNumber: order.orderNumber || generateOrderNumber(),
      paymentStatus: order.paymentStatus || 'pending',
      status: order.status || 'placed',
    }
    orders.push(stored)
    writeLocal(OrdersKey, orders)
    return { orderNumber: stored.orderNumber, order: stored }
  }
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

/* Looks up one order by order number plus phone. */
export async function fetchOrder(orderNumber, phone) {
  if (!isApiEnabled()) {
    const orders = readLocal(OrdersKey)
    const found = orders.find((o) => o.orderNumber === orderNumber
      && normalizePhone(o.contact && o.contact.phone) === normalizePhone(phone))
    if (!found) throw new Error('Order not found.')
    return { order: found }
  }
  return apiFetch('/api/orders/' + encodeURIComponent(orderNumber)
    + '?phone=' + encodeURIComponent(phone))
}

/* Chat helpers. Locally, conversations and messages live under one
   localStorage key. Through the API they live in Postgres. */
export async function createConversation(data) {
  if (!isApiEnabled()) {
    const conversations = readLocal(ChatKey)
    const conversation = {
      id: Date.now(),
      customerName: data.customerName || data.name || null,
      phone: data.phone || null,
      source: 'site',
      messages: [],
    }
    conversations.push(conversation)
    writeLocal(ChatKey, conversations)
    return { conversation }
  }
  return apiFetch('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function sendChatMessage(conversationId, body) {
  if (!isApiEnabled()) {
    const conversations = readLocal(ChatKey)
    const conversation = conversations.find((c) => String(c.id) === String(conversationId))
    if (!conversation) throw new Error('Conversation not found.')
    const message = {
      id: Date.now(),
      conversationId: conversation.id,
      sender: 'customer',
      body,
      createdAt: new Date().toISOString(),
    }
    conversation.messages.push(message)
    writeLocal(ChatKey, conversations)
    return { message }
  }
  return apiFetch('/api/chat/conversations/' + encodeURIComponent(conversationId) + '/messages', {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export async function fetchChatMessages(conversationId) {
  if (!isApiEnabled()) {
    const conversations = readLocal(ChatKey)
    const conversation = conversations.find((c) => String(c.id) === String(conversationId))
    if (!conversation) throw new Error('Conversation not found.')
    return { messages: conversation.messages || [] }
  }
  return apiFetch('/api/chat/conversations/' + encodeURIComponent(conversationId) + '/messages')
}

export async function sendOperatorReply(conversationId, body, adminToken) {
  if (!isApiEnabled()) {
    const conversations = readLocal(ChatKey)
    const conversation = conversations.find((c) => String(c.id) === String(conversationId))
    if (!conversation) throw new Error('Conversation not found.')
    const message = {
      id: Date.now(),
      conversationId: conversation.id,
      sender: 'operator',
      body,
      createdAt: new Date().toISOString(),
    }
    conversation.messages.push(message)
    writeLocal(ChatKey, conversations)
    return { message }
  }
  return apiFetch('/api/chat/conversations/' + encodeURIComponent(conversationId) + '/replies', {
    method: 'POST',
    headers: { 'x-admin-token': adminToken || '' },
    body: JSON.stringify({ body }),
  })
}
