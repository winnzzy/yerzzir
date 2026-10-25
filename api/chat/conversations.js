/* POST /api/chat/conversations. Opens a customer chat conversation.
   Messages wait in a queue and the operator replies through the reply
   endpoint. The widget polls the messages route for replies. There is
   no automatic answering here: replies come from the operator. */

import { applyCors, sendJson, getBody, handleDbError } from '../../lib/http.js'
import { createConversation } from '../../lib/db.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  const body = getBody(req)
  if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
  try {
    const conversation = await createConversation({
      customerName: body.customerName || body.name || null,
      phone: body.phone || null,
      source: 'site',
    })
    return sendJson(res, 201, { conversation })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/chat/conversations] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
