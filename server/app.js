require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/mysql'); // ✅ Add this

const policiesRouter = require('./routes/policies');
const verificationRouter = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Initialize database on startup
initDatabase().catch(console.error);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/policies', policiesRouter);
app.use('/api/verification', verificationRouter);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve built React app
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 TRUST ISSUES server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
});