import { useEffect, useState } from 'react';
import { api } from '../api';

const SEV_COLOR = { high: '#C9634F', medium: '#C08A3E', low: '#8B95A1' };

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [filter, setFilter] = useState('fail');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.findings(filter === 'all' ? {} : { status: filter }).then(setFindings);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs text-brass uppercase tracking-[0.2em] mb-2">Compliance Gap Detection</p>
          <h1 className="font-display text-3xl">Findings Ledger</h1>
        </div>
        <div className="flex gap-1">
          {['fail', 'pass', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border ${
                filter === f ? 'bg-surface2 border-brass text-ink' : 'border-line text-muted hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {findings.length === 0 && (
        <p className="text-muted text-sm font-mono">No findings yet — upload a policy and run verification from the dashboard.</p>
      )}

      <div className="border border-line divide-y divide-line">
        {findings.map((f) => (
          <div key={f.id} className="ledger-row px-5 py-3">
            <button
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
              className="w-full flex items-center justify-between text-left gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: f.status === 'pass' ? '#4C9A7A' : SEV_COLOR[f.severity] }}
                />
                <span className="text-sm truncate">{f.ruleDescription}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-xs text-muted">{f.department}</span>
                <span className="font-mono text-xs text-muted hidden sm:inline">{f.entity}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: f.status === 'pass' ? '#4C9A7A' : '#C9634F' }}>
                  {f.status}
                </span>
              </div>
            </button>
            {expanded === f.id && (
              <div className="mt-3 pl-4 border-l-2 border-line text-sm space-y-2">
                <p className="text-muted">Evidence: {f.evidence}</p>
                <p className="text-muted text-xs font-mono">Source policy: {f.source}</p>
                {f.recommendation && (
                  <div className="bg-surface2 p-3 mt-2 space-y-1 border border-line">
                    <p><span className="text-brass font-mono text-xs uppercase">Why:</span> {f.recommendation.why}</p>
                    <p><span className="text-brass font-mono text-xs uppercase">Impact:</span> {f.recommendation.impact}</p>
                    <p><span className="text-brass font-mono text-xs uppercase">Fix:</span> {f.recommendation.fix}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
