// Supports Anthropic (Claude) or OpenAI — set ANTHROPIC_API_KEY or
// OPENAI_API_KEY in .env. If neither is set, falls back to a deterministic
// keyword/regex extractor so the demo still runs live during judging
// without depending on network/API credits.

const RULE_TYPES = [
  'training_completed',
  'password_age_days',
  'policy_acknowledged',
  'access_review_completed',
  'vendor_cert_valid',
  'vendor_documents_uploaded',
  'system_patch_current',
];

async function callAnthropic(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || '').join('');
  return text;
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractJson(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[') === -1 ? cleaned.indexOf('{') : cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']') === -1 ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

function hasLLM() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

async function callLLM(prompt) {
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(prompt);
  if (process.env.OPENAI_API_KEY) return callOpenAI(prompt);
  throw new Error('no llm configured');
}

// --- Fallback heuristic extractor (no API key required) -------------------
function heuristicExtractRules(policyText, policyName) {
  const lower = policyText.toLowerCase();
  const rules = [];
  const push = (type, description, department) =>
    rules.push({ ruleType: type, description, department: department || 'All', source: policyName });

  if (/training/.test(lower)) push('training_completed', 'All employees must complete security awareness training annually.');
  if (/password/.test(lower)) push('password_age_days', 'Passwords must be rotated at least every 90 days.');
  if (/acknowledg/.test(lower)) push('policy_acknowledged', 'All employees must formally acknowledge this policy.');
  if (/access review|least privilege|access control/.test(lower)) push('access_review_completed', 'Departments must complete periodic access reviews.');
  if (/vendor|third[- ]party|supplier/.test(lower)) {
    push('vendor_cert_valid', 'Vendor security certifications must remain valid and unexpired.');
    push('vendor_documents_uploaded', 'Vendors must submit required compliance documentation.');
  }
  if (/patch|vulnerabilit|update/.test(lower)) push('system_patch_current', 'Systems must remain on current security patch levels.');

  if (rules.length === 0) {
    push('policy_acknowledged', 'All employees must formally acknowledge this policy.');
  }
  return rules;
}

async function extractRulesFromPolicy(policyText, policyName) {
  if (!hasLLM()) return heuristicExtractRules(policyText, policyName);

  const prompt = `You are a GRC compliance analyst. Read the policy text below and extract concrete, checkable compliance rules.
Return ONLY a JSON array, no prose, no markdown fences. Each item:
{"ruleType": one of ${JSON.stringify(RULE_TYPES)}, "description": "plain-English obligation", "department": "a department name or 'All'"}
Only use ruleType values from the list above — pick the closest match for anything not literally mentioned. Extract 3-8 rules.

POLICY TEXT:
"""${policyText.slice(0, 6000)}"""`;

  try {
    const text = await callLLM(prompt);
    const parsed = extractJson(text);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((r) => ({ ...r, source: policyName }));
    }
  } catch (e) {
    console.error('LLM extraction failed, falling back to heuristic:', e.message);
  }
  return heuristicExtractRules(policyText, policyName);
}

function heuristicRecommendation(finding) {
  const map = {
    training_completed: {
      why: 'Employee has not completed the required security awareness training.',
      impact: 'Increases risk of phishing/social-engineering incidents going unrecognized.',
      fix: 'Assign the outstanding training module with a 7-day completion deadline.',
    },
    password_age_days: {
      why: 'Password has exceeded the maximum allowed age without rotation.',
      impact: 'Stale credentials raise the risk of unauthorized account access.',
      fix: 'Force a password reset and enable rotation reminders going forward.',
    },
    policy_acknowledged: {
      why: 'Employee has not formally acknowledged the policy.',
      impact: 'Reduces enforceability and audit defensibility of the policy.',
      fix: 'Send an acknowledgement request and block until confirmed.',
    },
    access_review_completed: {
      why: 'Periodic access review has not been completed for this employee/department.',
      impact: 'Unreviewed access can accumulate excess privilege over time.',
      fix: 'Schedule an access recertification with the department lead.',
    },
    vendor_cert_valid: {
      why: 'Vendor security certification has expired.',
      impact: 'Working with an uncertified vendor creates third-party risk exposure.',
      fix: 'Request an updated certificate before continuing engagement.',
    },
    vendor_documents_uploaded: {
      why: 'Required vendor compliance documentation is missing.',
      impact: 'Gaps in vendor evidence weaken audit readiness.',
      fix: 'Request outstanding documents from the vendor contact.',
    },
    system_patch_current: {
      why: 'System has not been patched to the current security baseline.',
      impact: 'Unpatched systems are exposed to known vulnerabilities.',
      fix: 'Schedule the pending patch in the next maintenance window.',
    },
  };
  return map[finding.ruleType] || {
    why: 'Expected behaviour did not match actual behaviour.',
    impact: 'Creates a compliance gap that may surface during audit.',
    fix: 'Route to the responsible department for remediation.',
  };
}

module.exports = { extractRulesFromPolicy, heuristicRecommendation, hasLLM, RULE_TYPES };
