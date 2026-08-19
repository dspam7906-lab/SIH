const express = require('express');
const { Teams, Submissions, allTeamsWithDetails } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin only — every submission, joined with team info.
router.get('/', requireRole('admin'), (_req, res) => {
  const withSubs = allTeamsWithDetails().filter(t => t.submission);
  res.json({ submissions: withSubs });
});

// Student — the logged-in student's own team's submission, if any.
router.get('/mine', requireRole('student'), (req, res) => {
  const team = Teams.findByLeader(req.user.id);
  if (!team) return res.status(404).json({ error: 'Register a team before submitting a project.' });
  res.json({ submission: Submissions.findByTeam(team.id) || null });
});

// Student — create or overwrite their team's submission.
router.post('/', requireRole('student'), (req, res) => {
  const team = Teams.findByLeader(req.user.id);
  if (!team) return res.status(404).json({ error: 'Register a team before submitting a project.' });

  const { title, repoLink, description, videoLink, liveLink } = req.body || {};
  if (!title || !repoLink || !description) {
    return res.status(400).json({ error: 'Title, repository link, and description are required.' });
  }
  const submission = Submissions.upsert({
    teamId: team.id, title, repoLink, description,
    videoLink: videoLink || '', liveLink: liveLink || ''
  });
  res.status(201).json({ submission });
});

// Admin only — shortlist / rank a submission.
router.patch('/:id/rank', requireRole('admin'), (req, res) => {
  const { rank } = req.body || {};
  const allowed = [null, '', 'shortlisted', 'runner-up', 'winner'];
  if (!allowed.includes(rank)) return res.status(400).json({ error: 'Invalid rank value.' });
  const submission = Submissions.setRank(req.params.id, rank);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ submission });
});

module.exports = router;
