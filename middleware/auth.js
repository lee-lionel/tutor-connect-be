const jwt = require('jsonwebtoken')

/* Verifies the bearer token and attaches the signed payload to req.user.
   Every mutating route must sit behind this — ids are then taken from the
   token rather than from the URL or request body, which is what stops one
   user acting as another. */
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Sign in to continue' })
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET)
    req.user = payload.user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Sign in again.' })
  }
}

/* Role comes from the signed token, so it cannot be edited client-side. */
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Only a ${role} can do that` })
    }
    return next()
  }
}

module.exports = { requireAuth, requireRole }
