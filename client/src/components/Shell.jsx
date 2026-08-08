import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/upload', label: 'Upload Policy' },
  { to: '/findings', label: 'Findings' },
  { to: '/departments', label: 'Departments' },
  { to: '/report', label: 'Report' },
];

export default function Shell({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight">TRUST ISSUES</span>
            <span className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">Continuous GRC</span>
          </div>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-sm transition-colors ${
                    isActive ? 'bg-surface2 text-ink' : 'text-muted hover:text-ink hover:bg-surface'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
