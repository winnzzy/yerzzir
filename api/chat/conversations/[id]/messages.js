/* GET and POST /api/chat/conversations/:id/messages. GET lists the
   messages of one conversation in order, for widget polling. POST
   appends a customer message to the queue. Operator replies go through
   the replies route, never through this one. */

import { applyCors, sendJson, getBody, handleDbError } from '../../../../lib/http.js'
import { getConversation, addMessage, listMessages } from '../../../../lib/db.js'
import { isNonEmptyString } from '../../../../lib/validate.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  const id = Number(req.query && req.query.id)
  if (!Number.isInteger(id)) {
    return sendJson(res, 400, { error: 'Valid conversation id is required.' })
  }
  try {
    const conversation = await getConversation(id)
    if (!conversation) {
      return sendJson(res, 404, { error: 'Conversation not found.' })
    }
    if (req.method === 'GET') {
      const messages = await listMessages(id)
      return sendJson(res, 200, { messages })
    }
    if (req.method === 'POST') {
      const body = getBody(req)
      if (body === null) return sendJson(res, 400, { error: 'Invalid JSON body.' })
      if (!isNonEmptyString(body.body) || body.body.trim().length > 2000) {
        return sendJson(res, 400, {
          error: 'Message body is required and must be under 2000 characters.',
        })
      }
      const message = await addMessage(id, 'customer', body.body.trim())
      return sendJson(res, 201, { message })
    }
    return sendJson(res, 405, { error: 'Method not allowed.' })
  } catch (err) {
    if (handleDbError(err, res)) return
    console.log('[api/chat/messages] error: ' + err.message)
    return sendJson(res, 500, { error: 'Internal server error.' })
  }
}
