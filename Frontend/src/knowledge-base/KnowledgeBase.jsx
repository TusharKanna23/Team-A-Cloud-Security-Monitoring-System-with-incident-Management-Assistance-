import React, { useState, useMemo } from 'react';
import threats, { THREAT_CATEGORIES, SEVERITY_LEVELS } from '../data/threats';
import SeverityBadge from './SeverityBadge';
import ThreatTable from './ThreatTable';
import './KnowledgeBase.css';

/**
 * KnowledgeBase Page Component
 * Central cybersecurity repository providing threat intelligence, IOCs,
 * impact analysis, and mitigation playbooks for the SkyShield platform.
 */
export default function KnowledgeBase({ onNavigateToRiskEngine }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [activeThreat, setActiveThreat] = useState(null);
  const [copiedIocIndex, setCopiedIocIndex] = useState(null);

  // Compute stats across all threats
  const stats = useMemo(() => {
    return {
      total: threats.length,
      critical: threats.filter((t) => t.severity.toUpperCase() === 'CRITICAL').length,
      high: threats.filter((t) => t.severity.toUpperCase() === 'HIGH').length,
      medium: threats.filter((t) => t.severity.toUpperCase() === 'MEDIUM').length,
      low: threats.filter((t) => t.severity.toUpperCase() === 'LOW').length,
    };
  }, []);

  // Filtered threats based on search, category, and severity
  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        threat.name.toLowerCase().includes(query) ||
        threat.category.toLowerCase().includes(query) ||
        threat.id.toLowerCase().includes(query) ||
        threat.description.toLowerCase().includes(query) ||
        threat.mitreAttack.id.toLowerCase().includes(query) ||
        threat.mitreAttack.technique.toLowerCase().includes(query) ||
        threat.affectedSystems.some((sys) => sys.toLowerCase().includes(query)) ||
        threat.indicatorsOfCompromise.some((ioc) => ioc.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'All Categories' || threat.category === selectedCategory;

      const matchesSeverity =
        selectedSeverity === 'All Severities' ||
        threat.severity.toUpperCase() === selectedSeverity.toUpperCase();

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [searchQuery, selectedCategory, selectedSeverity]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedSeverity('All Severities');
  };

  const handleCopyIoc = (ioc, index) => {
    navigator.clipboard.writeText(ioc);
    setCopiedIocIndex(index);
    setTimeout(() => setCopiedIocIndex(null), 2000);
  };

  return (
    <div className="kb-container">
      {/* Page Header */}
      <header className="kb-header">
        <div className="kb-header-title">
          <h1>
            <span>🛡</span> Threat Knowledge Base
            <span className="kb-header-badge">SOC Intelligence</span>
          </h1>
          <p>
            Standardized catalog of cloud cybersecurity threats, MITRE ATT&amp;CK mappings,
            Indicators of Compromise (IOCs), and enterprise mitigation playbooks.
          </p>
        </div>

        <div className="kb-header-actions">
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
            >
              <span>▦</span> Cards
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Data Table View"
            >
              <span>☰</span> Table
            </button>
          </div>
        </div>
      </header>

      {/* Threat Statistics Cards */}
      <section className="kb-stats-grid">
        <div className="kb-stat-card total">
          <div className="kb-stat-top">
            <span className="kb-stat-label">Total Threats</span>
            <span className="kb-stat-icon">📚</span>
          </div>
          <div className="kb-stat-value">{stats.total}</div>
          <span className="kb-stat-meta">Active Catalog Entries</span>
        </div>

        <div className="kb-stat-card critical">
          <div className="kb-stat-top">
            <span className="kb-stat-label">Critical Severity</span>
            <span className="kb-stat-icon">🚨</span>
          </div>
          <div className="kb-stat-value">{stats.critical}</div>
          <span className="kb-stat-meta">Immediate Risk Impact</span>
        </div>

        <div className="kb-stat-card high">
          <div className="kb-stat-top">
            <span className="kb-stat-label">High Severity</span>
            <span className="kb-stat-icon">⚠</span>
          </div>
          <div className="kb-stat-value">{stats.high}</div>
          <span className="kb-stat-meta">Elevated Defense Priority</span>
        </div>

        <div className="kb-stat-card medium">
          <div className="kb-stat-top">
            <span className="kb-stat-label">Medium Severity</span>
            <span className="kb-stat-icon">⚡</span>
          </div>
          <div className="kb-stat-value">{stats.medium}</div>
          <span className="kb-stat-meta">Monitored Vectors</span>
        </div>

        <div className="kb-stat-card low">
          <div className="kb-stat-top">
            <span className="kb-stat-label">Low Severity</span>
            <span className="kb-stat-icon">✓</span>
          </div>
          <div className="kb-stat-value">{stats.low}</div>
          <span className="kb-stat-meta">Routine Audits</span>
        </div>
      </section>

      {/* Search and Filters Bar */}
      <section className="kb-controls-bar">
        <div className="kb-search-row">
          <div className="kb-search-box">
            <span className="kb-search-icon">🔍</span>
            <input
              type="text"
              className="kb-search-input"
              placeholder="Search by threat name, category, IOCs, affected systems, or MITRE ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="kb-clear-search" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <select
            className="kb-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {THREAT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="kb-severity-filters">
          <span className="kb-severity-label">Severity:</span>
          {SEVERITY_LEVELS.map((sev) => {
            const isSelected = selectedSeverity === sev;
            const sevKey = sev.toLowerCase().replace(' ', '-');
            return (
              <button
                key={sev}
                className={`kb-severity-pill ${isSelected ? `active ${sevKey}` : ''}`}
                onClick={() => setSelectedSeverity(sev)}
              >
                {sev}
              </button>
            );
          })}

          <div className="kb-results-count">
            Showing <strong>{filteredThreats.length}</strong> of {threats.length} threats
          </div>
        </div>
      </section>

      {/* Main Content: Cards View OR Table View */}
      {filteredThreats.length === 0 ? (
        <div className="kb-empty-state">
          <div className="kb-empty-icon">🔎</div>
          <h3>No threats found matching your query</h3>
          <p>
            Try adjusting your search keywords, clearing your severity filters, or choosing a different category.
          </p>
          <button className="kb-reset-btn" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <section className="kb-threat-grid">
          {filteredThreats.map((threat) => (
            <div
              key={threat.id}
              className="kb-threat-card"
              onClick={() => setActiveThreat(threat)}
            >
              <div className="kb-card-header">
                <span className="kb-threat-id">{threat.id}</span>
                <SeverityBadge severity={threat.severity} />
              </div>

              <h2 className="kb-threat-title">{threat.name}</h2>

              <div className="kb-threat-category">
                <span>📁</span>
                <span>{threat.category}</span>
              </div>

              <div className="kb-mitre-tag">
                <span>🎯</span>
                <span>
                  {threat.mitreAttack.id}: {threat.mitreAttack.technique}
                </span>
              </div>

              <p className="kb-threat-desc">{threat.description}</p>

              <div className="kb-card-systems">
                <span className="kb-card-systems-label">Target Infrastructure:</span>
                <div className="kb-systems-tags">
                  {threat.affectedSystems.slice(0, 3).map((sys, idx) => (
                    <span key={idx} className="kb-system-pill">
                      {sys}
                    </span>
                  ))}
                  {threat.affectedSystems.length > 3 && (
                    <span className="kb-system-pill" style={{ color: '#60a5fa' }}>
                      +{threat.affectedSystems.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="kb-card-footer">
                <button
                  className="kb-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveThreat(threat);
                  }}
                >
                  View Threat Intelligence ➜
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <ThreatTable threats={filteredThreats} onSelectThreat={setActiveThreat} />
      )}

      {/* Detailed Threat Intel Modal */}
      {activeThreat && (
        <div className="kb-modal-backdrop" onClick={() => setActiveThreat(null)}>
          <div className="kb-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="kb-modal-header">
              <div>
                <div className="kb-modal-title-row">
                  <span className="kb-threat-id">{activeThreat.id}</span>
                  <h2 className="kb-modal-title">{activeThreat.name}</h2>
                  <SeverityBadge severity={activeThreat.severity} />
                </div>
                <div className="kb-modal-category">
                  <span>📁 {activeThreat.category}</span>
                  <span>•</span>
                  <span>MITRE ATT&amp;CK {activeThreat.mitreAttack.id}</span>
                </div>
              </div>

              <button
                className="kb-modal-close-btn"
                onClick={() => setActiveThreat(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="kb-modal-body">
              {/* Technical Description */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>📖</span> Technical Description
                </h3>
                <p className="kb-section-text">{activeThreat.description}</p>
              </div>

              {/* Threat Intelligence Metrics */}
              <div className="kb-intel-grid">
                <div className="kb-intel-item">
                  <span>MITRE ATT&amp;CK ID</span>
                  <strong>{activeThreat.mitreAttack.id}</strong>
                </div>
                <div className="kb-intel-item">
                  <span>MITRE Tactic</span>
                  <strong>{activeThreat.mitreAttack.tactic}</strong>
                </div>
                <div className="kb-intel-item">
                  <span>Baseline Risk Score</span>
                  <strong style={{ color: '#60a5fa' }}>
                    {Math.round(
                      activeThreat.defaultMetrics.severity * 0.4 +
                      activeThreat.defaultMetrics.impact * 0.3 +
                      activeThreat.defaultMetrics.likelihood * 0.3
                    )} / 100
                  </strong>
                </div>
              </div>

              {/* Indicators of Compromise (IOCs) */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>🎯</span> Indicators of Compromise (IOCs)
                </h3>
                <div className="kb-ioc-container">
                  {activeThreat.indicatorsOfCompromise.map((ioc, idx) => (
                    <div key={idx} className="kb-ioc-item">
                      <span className="kb-ioc-bullet">▶</span>
                      <span style={{ flex: 1 }}>{ioc}</span>
                      <button
                        onClick={() => handleCopyIoc(ioc, idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedIocIndex === idx ? '#4ade80' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'sans-serif'
                        }}
                        title="Copy IOC to clipboard"
                      >
                        {copiedIocIndex === idx ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Systems */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>🖥</span> Affected Infrastructure &amp; Assets
                </h3>
                <div className="kb-systems-tags">
                  {activeThreat.affectedSystems.map((sys, idx) => (
                    <span
                      key={idx}
                      className="kb-system-pill"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      ☁ {sys}
                    </span>
                  ))}
                </div>
              </div>

              {/* Potential Impact */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>⚠</span> Potential Business &amp; Technical Impact
                </h3>
                <div className="kb-impact-card">
                  {activeThreat.potentialImpact}
                </div>
              </div>

              {/* Mitigation & Prevention Recommendations */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>🛡</span> Mitigation &amp; Prevention Playbook
                </h3>
                <div className="kb-numbered-steps">
                  {activeThreat.mitigationSteps.map((step, idx) => (
                    <div key={idx} className="kb-step-item">
                      <div className="kb-step-num">{idx + 1}</div>
                      <div className="kb-step-desc">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Security Actions (Immediate SOC Triage) */}
              <div className="kb-section">
                <h3 className="kb-section-title">
                  <span>⚡</span> Immediate SOC Triage Actions
                </h3>
                <div className="kb-numbered-steps">
                  {activeThreat.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="kb-step-item"
                      style={{ borderLeft: '3px solid #3b82f6' }}
                    >
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>✓</span>
                      <div className="kb-step-desc">{action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="kb-modal-footer">
              <button
                className="kb-modal-btn secondary"
                onClick={() => setActiveThreat(null)}
              >
                Close Intel View
              </button>

              {onNavigateToRiskEngine && (
                <button
                  className="kb-modal-btn primary"
                  onClick={() => {
                    const threatToSimulate = activeThreat;
                    setActiveThreat(null);
                    onNavigateToRiskEngine(threatToSimulate);
                  }}
                >
                  <span>⚡</span> Analyze in Risk Engine
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

