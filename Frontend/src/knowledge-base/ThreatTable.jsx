import React from 'react';
import SeverityBadge from './SeverityBadge';

/**
 * ThreatTable Component
 * Enterprise SOC tabular view of cybersecurity threats with sorting and quick action trigger
 */
export default function ThreatTable({ threats, onSelectThreat }) {
  if (!threats || threats.length === 0) {
    return null;
  }

  return (
    <div className="kb-table-container">
      <table className="kb-soc-table">
        <thead>
          <tr>
            <th>Threat ID</th>
            <th>Threat Name & MITRE</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Target Systems</th>
            <th>Risk Baseline</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((threat) => {
            // Calculate baseline score: (Sev * 0.4) + (Imp * 0.3) + (Lik * 0.3)
            const baselineScore = Math.round(
              threat.defaultMetrics.severity * 0.4 +
              threat.defaultMetrics.impact * 0.3 +
              threat.defaultMetrics.likelihood * 0.3
            );

            return (
              <tr key={threat.id} onClick={() => onSelectThreat(threat)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="kb-threat-id">{threat.id}</span>
                </td>
                <td>
                  <span className="kb-table-title">{threat.name}</span>
                  <span className="kb-mitre-tag" style={{ margin: 0, padding: '1px 6px', fontSize: '10px' }}>
                    {threat.mitreAttack.id} • {threat.mitreAttack.technique}
                  </span>
                </td>
                <td>
                  <span className="kb-table-category">{threat.category}</span>
                </td>
                <td>
                  <SeverityBadge severity={threat.severity} />
                </td>
                <td>
                  <div className="kb-systems-tags" style={{ maxWidth: '240px' }}>
                    {threat.affectedSystems.slice(0, 2).map((sys, idx) => (
                      <span key={idx} className="kb-system-pill" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {sys}
                      </span>
                    ))}
                    {threat.affectedSystems.length > 2 && (
                      <span className="kb-system-pill" style={{ fontSize: '10px', color: '#60a5fa' }}>
                        +{threat.affectedSystems.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '6px',
                        background: '#1e293b',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${baselineScore}%`,
                          height: '100%',
                          background:
                            baselineScore >= 75
                              ? '#ef4444'
                              : baselineScore >= 50
                              ? '#f97316'
                              : baselineScore >= 25
                              ? '#eab308'
                              : '#22c55e'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>
                      {baselineScore}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="kb-table-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectThreat(threat);
                    }}
                  >
                    View Intel ➜
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

