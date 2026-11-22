import React, { useState } from 'react';
import { getRiskClassification } from '../../utils/riskCalculator';

export default function EventAnalysisTable({
  events = [],
  onSelectEvent,
  onCreateIncidentFromEvent
}) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = events.filter((ev) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ev.id.toLowerCase().includes(query) ||
      ev.threatName.toLowerCase().includes(query) ||
      ev.sourceIp.toLowerCase().includes(query) ||
      ev.targetResource.toLowerCase().includes(query);

    const classification = getRiskClassification(ev.riskScore);
    const matchesLevel = levelFilter === 'ALL' || classification.label.toUpperCase() === levelFilter;

    const matchesStatus = statusFilter === 'ALL' || ev.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  return (
    <div className="event-analysis-container">
      <div className="event-analysis-header">
        <div>
          <h3>Real-Time Security Event Correlation</h3>
          <p>Continuous threat detection correlated with Knowledge Base mitigations and risk scores</p>
        </div>

        <div className="event-filters-row">
          <div className="event-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search event ID, threat, IP, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="event-search-input"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="event-select-filter"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="event-select-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="event-table-scroll">
        <table className="soc-event-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Detected Threat &amp; Vector</th>
              <th>Target Asset</th>
              <th>Source IP</th>
              <th>Metrics (S / I / L)</th>
              <th>Risk Score</th>
              <th>Classification</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev) => {
              const classification = getRiskClassification(ev.riskScore);
              return (
                <tr key={ev.id} onClick={() => onSelectEvent(ev)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="event-id-tag">{ev.id}</span>
                    <small className="event-time-sub">{ev.timestamp.split(' ')[1]}</small>
                  </td>
                  <td>
                    <div className="event-threat-name">{ev.threatName}</div>
                    <span className="event-threat-id">{ev.threatId}</span>
                  </td>
                  <td>
                    <div className="event-resource-tag">☁ {ev.targetResource}</div>
                    <small style={{ color: '#64748b', fontSize: '10px' }}>{ev.cloudProvider}</small>
                  </td>
                  <td>
                    <code className="event-ip-code">{ev.sourceIp}</code>
                  </td>
                  <td>
                    <div className="metrics-triad">
                      <span title="Severity (Weight 40%)">S:{ev.metrics?.severity ?? 0}</span>
                      <span title="Impact (Weight 30%)">I:{ev.metrics?.impact ?? 0}</span>
                      <span title="Likelihood (Weight 30%)">L:{ev.metrics?.likelihood ?? 0}</span>
                    </div>
                  </td>
                  <td>
                    <div className="score-meter-cell">
                      <div className="score-bar-bg">
                        <div
                          className="score-bar-fill"
                          style={{
                            width: `${ev.riskScore}%`,
                            backgroundColor: classification.color
                          }}
                        />
                      </div>
                      <strong style={{ color: classification.color, fontSize: '13px' }}>
                        {ev.riskScore}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span
                      className="risk-class-badge"
                      style={{
                        backgroundColor: classification.bgColor,
                        color: classification.color,
                        border: `1px solid ${classification.borderColor}`
                      }}
                    >
                      {classification.label}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${ev.status.toLowerCase()}`}>{ev.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        className="event-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                      >
                        Correlate ➜
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No security events found matching the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
