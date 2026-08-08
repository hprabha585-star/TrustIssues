const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: opts.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  uploadPolicyText: (name, text) => req('/policies/upload', { method: 'POST', body: JSON.stringify({ name, text }) }),
  uploadPolicyFile: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return req('/policies/upload', { method: 'POST', body: fd });
  },
  listPolicies: () => req('/policies'),
  runVerification: () => req('/verification/run', { method: 'POST' }),
  dashboard: () => req('/verification/dashboard'),
  findings: (params = {}) => req(`/verification/findings?${new URLSearchParams(params)}`),
  departments: () => req('/verification/departments'),
  vendors: () => req('/verification/vendors'),
  report: () => req('/verification/report'),
};
