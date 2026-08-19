const express = require('express');
const { Results, allTeamsWithDetails } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Public — only returns data once the admin has published results.
router.get('/', (_req, res) => {
  const published = Results.isPublished();
  if (!published) return res.json({ published: false, winner: null, runnerUp: null, shortlisted: [] });

  const ranked = allTeamsWithDetails().filter(t => t.submission && t.submission.rank);
  res.json({
    published: true,
    winner: ranked.find(t => t.submission.rank === 'winner') || null,
    runnerUp: ranked.find(t => t.submission.rank === 'runner-up') || null,
    shortlisted: ranked.filter(t => t.submission.rank === 'shortlisted')
  });
});

// Admin only — current publish state (used to drive the publish/unpublish button).
router.get('/state', requireRole('admin'), (_req, res) => {
  res.json({ published: Results.isPublished() });
});

router.post('/publish', requireRole('admin'), (_req, res) => {
  Results.publish();
  res.json({ published: true });
});

router.post('/unpublish', requireRole('admin'), (_req, res) => {
  Results.unpublish();
  res.json({ published: false });
});

module.exports = router;
