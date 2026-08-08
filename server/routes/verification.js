const express = require('express');
const store = require('../db/store');
const db = require('../db/mysql'); // ✅ Updated to use MySQL
const { runVerification, computeTrustScore } = require('../services/complianceEngine');
const { hasLLM } = require('../services/aiService');
const { employees, vendors, systems, departments } = require('../data/demoData');

const router = express.Router();

// Run verification
router.post('/run', async (req, res) => {
  try {
    // Get rules from MySQL or JSON
    let rules = await db.getAllRules();
    if (!rules || rules.length === 0) {
      rules = store.read('rules').filter((r) => r.active);
    }

    if (!rules || rules.length === 0) {
      return res.status(400).json({ error: 'Upload at least one policy first.' });
    }

    // Run compliance engine
    const findings = runVerification(rules);
    const trust = computeTrustScore(findings);

    // Save to MySQL
    try {
      await db.saveFindings(findings.map(f => ({ ...f, ruleId: f.ruleId || 'unknown' })));
      await db.saveTrustHistory(trust);
      console.log(`✅ Verification saved to MySQL: ${findings.length} findings, Trust Score: ${trust.overall}`);
    } catch (dbError) {
      console.warn('⚠️ MySQL save failed, using JSON fallback:', dbError.message);
    }

    // JSON fallback
    store.replaceAll('findings', findings.map((f, i) => ({ id: `f_${Date.now()}_${i}`, ...f })));
    store.insert('trustHistory', { at: new Date().toISOString(), overall: trust.overall, categories: trust.categories });

    res.json({ findings, trust });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get from MySQL or JSON
    let findings = await db.getFindings();
    if (!findings || findings.length === 0) {
      findings = store.read('findings');
    }

    let policies = await db.getPolicies();
    if (!policies || policies.length === 0) {
      policies = store.read('policies');
    }

    let trustHistory = await db.getTrustHistory();
    if (!trustHistory || trustHistory.length === 0) {
      trustHistory = store.read('trustHistory');
    }

    const trust = trustHistory && trustHistory.length 
      ? trustHistory[trustHistory.length - 1] 
      : { overall: null, categories: {} };

    const openFindings = findings.filter((f) => f.status === 'fail').length || 0;
    const totalFindings = findings.length || 0;

    res.json({
      trust,
      trustHistory,
      policiesEvaluated: policies.length || 0,
      employeesVerified: employees.length,
      vendorsReviewed: vendors.length,
      systemsChecked: systems.length,
      departmentsEvaluated: departments.length,
      openFindings,
      totalFindings,
      aiConfigured: hasLLM(),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get findings with filters
router.get('/findings', async (req, res) => {
  try {
    let findings = await db.getFindings();
    if (!findings || findings.length === 0) {
      findings = store.read('findings');
    }

    const { status, severity, department } = req.query;
    let out = findings;
    if (status) out = out.filter((f) => f.status === status);
    if (severity) out = out.filter((f) => f.severity === severity);
    if (department) out = out.filter((f) => f.department === department);
    res.json(out);
  } catch (err) {
    console.error('Findings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Department scores
router.get('/departments', async (req, res) => {
  try {
    let findings = await db.getFindings();
    if (!findings || findings.length === 0) {
      findings = store.read('findings');
    }

    const byDept = {};
    findings.forEach((f) => {
      byDept[f.department] = byDept[f.department] || { department: f.department, total: 0, open: 0 };
      byDept[f.department].total += 1;
      if (f.status === 'fail') byDept[f.department].open += 1;
    });
    
    const out = Object.values(byDept).map((d) => ({ 
      ...d, 
      score: d.total ? Math.round(((d.total - d.open) / d.total) * 100) : 100 
    }));
    res.json(out);
  } catch (err) {
    console.error('Departments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vendors
router.get('/vendors', (req, res) => {
  res.json({ vendors });
});

// Executive Report
router.get('/report', async (req, res) => {
  try {
    let findings = await db.getFindings();
    if (!findings || findings.length === 0) {
      findings = store.read('findings');
    }

    let policies = await db.getPolicies();
    if (!policies || policies.length === 0) {
      policies = store.read('policies');
    }

    let trustHistory = await db.getTrustHistory();
    if (!trustHistory || trustHistory.length === 0) {
      trustHistory = store.read('trustHistory');
    }

    const trust = trustHistory && trustHistory.length 
      ? trustHistory[trustHistory.length - 1] 
      : { overall: null, categories: {} };

    const openFindings = findings.filter((f) => f.status === 'fail');
    const passedControls = findings.filter((f) => f.status === 'pass').length;

    res.json({
      generatedAt: new Date().toISOString(),
      trust,
      policies: policies || [],
      openFindings: openFindings || [],
      passedControls: passedControls || 0,
      totalControls: findings.length || 0,
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;