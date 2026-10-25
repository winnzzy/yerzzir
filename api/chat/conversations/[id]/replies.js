/* POST /api/chat/conversations/:id/replies. Operator reply endpoint.
   Requires the admin token. The reply is stored with sender operator
   and shows up when the widget polls the messages route. This is how
   live chat works on this store: customers write, the operator reads
   the queue and replies here, and the widget polls for the reply. For
   a WhatsApp conversation, the reply is also sent to the customer on
   WhatsApp when the WhatsApp credentials are set. */

import { applyCors, sendJson, getBody, requireAdmin, handleDbError } from '../../../../lib/http.js'
import { getConversation, addMessage } from '../../../../lib/db.js'
import { sendWhatsAppMessage } from '../../../../lib/whatsapp.js'
import { isNonEmptyString } from '../../../../lib/validate.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!requireAdmin(req, res)) return
  const id = Number(req.query && req.query.id)
  if (!Number.isInteger(id)) {
    return sendJson(res, 400, { error: 'Valid conversation id is required.' })
  }
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  if (!isNonEmptyString(body.body) || body.body.trim().length > 2000) {
    return sendJson(res, 400, {
      error: 'Message body is required and must be under 2000 characters.',
    })
  }
  try {
    const conversation = await getConversation(id)
    if (!conversation) {
      return sendJson(res, 404, { error: 'Conversation not found.' })
    }
    const message = await addMessage(id, 'operator', body.body.trim())
    let whatsappSent = false
    if (conversation.source === 'whatsapp' && conversation.phone) {
      const result = await sendWhatsAppMessage(conversation.phone, body.body.trim())
      whatsappSent = result.sent
    }
    return sendJson(res, 201, { message, whatsappSent })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/chat/replies] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
