const express = require('express');
const { Teams, Users, teamWithDetails, allTeamsWithDetails } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin only — every team with its problem statement + submission attached.
router.get('/', requireRole('admin'), (_req, res) => {
  res.json({ teams: allTeamsWithDetails() });
});

// Student — the logged-in student's own team, if they've registered one.
router.get('/mine', requireRole('student'), (req, res) => {
  const team = Teams.findByLeader(req.user.id);
  res.json({ team: team ? teamWithDetails(team) : null });
});

// Student — register a team (one per student, as team leader).
router.post('/', requireRole('student'), (req, res) => {
  const { name, problemId, members } = req.body || {};
  if (!name || !problemId || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'Team name, a problem statement, and at least one member are required.' });
  }
  if (Teams.findByLeader(req.user.id)) {
    return res.status(409).json({ error: 'You have already registered a team.' });
  }
  const leader = Users.findById(req.user.id);
  const team = Teams.create({
    leaderId: req.user.id,
    name,
    problemId,
    members,
    college: (leader && leader.college) || ''
  });
  res.status(201).json({ team: teamWithDetails(team) });
});

module.exports = router;
