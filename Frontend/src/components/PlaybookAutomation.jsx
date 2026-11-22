
import { useCallback, useEffect, useMemo, useState } from 'react';
import './PlaybookAutomation.css';

const API = 'http://localhost:8080/api';

const playbooks = [
  {
    id: 1,
    name: 'Failed Login Detection',
    type: 'FAILED_LOGIN',
    severity: 'HIGH',
    icon: '🔐',
    description: 'Detects repeated failed login attempts from suspicious IP addresses.',
    trigger: 'Multiple failed login attempts',
    actions: [
      'Detect failed login activity',
      'Identify suspicious IP address',
      'Generate security alert',
      'Record administrator notification',
      'Create security incident'
    ]
  },
  {
    id: 2,
    name: 'Unauthorized Access Detection',
    type: 'UNAUTHORIZED_ACCESS',
    severity: 'CRITICAL',
    icon: '🚨',
    description: 'Identifies unauthorized access attempts to protected resources.',
    trigger: 'Unauthorized access detected',
    actions: [
      'Identify affected resource',
      'Record access attempt',
      'Generate critical security alert',
      'Create investigation incident'
    ]
  },
  {
    id: 3,
    name: 'Suspicious Data Access',
    type: 'SUSPICIOUS_DATA_ACCESS',
    severity: 'HIGH',
    icon: '🗄️',
    description: 'Monitors unusual access to sensitive cloud data.',
    trigger: 'Unusual data access activity',
    actions: [
      'Identify affected user',
      'Record accessed resource',
      'Generate security alert',
      'Notify administrator'
    ]
  },
  {
    id: 4,
    name: 'Suspicious Network Activity',
    type: 'SUSPICIOUS_NETWORK',
    severity: 'HIGH',
    icon: '🌐',
    description: 'Detects unusual network activity and suspicious IP addresses.',
    trigger: 'Suspicious network traffic',
    actions: [
      'Identify source IP address',
      'Record network activity',
      'Generate security alert',
      'Create security incident'
    ]
  },
  {
    id: 5,
    name: 'Cloud Misconfiguration',
    type: 'CLOUD_MISCONFIGURATION',
    severity: 'CRITICAL',
    icon: '☁️',
    description: 'Identifies potentially unsafe cloud resource configurations.',
    trigger: 'Insecure cloud configuration detected',
    actions: [
      'Identify affected cloud resource',
      'Record configuration issue',
      'Generate critical alert',
      'Create remediation task'
    ]
  }
];

function PlaybookAutomation() {
  const [events, setEvents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [eventResponse, executionResponse] = await Promise.all([
        fetch(`${API}/events`),
        fetch(`${API}/playbooks`)
      ]);

      if (!eventResponse.ok || !executionResponse.ok) {
        throw new Error('Unable to load playbook data.');
      }

      const eventData = await eventResponse.json();
      const executionData = await executionResponse.json();

      setEvents(Array.isArray(eventData) ? eventData : []);
      setExecutions(
        Array.isArray(executionData) ? executionData : []
      );

      setSelectedEventId(previous => {
        if (previous && eventData.some(
          event => String(event.id) === String(previous)
        )) {
          return previous;
        }

        return eventData.length ? String(eventData[0].id) : '';
      });
    } catch (err) {
      setError(err.message || 'Backend connection failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(playbook => {
      const matchesSearch =
        playbook.name.toLowerCase().includes(search.toLowerCase()) ||
        playbook.type.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === 'ALL' ||
        playbook.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter]);

  const successfulExecutions = executions.filter(
    item => item.status?.toUpperCase() === 'SUCCESS'
  ).length;

  const selectedEvent = events.find(
    event => String(event.id) === String(selectedEventId)
  );

  const executePlaybook = async () => {
    if (!selectedPlaybook) {
      setError('Please select a playbook.');
      return;
    }

    if (!selectedEventId) {
      setError('Please select a security event first.');
      return;
    }

    setExecuting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API}/playbooks/execute/${selectedEventId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Playbook execution failed. Check the backend.');
      }

      const result = await response.json();

      setMessage(
        `Playbook executed successfully for Event #${selectedEventId}.`
      );

      await fetchData();

      // Show the backend response in the browser console for debugging.
      console.log('Playbook execution result:', result);
    } catch (err) {
      setError(err.message || 'Unable to execute playbook.');
    } finally {
      setExecuting(false);
    }
  };

  const formatDate = value => {
    if (!value) return 'Not available';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  return (
    <div className="playbook-page">

      {/* HEADER */}
      <div className="playbook-header">
        <div>
          <span className="page-eyebrow">SECURITY OPERATIONS</span>
          <h1>Playbook Automation</h1>
          <p>
            Automate security response workflows and investigate
            suspicious cloud activity.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchData}
          disabled={loading || executing}
        >
          ↻ Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {message && (
        <div className="playbook-message success-message">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="playbook-message error-message">
          <span>!</span>
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="playbook-stats">
        <div className="playbook-stat">
          <div className="stat-icon-box">⚙</div>
          <div>
            <span>Total Playbooks</span>
            <h2>{playbooks.length}</h2>
            <small>Configured workflows</small>
          </div>
        </div>

        <div className="playbook-stat">
          <div className="stat-icon-box blue">▶</div>
          <div>
            <span>Total Executions</span>
            <h2>{executions.length}</h2>
            <small>Recorded in PostgreSQL</small>
          </div>
        </div>

        <div className="playbook-stat">
          <div className="stat-icon-box green">✓</div>
          <div>
            <span>Successful Executions</span>
            <h2>{successfulExecutions}</h2>
            <small>Successfully completed</small>
          </div>
        </div>

        <div className="playbook-stat">
          <div className="stat-icon-box orange">!</div>
          <div>
            <span>Security Events</span>
            <h2>{events.length}</h2>
            <small>Available for investigation</small>
          </div>
        </div>
      </div>

      {/* AVAILABLE PLAYBOOKS */}
      <section className="playbook-section">
        <div className="section-heading">
          <div>
            <h2>Available Security Playbooks</h2>
            <p>Select a workflow to view its response configuration.</p>
          </div>
          <span className="section-count">
            {filteredPlaybooks.length} Workflows
          </span>
        </div>

        <div className="playbook-filters">
          <input
            type="text"
            placeholder="Search playbooks..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          <select
            value={severityFilter}
            onChange={event => setSeverityFilter(event.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="playbook-grid">
          {filteredPlaybooks.map(playbook => (
            <article
              className={`playbook-card ${
                selectedPlaybook?.id === playbook.id ? 'selected-card' : ''
              }`}
              key={playbook.id}
            >
              <div className="playbook-card-top">
                <span className="playbook-icon">{playbook.icon}</span>
                <span className={`severity ${playbook.severity.toLowerCase()}`}>
                  {playbook.severity}
                </span>
              </div>

              <h3>{playbook.name}</h3>
              <p>{playbook.description}</p>

              <div className="playbook-type">
                <span>EVENT TYPE</span>
                <strong>{playbook.type}</strong>
              </div>

              <button
                className="view-playbook-btn"
                onClick={() => {
                  setSelectedPlaybook(playbook);
                  setMessage('');
                  setError('');
                }}
              >
                View Workflow →
              </button>
            </article>
          ))}
        </div>

        {filteredPlaybooks.length === 0 && (
          <div className="empty-playbooks">
            No matching playbooks found.
          </div>
        )}
      </section>

      {/* PLAYBOOK DETAILS AND EXECUTION */}
      {selectedPlaybook && (
        <section className="playbook-details">
          <div className="details-header">
            <div className="details-title">
              <span className="details-icon">
                {selectedPlaybook.icon}
              </span>
              <div>
                <span className="page-eyebrow">WORKFLOW CONFIGURATION</span>
                <h2>{selectedPlaybook.name}</h2>
                <p>{selectedPlaybook.description}</p>
              </div>
            </div>

            <button
              className="close-btn"
              onClick={() => setSelectedPlaybook(null)}
              aria-label="Close playbook details"
            >
              ✕
            </button>
          </div>

          <div className="details-info">
            <div>
              <span>Event Type</span>
              <strong>{selectedPlaybook.type}</strong>
            </div>

            <div>
              <span>Severity</span>
              <strong>{selectedPlaybook.severity}</strong>
            </div>

            <div>
              <span>Trigger Condition</span>
              <strong>{selectedPlaybook.trigger}</strong>
            </div>
          </div>

          <div className="workflow-content">
            <div className="workflow-actions">
              <h3>Automated Response Workflow</h3>
              <p>Actions defined for this security playbook.</p>

              <ol className="action-list">
                {selectedPlaybook.actions.map((action, index) => (
                  <li key={index}>
                    <span className="action-number">{index + 1}</span>
                    <div>
                      <strong>{action}</strong>
                      <small>Response step {index + 1}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="execution-panel">
              <div className="execution-panel-icon">▶</div>
              <h3>Execute Playbook</h3>
              <p>
                Select a security event to run the backend response
                workflow.
              </p>

              <label htmlFor="event-select">Select Security Event</label>

              <select
                id="event-select"
                value={selectedEventId}
                onChange={event => {
                  setSelectedEventId(event.target.value);
                  setMessage('');
                  setError('');
                }}
                disabled={loading || events.length === 0}
              >
                <option value="">Choose an event</option>

                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    Event #{event.id} - {event.eventType} - {event.ipAddress}
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <div className="selected-event">
                  <span>Selected event</span>
                  <strong>#{selectedEvent.id} · {selectedEvent.eventType}</strong>
                  <small>IP: {selectedEvent.ipAddress}</small>
                  <small>Severity: {selectedEvent.severity}</small>
                </div>
              )}

              <button
                className="execute-btn"
                onClick={executePlaybook}
                disabled={
                  executing ||
                  loading ||
                  !selectedEventId
                }
              >
                {executing ? 'Executing...' : '▶ Execute Playbook'}
              </button>

              <small className="execution-note">
                Execution is recorded by the Spring Boot backend.
              </small>
            </div>
          </div>
        </section>
      )}

      {/* EXECUTION HISTORY */}
      <section className="playbook-section execution-history">
        <div className="section-heading">
          <div>
            <h2>Execution History</h2>
            <p>Previously executed security response workflows.</p>
          </div>
          <span className="section-count">
            {executions.length} Executions
          </span>
        </div>

        {loading ? (
          <p className="table-message">Loading execution history...</p>
        ) : executions.length === 0 ? (
          <div className="empty-playbooks">
            No playbook executions recorded yet.
          </div>
        ) : (
          <div className="execution-table-container">
            <table className="execution-table">
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Event ID</th>
                  <th>Event Type</th>
                  <th>Actions Performed</th>
                  <th>Executed At</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {[...executions].reverse().map(execution => (
                  <tr key={execution.id}>
                    <td>#{execution.id}</td>
                    <td>#{execution.eventId}</td>
                    <td>{execution.eventType}</td>
                    <td className="actions-cell">
                      {execution.actions || 'No action details available'}
                    </td>
                    <td>{formatDate(execution.executedAt)}</td>
                    <td>
                      <span
                        className={`execution-status ${
                          execution.status?.toLowerCase() || 'unknown'
                        }`}
                      >
                        {execution.status || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="playbook-footer">
        SkyShield Security Automation · Backend API Integration
      </div>
    </div>
  );
}

export default PlaybookAutomation;
