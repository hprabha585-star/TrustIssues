import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Report() {
  const [data, setData] = useState(null);
  useEffect(() => { api.report().then(setData); }, []);

  if (!data) return <div className="text-muted font-mono text-sm">Loading…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <p className="font-mono text-xs text-brass uppercase tracking-[0.2em] mb-2">Audit-Ready</p>
          <h1 className="font-display text-3xl">Executive Compliance Report</h1>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-brass text-bg text-sm font-medium hover:opacity-90">
          Export / Print
        </button>
      </div>

      <div className="border border-line bg-surface p-8 space-y-6">
        <div className="flex justify-between items-baseline border-b border-line pb-4">
          <span className="font-display text-xl">TRUST ISSUES — Compliance Summary</span>
          <span className="font-mono text-xs text-muted">Generated {new Date(data.generatedAt).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="font-display text-4xl">{data.trust.overall ?? '—'}</div>
            <div className="text-xs text-muted font-mono uppercase mt-1">Overall Trust Score</div>
          </div>
          <div>
            <div className="font-display text-4xl text-verified">{data.passedControls}</div>
            <div className="text-xs text-muted font-mono uppercase mt-1">Controls Passed</div>
          </div>
          <div>
            <div className="font-display text-4xl text-gap">{data.openFindings.length}</div>
            <div className="text-xs text-muted font-mono uppercase mt-1">Open Findings</div>
          </div>
        </div>

        <div>
          <h2 className="font-mono text-xs text-muted uppercase tracking-[0.15em] mb-2">Policies Evaluated ({data.policies.length})</h2>
          <ul className="text-sm space-y-1">
            {data.policies.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-line py-1.5">
                <span>{p.name}</span>
                <span className="text-muted font-mono text-xs">{p.ruleCount} rules · {new Date(p.uploadedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-xs text-muted uppercase tracking-[0.15em] mb-2">Priority Findings</h2>
          <ul className="text-sm space-y-2">
            {data.openFindings.slice(0, 15).map((f) => (
              <li key={f.id} className="border-l-2 border-gap pl-3">
                <span>{f.ruleDescription}</span>
                <span className="block text-xs text-muted font-mono">{f.department} · {f.entity} · {f.severity} severity</span>
                {f.recommendation && <span className="block text-xs text-muted mt-0.5">Fix: {f.recommendation.fix}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
