/* Tiny hash router. Routes live in the URL hash so the site works when
   served as static files, with no server configuration. */

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart] = raw.split('?')
  const query = {}
  if (queryPart) {
    const params = new URLSearchParams(queryPart)
    params.forEach((value, key) => {
      query[key] = value
    })
  }
  return { path: pathPart || '/', query }
}

export function navigate(path) {
  window.location.hash = '#' + path
}

/* Match a path against a pattern like /product/:id. Returns the params
   object on a match, or null. */
export function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i]
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(pathParts[i])
    } else if (part !== pathParts[i]) {
      return null
    }
  }
  return params
}
