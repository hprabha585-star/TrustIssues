import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Upload() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = file ? await api.uploadPolicyFile(file) : await api.uploadPolicyText(name || 'Untitled Policy', text);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs text-brass uppercase tracking-[0.2em] mb-2">Step 1</p>
        <h1 className="font-display text-3xl">Upload a governance document</h1>
        <p className="text-muted text-sm mt-2">PDF, plain text, or paste it directly. The engine converts it into checkable compliance rules.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-[0.15em] block mb-2">Policy name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Information Security Policy v3"
            className="w-full bg-surface border border-line px-3 py-2 text-sm focus:border-brass outline-none"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-[0.15em] block mb-2">PDF or text file</label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full text-sm text-muted file:mr-3 file:px-3 file:py-1.5 file:border file:border-line file:bg-surface file:text-ink file:text-sm"
          />
        </div>

        <div className="text-center text-muted text-xs font-mono">— or paste policy text —</div>

        <div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setFile(null); }}
            rows={8}
            placeholder="Paste the policy text here…"
            className="w-full bg-surface border border-line px-3 py-2 text-sm focus:border-brass outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!file && text.trim().length < 20)}
          className="px-5 py-2.5 bg-brass text-bg text-sm font-medium hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Extracting rules…' : 'Extract compliance rules'}
        </button>
        {error && <p className="text-gap text-sm font-mono">{error}</p>}
      </form>

      {result && (
        <div className="border border-line bg-surface p-5 space-y-4">
          <p className="font-mono text-xs text-verified uppercase tracking-[0.15em]">
            {result.rules.length} rules extracted from "{result.policy.name}"
          </p>
          <ul className="space-y-2">
            {result.rules.map((r, i) => (
              <li key={i} className="text-sm border-l-2 border-brass pl-3">
                <span className="text-ink">{r.description}</span>
                <span className="block text-muted text-xs font-mono mt-0.5">{r.ruleType} · {r.department}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-surface2 border border-line text-sm hover:border-brass"
          >
            Go run verification →
          </button>
        </div>
      )}
    </div>
  );
}
