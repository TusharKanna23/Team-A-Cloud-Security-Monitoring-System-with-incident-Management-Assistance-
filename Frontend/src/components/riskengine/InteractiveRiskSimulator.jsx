import React, { useState, useEffect } from 'react';
import threats from '../../data/threats';
import {
  calculateRiskScore,
  getRiskClassification,
  generateMitigationRecommendation,
  RISK_WEIGHTS
} from '../../utils/riskCalculator';
import RiskGauge from './RiskGauge';

export default function InteractiveRiskSimulator({ preloadedThreat, onCreateIncident }) {
  const [selectedThreatId, setSelectedThreatId] = useState(preloadedThreat?.id || '');
  const [threatName, setThreatName] = useState(preloadedThreat?.name || 'Custom Security Simulation');
  const [severity, setSeverity] = useState(preloadedThreat?.defaultMetrics?.severity ?? 75);
  const [impact, setImpact] = useState(preloadedThreat?.defaultMetrics?.impact ?? 70);
  const [likelihood, setLikelihood] = useState(preloadedThreat?.defaultMetrics?.likelihood ?? 65);

  // Sync when preloadedThreat prop updates (e.g., from Knowledge Base navigation)
  useEffect(() => {
    if (preloadedThreat) {
      setSelectedThreatId(preloadedThreat.id);
      setThreatName(preloadedThreat.name);
      setSeverity(preloadedThreat.defaultMetrics.severity);
      setImpact(preloadedThreat.defaultMetrics.impact);
      setLikelihood(preloadedThreat.defaultMetrics.likelihood);
    }
  }, [preloadedThreat]);

  // Handle preset dropdown selection
  const handleSelectPreset = (e) => {
    const threatId = e.target.value;
    setSelectedThreatId(threatId);
    if (!threatId) {
      setThreatName('Custom Security Simulation');
      return;
    }
    const found = threats.find(t => t.id === threatId);
    if (found) {
      setThreatName(found.name);
      setSeverity(found.defaultMetrics.severity);
      setImpact(found.defaultMetrics.impact);
      setLikelihood(found.defaultMetrics.likelihood);
    }
  };

  // Perform real-time calculation
  const calculatedScore = calculateRiskScore(severity, impact, likelihood);
  const classification = getRiskClassification(calculatedScore);
  const mitigationAdvice = generateMitigationRecommendation(calculatedScore, threatName);

  // Formula terms
  const sevContrib = (severity * RISK_WEIGHTS.severity).toFixed(1);
  const impContrib = (impact * RISK_WEIGHTS.impact).toFixed(1);
  const likContrib = (likelihood * RISK_WEIGHTS.likelihood).toFixed(1);

  return (
    <div className="risk-simulator-card">
      <div className="simulator-header">
        <div>
          <h2>
            <span>⚡</span> Intelligent Risk Analysis Engine
          </h2>
          <p>
            Dynamically evaluate threat severity, asset impact, and exploit likelihood using the weighted algorithm.
          </p>
        </div>

        <div className="simulator-preset-selector">
          <label htmlFor="threat-preset">Load Threat Baseline:</label>
          <select
            id="threat-preset"
            value={selectedThreatId}
            onChange={handleSelectPreset}
            className="simulator-dropdown"
          >
            <option value="">-- Custom Simulation --</option>
            {threats.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="simulator-layout">
        {/* Sliders Column */}
        <div className="simulator-sliders-col">
          {/* Severity Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-title">
                Severity Score <small>(Weight: 40%)</small>
              </span>
              <div className="slider-val-box">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="slider-num-input"
                />
                <span className="unit">/ 100</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="soc-range-slider red"
            />
            <div className="slider-hints">
              <span>0 (Negligible)</span>
              <span>50 (Moderate)</span>
              <span>100 (Catastrophic)</span>
            </div>
          </div>

          {/* Impact Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-title">
                Asset &amp; Business Impact <small>(Weight: 30%)</small>
              </span>
              <div className="slider-val-box">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  className="slider-num-input"
                />
                <span className="unit">/ 100</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              className="soc-range-slider orange"
            />
            <div className="slider-hints">
              <span>0 (Isolated)</span>
              <span>50 (Internal Service)</span>
              <span>100 (Core Infrastructure)</span>
            </div>
          </div>

          {/* Likelihood Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span className="slider-title">
                Exploit Likelihood <small>(Weight: 30%)</small>
              </span>
              <div className="slider-val-box">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value))}
                  className="slider-num-input"
                />
                <span className="unit">/ 100</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={likelihood}
              onChange={(e) => setLikelihood(Number(e.target.value))}
              className="soc-range-slider yellow"
            />
            <div className="slider-hints">
              <span>0 (Theoretical)</span>
              <span>50 (Known PoC)</span>
              <span>100 (Actively Exploited)</span>
            </div>
          </div>

          {/* Mathematical Proof Card */}
          <div className="formula-math-card">
            <span className="formula-label">Algorithm Calculation Breakdown:</span>
            <div className="formula-math-display">
              <code>
                Score = ({severity} × 0.4) + ({impact} × 0.3) + ({likelihood} × 0.3)
              </code>
              <code className="formula-result">
                = {sevContrib} + {impContrib} + {likContrib} = <strong>{calculatedScore}</strong>
              </code>
            </div>
          </div>
        </div>

        {/* Gauge & Assessment Column */}
        <div className="simulator-result-col">
          <RiskGauge score={calculatedScore} label={threatName} size={220} />

          <div
            className="sim-assessment-box"
            style={{
              backgroundColor: classification.bgColor,
              borderColor: classification.borderColor
            }}
          >
            <div className="sim-assessment-header">
              <span style={{ color: classification.color, fontWeight: '700' }}>
                {classification.label} Risk Priority
              </span>
              <span className="sim-sla-badge">SLA: {classification.sla}</span>
            </div>
            <p className="sim-advice-text">{mitigationAdvice}</p>
          </div>

          <button
            className="sim-create-incident-btn"
            onClick={() => {
              onCreateIncident({
                threatName,
                threatId: selectedThreatId,
                severity,
                impact,
                likelihood,
                riskScore: calculatedScore,
                classification: classification.label
              });
            }}
          >
            <span>🚨</span> Convert to Security Incident
          </button>
        </div>
      </div>
    </div>
  );
}
