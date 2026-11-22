import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

/**
 * Custom dark SOC tooltip for Recharts
 */
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: '#0b1120',
          border: `1px solid ${data.color || '#3b82f6'}`,
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
          fontSize: '12px'
        }}
      >
        <div style={{ fontWeight: '700', color: data.color, marginBottom: '4px' }}>
          {data.name} Risk
        </div>
        <div style={{ color: '#f8fafc' }}>
          Events: <strong>{data.value}</strong>
        </div>
        <div style={{ color: '#94a3b8' }}>
          Share: <strong>{data.percentage}%</strong>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * RiskDistributionChart Component
 * Visualizes the breakdown of security events across Critical, High, Medium, and Low risk tiers
 */
export default function RiskDistributionChart({ data = [] }) {
  const totalEvents = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="risk-chart-box">
      <div className="risk-chart-header">
        <div>
          <h3>Risk Level Distribution</h3>
          <p>Classification breakdown across {totalEvents} analyzed events</p>
        </div>
      </div>

      <div style={{ width: '100%', height: 240, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#111a2b" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }}>
            {totalEvents}
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
            Events
          </span>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="risk-distribution-legend">
        {data.map((tier) => (
          <div key={tier.name} className="distribution-legend-item">
            <span className="legend-dot" style={{ backgroundColor: tier.color }} />
            <span className="legend-label">{tier.name}:</span>
            <strong style={{ color: '#ffffff' }}>{tier.value}</strong>
            <span style={{ color: '#64748b', fontSize: '11px' }}>({tier.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
