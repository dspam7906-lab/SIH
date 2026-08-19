// ===========================================================
// Simple JSON-file data store.
// No external database needed — good enough for a hackathon
// portal's traffic. Swap this file out for a real DB (Postgres,
// Mongo, etc.) later without touching the route files, as long
// as you keep the same function signatures.
// ===========================================================
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function loadRaw() {
  if (!fs.existsSync(DB_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveRaw(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function seedIfEmpty() {
  const existing = loadRaw();
  if (existing) return existing;

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sih.gov.in';

  const data = {
    users: [
      {
        id: 'u_admin',
        name: 'Portal Admin',
        email: adminEmail,
        passwordHash: bcrypt.hashSync(adminPassword, 10),
        role: 'admin',
        college: 'SIH Nodal Office'
      }
    ],
    problems: [
      { id: 'ps01', code: 'PS-01', title: 'AI-Based Crop Disease Detection', domain: 'AgriTech', difficulty: 'Medium', description: 'Build a mobile-first tool that detects crop disease from leaf images and suggests remedies in regional languages.' },
      { id: 'ps02', code: 'PS-02', title: 'Smart Traffic Signal Optimisation', domain: 'Smart Mobility', difficulty: 'Hard', description: 'Design an adaptive traffic-signal system using live camera feeds to reduce average junction wait time.' },
      { id: 'ps03', code: 'PS-03', title: 'Offline-First Rural Health Records', domain: 'HealthTech', difficulty: 'Medium', description: 'Create a health-record app that works offline in low-connectivity villages and syncs when online.' },
      { id: 'ps04', code: 'PS-04', title: 'Fake News Detection in Regional Languages', domain: 'GovTech', difficulty: 'Hard', description: 'Build a classifier and browser extension that flags misinformation in Hindi, Tamil, and Bengali news posts.' },
      { id: 'ps05', code: 'PS-05', title: 'Waste Segregation via Computer Vision', domain: 'CleanTech', difficulty: 'Easy', description: 'Prototype a low-cost camera + ML pipeline that sorts household waste into wet, dry, and hazardous bins.' },
      { id: 'ps06', code: 'PS-06', title: 'Digital Ledger for Farmer Cooperatives', domain: 'FinTech', difficulty: 'Medium', description: 'Build a transparent ledger so farmer cooperatives can track collective sales, dues, and payouts.' },
      { id: 'ps07', code: 'PS-07', title: 'Accessible Exam Portal for Visually Impaired Students', domain: 'EdTech', difficulty: 'Medium', description: 'Design a screen-reader-first exam portal with audio question delivery and voice-based answering.' },
      { id: 'ps08', code: 'PS-08', title: 'Disaster Response Resource Mapper', domain: 'GovTech', difficulty: 'Hard', description: 'Build a live map that matches disaster-relief volunteers and supplies to affected zones by need and distance.' }
    ],
    teams: [],
    submissions: [],
    resultsPublished: false
  };
  saveRaw(data);
  return data;
}

let cache = seedIfEmpty();

function persist() {
  saveRaw(cache);
}

// ---------- users ----------
const Users = {
  all: () => cache.users,
  findByEmail: (email) => cache.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id) => cache.users.find(u => u.id === id),
  createStudent({ name, email, password, college }) {
    const user = {
      id: uid('u'),
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'student',
      college: college || ''
    };
    cache.users.push(user);
    persist();
    return user;
  },
  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.passwordHash);
  }
};

// ---------- problems ----------
const Problems = {
  all: () => cache.problems,
  add(p) {
    const item = { id: uid('ps'), code: 'PS-' + String(cache.problems.length + 1).padStart(2, '0'), ...p };
    cache.problems.push(item);
    persist();
    return item;
  },
  remove(id) {
    cache.problems = cache.problems.filter(p => p.id !== id);
    persist();
  }
};

// ---------- teams ----------
const Teams = {
  all: () => cache.teams,
  findByLeader: (userId) => cache.teams.find(t => t.leaderId === userId),
  findById: (id) => cache.teams.find(t => t.id === id),
  create({ leaderId, name, problemId, members, college }) {
    const team = { id: uid('team'), name, leaderId, problemId, members, college, createdAt: Date.now() };
    cache.teams.push(team);
    persist();
    return team;
  }
};

// ---------- submissions ----------
const Submissions = {
  all: () => cache.submissions,
  findByTeam: (teamId) => cache.submissions.find(s => s.teamId === teamId),
  findById: (id) => cache.submissions.find(s => s.id === id),
  upsert({ teamId, title, repoLink, videoLink, liveLink, description }) {
    const existing = cache.submissions.find(s => s.teamId === teamId);
    if (existing) {
      Object.assign(existing, { title, repoLink, videoLink, liveLink, description, submittedAt: Date.now() });
      persist();
      return existing;
    }
    const sub = {
      id: uid('sub'), teamId, title, repoLink, videoLink, liveLink, description,
      submittedAt: Date.now(), status: 'submitted', rank: null
    };
    cache.submissions.push(sub);
    persist();
    return sub;
  },
  setRank(id, rank) {
    const s = cache.submissions.find(x => x.id === id);
    if (!s) return null;
    s.rank = rank || null;
    persist();
    return s;
  }
};

// ---------- results publish flag ----------
const Results = {
  isPublished: () => !!cache.resultsPublished,
  publish() { cache.resultsPublished = true; persist(); },
  unpublish() { cache.resultsPublished = false; persist(); }
};

// ---------- composed views ----------
function teamWithDetails(team) {
  return {
    ...team,
    problem: Problems.all().find(p => p.id === team.problemId) || null,
    submission: Submissions.findByTeam(team.id) || null
  };
}
function allTeamsWithDetails() {
  return Teams.all().map(teamWithDetails);
}

module.exports = { Users, Problems, Teams, Submissions, Results, teamWithDetails, allTeamsWithDetails };
