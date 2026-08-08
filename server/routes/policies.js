const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { extractRulesFromPolicy } = require('../services/aiService');
const store = require('../db/store');
const db = require('../db/mysql'); // ✅ Updated to use MySQL

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload policy (PDF or text)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let text = req.body.text || '';
    let name = req.body.name || 'Untitled Policy';

    // If file uploaded, extract text
    if (req.file) {
      name = req.file.originalname;
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        text = parsed.text;
      } else {
        text = req.file.buffer.toString('utf-8');
      }
    }

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Provide a PDF file or at least a paragraph of policy text.' });
    }

    // Extract rules using AI or heuristic
    const rules = await extractRulesFromPolicy(text, name);
    
    // Prepare policy data
    const policyData = {
      name,
      textPreview: text.slice(0, 500),
      uploadedAt: new Date().toISOString(),
      ruleCount: rules.length,
    };

    // Try MySQL first
    let savedPolicy, savedRules;
    try {
      const result = await db.savePolicy(policyData, rules);
      if (result) {
        savedPolicy = result.policy;
        savedRules = result.rules;
        console.log(`✅ Policy saved to MySQL: ${savedPolicy.name}`);
      }
    } catch (dbError) {
      console.warn('⚠️ MySQL save failed, using JSON fallback:', dbError.message);
    }

    // JSON fallback if MySQL fails
    if (!savedPolicy) {
      const policy = store.insert('policies', policyData);
      savedRules = rules.map((r) => store.insert('rules', { ...r, policyId: policy.id, active: true }));
      savedPolicy = policy;
      console.log(`💾 Policy saved to JSON: ${savedPolicy.name}`);
    }

    res.json({ policy: savedPolicy, rules: savedRules });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process policy.' });
  }
});

// Get all policies
router.get('/', async (req, res) => {
  try {
    let policies = await db.getPolicies();
    if (!policies || policies.length === 0) {
      policies = store.read('policies');
    }
    res.json(policies);
  } catch (err) {
    console.error('Get policies error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get rules for a specific policy
router.get('/:id/rules', async (req, res) => {
  try {
    // Note: MySQL uses UUID, JSON uses policyId
    let rules = await db.getRules ? await db.getRules(req.params.id) : [];
    if (!rules || rules.length === 0) {
      rules = store.read('rules').filter(r => r.policyId === req.params.id);
    }
    res.json(rules);
  } catch (err) {
    console.error('Get rules error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all rules (for verification)
router.get('/rules/all', async (req, res) => {
  try {
    let rules = await db.getAllRules();
    if (!rules || rules.length === 0) {
      rules = store.read('rules').filter(r => r.active);
    }
    res.json(rules);
  } catch (err) {
    console.error('Get all rules error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;