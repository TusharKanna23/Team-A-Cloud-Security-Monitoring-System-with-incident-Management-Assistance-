import React, { useState, useMemo } from 'react';
import securityEvents from '../data/securityEvents';
import {
  calculateRiskScore,
  getRiskClassification,
  getRiskDistribution
} from '../utils/riskCalculator';
import { analyzeSecurityEvent } from '../utils/threatMatcher';
import InteractiveRiskSimulator from '../components/riskengine/InteractiveRiskSimulator';
import RiskDistributionChart from '../components/riskengine/RiskDistributionChart';
import RiskTrendChart from '../components/riskengine/RiskTrendChart';
import EventAnalysisTable from '../components/riskengine/EventAnalysisTable';
import './RiskEngine.css';

export default function RiskEngine({ preloadedThreat, onIncidentCreated }) {
  const [events, setEvents] = useState(securityEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    severity: 'HIGH',
    assignedTo: 'SOC Tier-2 Team',
    notes: '',
    sourceEventId: ''
  });
  const [toastMessage, setToastMessage] = useState('');

  // Top summary metrics
  const stats = useMemo(() => {
    const total = events.length;
    let criticalCount = 0;
    let highCount = 0;
    let sumScore = 0;

    events.forEach((ev) => {
      const cls = getRiskClassification(ev.riskScore);
      if (cls.label === 'Critical') criticalCount++;
      if (cls.label === 'High') highCount++;
      sumScore += ev.riskScore;
    });

    const avgScore = total ? Math.round(sumScore / total) : 0;

    return {
      total,
      criticalCount,
      highCount,
      avgScore
    };
  }, [events]);

  // Risk distribution for Recharts Pie
  const distributionData = useMemo(() => {
    return getRiskDistribution(events);
  }, [events]);

  // Correlate selected event with Knowledge Base
  const correlatedAnalysis = useMemo(() => {
    if (!selectedEvent) return null;
    return analyzeSecurityEvent(selectedEvent);
  }, [selectedEvent]);

  // Trigger modal from simulation or event
  const handleOpenIncidentModal = (data) => {
    setIncidentForm({
      title: `Incident: Potential ${data.threatName || 'Security Threat'} Detected`,
      severity: data.classification?.toUpperCase() || 'HIGH',
      assignedTo: data.riskScore >= 75 ? 'SOC Emergency Response' : 'SOC Tier-2 Team',
      notes: `Automated Risk Engine Assessment:\nCalculated Score: ${data.riskScore}/100\nSeverity: ${data.severity}\nImpact: ${data.impact}\nLikelihood: ${data.likelihood}`,
      sourceEventId: data.id || 'SIMULATED-EVENT',
      riskScore: data.riskScore
    });
    setIncidentModalOpen(true);
  };

  const handleSaveIncident = (e) => {
    e.preventDefault();

    const newIncident = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: incidentForm.title,
      severity: incidentForm.severity,
      assignedTo: incidentForm.assignedTo,
      notes: incidentForm.notes,
      sourceEventId: incidentForm.sourceEventId,
      riskScore: incidentForm.riskScore || 75,
      createdAt: new Date().toISOString(),
      status: 'Open'
    };

    if (onIncidentCreated) {
      onIncidentCreated(newIncident);
    }

    setIncidentModalOpen(false);
    setSelectedEvent(null);
    setToastMessage(`Incident ${newIncident.id} successfully created and dispatched.`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  return (
    <div className="risk-engine-page">
      {/* Top Header */}
      <header className="risk-topbar">
        <div className="risk-topbar-title">
          <h1>
            <span>⚡</span> Intelligent Risk Analysis Engine
            <span className="risk-engine-badge">Weighted Scoring</span>
          </h1>
          <p>
            Autonomous threat scoring using <code>(Severity × 0.4) + (Impact × 0.3) + (Likelihood × 0.3)</code>,
            correlation with Knowledge Base intelligence, and incident triage assistance.
          </p>
        </div>
      </header>

      {/* Top Stats Cards */}
      <section className="risk-stats-grid">
        <div className="risk-stat-card events">
          <div className="risk-stat-top">
            <span className="risk-stat-label">Total Analyzed Events</span>
            <span className="risk-stat-icon">◈</span>
          </div>
          <div className="risk-stat-value">{stats.total}</div>
          <span className="risk-stat-meta">Active Monitored Streams</span>
        </div>

        <div className="risk-stat-card critical">
          <div className="risk-stat-top">
            <span className="risk-stat-label">Critical Risks (75–100)</span>
            <span className="risk-stat-icon">🚨</span>
          </div>
          <div className="risk-stat-value">{stats.criticalCount}</div>
          <span className="risk-stat-meta">Requires Urgent Containment</span>
        </div>

        <div className="risk-stat-card high">
          <div className="risk-stat-top">
            <span className="risk-stat-label">High Risks (50–74)</span>
            <span className="risk-stat-icon">⚠</span>
          </div>
          <div className="risk-stat-value">{stats.highCount}</div>
          <span className="risk-stat-meta">Active Investigation Underway</span>
        </div>

        <div className="risk-stat-card average">
          <div className="risk-stat-top">
            <span className="risk-stat-label">Average Risk Score</span>
            <span className="risk-stat-icon">⚡</span>
          </div>
          <div className="risk-stat-value">{stats.avgScore} <small style={{ fontSize: '16px', color: '#94a3b8' }}>/ 100</small></div>
          <span className="risk-stat-meta">Fleet-wide Security Index</span>
        </div>
      </section>

      {/* Interactive Risk Simulator */}
      <section>
        <InteractiveRiskSimulator
          preloadedThreat={preloadedThreat}
          onCreateIncident={handleOpenIncidentModal}
        />
      </section>

      {/* Visual Analytics Grid (Recharts) */}
      <section className="risk-charts-row">
        <RiskDistributionChart data={distributionData} />
        <RiskTrendChart events={events} />
      </section>

      {/* Real-time Security Event Correlation Table */}
      <section>
        <EventAnalysisTable
          events={events}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
          onCreateIncidentFromEvent={handleOpenIncidentModal}
        />
      </section>

      {/* Event Correlation Modal */}
      {selectedEvent && correlatedAnalysis && (
        <div className="kb-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="kb-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="kb-modal-header">
              <div>
                <div className="kb-modal-title-row">
                  <span className="kb-threat-id">{selectedEvent.id}</span>
                  <h2 className="kb-modal-title">{selectedEvent.threatName}</h2>
                  <span
                    className="risk-class-badge"
                    style={{
                      backgroundColor: correlatedAnalysis.riskClassification.bgColor,
                      color: correlatedAnalysis.riskClassification.color,
                      border: `1px solid ${correlatedAnalysis.riskClassification.borderColor}`
                    }}
                  >
                    {correlatedAnalysis.riskClassification.label} Risk ({correlatedAnalysis.riskScore}/100)
                  </span>
                </div>
                <div className="kb-modal-category">
                  <span>Target: {selectedEvent.targetResource}</span>
                  <span>•</span>
                  <span>Source IP: {selectedEvent.sourceIp}</span>
                  <span>•</span>
                  <span>{selectedEvent.cloudProvider}</span>
                </div>
              </div>

              <button className="kb-modal-close-btn" onClick={() => setSelectedEvent(null)}>
                ✕
              </button>
            </div>

            <div className="kb-modal-body">
              {/* Event Log Snippet */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>📋</span> Raw Security Audit Log
                </h3>
                <div className="kb-ioc-container">
                  <code style={{ color: '#38bdf8', fontSize: '12px' }}>{selectedEvent.rawLog}</code>
                </div>
              </div>

              {/* Correlated Knowledge Base Threat Info */}
              {correlatedAnalysis.matchedThreat && (
                <>
                  <div className="kb-section">
                    <h3 className="kb-section-title">
                      <span>📚</span> Correlated Knowledge Base Intelligence
                    </h3>
                    <p className="kb-section-text">{correlatedAnalysis.matchedThreat.description}</p>
                    <div className="kb-intel-grid" style={{ marginTop: '10px' }}>
                      <div className="kb-intel-item">
                        <span>MITRE ATT&amp;CK</span>
                        <strong>{correlatedAnalysis.matchedThreat.mitreAttack.id} ({correlatedAnalysis.matchedThreat.mitreAttack.technique})</strong>
                      </div>
                      <div className="kb-intel-item">
                        <span>Threat Category</span>
                        <strong>{correlatedAnalysis.matchedThreat.category}</strong>
                      </div>
                      <div className="kb-intel-item">
                        <span>Response SLA</span>
                        <strong style={{ color: correlatedAnalysis.riskClassification.color }}>
                          {correlatedAnalysis.riskClassification.sla}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="kb-section">
                    <h3 className="kb-section-title">
                      <span>🛡</span> Recommended Mitigation Playbook
                    </h3>
                    <div className="kb-numbered-steps">
                      {correlatedAnalysis.matchedThreat.mitigationSteps.map((step, idx) => (
                        <div key={idx} className="kb-step-item">
                          <div className="kb-step-num">{idx + 1}</div>
                          <div className="kb-step-desc">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="kb-modal-footer">
              <button className="kb-modal-btn secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
              <button
                className="kb-modal-btn primary"
                onClick={() => {
                  handleOpenIncidentModal({
                    id: selectedEvent.id,
                    threatName: selectedEvent.threatName,
                    threatId: selectedEvent.threatId,
                    severity: selectedEvent.metrics.severity,
                    impact: selectedEvent.metrics.impact,
                    likelihood: selectedEvent.metrics.likelihood,
                    riskScore: selectedEvent.riskScore,
                    classification: correlatedAnalysis.riskClassification.label
                  });
                }}
              >
                <span>🚨</span> Create Incident Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Creation Modal */}
      {incidentModalOpen && (
        <div className="kb-modal-backdrop" onClick={() => setIncidentModalOpen(false)}>
          <div
            className="kb-modal-content"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kb-modal-header">
              <div>
                <h2 className="kb-modal-title">Create Security Incident</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
                  Dispatch security alert to the SOC incident response tracking pipeline.
                </p>
              </div>
              <button className="kb-modal-close-btn" onClick={() => setIncidentModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident}>
              <div className="kb-modal-body" style={{ gap: '16px' }}>
                <div className="slider-group">
                  <label className="slider-title">Incident Title</label>
                  <input
                    type="text"
                    required
                    value={incidentForm.title}
                    onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                    className="kb-search-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="slider-group">
                    <label className="slider-title">Severity Tier</label>
                    <select
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                      className="kb-category-select"
                      style={{ width: '100%', minWidth: 'auto' }}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="slider-group">
                    <label className="slider-title">Assigned SOC Queue</label>
                    <select
                      value={incidentForm.assignedTo}
                      onChange={(e) => setIncidentForm({ ...incidentForm, assignedTo: e.target.value })}
                      className="kb-category-select"
                      style={{ width: '100%', minWidth: 'auto' }}
                    >
                      <option value="SOC Emergency Response">SOC Emergency Response</option>
                      <option value="SOC Tier-2 Team">SOC Tier-2 Team</option>
                      <option value="Cloud SecOps Team">Cloud SecOps Team</option>
                      <option value="Database Engineering">Database Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="slider-group">
                  <label className="slider-title">Investigation &amp; Triage Notes</label>
                  <textarea
                    rows={4}
                    value={incidentForm.notes}
                    onChange={(e) => setIncidentForm({ ...incidentForm, notes: e.target.value })}
                    className="kb-search-input"
                    style={{ paddingLeft: '14px', fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="kb-modal-footer">
                <button
                  type="button"
                  className="kb-modal-btn secondary"
                  onClick={() => setIncidentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="kb-modal-btn primary">
                  <span>✓</span> Dispatch Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="incident-success-toast">
          <span style={{ fontSize: '20px' }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
