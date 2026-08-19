require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const teamRoutes = require('./routes/teams');
const submissionRoutes = require('./routes/submissions');
const resultRoutes = require('./routes/results');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET — copy .env.example to .env and set one before starting the server.');
  process.exit(1);
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/results', resultRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SIH Portal API listening on port ${PORT}`));
