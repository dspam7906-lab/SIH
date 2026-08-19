const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    SECRET,
    { expiresIn: '7d' }
  );
}

// Attaches req.user if a valid token is present. Does not reject
// requests without a token — use requireAuth for that.
function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Log in to continue.' });
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Log in to continue.' });
    if (req.user.role !== role) return res.status(403).json({ error: `This action requires a ${role} account.` });
    next();
  };
}

module.exports = { signToken, attachUser, requireAuth, requireRole };
