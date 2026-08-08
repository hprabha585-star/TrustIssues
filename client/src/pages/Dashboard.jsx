import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import TrustSeal from '../components/TrustSeal.jsx';

const CATEGORY_LABELS = {
  complianceHealth: 'Compliance Health',
  controlEffectiveness: 'Control Effectiveness',
  vendorReliability: 'Vendor Reliability',
  employeeCompliance: 'Employee Compliance',
  auditReadiness: 'Audit Readiness',
};

function StatCard({ value, label }) {
  return (
    <div className="border border-line bg-surface px-5 py-4">
      <div className="font-display text-2xl tabular-nums">{value}</div>
      <div className="font-mono text-[10px] text-muted uppercase tracking-[0.15em] mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [depts, setDepts] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const d = await api.dashboard();
      setData(d);
      setDepts(await api.departments());
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    setRunning(true);
    setError('');
    try {
      await api.runVerification();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!data) return <div className="text-muted font-mono text-sm">Loading…</div>;

  const hasPolicies = data.policiesEvaluated > 0;

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between flex-wrap gap-6">
        <div>
          <p className="font-mono text-xs text-brass uppercase tracking-[0.2em] mb-2">Live Verification</p>
          <h1 className="font-display text-3xl leading-tight max-w-xl">
            Are we compliant right now — not on the day of the audit.
          </h1>
          <p className="text-muted text-sm mt-3 max-w-md">
            {hasPolicies
              ? 'Every uploaded policy is continuously checked against organizational activity. Evidence is generated automatically.'
              : 'No policies uploaded yet. Upload one to generate your first trust score.'}
          </p>
          <div className="mt-5 flex gap-3">
            {!hasPolicies && (
              <Link to="/upload" className="px-4 py-2 bg-brass text-bg text-sm font-medium hover:opacity-90">
                Upload your first policy
              </Link>
            )}
            {hasPolicies && (
              <button
                onClick={run}
                disabled={running}
                className="px-4 py-2 bg-brass text-bg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {running ? 'Verifying…' : 'Run verification now'}
              </button>
            )}
          </div>
          {error && <p className="text-gap text-sm mt-3 font-mono">{error}</p>}
          {!data.aiConfigured && (
            <p className="text-muted text-xs mt-4 font-mono max-w-md">
              Running on the built-in heuristic rule engine (no LLM API key set). Add ANTHROPIC_API_KEY or
              OPENAI_API_KEY to .env for AI-extracted rules and recommendations.
            </p>
          )}
        </div>
        <TrustSeal score={data.trust.overall} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={data.policiesEvaluated} label="Policies Evaluated" />
        <StatCard value={data.employeesVerified} label="Employees Verified" />
        <StatCard value={data.vendorsReviewed} label="Vendors Reviewed" />
        <StatCard value={data.systemsChecked} label="Systems Checked" />
        <StatCard value={data.departmentsEvaluated} label="Departments" />
        <StatCard value={data.totalFindings} label="Controls Checked" />
        <StatCard value={data.openFindings} label="Open Findings" />
        <StatCard value={data.aiConfigured ? 'AI' : 'Heuristic'} label="Extraction Mode" />
      </div>

      {data.trust.categories && Object.keys(data.trust.categories).length > 0 && (
        <div>
          <h2 className="font-mono text-xs text-muted uppercase tracking-[0.15em] mb-3">Trust Composition</h2>
          <div className="grid md:grid-cols-5 gap-px bg-line border border-line">
            {Object.entries(data.trust.categories).map(([key, val]) => (
              <div key={key} className="bg-surface px-4 py-4">
                <div className="font-display text-2xl">{val}</div>
                <div className="text-xs text-muted mt-1">{CATEGORY_LABELS[key] || key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {depts.length > 0 && (
        <div>
          <h2 className="font-mono text-xs text-muted uppercase tracking-[0.15em] mb-3">Department Scoreboard</h2>
          <div className="border border-line divide-y divide-line">
            {depts.sort((a, b) => a.score - b.score).map((d) => (
              <div key={d.department} className="ledger-row flex items-center justify-between px-5 py-3">
                <span className="text-sm">{d.department}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted">{d.open} open / {d.total} checked</span>
                  <span
                    className="font-mono text-sm w-10 text-right"
                    style={{ color: d.score >= 80 ? '#4C9A7A' : d.score >= 55 ? '#C08A3E' : '#C9634F' }}
                  >
                    {d.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
