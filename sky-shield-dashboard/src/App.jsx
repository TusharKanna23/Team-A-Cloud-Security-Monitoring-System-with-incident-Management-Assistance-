import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/* =====================================================================
   Sky Shield - Cloud Security Monitoring & Incident Management
   Single-file frontend: layout, pages, charts, Report Generator, CSS.
   Live data  : /api/users, /api/teams, /api/incidents, /api/logs (Java server)
   Demo data  : security-alert feed and cloud inventory (simulated, labelled)
   ===================================================================== */

const SEVS = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'Investigating', 'Resolved'];
const ROLES = ['Admin', 'Analyst', 'Responder', 'Viewer'];
const SEV_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
const STATUS_COLOR = { Open: '#ef4444', Investigating: '#3b82f6', Resolved: '#22c55e' };
const PROVIDER_COLOR = { AWS: '#f59e0b', Azure: '#3b82f6', GCP: '#10b981' };
const DAY = 86400000;

/* Demo inventory (simulated - not connected to any cloud account) */
const ASSETS = [
  { provider: 'AWS', resources: 412, misconfig: 9, compliance: 91 },
  { provider: 'Azure', resources: 268, misconfig: 6, compliance: 94 },
  { provider: 'GCP', resources: 174, misconfig: 4, compliance: 96 },
];
const FRAMEWORKS = [
  ['CIS Benchmarks', 92], ['ISO 27001', 88], ['SOC 2', 95], ['PCI DSS', 90],
];

/* Demo alert templates: [title, severity, category, provider, resource] */
const TPL = [
  ['Unauthorized IAM role assumption', 'Critical', 'Identity', 'AWS', 'iam:role/admin-ops'],
  ['Public S3 bucket detected', 'High', 'Misconfiguration', 'AWS', 's3://customer-exports'],
  ['Brute-force login attempts', 'Medium', 'Authentication', 'Azure', 'vm-web-02'],
  ['Expired TLS certificate', 'Low', 'Certificate', 'GCP', 'lb-frontend-01'],
  ['Security group open to 0.0.0.0/0', 'High', 'Network', 'AWS', 'sg-0a41'],
  ['Impossible-travel sign-in', 'High', 'Identity', 'Azure', 'user m.nair'],
  ['Storage account without encryption', 'Medium', 'Misconfiguration', 'Azure', 'stproddata01'],
  ['Service account key unused 90 days', 'Low', 'Identity', 'GCP', 'sa-batch'],
  ['Outbound traffic spike', 'Critical', 'Network', 'GCP', 'vm-batch-07'],
  ['MFA disabled for privileged user', 'High', 'Identity', 'AWS', 'user devops-lead'],
  ['Root account activity', 'Critical', 'Identity', 'AWS', 'account root'],
  ['Failed API calls burst', 'Medium', 'Authentication', 'GCP', 'api-gateway'],
];

const mkAlert = (t, time, n) => ({ id: 'A-' + n, sev: t[1], title: t[0], category: t[2], provider: t[3], resource: t[4], time, ack: false });
function seedAlerts() {
  let s = 7;
  const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const now = Date.now();
  const out = [];
  for (let i = 1; i <= 140; i++) {
    const t = TPL[Math.floor(r() * TPL.length)];
    out.push(mkAlert(t, now - Math.floor(r() * r() * 30 * DAY), i));
  }
  return out.sort((a, b) => b.time - a.time);
}

/* ---------------- helpers ---------------- */
const fmt = (t) => (t ? new Date(t).toLocaleString() : '-');
const logTime = (l) => { const t = Date.parse(l.time); return Number.isNaN(t) ? 0 : t; };
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  if (m < 1440) return Math.round(m / 60) + ' h ago';
  return Math.round(m / 1440) + ' d ago';
};
const group = (arr, k) => Object.entries(arr.reduce((m, x) => { m[x[k]] = (m[x[k]] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
const riskScore = (inc) => Math.min(100, inc.filter((i) => i.status !== 'Resolved')
  .reduce((s, i) => s + ({ Critical: 25, High: 15, Medium: 8, Low: 3 }[i.severity] || 0), 0));
const riskLevel = (s) => (s < 25 ? 'Low' : s < 50 ? 'Moderate' : s < 75 ? 'High' : 'Critical');
const riskColor = (s) => (s < 25 ? '#22c55e' : s < 50 ? '#eab308' : s < 75 ? '#f97316' : '#ef4444');
// Stops spreadsheet formulas (=, +, -, @) in exported CSV cells
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
function downloadCsv(name, rows) {
  const csv = '\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------------- API (form-encoded, matches server/Server.java) ---------------- */
async function api(path, method = 'GET', data) {
  const opt = { method };
  if (data) {
    opt.body = new URLSearchParams(data).toString();
    opt.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  }
  const r = await fetch('/api/' + path, opt);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error('Bad response');
  return j;
}

/* ---------------- icons ---------------- */
const ICONS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  cloud: 'M18 10a4 4 0 0 0-7.5-1.8A4.5 4.5 0 1 0 7 17h11a3.5 3.5 0 0 0 0-7z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  alert: 'M12 3 2 20h20zM12 9v5M12 17.5v.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h8',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
};
const Icon = ({ n, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[n]} /></svg>
);
const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 2 4 6.5V15c0 7.2 5.1 12.4 12 15 6.9-2.6 12-7.8 12-15V6.5z" fill="#2563eb" />
    <path d="M10.5 15.5l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------------- small UI parts ---------------- */
const SevPill = ({ v }) => <span className="ss-pill" style={{ '--c': SEV_COLOR[v] }}>{v}</span>;
const StatusPill = ({ v }) => <span className="ss-pill" style={{ '--c': STATUS_COLOR[v] || '#64748b' }}>{v}</span>;
const Card = ({ title, sub, right, children, cls = '' }) => (
  <div className={'ss-card ' + cls}>
    {(title || right) && (
      <div className="ss-ch"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{right}</div>
    )}
    {children}
  </div>
);
const Kpi = ({ label, value, sub, color, tag }) => (
  <div className="ss-kpi" style={{ '--c': color }}>
    <span>{label}{tag && <em className="ss-demo">{tag}</em>}</span>
    <b>{value}</b>
    {sub && <small>{sub}</small>}
  </div>
);
const Tbl = ({ head, children, empty }) => (
  <div className="ss-tw">
    <table className="ss-table">
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{children}{empty && <tr><td colSpan={head.length} className="ss-empty">{empty}</td></tr>}</tbody>
    </table>
  </div>
);
const Banner = ({ children, kind = 'info' }) => <div className={'ss-banner ' + kind}>{children}</div>;

function Donut({ items, label }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="ss-donut">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={label}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
        {total > 0 && items.map((i) => {
          const len = (i.value / total) * C;
          const el = <circle key={i.label} cx="70" cy="70" r={R} fill="none" stroke={i.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />;
          off += len;
          return el;
        })}
        <text x="70" y="70" textAnchor="middle" className="ss-dnum">{total}</text>
        <text x="70" y="88" textAnchor="middle" className="ss-dlab">{label}</text>
      </svg>
      <ul className="ss-legend">
        {items.map((i) => <li key={i.label}><i style={{ background: i.color }} />{i.label}<b>{i.value}</b></li>)}
      </ul>
    </div>
  );
}

function HBars({ items, empty = 'No data' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="ss-muted">{empty}</p>;
  return (
    <div className="ss-hbars">
      {items.map((i) => (
        <div className="ss-hb" key={i.label}>
          <span>{i.label}</span>
          <div className="ss-track"><div style={{ width: (i.value / max) * 100 + '%', background: i.color || 'var(--accent)' }} /></div>
          <b>{i.suffix ? i.value + i.suffix : i.value}</b>
        </div>
      ))}
    </div>
  );
}

function Columns({ values, labels }) {
  const W = 600, H = 150;
  const max = Math.max(1, ...values);
  const bw = W / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="ss-cols" role="img" aria-label="Alerts per hour">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1="0" x2={W} y1={H - g * H} y2={H - g * H} stroke="var(--line)" strokeDasharray="3 4" />)}
      {values.map((v, i) => {
        const h = (v / max) * H;
        return (
          <g key={i}>
            <rect x={i * bw + 3} y={H - h} width={bw - 6} height={h} rx="2" fill="var(--accent)" opacity="0.9"><title>{labels[i]}: {v}</title></rect>
            {i % 3 === 0 && <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" className="ss-axis">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Gauge({ score }) {
  const L = Math.PI * 60;
  return (
    <div className="ss-gauge">
      <svg viewBox="0 0 140 84" width="100%" role="img" aria-label={'Risk score ' + score}>
        <path d="M10 74 A60 60 0 0 1 130 74" fill="none" stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
        <path d="M10 74 A60 60 0 0 1 130 74" fill="none" stroke={riskColor(score)} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * L} ${L}`} />
        <text x="70" y="64" textAnchor="middle" className="ss-gnum">{score}</text>
      </svg>
      <div className="ss-glevel" style={{ color: riskColor(score) }}>{riskLevel(score)} risk</div>
    </div>
  );
}

/* =====================================================================
   PAGES
   ===================================================================== */

function Dashboard({ c }) {
  const { alerts, incidents, logs, users, teams, online, live, risk, go } = c;
  const d24 = alerts.filter((a) => a.time > Date.now() - DAY);
  const active = d24.filter((a) => !a.ack && (a.sev === 'Critical' || a.sev === 'High')).length;
  const crit = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length;
  const resolved = incidents.filter((i) => i.status === 'Resolved').length;
  const total = ASSETS.reduce((s, a) => s + a.resources, 0);
  const sev = SEVS.map((s) => ({ label: s, value: d24.filter((a) => a.sev === s).length, color: SEV_COLOR[s] }));
  const started = logs.filter((l) => l.action === 'Server started').map(logTime).sort((a, b) => b - a)[0];
  const status = [
    ['Sky Shield API', online === false ? 'Offline' : online ? 'Online' : 'Checking', online],
    ['Simulated alert feed', live ? 'Running' : 'Paused', live],
    ['Audit log entries', String(logs.length), true],
    ['Registered users / teams', users.length + ' / ' + teams.length, true],
    ['Last API start', started ? fmt(started) : '-', true],
  ];
  return (
    <>
      <div className="ss-grid kpis">
        <Kpi label="Total Cloud Assets" value={total} sub="3 providers" color="#3b82f6" tag="demo" />
        <Kpi label="Active Security Threats" value={active} sub="Critical/High alerts not acknowledged (24 h)" color="#f97316" tag="demo" />
        <Kpi label="Critical Incidents" value={crit} sub="Critical and not resolved" color="#ef4444" />
        <Kpi label="Resolved Incidents" value={resolved} sub={`of ${incidents.length} total`} color="#22c55e" />
        <div className="ss-kpi ss-risk" style={{ '--c': riskColor(risk) }}>
          <span>Security Risk Score</span>
          <Gauge score={risk} />
          <small>Computed from open incidents</small>
        </div>
      </div>
      <div className="ss-grid two">
        <Card title="Recent Security Alerts" sub="Simulated telemetry" right={<button className="ss-btn sm" onClick={() => go('alerts')}>View all</button>}>
          <div className="ss-list">
            {alerts.slice(0, 7).map((a) => (
              <div className="ss-li" key={a.id}>
                <SevPill v={a.sev} />
                <div><b>{a.title}</b><small>{a.provider} / {a.resource}</small></div>
                <time>{ago(a.time)}</time>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Threat Severity Distribution" sub="Alerts in the last 24 hours (simulated)">
          <Donut items={sev} label="alerts" />
        </Card>
      </div>
      <div className="ss-grid three">
        <Card title="Incident Activity Timeline" sub="Latest entries from the audit log">
          {logs.length === 0 && <p className="ss-muted">No activity yet.</p>}
          <ol className="ss-tl">
            {logs.slice(0, 7).map((l, i) => <li key={i}><b>{l.action}</b><small>{l.time}</small></li>)}
          </ol>
        </Card>
        <Card title="Cloud Security Overview" sub="Compliance by provider (demo inventory)">
          <HBars items={ASSETS.map((a) => ({ label: a.provider, value: a.compliance, suffix: '%', color: PROVIDER_COLOR[a.provider] }))} />
          <p className="ss-muted sm">Misconfigurations: {ASSETS.reduce((s, a) => s + a.misconfig, 0)} across {total} resources</p>
        </Card>
        <Card title="System Monitoring Status">
          <ul className="ss-status">
            {status.map(([k, v, ok]) => (
              <li key={k}><span><i className={'dot ' + (ok ? 'ok' : 'bad')} />{k}</span><b>{v}</b></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Assets() {
  const total = ASSETS.reduce((s, a) => s + a.resources, 0);
  const mis = ASSETS.reduce((s, a) => s + a.misconfig, 0);
  const avg = Math.round(ASSETS.reduce((s, a) => s + a.compliance, 0) / ASSETS.length);
  return (
    <>
      <Banner>Demo inventory: these figures are sample data and are not collected from a real cloud account.</Banner>
      <div className="ss-grid kpis3">
        <Kpi label="Total resources" value={total} color="#3b82f6" tag="demo" />
        <Kpi label="Misconfigurations" value={mis} color="#f97316" tag="demo" />
        <Kpi label="Average compliance" value={avg + '%'} color="#22c55e" tag="demo" />
      </div>
      <div className="ss-grid two">
        <Card title="Inventory by provider">
          <Tbl head={['Provider', 'Resources', 'Misconfigurations', 'Compliance']}>
            {ASSETS.map((a) => <tr key={a.provider}><td>{a.provider}</td><td>{a.resources}</td><td>{a.misconfig}</td><td>{a.compliance}%</td></tr>)}
          </Tbl>
        </Card>
        <Card title="Compliance frameworks">
          <HBars items={FRAMEWORKS.map(([l, v]) => ({ label: l, value: v, suffix: '%', color: v >= 92 ? '#22c55e' : '#eab308' }))} />
        </Card>
      </div>
    </>
  );
}

function Alerts({ c }) {
  const { alerts, live, setLive, ackAlert, escalate, canEdit } = c;
  const [f, setF] = useState({ q: '', sev: '', provider: '' });
  const rows = alerts.filter((a) => (!f.sev || a.sev === f.sev) && (!f.provider || a.provider === f.provider)
    && (a.title + ' ' + a.resource + ' ' + a.category).toLowerCase().includes(f.q.toLowerCase()));
  const cats = group(alerts.filter((a) => a.time > Date.now() - 7 * DAY), 'category').map(([label, value]) => ({ label, value }));
  const prov = group(alerts.filter((a) => a.time > Date.now() - 7 * DAY), 'provider').map(([label, value]) => ({ label, value, color: PROVIDER_COLOR[label] }));
  return (
    <>
      <Banner>Alerts are simulated demo telemetry, not collected from a real cloud account.</Banner>
      <div className="ss-grid two">
        <Card title="Detections by category" sub="Last 7 days"><HBars items={cats} /></Card>
        <Card title="Detections by provider" sub="Last 7 days"><Donut items={prov} label="alerts" /></Card>
      </div>
      <Card title="Security alerts" right={<button className="ss-btn sm" onClick={() => setLive(!live)}>{live ? 'Pause feed' : 'Resume feed'}</button>}>
        <div className="ss-toolbar">
          <input placeholder="Search alerts" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search alerts" />
          <select value={f.sev} onChange={(e) => setF({ ...f, sev: e.target.value })} aria-label="Severity"><option value="">All severities</option>{SEVS.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} aria-label="Provider"><option value="">All providers</option>{ASSETS.map((a) => <option key={a.provider}>{a.provider}</option>)}</select>
        </div>
        <Tbl head={['Time', 'Severity', 'Alert', 'Resource', 'Provider', 'State', '']} empty={rows.length ? '' : 'No alerts match.'}>
          {rows.slice(0, 100).map((a) => (
            <tr key={a.id}>
              <td>{fmt(a.time)}</td><td><SevPill v={a.sev} /></td><td>{a.title}</td><td>{a.resource}</td><td>{a.provider}</td>
              <td>{a.ack ? 'Acknowledged' : 'New'}</td>
              <td className="ss-act">
                {!a.ack && <button className="ss-btn sm" onClick={() => ackAlert(a.id)}>Acknowledge</button>}
                {canEdit && <button className="ss-btn sm pri" onClick={() => escalate(a)}>Create incident</button>}
              </td>
            </tr>
          ))}
        </Tbl>
        {rows.length > 100 && <p className="ss-muted sm">Showing the latest 100 of {rows.length} alerts.</p>}
      </Card>
    </>
  );
}

function Incidents({ c }) {
  const { incidents, teams, canEdit, isAdmin, mutate, go, setSel, toast } = c;
  const [f, setF] = useState({ q: '', sev: '', st: '' });
  const [n, setN] = useState({ title: '', severity: 'Medium', team: '' });
  const rows = incidents.filter((i) => (!f.sev || i.severity === f.sev) && (!f.st || i.status === f.st)
    && i.title.toLowerCase().includes(f.q.toLowerCase()));
  const add = () => {
    if (!n.title.trim()) return toast('Enter an incident title', 'err');
    mutate('incidents', 'POST', 'incidents', { title: n.title.trim(), severity: n.severity, status: 'Open', team: n.team }, 'Incident created');
    setN({ ...n, title: '' });
  };
  const del = (i) => { if (window.confirm('Delete incident "' + i.title + '"?')) mutate('incidents', 'DELETE', 'incidents/' + i.id, {}, 'Incident deleted'); };
  return (
    <>
      {canEdit && (
        <Card title="Report a new incident">
          <div className="ss-toolbar">
            <input placeholder="Incident title" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} aria-label="Incident title" />
            <select value={n.severity} onChange={(e) => setN({ ...n, severity: e.target.value })} aria-label="Severity">{SEVS.map((s) => <option key={s}>{s}</option>)}</select>
            <select value={n.team} onChange={(e) => setN({ ...n, team: e.target.value })} aria-label="Team"><option value="">Unassigned</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <button className="ss-btn pri" onClick={add}>Add incident</button>
          </div>
        </Card>
      )}
      <Card title="Incidents">
        <div className="ss-toolbar">
          <input placeholder="Search incidents" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search incidents" />
          <select value={f.sev} onChange={(e) => setF({ ...f, sev: e.target.value })} aria-label="Severity filter"><option value="">All severities</option>{SEVS.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={f.st} onChange={(e) => setF({ ...f, st: e.target.value })} aria-label="Status filter"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <Tbl head={['ID', 'Title', 'Severity', 'Status', 'Team', '']} empty={rows.length ? '' : 'No incidents match.'}>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>#{i.id}</td><td>{i.title}</td><td><SevPill v={i.severity} /></td>
              <td>{canEdit
                ? <select value={i.status} onChange={(e) => mutate('incidents', 'PUT', 'incidents/' + i.id, { status: e.target.value }, 'Status updated')} aria-label="Status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                : <StatusPill v={i.status} />}</td>
              <td>{canEdit
                ? <select value={teams.some((t) => t.id === i.team) ? i.team : ''} onChange={(e) => mutate('incidents', 'PUT', 'incidents/' + i.id, { team: e.target.value }, 'Team assigned')} aria-label="Team"><option value="">Unassigned</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                : (teams.find((t) => t.id === i.team)?.name || 'Unassigned')}</td>
              <td className="ss-act">
                <button className="ss-btn sm" onClick={() => { setSel(i.id); go('investigate'); }}>Investigate</button>
                {isAdmin && <button className="ss-btn sm danger" onClick={() => del(i)}>Delete</button>}
              </td>
            </tr>
          ))}
        </Tbl>
      </Card>
    </>
  );
}

function Investigate({ c }) {
  const { incidents, teams, users, logs, sel, setSel, canEdit, mutate } = c;
  const inc = incidents.find((i) => i.id === sel) || incidents[0];
  if (!inc) return <Card><p className="ss-muted">There are no incidents to investigate.</p></Card>;
  const team = teams.find((t) => t.id === inc.team);
  const members = team ? team.members.split(',').filter(Boolean).map((id) => users.find((u) => u.id === id)?.name).filter(Boolean) : [];
  const trail = logs.filter((l) => l.action.includes('incidents #' + inc.id + ' ') || l.action.endsWith('incidents #' + inc.id) || l.action === 'Created incidents: ' + inc.title);
  const upd = (body, msg) => mutate('incidents', 'PUT', 'incidents/' + inc.id, body, msg);
  return (
    <>
      <div className="ss-toolbar">
        <label className="ss-lab">Incident
          <select value={inc.id} onChange={(e) => setSel(e.target.value)}>{incidents.map((i) => <option key={i.id} value={i.id}>#{i.id} - {i.title}</option>)}</select>
        </label>
      </div>
      <div className="ss-grid two">
        <Card title={inc.title} sub={'Incident #' + inc.id}>
          <dl className="ss-dl">
            <dt>Severity</dt><dd><SevPill v={inc.severity} /></dd>
            <dt>Status</dt><dd><StatusPill v={inc.status} /></dd>
            <dt>Assigned team</dt><dd>{team ? team.name : 'Unassigned'}</dd>
            <dt>Team members</dt><dd>{members.length ? members.join(', ') : '-'}</dd>
          </dl>
        </Card>
        <Card title="Response actions" sub={canEdit ? 'Changes are saved to the API and recorded in the audit log' : 'Your role is read-only'}>
          {canEdit ? (
            <div className="ss-actions">
              <button className="ss-btn" disabled={inc.status === 'Investigating'} onClick={() => upd({ status: 'Investigating' }, 'Investigation started')}>Start investigation</button>
              <button className="ss-btn pri" disabled={inc.status === 'Resolved'} onClick={() => upd({ status: 'Resolved' }, 'Incident resolved')}>Mark resolved</button>
              <button className="ss-btn" disabled={inc.status === 'Open'} onClick={() => upd({ status: 'Open' }, 'Incident reopened')}>Reopen</button>
              <label className="ss-lab">Assign team
                <select value={team ? team.id : ''} onChange={(e) => upd({ team: e.target.value }, 'Team assigned')}><option value="">Unassigned</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </label>
              <label className="ss-lab">Severity
                <select value={inc.severity} onChange={(e) => upd({ severity: e.target.value }, 'Severity updated')}>{SEVS.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
            </div>
          ) : <p className="ss-muted">Switch to an Admin, Analyst or Responder to act on incidents.</p>}
        </Card>
      </div>
      <Card title="Investigation timeline" sub="Audit-log entries for this incident">
        {trail.length === 0 && <p className="ss-muted">No recorded actions for this incident yet.</p>}
        <ol className="ss-tl">{trail.map((l, i) => <li key={i}><b>{l.action}</b><small>{l.time}</small></li>)}</ol>
      </Card>
    </>
  );
}

function Analytics({ c }) {
  const { alerts, incidents, teams } = c;
  const now = Date.now();
  const hours = Array.from({ length: 24 }, (_, i) => {
    const start = now - (24 - i) * 3600000;
    return { v: alerts.filter((a) => a.time >= start && a.time < start + 3600000).length, l: new Date(start + 3600000).getHours() + ':00' };
  });
  const bySev = SEVS.map((s) => ({ label: s, value: incidents.filter((i) => i.severity === s).length, color: SEV_COLOR[s] }));
  const byStatus = STATUSES.map((s) => ({ label: s, value: incidents.filter((i) => i.status === s).length, color: STATUS_COLOR[s] }));
  const byTeam = [...teams.map((t) => ({ label: t.name, value: incidents.filter((i) => i.team === t.id).length })),
    { label: 'Unassigned', value: incidents.filter((i) => !teams.some((t) => t.id === i.team)).length, color: '#64748b' }];
  const topRes = group(alerts, 'resource').slice(0, 6).map(([label, value]) => ({ label, value }));
  return (
    <>
      <Card title="Alerts per hour" sub="Last 24 hours (simulated telemetry)"><Columns values={hours.map((h) => h.v)} labels={hours.map((h) => h.l)} /></Card>
      <div className="ss-grid three">
        <Card title="Incidents by severity"><Donut items={bySev} label="incidents" /></Card>
        <Card title="Incidents by status"><HBars items={byStatus} /></Card>
        <Card title="Incidents by team"><HBars items={byTeam} /></Card>
      </div>
      <Card title="Most frequently alerted resources" sub="Simulated telemetry"><HBars items={topRes} /></Card>
    </>
  );
}

/* ---------------- Report generator ---------------- */
const REPORT_TYPES = [
  ['overview', 'Security Overview Report'],
  ['incidents', 'Incident Summary Report'],
  ['threats', 'Threat Detection Report'],
  ['assets', 'Cloud Asset Report'],
  ['response', 'Incident Response Report'],
  ['users', 'Users & Teams Report'],
];
const SRC_LIVE = 'Incidents, users, teams and the audit log come from the Sky Shield API (live data).';
const SRC_SIM = 'Security alerts and the cloud inventory are simulated demo data, not collected from a real cloud account.';

function buildReport(type, x) {
  const { from, to, alerts, incidents, users, teams, logs } = x;
  const A = alerts.filter((a) => a.time >= from && a.time <= to).sort((a, b) => b.time - a.time);
  const L = logs.filter((l) => { const t = logTime(l); return t >= from && t <= to; });
  const tn = (id) => teams.find((t) => t.id === id)?.name || 'Unassigned';
  const open = incidents.filter((i) => i.status !== 'Resolved');
  const cnt = (arr, k, v) => arr.filter((r) => r[k] === v).length;
  const incRows = incidents.map((i) => [i.id, i.title, i.severity, i.status, tn(i.team)]);
  const IH = ['ID', 'Title', 'Severity', 'Status', 'Team'];
  const alertRows = A.map((a) => [a.id, fmt(a.time), a.sev, a.title, a.resource, a.provider, a.category, a.ack ? 'Acknowledged' : 'New']);
  const AH = ['ID', 'Time', 'Severity', 'Alert', 'Resource', 'Provider', 'Category', 'State'];
  const totalRes = ASSETS.reduce((s, a) => s + a.resources, 0);
  const note = 'Incidents are a current-state snapshot because the API stores no incident timestamps; the period applies to alerts and audit-log entries.';
  switch (type) {
    case 'overview':
      return {
        title: 'Security Overview Report', source: [SRC_LIVE, SRC_SIM], note,
        kpis: [['Cloud assets (demo)', totalRes], ['Alerts in period (demo)', A.length], ['Critical alerts (demo)', cnt(A, 'sev', 'Critical')],
          ['Open incidents', open.length], ['Resolved incidents', cnt(incidents, 'status', 'Resolved')], ['Risk score', riskScore(incidents) + ' / 100 (' + riskLevel(riskScore(incidents)) + ')']],
        sections: [
          { title: 'Incidents by severity', head: ['Severity', 'Open', 'Total'], rows: SEVS.map((s) => [s, open.filter((i) => i.severity === s).length, cnt(incidents, 'severity', s)]) },
          { title: 'Alerts by severity (demo)', head: ['Severity', 'Alerts'], rows: SEVS.map((s) => [s, cnt(A, 'sev', s)]) },
          { title: 'Cloud posture (demo)', head: ['Provider', 'Resources', 'Misconfigurations', 'Compliance %'], rows: ASSETS.map((a) => [a.provider, a.resources, a.misconfig, a.compliance]) },
        ],
      };
    case 'incidents':
      return {
        title: 'Incident Summary Report', source: [SRC_LIVE], note,
        kpis: [['Total incidents', incidents.length], ['Open', cnt(incidents, 'status', 'Open')], ['Investigating', cnt(incidents, 'status', 'Investigating')],
          ['Resolved', cnt(incidents, 'status', 'Resolved')], ['Unassigned', incidents.filter((i) => !teams.some((t) => t.id === i.team)).length]],
        sections: [
          { title: 'Incidents by status', head: ['Status', 'Count'], rows: STATUSES.map((s) => [s, cnt(incidents, 'status', s)]) },
          { title: 'Incident list', head: IH, rows: incRows, empty: 'No incidents recorded.' },
        ],
      };
    case 'threats':
      return {
        title: 'Threat Detection Report', source: [SRC_SIM],
        kpis: [['Alerts in period', A.length], ['Critical', cnt(A, 'sev', 'Critical')], ['High', cnt(A, 'sev', 'High')], ['Acknowledged', A.filter((a) => a.ack).length]],
        sections: [
          { title: 'Alerts by category', head: ['Category', 'Alerts'], rows: group(A, 'category') },
          { title: 'Alerts by provider', head: ['Provider', 'Alerts'], rows: group(A, 'provider') },
          { title: 'Alert list', head: AH, rows: alertRows, empty: 'No alerts in this period.' },
        ],
      };
    case 'assets':
      return {
        title: 'Cloud Asset Report', source: [SRC_SIM],
        kpis: [['Total resources', totalRes], ['Misconfigurations', ASSETS.reduce((s, a) => s + a.misconfig, 0)],
          ['Average compliance', Math.round(ASSETS.reduce((s, a) => s + a.compliance, 0) / ASSETS.length) + '%']],
        sections: [
          { title: 'Inventory by provider', head: ['Provider', 'Resources', 'Misconfigurations', 'Compliance %'], rows: ASSETS.map((a) => [a.provider, a.resources, a.misconfig, a.compliance]) },
          { title: 'Compliance frameworks', head: ['Framework', 'Score %'], rows: FRAMEWORKS },
        ],
      };
    case 'response': {
      const acts = L.filter((l) => l.action.includes('incidents'));
      const resolved = cnt(incidents, 'status', 'Resolved');
      return {
        title: 'Incident Response Report', source: [SRC_LIVE], note,
        kpis: [['Resolution rate', (incidents.length ? Math.round((resolved / incidents.length) * 100) : 0) + '%'],
          ['Open and unassigned', open.filter((i) => !teams.some((t) => t.id === i.team)).length], ['Response actions in period', acts.length]],
        sections: [
          { title: 'Incidents awaiting resolution', head: IH, rows: open.map((i) => [i.id, i.title, i.severity, i.status, tn(i.team)]), empty: 'No open incidents.' },
          { title: 'Response actions (audit log)', head: ['Time', 'Action'], rows: acts.map((l) => [l.time, l.action]), empty: 'No response actions in this period.' },
        ],
      };
    }
    default:
      return {
        title: 'Users & Teams Report', source: [SRC_LIVE],
        kpis: [['Users', users.length], ['Admins', cnt(users, 'role', 'Admin')], ['Teams', teams.length]],
        sections: [
          { title: 'Users', head: ['Name', 'Email', 'Role', 'Team'], rows: users.map((u) => [u.name, u.email, u.role, teams.filter((t) => t.members.split(',').includes(u.id)).map((t) => t.name).join('; ') || '-']), empty: 'No users.' },
          { title: 'Teams', head: ['Team', 'Lead', 'Members'], rows: teams.map((t) => [t.name, users.find((u) => u.id === t.lead)?.name || '-', t.members.split(',').map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join('; ') || '-']), empty: 'No teams.' },
        ],
      };
  }
}

function Reports({ c }) {
  const { users, teams, incidents, logs, alerts, toast } = c;
  const [type, setType] = useState('overview');
  const [preset, setPreset] = useState('7');
  const today = new Date().toISOString().slice(0, 10);
  const [cFrom, setCFrom] = useState(new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10));
  const [cTo, setCTo] = useState(today);
  const [gen, setGen] = useState(null);

  const generate = () => {
    let from, to;
    if (preset === 'custom') {
      from = new Date(cFrom + 'T00:00:00').getTime();
      to = new Date(cTo + 'T23:59:59').getTime();
      if (Number.isNaN(from) || Number.isNaN(to) || from > to) return toast('Choose a valid date range', 'err');
    } else { to = Date.now(); from = to - Number(preset) * DAY; }
    const rep = buildReport(type, { from, to, alerts, incidents, users, teams, logs });
    setGen({ rep, from, to, at: Date.now() });
    toast('Report generated');
  };
  const exportCsv = () => {
    const { rep, from, to, at } = gen;
    const rows = [['Sky Shield', rep.title], ['Generated', fmt(at)], ['Period', fmt(from) + ' to ' + fmt(to)], ...rep.source.map((s) => ['Source', s]), []];
    rows.push(['Summary']);
    rep.kpis.forEach((k) => rows.push(k));
    rows.push([]);
    rep.sections.forEach((s) => { rows.push([s.title], s.head, ...s.rows, []); });
    downloadCsv(rep.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), rows);
    toast('CSV downloaded');
  };
  return (
    <>
      <Card title="Generate a report" cls="ss-noprint">
        <div className="ss-toolbar">
          <label className="ss-lab">Report type
            <select value={type} onChange={(e) => setType(e.target.value)}>{REPORT_TYPES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>
          </label>
          <label className="ss-lab">Period
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="custom">Custom range</option>
            </select>
          </label>
          {preset === 'custom' && (
            <>
              <label className="ss-lab">From<input type="date" value={cFrom} max={cTo} onChange={(e) => setCFrom(e.target.value)} /></label>
              <label className="ss-lab">To<input type="date" value={cTo} min={cFrom} max={today} onChange={(e) => setCTo(e.target.value)} /></label>
            </>
          )}
          <button className="ss-btn pri" onClick={generate}>Generate</button>
          {gen && <button className="ss-btn" onClick={() => window.print()}><Icon n="print" size={15} /> Print / Save as PDF</button>}
          {gen && <button className="ss-btn" onClick={exportCsv}><Icon n="download" size={15} /> Download CSV</button>}
        </div>
      </Card>
      {!gen && <p className="ss-muted ss-noprint">Choose a report type and period, then press Generate.</p>}
      {gen && (
        <div className="ss-report" id="ss-report">
          <div className="ss-rhead">
            <div className="ss-brand"><Logo size={38} /><div><b>Sky Shield</b><small>Cloud Security Monitoring &amp; Incident Management</small></div></div>
            <div className="ss-rmeta"><b>{gen.rep.title}</b><small>Generated {fmt(gen.at)}</small><small>Period {fmt(gen.from)} - {fmt(gen.to)}</small></div>
          </div>
          <div className="ss-grid rk">
            {gen.rep.kpis.map(([k, v]) => <div className="ss-rk" key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>
          {gen.rep.sections.map((s) => (
            <div className="ss-rsec" key={s.title}>
              <h4>{s.title}</h4>
              <Tbl head={s.head} empty={s.rows.length ? '' : s.empty || 'No data.'}>
                {s.rows.slice(0, 200).map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}
              </Tbl>
              {s.rows.length > 200 && <p className="ss-muted sm">Showing the first 200 of {s.rows.length} rows. The CSV contains all rows.</p>}
            </div>
          ))}
          <div className="ss-rfoot">
            {gen.rep.source.map((s) => <p key={s}>{s}</p>)}
            {gen.rep.note && <p>{gen.rep.note}</p>}
          </div>
        </div>
      )}
    </>
  );
}

function UsersTeams({ c }) {
  const { users, teams, mutate, toast, me } = c;
  const [u, setU] = useState({ name: '', email: '', role: 'Analyst' });
  const [t, setT] = useState({ name: '', lead: '' });
  const addU = () => {
    if (!u.name.trim() || !/^\S+@\S+\.\S+$/.test(u.email.trim())) return toast('Enter a name and a valid email', 'err');
    mutate('users', 'POST', 'users', { name: u.name.trim(), email: u.email.trim(), role: u.role }, 'User added');
    setU({ name: '', email: '', role: 'Analyst' });
  };
  const addT = () => {
    if (!t.name.trim()) return toast('Enter a team name', 'err');
    mutate('teams', 'POST', 'teams', { name: t.name.trim(), lead: t.lead, members: t.lead }, 'Team created');
    setT({ name: '', lead: '' });
  };
  const toggle = (team, uid) => {
    const m = team.members.split(',').filter(Boolean);
    const next = m.includes(uid) ? m.filter((x) => x !== uid) : [...m, uid];
    mutate('teams', 'PUT', 'teams/' + team.id, { members: next.join(',') }, 'Team updated');
  };
  const delU = (x) => { if (window.confirm('Delete user ' + x.name + '?')) mutate('users', 'DELETE', 'users/' + x.id, {}, 'User deleted'); };
  const delT = (x) => { if (window.confirm('Delete team ' + x.name + '?')) mutate('teams', 'DELETE', 'teams/' + x.id, {}, 'Team deleted'); };
  return (
    <>
      <Card title="Users">
        <div className="ss-toolbar">
          <input placeholder="Full name" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} aria-label="Full name" />
          <input placeholder="Email" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} aria-label="Email" />
          <select value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })} aria-label="Role">{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <button className="ss-btn pri" onClick={addU}>Add user</button>
        </div>
        <Tbl head={['Name', 'Email', 'Role', '']} empty={users.length ? '' : 'No users.'}>
          {users.map((x) => (
            <tr key={x.id}><td>{x.name}</td><td>{x.email}</td><td>{x.role}</td>
              <td className="ss-act">{me && me.id === x.id ? <small className="ss-muted">You</small> : <button className="ss-btn sm danger" onClick={() => delU(x)}>Delete</button>}</td></tr>
          ))}
        </Tbl>
      </Card>
      <Card title="Teams">
        <div className="ss-toolbar">
          <input placeholder="Team name" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} aria-label="Team name" />
          <select value={t.lead} onChange={(e) => setT({ ...t, lead: e.target.value })} aria-label="Team lead"><option value="">No lead</option>{users.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <button className="ss-btn pri" onClick={addT}>Create team</button>
        </div>
        {teams.length === 0 && <p className="ss-muted">No teams yet.</p>}
        <div className="ss-grid teams">
          {teams.map((tm) => (
            <div className="ss-team" key={tm.id}>
              <h4>{tm.name}</h4>
              <small className="ss-muted">Lead: {users.find((x) => x.id === tm.lead)?.name || '-'}</small>
              {users.map((x) => (
                <label className="ss-chk" key={x.id}><input type="checkbox" checked={tm.members.split(',').includes(x.id)} onChange={() => toggle(tm, x.id)} />{x.name}</label>
              ))}
              <button className="ss-btn sm danger" onClick={() => delT(tm)}>Delete team</button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Audit({ c }) {
  const { logs } = c;
  const [q, setQ] = useState('');
  const rows = logs.filter((l) => l.action.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Audit log" sub="Every change made through the API"
      right={<button className="ss-btn sm" disabled={!rows.length} onClick={() => downloadCsv('audit-log', [['Time', 'Action'], ...rows.map((l) => [l.time, l.action])])}><Icon n="download" size={14} /> CSV</button>}>
      <div className="ss-toolbar"><input placeholder="Search the log" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the log" /></div>
      <Tbl head={['Time', 'Action']} empty={rows.length ? '' : 'No entries.'}>
        {rows.slice(0, 300).map((l, i) => <tr key={i}><td>{l.time}</td><td>{l.action}</td></tr>)}
      </Tbl>
    </Card>
  );
}

function Settings({ c }) {
  const { theme, setTheme, live, setLive, resetFeed, online, load, me, role } = c;
  return (
    <div className="ss-grid two">
      <Card title="Appearance">
        <div className="ss-seg">
          {['dark', 'light'].map((t) => <button key={t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}><Icon n={t === 'dark' ? 'moon' : 'sun'} size={15} /> {t === 'dark' ? 'Dark' : 'Light'}</button>)}
        </div>
        <p className="ss-muted sm">Your choice is remembered in this browser.</p>
      </Card>
      <Card title="Simulated alert feed">
        <div className="ss-actions">
          <button className="ss-btn" onClick={() => setLive(!live)}>{live ? 'Pause feed' : 'Resume feed'}</button>
          <button className="ss-btn" onClick={resetFeed}>Reset simulated data</button>
        </div>
        <p className="ss-muted sm">The feed is demo data. It does not read from any cloud account.</p>
      </Card>
      <Card title="API connection">
        <p><i className={'dot ' + (online ? 'ok' : 'bad')} />{online ? 'Connected to the Sky Shield API' : online === false ? 'API unreachable' : 'Checking'}</p>
        <button className="ss-btn" onClick={load}>Check again</button>
      </Card>
      <Card title="Session">
        <dl className="ss-dl"><dt>Signed in as</dt><dd>{me ? me.name : '-'}</dd><dt>Role</dt><dd>{role}</dd></dl>
        <p className="ss-muted sm">Admin: everything. Analyst and Responder: act on incidents. Viewer: read-only. Users &amp; Teams is Admin only.</p>
      </Card>
    </div>
  );
}

/* =====================================================================
   APP SHELL
   ===================================================================== */
const NAV = [
  ['MONITOR', [['dashboard', 'Dashboard', 'grid'], ['assets', 'Cloud Assets', 'cloud'], ['alerts', 'Security Alerts', 'bell']]],
  ['INCIDENT MANAGEMENT', [['incidents', 'Incidents', 'alert'], ['investigate', 'Investigation & Response', 'search']]],
  ['INSIGHTS', [['analytics', 'Analytics', 'chart'], ['reports', 'Reports', 'file']]],
  ['ADMINISTRATION', [['users', 'Users & Teams', 'users', true], ['audit', 'Audit Log', 'list'], ['settings', 'Settings', 'gear']]],
];
const TITLES = Object.fromEntries(NAV.flatMap(([, items]) => items.map((i) => [i[0], i[1]])));

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem('ss-theme') || 'dark'; } catch { return 'dark'; } });
  const [data, setData] = useState({ users: [], teams: [], incidents: [], logs: [] });
  const [online, setOnline] = useState(null);
  const [meId, setMeId] = useState('');
  const [sel, setSel] = useState('');
  const [alerts, setAlerts] = useState(seedAlerts);
  const [live, setLive] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const nid = useRef(1000);
  const tt = useRef(0);

  const setTheme = (t) => { setThemeState(t); try { localStorage.setItem('ss-theme', t); } catch { /* storage unavailable */ } };
  const toast = useCallback((msg, kind = 'ok') => {
    setToastMsg({ msg, kind });
    clearTimeout(tt.current);
    tt.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      const [users, teams, incidents, logs] = await Promise.all(['users', 'teams', 'incidents', 'logs'].map((r) => api(r)));
      setData({ users, teams, incidents, logs });
      setOnline(true);
    } catch { setOnline(false); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setAlerts((a) => [mkAlert(TPL[Math.floor(Math.random() * TPL.length)], Date.now(), ++nid.current), ...a].slice(0, 600)), 7000);
    return () => clearInterval(t);
  }, [live]);

  const mutate = useCallback(async (res, method, path, body, msg) => {
    try {
      const list = await api(path, method, body);
      setData((d) => ({ ...d, [res]: list }));
      setOnline(true);
      toast(msg);
      load();
    } catch { setOnline(false); toast('API unreachable - change not saved', 'err'); }
  }, [load, toast]);

  const me = data.users.find((u) => u.id === meId) || data.users.find((u) => u.role === 'Admin') || data.users[0];
  const role = me ? me.role : 'Viewer';
  const isAdmin = role === 'Admin';
  const canEdit = role !== 'Viewer';
  const risk = useMemo(() => riskScore(data.incidents), [data.incidents]);

  const ackAlert = (id) => setAlerts((a) => a.map((x) => (x.id === id ? { ...x, ack: true } : x)));
  const escalate = (a) => {
    mutate('incidents', 'POST', 'incidents', { title: a.title + ' (' + a.resource + ')', severity: a.sev, status: 'Open', team: '' }, 'Incident created from alert');
    ackAlert(a.id);
  };
  const resetFeed = () => { setAlerts(seedAlerts()); toast('Simulated data reset'); };
  const go = (p) => { setPage(p); setMenu(false); window.scrollTo(0, 0); };

  const c = { ...data, alerts, live, setLive, online, load, risk, me, role, isAdmin, canEdit, mutate, toast, go, sel, setSel, ackAlert, escalate, resetFeed, theme, setTheme };
  const pages = { dashboard: Dashboard, assets: Assets, alerts: Alerts, incidents: Incidents, investigate: Investigate, analytics: Analytics, reports: Reports, users: UsersTeams, audit: Audit, settings: Settings };
  const Page = pages[page] || Dashboard;
  const blocked = page === 'users' && !isAdmin;

  return (
    <div className="ss" data-theme={theme}>
      <style>{CSS}</style>
      {menu && <div className="ss-back" onClick={() => setMenu(false)} />}
      <div className={'ss-side' + (menu ? ' open' : '')}>
        <div className="ss-brand"><Logo /><div><b>Sky Shield</b><small>Security Operations</small></div></div>
        <div className="ss-nav">
          {NAV.map(([sec, items]) => (
            <div key={sec}>
              <div className="ss-sec">{sec}</div>
              {items.filter((i) => !i[3] || isAdmin).map(([id, label, icon]) => (
                <button key={id} className={'ss-link' + (page === id ? ' on' : '')} onClick={() => go(id)} aria-current={page === id ? 'page' : undefined}>
                  <Icon n={icon} />{label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <label className="ss-me">Signed in as
          <select value={me ? me.id : ''} onChange={(e) => setMeId(e.target.value)} disabled={!data.users.length}>
            {data.users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </label>
      </div>
      <div className="ss-body">
        <header className="ss-top">
          <button className="ss-icon ss-menu" onClick={() => setMenu(true)} aria-label="Open menu"><Icon n="menu" /></button>
          <h2>{TITLES[page]}</h2>
          <div className="ss-topr">
            <span className={'ss-chip ' + (online ? 'ok' : online === false ? 'bad' : '')}><i className={'dot ' + (online ? 'ok' : 'bad')} />API {online ? 'online' : online === false ? 'offline' : '...'}</span>
            <button className="ss-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme"><Icon n={theme === 'dark' ? 'sun' : 'moon'} /></button>
            <span className="ss-user"><b>{me ? me.name : 'Not signed in'}</b><small>{role}</small></span>
          </div>
        </header>
        <div className="ss-content">
          {online === false && (
            <Banner kind="bad">Cannot reach the Sky Shield API on port 8080, so incidents, users and the audit log are unavailable. Start it with <code>npm run server</code> or <code>start.bat</code>.{' '}
              <button className="ss-btn sm" onClick={load}>Retry</button></Banner>
          )}
          {blocked ? <Card><p><Icon n="lock" size={16} /> Users &amp; Teams is available to Admins only.</p></Card> : <Page c={c} />}
        </div>
      </div>
      {toastMsg && <div className={'ss-toast ' + toastMsg.kind} role="status">{toastMsg.msg}</div>}
    </div>
  );
}

/* =====================================================================
   STYLES (scoped under .ss so the old styles.css cannot interfere)
   ===================================================================== */
const CSS = `
.ss{--bg:#0b1220;--panel:#111c30;--panel2:#16243b;--line:#223452;--text:#e5edf9;--mute:#8fa3c2;--accent:#3b82f6;--accent2:#60a5fa;--side:#080f1b;
  display:flex;min-height:100vh;background:var(--bg);color:var(--text);font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;font-size:14px;line-height:1.45}
.ss[data-theme=light]{--bg:#eef2f8;--panel:#fff;--panel2:#f5f8fc;--line:#d9e2ef;--text:#0f1b2d;--mute:#5a6e8c;--accent:#2563eb;--accent2:#1d4ed8}
.ss *{box-sizing:border-box}
.ss h2,.ss h3,.ss h4,.ss p,.ss dl,.ss ol,.ss ul{margin:0}
.ss button{font-family:inherit}
.ss-side{width:250px;flex:none;background:var(--side);border-right:1px solid #16243b;padding:20px 12px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;color:#cbd8ee;z-index:30}
.ss-brand{display:flex;align-items:center;gap:10px}
.ss-brand b{display:block;font-size:17px;letter-spacing:.2px}
.ss-side .ss-brand b{color:#fff}
.ss-brand small{display:block;color:#8fa3c2;font-size:11px}
.ss-side .ss-brand{padding:4px 8px 20px}
.ss-nav{flex:1}
.ss-sec{font-size:10.5px;letter-spacing:1.2px;color:#6b819f;padding:16px 10px 6px;font-weight:600}
.ss .ss-link{display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:none;border:0;border-left:3px solid transparent;color:#a9bbd6;padding:9px 10px;border-radius:6px;font-size:14px;cursor:pointer;transition:background .15s,color .15s}
.ss .ss-link:hover{background:#101c31;color:#fff}
.ss .ss-link.on{background:#12233f;color:#fff;border-left-color:var(--accent2)}
.ss .ss-link.on svg{color:var(--accent2)}
.ss-me{display:block;font-size:11px;color:#8fa3c2;margin-top:14px;padding:12px 8px 0;border-top:1px solid #16243b}
.ss-me select{margin-top:6px;width:100%}
.ss-body{flex:1;min-width:0;display:flex;flex-direction:column}
.ss-top{display:flex;align-items:center;gap:14px;padding:14px 28px;background:var(--panel);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.ss-top h2{font-size:18px;font-weight:600;flex:1}
.ss-topr{display:flex;align-items:center;gap:12px}
.ss-user{display:flex;flex-direction:column;text-align:right;line-height:1.2}
.ss-user small{color:var(--mute);font-size:11px}
.ss .ss-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--text);cursor:pointer;transition:border-color .15s}
.ss .ss-icon:hover{border-color:var(--accent)}
.ss-menu{display:none!important}
.ss-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;border:1px solid var(--line);font-size:12px;color:var(--mute)}
.ss .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:#64748b}
.ss-chip .dot{margin:0}
.ss .dot.ok{background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}
.ss .dot.bad{background:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.18)}
.ss-content{padding:24px 28px 48px;max-width:1280px;width:100%}
.ss-grid{display:grid;gap:16px;margin-bottom:16px}
.ss-grid.kpis{grid-template-columns:repeat(5,minmax(0,1fr))}
.ss-grid.kpis3{grid-template-columns:repeat(3,minmax(0,1fr))}
.ss-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.ss-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.ss-grid.teams{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.ss-grid.rk{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.ss-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:16px;min-width:0}
.ss-grid .ss-card{margin-bottom:0}
.ss-ch{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px}
.ss-ch h3{font-size:15px;font-weight:600}
.ss-ch p{color:var(--mute);font-size:12px;margin-top:2px}
.ss-kpi{background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--c,var(--accent));border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:4px;transition:transform .15s,border-color .15s;min-width:0}
.ss-kpi:hover{transform:translateY(-2px);border-color:var(--c,var(--accent))}
.ss-kpi>span{color:var(--mute);font-size:12px;display:flex;align-items:center;gap:6px}
.ss-kpi b{font-size:30px;line-height:1.1;font-weight:650}
.ss-kpi small{color:var(--mute);font-size:11.5px}
.ss-demo{font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;border:1px solid var(--line);border-radius:4px;padding:0 5px;color:var(--mute)}
.ss-risk{align-items:stretch}
.ss-gauge{text-align:center}
.ss-gnum{font-size:30px;font-weight:650;fill:var(--text)}
.ss-glevel{font-weight:600;font-size:13px;margin-top:-4px}
.ss .ss-pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:600;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.ss-list{display:flex;flex-direction:column}
.ss-li{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}
.ss-li:last-child{border:0}
.ss-li b{display:block;font-weight:500}
.ss-li small,.ss-li time{color:var(--mute);font-size:12px}
.ss-donut{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ss-dnum{font-size:26px;font-weight:650;fill:var(--text)}
.ss-dlab{font-size:10px;fill:var(--mute)}
.ss-legend{list-style:none;padding:0;flex:1;min-width:130px}
.ss-legend li{display:flex;align-items:center;gap:8px;padding:4px 0}
.ss-legend i{width:10px;height:10px;border-radius:3px}
.ss-legend b{margin-left:auto}
.ss-hbars{display:flex;flex-direction:column;gap:11px}
.ss-hb{display:grid;grid-template-columns:minmax(80px,38%) 1fr auto;gap:10px;align-items:center}
.ss-hb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ss-track{height:9px;background:var(--panel2);border-radius:5px;overflow:hidden;border:1px solid var(--line)}
.ss-track div{height:100%;border-radius:5px;transition:width .4s}
.ss-cols{width:100%;height:auto;display:block}
.ss-axis{font-size:10px;fill:var(--mute)}
.ss-tl{list-style:none;padding:0 0 0 14px;border-left:2px solid var(--line)}
.ss-tl li{position:relative;padding:0 0 12px 14px}
.ss-tl li:before{content:"";position:absolute;left:-21px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--accent);border:2px solid var(--panel)}
.ss-tl b{display:block;font-weight:500;word-break:break-word}
.ss-tl small{color:var(--mute);font-size:11.5px}
.ss-status{list-style:none;padding:0}
.ss-status li{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
.ss-status li:last-child{border:0}
.ss-muted{color:var(--mute)}
.ss-muted.sm{font-size:12px;margin-top:10px}
.ss-banner{padding:10px 14px;border-radius:8px;margin-bottom:16px;border:1px solid var(--line);background:var(--panel);color:var(--mute);font-size:13px;border-left:3px solid var(--accent)}
.ss-banner.bad{border-left-color:#ef4444;color:var(--text)}
.ss-banner code{background:var(--panel2);padding:1px 6px;border-radius:4px}
.ss-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px}
.ss-toolbar>input{flex:1;min-width:160px}
.ss-lab{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:var(--mute)}
.ss .ss-card input,.ss .ss-card select,.ss .ss-me select,.ss .ss-lab input,.ss .ss-lab select{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:7px;padding:8px 10px;font-size:13.5px;font-family:inherit;max-width:100%}
.ss .ss-me select{background:#0f1b30;color:#e5edf9;border-color:#223452}
.ss input:focus-visible,.ss select:focus-visible,.ss button:focus-visible{outline:2px solid var(--accent2);outline-offset:1px}
.ss input[type=checkbox]{padding:0;width:auto}
.ss .ss-btn{display:inline-flex;align-items:center;gap:6px;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:7px;padding:8px 14px;font-size:13.5px;cursor:pointer;transition:border-color .15s,transform .05s;white-space:nowrap}
.ss .ss-btn:hover:not(:disabled){border-color:var(--accent)}
.ss .ss-btn:active:not(:disabled){transform:translateY(1px)}
.ss .ss-btn:disabled{opacity:.45;cursor:not-allowed}
.ss .ss-btn.pri{background:var(--accent);border-color:var(--accent);color:#fff}
.ss .ss-btn.pri:hover:not(:disabled){background:var(--accent2);border-color:var(--accent2)}
.ss .ss-btn.danger{color:#ef4444;border-color:rgba(239,68,68,.5);background:transparent}
.ss .ss-btn.sm{padding:4px 10px;font-size:12.5px}
.ss-tw{overflow-x:auto}
.ss table.ss-table{width:100%;border-collapse:collapse;background:transparent;border-radius:0;overflow:visible}
.ss .ss-table th,.ss .ss-table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle;color:var(--text)}
.ss .ss-table th{color:var(--mute);font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}
.ss .ss-table tbody tr:hover{background:var(--panel2)}
.ss .ss-table td.ss-empty{text-align:center;color:var(--mute);padding:20px}
.ss .ss-table td.ss-act{white-space:nowrap;display:table-cell}
.ss .ss-act .ss-btn{margin-right:6px}
.ss-dl{display:grid;grid-template-columns:130px 1fr;gap:10px 12px;align-items:center}
.ss-dl dt{color:var(--mute)}
.ss-dl dd{margin:0}
.ss-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.ss-seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.ss .ss-seg button{display:inline-flex;align-items:center;gap:6px;background:var(--panel2);color:var(--mute);border:0;padding:8px 16px;cursor:pointer}
.ss .ss-seg button.on{background:var(--accent);color:#fff}
.ss-team{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:4px}
.ss-team .ss-btn{margin-top:10px;align-self:flex-start}
.ss-chk{display:flex;align-items:center;gap:8px;padding:2px 0}
.ss-toast{position:fixed;right:20px;bottom:20px;background:#16a34a;color:#fff;padding:11px 18px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:100;font-size:13.5px}
.ss-toast.err{background:#dc2626}
.ss-back{display:none}
/* report sheet */
.ss-report{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:26px}
.ss-rhead{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:2px solid var(--accent);padding-bottom:16px;margin-bottom:18px}
.ss-rmeta{text-align:right}
.ss-rmeta b{display:block;font-size:19px}
.ss-rmeta small{display:block;color:var(--mute)}
.ss-rk{border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--panel2)}
.ss-rk span{display:block;color:var(--mute);font-size:12px}
.ss-rk b{font-size:22px}
.ss-rsec{margin-top:20px}
.ss-rsec h4{font-size:14px;margin-bottom:8px}
.ss-rfoot{margin-top:22px;padding-top:12px;border-top:1px solid var(--line);color:var(--mute);font-size:12px}
.ss-rfoot p{margin-bottom:4px}
@media(max-width:1180px){.ss-grid.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.ss-grid.three{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){
  .ss-side{position:fixed;left:0;top:0;transform:translateX(-100%);transition:transform .2s}
  .ss-side.open{transform:none}
  .ss-back{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:25}
  .ss-menu{display:inline-flex!important}
  .ss-grid.two,.ss-grid.three{grid-template-columns:1fr}
  .ss-top{padding:12px 16px}.ss-content{padding:16px 14px 40px}
  .ss-user{display:none}
}
@media(max-width:560px){.ss-grid.kpis,.ss-grid.kpis3{grid-template-columns:1fr 1fr}.ss-chip{display:none}.ss-dl{grid-template-columns:1fr}}
@media print{
  .ss{display:block;background:#fff}
  .ss-side,.ss-top,.ss-noprint,.ss-toast,.ss-back,.ss-banner{display:none!important}
  .ss-content{padding:0;max-width:none}
  .ss-report{border:0;background:#fff;color:#000;padding:0}
  .ss-report *{color:#000!important;border-color:#bbb!important;background:transparent!important}
  .ss-report .ss-rk{background:#f4f6fa!important}
  .ss-rsec{break-inside:avoid}
  .ss-report .ss-tw{overflow:visible}
  .ss-report .ss-pill{border:1px solid #888}
  @page{margin:14mm}
}
`;
