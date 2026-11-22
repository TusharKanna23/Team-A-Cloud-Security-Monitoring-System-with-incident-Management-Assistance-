
import { useEffect, useState } from 'react';
import './App.css';
import KnowledgeBase from './knowledge-base/KnowledgeBase';
import RiskEngine from './pages/RiskEngine';

const API = 'http://localhost:8080/api';

const playbooks = [
  {
    id: 1,
    name: 'Failed Login Detection',
    type: 'FAILED_LOGIN',
    icon: '🔐',
    severity: 'HIGH',
    description: 'Detects repeated or suspicious failed login attempts.',
    actions: [
      'Analyze failed login activity',
      'Identify suspicious IP address',
      'Generate administrator notification',
      'Mark security incident for investigation'
    ]
  },
  {
    id: 2,
    name: 'Unauthorized Access Detection',
    type: 'UNAUTHORIZED_ACCESS',
    icon: '🚫',
    severity: 'CRITICAL',
    description: 'Detects unauthorized attempts to access protected resources.',
    actions: [
      'Identify unauthorized access',
      'Analyze access source',
      'Generate security alert',
      'Notify administrator'
    ]
  },
  {
    id: 3,
    name: 'Suspicious Data Access',
    type: 'SUSPICIOUS_DATA_ACCESS',
    icon: '📁',
    severity: 'HIGH',
    description: 'Monitors unusual access to sensitive cloud data.',
    actions: [
      'Analyze data access activity',
      'Identify unusual access patterns',
      'Generate security alert',
      'Request investigation'
    ]
  },
  {
    id: 4,
    name: 'Suspicious Network Activity',
    type: 'SUSPICIOUS_NETWORK',
    icon: '🌐',
    severity: 'HIGH',
    description: 'Identifies unusual network traffic and suspicious connections.',
    actions: [
      'Analyze network activity',
      'Identify suspicious traffic',
      'Generate network alert',
      'Notify security team'
    ]
  },
  {
    id: 5,
    name: 'Cloud Misconfiguration',
    type: 'CLOUD_MISCONFIGURATION',
    icon: '☁️',
    severity: 'MEDIUM',
    description: 'Identifies potential cloud configuration security risks.',
    actions: [
      'Analyze cloud configuration',
      'Identify configuration risks',
      'Generate security alert',
      'Recommend corrective action'
    ]
  }
];

const fallbackEvents = [
  { id: 101, eventType: 'SQL_INJECTION', ipAddress: '194.26.29.114', source: 'WAF Rule CRS-942100', severity: 'CRITICAL', status: 'ACTIVE' },
  { id: 102, eventType: 'RANSOMWARE', ipAddress: '10.0.4.88 (Internal)', source: 'Endpoint EDR / File Monitor', severity: 'CRITICAL', status: 'ACTIVE' },
  { id: 103, eventType: 'PRIVILEGE_ESCALATION', ipAddress: '172.31.18.204', source: 'KubeAudit Daemon', severity: 'CRITICAL', status: 'INVESTIGATING' },
  { id: 104, eventType: 'DDOS_FLOOD', ipAddress: 'Botnet Cluster (3.4k IPs)', source: 'AWS Shield / CDN Edge', severity: 'HIGH', status: 'CONTAINED' },
  { id: 105, eventType: 'FAILED_LOGIN', ipAddress: '185.220.101.5', source: 'Okta SSO Gateway', severity: 'HIGH', status: 'ACTIVE' },
  { id: 106, eventType: 'UNAUTHORIZED_ACCESS', ipAddress: '45.142.122.9', source: 'CloudTrail IAM Guard', severity: 'HIGH', status: 'INVESTIGATING' }
];

const fallbackAlerts = [
  {
    id: 1,
    eventId: 101,
    severity: 'CRITICAL',
    title: 'SQL Injection on Aurora Database',
    message: 'Repeated SQL injection payload detected targeting user credentials table in aurora-db-customer-prod.',
    status: 'ACTIVE'
  },
  {
    id: 2,
    eventId: 102,
    severity: 'CRITICAL',
    title: 'Ransomware Mass Encryption Alert',
    message: 'Rapid file modification with .locked extension on nas-shared-vault-vol03.',
    status: 'ACTIVE'
  },
  {
    id: 3,
    eventId: 105,
    severity: 'HIGH',
    title: 'Brute Force Password Spraying',
    message: 'Surge of 820 failed logins from Tor exit node targeting cloud IAM SSO gateway.',
    status: 'INVESTIGATING'
  },
  {
    id: 4,
    eventId: 106,
    severity: 'HIGH',
    title: 'Unauthorized S3 Bucket Access',
    message: 'Anonymous API GetObject invoked on confidential financial archives bucket.',
    status: 'INVESTIGATING'
  }
];

const fallbackExecutions = [
  { id: 1, eventId: 101, eventType: 'FAILED_LOGIN', status: 'EXECUTED', executedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, eventId: 105, eventType: 'UNAUTHORIZED_ACCESS', status: 'EXECUTED', executedAt: new Date(Date.now() - 7200000).toISOString() }
];

const initialIncidents = [
  {
    id: 'INC-2026-0814',
    title: 'Aurora Database SQL Injection Exploit Attempt',
    severity: 'CRITICAL',
    assignedTo: 'SOC Emergency Response',
    sourceEventId: 'SEC-2026-101',
    riskScore: 92,
    status: 'Investigating',
    createdAt: '2026-11-20 17:45:00',
    notes: 'Adversary targeting /api/v1/auth/login with union select payloads. WAF rule CRS-942100 blocked downstream queries.'
  },
  {
    id: 'INC-2026-0815',
    title: 'Ransomware Encryption Activity on Storage Vault',
    severity: 'CRITICAL',
    assignedTo: 'SOC Emergency Response',
    sourceEventId: 'SEC-2026-102',
    riskScore: 96,
    status: 'Containment',
    createdAt: '2026-11-20 17:36:12',
    notes: 'Host isolated from VPC subnet. Shadow copies deletion detected. Immutable backups verified safe.'
  },
  {
    id: 'INC-2026-0816',
    title: 'Tor Exit Node Brute Force Credential Spray',
    severity: 'HIGH',
    assignedTo: 'SOC Tier-2 Team',
    sourceEventId: 'SEC-2026-105',
    riskScore: 71,
    status: 'Mitigated',
    createdAt: '2026-11-20 16:25:30',
    notes: 'Edge IP block applied at Cloudflare WAF. Targeted accounts flagged for mandatory MFA verification.'
  }
];

function App() {
  const [events, setEvents] = useState(fallbackEvents);
  const [alerts, setAlerts] = useState(fallbackAlerts);
  const [executions, setExecutions] = useState(fallbackExecutions);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [preloadedThreat, setPreloadedThreat] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState('');
  const [executionError, setExecutionError] = useState('');

  // Fetch dashboard data with fallback to mock data when backend is not running
  const fetchDashboardData = async () => {
    try {
      setError('');

      const [eventRes, alertRes, executionRes] = await Promise.all([
        fetch(`${API}/events`),
        fetch(`${API}/alerts`),
        fetch(`${API}/playbooks`)
      ]);

      if (!eventRes.ok || !alertRes.ok || !executionRes.ok) {
        throw new Error('Backend offline. Loaded realistic mock security stream.');
      }

      const eventData = await eventRes.json();
      const alertData = await alertRes.json();
      const executionData = await executionRes.json();

      setEvents(Array.isArray(eventData) ? eventData : fallbackEvents);
      setAlerts(Array.isArray(alertData) ? alertData : fallbackAlerts);
      setExecutions(Array.isArray(executionData) ? executionData : fallbackExecutions);
      setBackendOnline(true);
    } catch (err) {
      // Graceful fallback to mock data
      setEvents(fallbackEvents);
      setAlerts(fallbackAlerts);
      setExecutions(fallbackExecutions);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dashboard calculations
  const criticalThreats = events.filter(
    event => event.severity?.toUpperCase() === 'CRITICAL'
  ).length;

  const stats = [
    {
      title: 'Total Events',
      value: events.length,
      icon: '◈'
    },
    {
      title: 'Security Alerts',
      value: alerts.length,
      icon: '⚠'
    },
    {
      title: 'Critical Threats',
      value: criticalThreats,
      icon: '◆'
    },
    {
      title: 'Playbooks Executed',
      value: executions.length,
      icon: '⚙'
    }
  ];

  // Execute selected playbook
  const executePlaybook = async () => {
    if (!selectedPlaybook) {
      setExecutionError('Please select a playbook.');
      return;
    }

    if (!selectedEvent) {
      setExecutionError('Please select a security event.');
      return;
    }

    const event = events.find(
      item => String(item.id) === String(selectedEvent)
    );

    if (!event) {
      setExecutionError('Selected event was not found.');
      return;
    }

    if (event.eventType !== selectedPlaybook.type) {
      setExecutionError(
        `This playbook requires an event of type ${selectedPlaybook.type}.`
      );
      return;
    }

    try {
      setExecuting(true);
      setExecutionError('');
      setExecutionMessage('');

      // Update this URL if your backend uses a different execution endpoint.
      const response = await fetch(
        `${API}/playbooks/execute/${event.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || 'Playbook execution failed. Check your backend endpoint.'
        );
      }

      setExecutionMessage(
        `${selectedPlaybook.name} executed successfully for Event #${event.id}.`
      );

      await fetchDashboardData();
    } catch (err) {
      setExecutionError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  // Sidebar navigation
  const navigateTo = (page) => {
    setActivePage(page);
    setSelectedPlaybook(null);
    setExecutionMessage('');
    setExecutionError('');
  };

  // Render dashboard
  const renderDashboard = () => (
    <>
      <header className="topbar">
        <div>
          <h1>Security Dashboard</h1>
          <p>Monitor and manage your cloud security environment</p>
        </div>

        <div className="topbar-right">
          <span className="live-badge">
            <span></span> LIVE
          </span>
          <div className="profile">SG</div>
        </div>
      </header>

      {loading && (
        <p className="info-message">Loading dashboard data...</p>
      )}

      {error && (
        <p className="error-message">
          Backend connection failed: {error}
        </p>
      )}

      <section className="stats-grid">
        {stats.map(stat => (
          <div className="stat-card" key={stat.title}>
            <div className="stat-top">
              <span>{stat.title}</span>
              <span className="stat-icon">{stat.icon}</span>
            </div>

            <h2>{loading ? '...' : stat.value}</h2>
            <p className="stat-description">{stat.title}</p>
          </div>
        ))}
      </section>

      {/* Security Events */}
      <section className="content-card">
        <div className="section-header">
          <div>
            <h2>Recent Security Events</h2>
            <p>Latest activity detected in your cloud environment</p>
          </div>
          <span className="count-badge">
            {events.length} Events
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Type</th>
                <th>IP Address</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>#{event.id}</td>
                  <td>{event.eventType}</td>
                  <td>{event.ipAddress}</td>
                  <td>{event.source}</td>
                  <td>
                    <span
                      className={`severity ${event.severity?.toLowerCase()}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td>{event.status}</td>
                </tr>
              ))}

              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan="6">No security events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security Alerts */}
      <section className="content-card">
        <div className="section-header">
          <div>
            <h2>Security Alerts</h2>
            <p>Detected threats requiring attention</p>
          </div>

          <span className="count-badge">
            {alerts.length} Alerts
          </span>
        </div>

        <div className="alerts-grid">
          {alerts.map(alert => (
            <div className="alert-card" key={alert.id}>
              <div className="alert-heading">
                <span className="alert-symbol">⚠</span>
                <span className="severity high">
                  {alert.severity}
                </span>
              </div>

              <h3>{alert.title}</h3>
              <p>{alert.message}</p>

              <div className="alert-footer">
                <span>Event ID: #{alert.eventId}</span>
                <span className="alert-status">{alert.status}</span>
              </div>
            </div>
          ))}

          {!loading && alerts.length === 0 && (
            <p>No security alerts found.</p>
          )}
        </div>
      </section>

      {/* Playbook Summary */}
      <section className="content-card">
        <div className="section-header">
          <div>
            <h2>Playbook Automation</h2>
            <p>Automated security response overview</p>
          </div>
        </div>

        <div className="playbook-summary">
          <div className="playbook-icon">⚙</div>

          <div>
            <h3>{executions.length} Playbook Executions</h3>
            <p>Recorded automated security responses</p>
          </div>

          <span className="success-badge">
            Backend Connected
          </span>
        </div>
      </section>

      {/* Incident Management */}
      <section className="content-card">
        <div className="section-header">
          <div>
            <h2>Incident Management</h2>
            <p>Security incidents and investigation workspace</p>
          </div>
        </div>

        <div className="empty-state">
          <span>▣</span>
          <h3>Incident Management</h3>
          <p>
            Incident tracking and investigation features will be
            developed next.
          </p>
        </div>
      </section>
    </>
  );

  // Render playbook automation page
  const renderPlaybooks = () => (
    <>
      <header className="topbar">
        <div>
          <h1>Playbook Automation</h1>
          <p>Automate security responses to detected threats</p>
        </div>

        <span className="automation-status">
          ● Automation Module
        </span>
      </header>

      <section className="playbook-stats">
        <div className="playbook-stat">
          <span>Available Playbooks</span>
          <h2>{playbooks.length}</h2>
        </div>

        <div className="playbook-stat">
          <span>Total Executions</span>
          <h2>{executions.length}</h2>
        </div>

        <div className="playbook-stat">
          <span>Security Events</span>
          <h2>{events.length}</h2>
        </div>
      </section>

      <section className="playbook-section">
        <h2>Available Security Playbooks</h2>
        <p>Select a playbook to view its workflow and execute it.</p>

        <div className="playbook-grid">
          {playbooks.map(playbook => (
            <div className="playbook-card" key={playbook.id}>
              <div className="playbook-card-top">
                <span>{playbook.icon}</span>
                <span className={`severity ${playbook.severity.toLowerCase()}`}>
                  {playbook.severity}
                </span>
              </div>

              <h3>{playbook.name}</h3>
              <p>{playbook.description}</p>

              <div className="playbook-type">
                Trigger: {playbook.type}
              </div>

              <button
                className="view-playbook-btn"
                onClick={() => {
                  setSelectedPlaybook(playbook);
                  setSelectedEvent('');
                  setExecutionMessage('');
                  setExecutionError('');
                }}
              >
                View Workflow
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedPlaybook && (
        <section className="workflow-container">
          <div className="workflow-header">
            <div>
              <h2>
                {selectedPlaybook.icon} {selectedPlaybook.name}
              </h2>
              <p>{selectedPlaybook.description}</p>
            </div>

            <span className="workflow-status">Ready</span>
          </div>

          <h3>Automated Response Workflow</h3>

          <div className="workflow-steps">
            {selectedPlaybook.actions.map((action, index) => (
              <div className="workflow-step" key={action}>
                <div className="workflow-step-number">
                  {index + 1}
                </div>
                <h3>{action}</h3>
                <p>
                  {index === 0
                    ? 'Analyze the detected security event.'
                    : 'Perform the next automated response action.'}
                </p>
              </div>
            ))}
          </div>

          <div className="details-info">
            <strong>Playbook:</strong> {selectedPlaybook.name}
            <br />
            <strong>Event Type:</strong> {selectedPlaybook.type}
            <br />
            <strong>Severity:</strong> {selectedPlaybook.severity}
          </div>

          <label htmlFor="event-select">
            Select a matching security event
          </label>

          <select
            id="event-select"
            value={selectedEvent}
            onChange={event => {
              setSelectedEvent(event.target.value);
              setExecutionError('');
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              marginBottom: '18px',
              background: '#101b2d',
              color: '#f8fafc',
              border: '1px solid #344660',
              borderRadius: '8px'
            }}
          >
            <option value="">-- Select Event --</option>

            {events
              .filter(event => event.eventType === selectedPlaybook.type)
              .map(event => (
                <option key={event.id} value={event.id}>
                  Event #{event.id} - {event.eventType} - {event.ipAddress}
                </option>
              ))}
          </select>

          {executionMessage && (
            <div className="workflow-result">
              <h3>✓ Execution Successful</h3>
              <p>{executionMessage}</p>
            </div>
          )}

          {executionError && (
            <p className="error-message">{executionError}</p>
          )}

          <div className="workflow-actions">
            <button
              className="workflow-button"
              onClick={executePlaybook}
              disabled={executing}
            >
              {executing ? 'Executing...' : '▶ Execute Playbook'}
            </button>

            <button
              className="workflow-button secondary"
              onClick={() => {
                setSelectedPlaybook(null);
                setSelectedEvent('');
                setExecutionMessage('');
                setExecutionError('');
              }}
            >
              Close Workflow
            </button>
          </div>
        </section>
      )}

      {/* Execution History */}
      <section className="playbook-section">
        <h2>Recent Playbook Executions</h2>
        <p>Previously recorded automated security responses.</p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Event ID</th>
                <th>Event Type</th>
                <th>Status</th>
                <th>Executed At</th>
              </tr>
            </thead>

            <tbody>
              {executions.map((execution, index) => (
                <tr key={execution.id ?? index}>
                  <td>#{execution.id ?? index + 1}</td>
                  <td>#{execution.eventId}</td>
                  <td>{execution.eventType}</td>
                  <td>
                    <span className="severity low">
                      {execution.status}
                    </span>
                  </td>
                  <td>
                    {execution.executedAt
                      ? new Date(execution.executedAt).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}

              {!loading && executions.length === 0 && (
                <tr>
                  <td colSpan="5">No playbook executions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🛡</span>
          <span>SkyShield</span>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="sidebar-nav">
          <button
            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={`nav-link ${activePage === 'events' ? 'active' : ''}`}
            onClick={() => navigateTo('events')}
          >
            <span>◈</span> Security Events
          </button>

          <button
            className={`nav-link ${activePage === 'alerts' ? 'active' : ''}`}
            onClick={() => navigateTo('alerts')}
          >
            <span>⚠</span> Security Alerts
          </button>

          <button
            className={`nav-link ${activePage === 'knowledge-base' ? 'active' : ''}`}
            onClick={() => navigateTo('knowledge-base')}
          >
            <span>📚</span> Knowledge Base
          </button>

          <button
            className={`nav-link ${activePage === 'risk-engine' ? 'active' : ''}`}
            onClick={() => navigateTo('risk-engine')}
          >
            <span>⚡</span> Risk Engine
          </button>

          <button
            className={`nav-link ${activePage === 'playbooks' ? 'active' : ''}`}
            onClick={() => navigateTo('playbooks')}
          >
            <span>⚙</span> Playbook Automation
          </button>

          <button
            className={`nav-link ${activePage === 'incidents' ? 'active' : ''}`}
            onClick={() => navigateTo('incidents')}
          >
            <span>▣</span> Incident Management
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="online-indicator"></div>
          <div>
            <strong>System Online</strong>
            <small>Monitoring Active</small>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activePage === 'dashboard' && renderDashboard()}

        {activePage === 'knowledge-base' && (
          <KnowledgeBase
            onNavigateToRiskEngine={(threat) => {
              setPreloadedThreat(threat);
              navigateTo('risk-engine');
            }}
          />
        )}

        {activePage === 'risk-engine' && (
          <RiskEngine
            preloadedThreat={preloadedThreat}
            onIncidentCreated={(newIncident) => {
              setIncidents((prev) => [newIncident, ...prev]);
              navigateTo('incidents');
            }}
          />
        )}

        {activePage === 'playbooks' && renderPlaybooks()}

        {activePage === 'events' && (
          <>
            <header className="topbar">
              <div>
                <h1>Security Events</h1>
                <p>All detected cloud security events</p>
              </div>
            </header>

            <section className="content-card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Event Type</th>
                      <th>IP Address</th>
                      <th>Source</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {events.map(event => (
                      <tr key={event.id}>
                        <td>#{event.id}</td>
                        <td>{event.eventType}</td>
                        <td>{event.ipAddress}</td>
                        <td>{event.source}</td>
                        <td>
                          <span className={`severity ${event.severity?.toLowerCase()}`}>
                            {event.severity}
                          </span>
                        </td>
                        <td>{event.status}</td>
                      </tr>
                    ))}

                    {!loading && events.length === 0 && (
                      <tr>
                        <td colSpan="6">No security events found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activePage === 'alerts' && (
          <>
            <header className="topbar">
              <div>
                <h1>Security Alerts</h1>
                <p>Threats requiring security investigation</p>
              </div>
            </header>

            <section className="content-card">
              <div className="alerts-grid">
                {alerts.map(alert => (
                  <div className="alert-card" key={alert.id}>
                    <div className="alert-heading">
                      <span className="alert-symbol">⚠</span>
                      <span className="severity high">{alert.severity}</span>
                    </div>
                    <h3>{alert.title}</h3>
                    <p>{alert.message}</p>
                    <div className="alert-footer">
                      <span>Event ID: #{alert.eventId}</span>
                      <span>{alert.status}</span>
                    </div>
                  </div>
                ))}

                {!loading && alerts.length === 0 && (
                  <p>No security alerts found.</p>
                )}
              </div>
            </section>
          </>
        )}

        {activePage === 'incidents' && (
          <>
            <header className="topbar">
              <div>
                <h1>Security Incident Management</h1>
                <p>Enterprise SOC incident response, assignment queues, and investigation tracking</p>
              </div>

              <div className="topbar-right">
                <span className="live-badge" style={{ background: '#172554', color: '#93c5fd' }}>
                  <span></span> {incidents.length} Active Tickets
                </span>
              </div>
            </header>

            <section className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Incidents</span>
                  <span className="stat-icon">▣</span>
                </div>
                <h2>{incidents.length}</h2>
                <p className="stat-description">Managed Security Tickets</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Critical Incidents</span>
                  <span className="stat-icon" style={{ color: '#ef4444' }}>🚨</span>
                </div>
                <h2>{incidents.filter(i => i.severity === 'CRITICAL').length}</h2>
                <p className="stat-description">Immediate Containment SLA</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>In Investigation</span>
                  <span className="stat-icon" style={{ color: '#f97316' }}>⚡</span>
                </div>
                <h2>{incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Mitigated').length}</h2>
                <p className="stat-description">Active SOC Triage</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Mitigated / Resolved</span>
                  <span className="stat-icon" style={{ color: '#22c55e' }}>✓</span>
                </div>
                <h2>{incidents.filter(i => i.status === 'Resolved' || i.status === 'Mitigated').length}</h2>
                <p className="stat-description">Successfully Closed</p>
              </div>
            </section>

            <section className="content-card">
              <div className="section-header">
                <div>
                  <h2>Active Incident Queue</h2>
                  <p>Security tickets converted from Risk Engine and automated threat detection</p>
                </div>
                <button
                  className="workflow-button"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => navigateTo('risk-engine')}
                >
                  + New Incident from Risk Engine
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Incident Title</th>
                      <th>Severity</th>
                      <th>Assigned SOC Queue</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold' }}>
                            {inc.id}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#ffffff' }}>{inc.title}</strong>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                            Ref: {inc.sourceEventId}
                          </div>
                        </td>
                        <td>
                          <span className={`severity ${inc.severity?.toLowerCase()}`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{inc.assignedTo}</span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 'bold',
                            color: inc.riskScore >= 75 ? '#ef4444' : inc.riskScore >= 50 ? '#f97316' : '#22c55e'
                          }}>
                            {inc.riskScore} / 100
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: inc.status === 'Resolved' || inc.status === 'Mitigated' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: inc.status === 'Resolved' || inc.status === 'Mitigated' ? '#86efac' : '#fca5a5',
                              border: `1px solid ${inc.status === 'Resolved' || inc.status === 'Mitigated' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                            }}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {inc.createdAt ? inc.createdAt.replace('T', ' ').slice(0, 19) : 'Just now'}
                        </td>
                        <td>
                          <button
                            className="event-action-btn"
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              setIncidents(prev =>
                                prev.map(item =>
                                  item.id === inc.id
                                    ? { ...item, status: item.status === 'Resolved' ? 'Active' : 'Resolved' }
                                    : item
                                )
                              );
                            }}
                          >
                            {inc.status === 'Resolved' ? 'Reopen' : 'Mark Resolved'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>SkyShield Cloud Security Monitoring System</span>
          <span>© 2026 SkyShield</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
