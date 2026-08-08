import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Departments() {
  const [depts, setDepts] = useState([]);
  useEffect(() => { api.departments().then(setDepts); }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-brass uppercase tracking-[0.2em] mb-2">Accountability</p>
        <h1 className="font-display text-3xl">Department Scoreboard</h1>
      </div>

      {depts.length === 0 && <p className="text-muted text-sm font-mono">Run verification first to populate department scores.</p>}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {depts.map((d) => {
          const color = d.score >= 80 ? '#4C9A7A' : d.score >= 55 ? '#C08A3E' : '#C9634F';
          return (
            <div key={d.department} className="border border-line bg-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">{d.department}</span>
                <span className="font-display text-2xl" style={{ color }}>{d.score}</span>
              </div>
              <div className="h-1 bg-surface2">
                <div className="h-1" style={{ width: `${d.score}%`, background: color }} />
              </div>
              <p className="text-xs text-muted font-mono mt-2">{d.open} open of {d.total} controls</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
