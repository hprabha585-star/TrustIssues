export default function TrustSeal({ score, size = 220, label = 'Organizational Trust' }) {
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score == null ? 0 : score / 100;
  const offset = circumference * (1 - pct);
  const color = score == null ? '#8B95A1' : score >= 80 ? '#4C9A7A' : score >= 55 ? '#C08A3E' : '#C9634F';

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* engraved ridge rings */}
        <circle cx={size / 2} cy={size / 2} r={r + 6} fill="none" stroke="#2E353D" strokeWidth="1" />
        <circle cx={size / 2} cy={size / 2} r={r - 6} fill="none" stroke="#2E353D" strokeWidth="1" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#242A31" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className="seal-progress"
          style={{ '--circumference': circumference, '--offset': offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl tabular-nums" style={{ color }}>
          {score == null ? '—' : score}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase mt-1">{label}</span>
      </div>
    </div>
  );
}
