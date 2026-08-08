const express = require('express');
const store = require('../db/store');
const { runVerification, computeTrustScore } = require('../services/complianceEngine');
const { hasLLM } = require('../services/aiService');
const { employees, vendors, systems, departments } = require('../data/demoData');

const router = express.Router();

router.post('/run', (req, res) => {
  const rules = store.read('rules').filter((r) => r.active);
  if (!rules.length) {
    return res.status(400).json({ error: 'Upload at least one policy first.' });
  }
  const findings = runVerification(rules);
  const trust = computeTrustScore(findings);

  store.replaceAll('findings', findings.map((f, i) => ({ id: `f_${Date.now()}_${i}`, ...f })));
  store.insert('trustHistory', { at: new Date().toISOString(), overall: trust.overall, categories: trust.categories });

  res.json({ findings, trust });
});

router.get('/dashboard', (req, res) => {
  const findings = store.read('findings');
  const policies = store.read('policies');
  const trustHistory = store.read('trustHistory');
  const trust = trustHistory.length ? trustHistory[trustHistory.length - 1] : { overall: null, categories: {} };

  res.json({
    trust,
    trustHistory,
    policiesEvaluated: policies.length,
    employeesVerified: employees.length,
    vendorsReviewed: vendors.length,
    systemsChecked: systems.length,
    departmentsEvaluated: departments.length,
    openFindings: findings.filter((f) => f.status === 'fail').length,
    totalFindings: findings.length,
    aiConfigured: hasLLM(),
  });
});

router.get('/findings', (req, res) => {
  const findings = store.read('findings');
  const { status, severity, department } = req.query;
  let out = findings;
  if (status) out = out.filter((f) => f.status === status);
  if (severity) out = out.filter((f) => f.severity === severity);
  if (department) out = out.filter((f) => f.department === department);
  res.json(out);
});

router.get('/departments', (req, res) => {
  const findings = store.read('findings');
  const byDept = {};
  findings.forEach((f) => {
    byDept[f.department] = byDept[f.department] || { department: f.department, total: 0, open: 0 };
    byDept[f.department].total += 1;
    if (f.status === 'fail') byDept[f.department].open += 1;
  });
  const out = Object.values(byDept).map((d) => ({ ...d, score: d.total ? Math.round(((d.total - d.open) / d.total) * 100) : 100 }));
  res.json(out);
});

router.get('/vendors', (req, res) => {
  const findings = store.read('findings').filter((f) => f.department === 'Vendor Management');
  res.json({ vendors, findings });
});

router.get('/report', (req, res) => {
  const findings = store.read('findings');
  const policies = store.read('policies');
  const trustHistory = store.read('trustHistory');
  const trust = trustHistory.length ? trustHistory[trustHistory.length - 1] : { overall: null, categories: {} };
  res.json({
    generatedAt: new Date().toISOString(),
    trust,
    policies,
    openFindings: findings.filter((f) => f.status === 'fail'),
    passedControls: findings.filter((f) => f.status === 'pass').length,
    totalControls: findings.length,
  });
});

module.exports = router;
