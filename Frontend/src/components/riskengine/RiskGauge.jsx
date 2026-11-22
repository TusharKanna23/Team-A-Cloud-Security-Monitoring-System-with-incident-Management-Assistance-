import React from 'react';
import { getRiskClassification } from '../../utils/riskCalculator';

/**
 * RiskGauge Component
 * Circular SVG semi-radial gauge displaying the weighted risk score (0-100)
 * with color transitions, classification badge, and SLA countdown.
 */
export default function RiskGauge({ score = 0, label = "Calculated Risk Score", size = 200 }) {
  const classification = getRiskClassification(score);

  // SVG parameters for radial circle
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  // Use 75% arc (270 degrees)
  const arcLength = circumference * 0.75;
  const progressOffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className="risk-gauge-wrapper" style={{ width: size, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={classification.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
              filter: `drop-shadow(0 0 6px ${classification.color})`
            }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -42%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
            / 100
          </span>
          <span
            style={{
              marginTop: '6px',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: classification.bgColor,
              color: classification.color,
              border: `1px solid ${classification.borderColor}`
            }}
          >
            {classification.label} Risk
          </span>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{label}</span>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          Target Response SLA: <strong style={{ color: classification.color }}>{classification.sla}</strong>
        </div>
      </div>
    </div>
  );
}
