const express = require('express');
const { Users } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, college: u.college || '' };
}

router.post('/signup', (req, res) => {
  const { name, email, password, college } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (Users.findByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const user = Users.createStudent({ name, email, password, college });
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password, role } = req.body || {};
  const user = Users.findByEmail(email || '');
  if (!user || !Users.verifyPassword(user, password || '')) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (role && user.role !== role) {
    return res.status(401).json({ error: `This account is not registered as ${role}.` });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = Users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
