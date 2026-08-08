const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const store = require('../db/store');
const { extractRulesFromPolicy } = require('../services/aiService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload either a PDF file (multipart field "file") or raw pasted text ({ text, name })
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let text = req.body.text || '';
    let name = req.body.name || 'Untitled Policy';

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

    const rules = await extractRulesFromPolicy(text, name);
    const policy = store.insert('policies', {
      name,
      textPreview: text.slice(0, 500),
      uploadedAt: new Date().toISOString(),
      ruleCount: rules.length,
    });
    const savedRules = rules.map((r) => store.insert('rules', { ...r, policyId: policy.id, active: true }));

    res.json({ policy, rules: savedRules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process policy.' });
  }
});

router.get('/', (req, res) => {
  res.json(store.read('policies'));
});

router.get('/rules', (req, res) => {
  res.json(store.read('rules'));
});

module.exports = router;
