/* WhatsApp webhook for Yerzzir Store.
   GET verifies the webhook with Meta: it returns hub.challenge when
   hub.mode is subscribe and hub.verify_token matches
   WHATSAPP_VERIFY_TOKEN.
   POST receives a WhatsApp message, stores it as a chat conversation
   linked to the sender phone, and sends a short automatic
   acknowledgement through the WhatsApp Cloud API only when
   WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set. When they are
   unset, the message is stored and the response says so honestly.
   Server logs record counts and statuses only, never tokens and never
   message bodies. */

import { applyCors, sendJson, getBody, handleDbError } from '../../lib/http.js'
import { findConversationByPhone, createConversation, addMessage } from '../../lib/db.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp.js'

const ACK_TEXT = 'Hello, thanks for messaging Yerzzir Store. An operator will reply to you here shortly.'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method === 'GET') {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    if (!verifyToken) {
      return sendJson(res, 503, {
        error: 'WhatsApp webhook is not configured. Set WHATSAPP_VERIFY_TOKEN.',
      })
    }
    const mode = req.query && req.query['hub.mode']
    const token = req.query && req.query['hub.verify_token']
    const challenge = req.query && req.query['hub.challenge']
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return res.status(200).send(challenge)
    }
    return sendJson(res, 403, { error: 'Verification failed.' })
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  let stored = 0
  let replied = 0
  try {
    const entries = Array.isArray(body.entry) ? body.entry : []
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : []
      for (const change of changes) {
        const value = change.value || {}
        const messages = Array.isArray(value.messages) ? value.messages : []
        for (const message of messages) {
          if (message.type !== 'text' || !message.text || !message.from) continue
          let conversation = await findConversationByPhone(message.from)
          if (!conversation) {
            conversation = await createConversation({
              phone: message.from,
              source: 'whatsapp',
            })
          }
          await addMessage(conversation.id, 'customer', message.text.body)
          stored += 1
          const result = await sendWhatsAppMessage(message.from, ACK_TEXT)
          if (result.sent) replied += 1
        }
      }
    }
    const whatsappConfigured = Boolean(
      process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
    )
    return sendJson(res, 200, {
      ok: true,
      stored,
      replied,
      whatsapp: whatsappConfigured ? 'configured' : 'not-configured',
    })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[webhook/whatsapp] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
