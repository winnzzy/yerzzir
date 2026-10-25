/* Small HTTP helpers shared by the Yerzzir Store API routes. These keep
   every route on the same response shape and the same auth rules. */

export function getHeader(req, name) {
  const headers = req.headers || {}
  return headers[name.toLowerCase()] || headers[name] || null
}

export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token')
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return true
  }
  return false
}

export function sendJson(res, status, body) {
  return res.status(status).json(body)
}

export function getBody(req) {
  if (req.body === null || req.body === undefined) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch (err) {
      return null
    }
  }
  return req.body
}

/* Compares two strings without leaking timing information about where
   they differ. Returns false when either value is not a string. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/* Admin guard for operator routes. The admin token lives only in the
   ADMIN_TOKEN env var. When it is unset, admin routes are disabled
   with an honest error and are never open by default. Returns true
   when the request is authorized, and sends the error itself when it
   is not. */
export function requireAdmin(req, res) {
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    sendJson(res, 503, {
      error: 'Admin features are disabled because ADMIN_TOKEN is not set.',
    })
    return false
  }
  const given = getHeader(req, 'x-admin-token')
  if (!safeEqual(given || '', token)) {
    sendJson(res, 401, { error: 'Invalid admin token.' })
    return false
  }
  return true
}

/* Converts a database error about a missing configuration into the
   honest 503 response the routes return. Returns true when it handled
   the error. */
export function handleDbError(err, res) {
  if (err && err.code === 'DB_NOT_CONFIGURED') {
    sendJson(res, 503, {
      error: 'Database is not configured. Set DATABASE_URL.',
    })
    return true
  }
  return false
}
