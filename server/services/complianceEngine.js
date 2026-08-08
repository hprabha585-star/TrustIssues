const { employees, vendors, systems } = require('../data/demoData');
const { heuristicRecommendation } = require('./aiService');

const TRAINING_MAX_AGE_DAYS = 365;
const PASSWORD_MAX_AGE_DAYS = 90;

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function daysUntil(dateStr) {
  if (!dateStr) return -Infinity;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function severityFor(ruleType) {
  const high = ['vendor_cert_valid', 'system_patch_current', 'password_age_days'];
  const medium = ['access_review_completed', 'vendor_documents_uploaded'];
  if (high.includes(ruleType)) return 'high';
  if (medium.includes(ruleType)) return 'medium';
  return 'low';
}

// Evaluate one rule against every relevant entity, returning pass/fail findings.
function evaluateRule(rule) {
  const findings = [];
  const inScope = (dept) => rule.department === 'All' || !rule.department || dept === rule.department;

  switch (rule.ruleType) {
    case 'training_completed':
      employees.filter((e) => inScope(e.department)).forEach((e) => {
        const ok = e.trainingCompleted && daysSince(e.trainingDate) <= TRAINING_MAX_AGE_DAYS;
        findings.push(mkFinding(rule, ok, e.department, e.name, ok ? 'Training current.' : (e.trainingCompleted ? 'Training expired.' : 'Training not completed.')));
      });
      break;
    case 'password_age_days':
      employees.filter((e) => inScope(e.department)).forEach((e) => {
        const age = daysSince(e.passwordLastChanged);
        const ok = age <= PASSWORD_MAX_AGE_DAYS;
        findings.push(mkFinding(rule, ok, e.department, e.name, ok ? `Password rotated ${age}d ago.` : `Password is ${age} days old (limit ${PASSWORD_MAX_AGE_DAYS}).`));
      });
      break;
    case 'policy_acknowledged':
      employees.filter((e) => inScope(e.department)).forEach((e) => {
        findings.push(mkFinding(rule, e.policyAcknowledged, e.department, e.name, e.policyAcknowledged ? 'Acknowledged.' : 'No acknowledgement on file.'));
      });
      break;
    case 'access_review_completed':
      employees.filter((e) => inScope(e.department)).forEach((e) => {
        findings.push(mkFinding(rule, e.accessReviewCompleted, e.department, e.name, e.accessReviewCompleted ? 'Access reviewed.' : 'Access review overdue.'));
      });
      break;
    case 'vendor_cert_valid':
      vendors.forEach((v) => {
        const ok = daysUntil(v.certExpiry) >= 0;
        findings.push(mkFinding(rule, ok, 'Vendor Management', v.name, ok ? `Certificate valid, expires ${v.certExpiry}.` : `Certificate expired ${v.certExpiry}.`));
      });
      break;
    case 'vendor_documents_uploaded':
      vendors.forEach((v) => {
        findings.push(mkFinding(rule, v.documentsUploaded, 'Vendor Management', v.name, v.documentsUploaded ? 'Documents on file.' : 'Missing required documents.'));
      });
      break;
    case 'system_patch_current':
      systems.forEach((s) => {
        const ok = s.patchStatus === 'current';
        findings.push(mkFinding(rule, ok, 'IT', s.name, ok ? 'Patch level current.' : 'Patch overdue.'));
      });
      break;
    default:
      break;
  }
  return findings;
}

function mkFinding(rule, passed, department, entity, evidence) {
  const base = {
    ruleType: rule.ruleType,
    ruleDescription: rule.description,
    source: rule.source,
    department,
    entity,
    status: passed ? 'pass' : 'fail',
    evidence,
    severity: severityFor(rule.ruleType),
  };
  if (!passed) {
    const rec = heuristicRecommendation(rule);
    base.recommendation = rec;
  }
  return base;
}

function runVerification(rules) {
  const allFindings = rules.flatMap(evaluateRule);
  return allFindings;
}

// Aggregate into category + department + overall trust scores (0-100)
function computeTrustScore(findings) {
  const pct = (arr) => (arr.length ? Math.round((arr.filter((f) => f.status === 'pass').length / arr.length) * 100) : 100);

  const categories = {
    complianceHealth: pct(findings.filter((f) => ['training_completed', 'policy_acknowledged'].includes(f.ruleType))),
    controlEffectiveness: pct(findings.filter((f) => ['password_age_days', 'access_review_completed', 'system_patch_current'].includes(f.ruleType))),
    vendorReliability: pct(findings.filter((f) => f.ruleType.startsWith('vendor'))),
    employeeCompliance: pct(findings.filter((f) => ['training_completed', 'password_age_days', 'policy_acknowledged'].includes(f.ruleType))),
    auditReadiness: pct(findings),
  };
  const overall = Math.round(Object.values(categories).reduce((a, b) => a + b, 0) / Object.values(categories).length);

  const byDept = {};
  findings.forEach((f) => {
    byDept[f.department] = byDept[f.department] || [];
    byDept[f.department].push(f);
  });
  const departmentScores = Object.entries(byDept).map(([dept, arr]) => ({
    department: dept,
    score: pct(arr),
    open: arr.filter((f) => f.status === 'fail').length,
    total: arr.length,
  }));

  return { overall, categories, departmentScores };
}

module.exports = { runVerification, computeTrustScore };
