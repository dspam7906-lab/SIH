const express = require('express');
const { Problems } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Public — anyone can browse problem statements.
router.get('/', (_req, res) => {
  res.json({ problems: Problems.all() });
});

// Admin only — add a new problem statement.
router.post('/', requireRole('admin'), (req, res) => {
  const { title, domain, difficulty, description } = req.body || {};
  if (!title || !domain || !description) {
    return res.status(400).json({ error: 'Title, domain, and description are required.' });
  }
  const problem = Problems.add({ title, domain, difficulty: difficulty || 'Medium', description });
  res.status(201).json({ problem });
});

// Admin only — remove a problem statement.
router.delete('/:id', requireRole('admin'), (req, res) => {
  Problems.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
