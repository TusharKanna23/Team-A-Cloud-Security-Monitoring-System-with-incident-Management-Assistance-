import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

function TrendTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: '#0b1120',
          border: '1px solid #3b82f6',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
          fontSize: '12px',
          minWidth: '180px'
        }}
      >
        <div style={{ color: '#60a5fa', fontWeight: '700', marginBottom: '6px' }}>
          {data.id} - {data.threatName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc', marginBottom: '3px' }}>
          <span>Risk Score:</span>
          <strong style={{ color: data.riskScore >= 75 ? '#ef4444' : data.riskScore >= 50 ? '#f97316' : '#eab308' }}>
            {data.riskScore} / 100
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px' }}>
          <span>Severity (40%):</span>
          <span>{data.metrics?.severity ?? 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px' }}>
          <span>Impact (30%):</span>
          <span>{data.metrics?.impact ?? 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px' }}>
          <span>Likelihood (30%):</span>
          <span>{data.metrics?.likelihood ?? 0}</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
          {data.timestamp}
        </div>
      </div>
    );
  }
  return null;
}

export default function RiskTrendChart({ events = [] }) {
  // Sort events chronologically if timestamps exist, or reverse slice
  const chartData = [...events].reverse().map(e => ({
    ...e,
    shortId: e.id.replace('SEC-2026-', '#')
  }));

  return (
    <div className="risk-chart-box">
      <div className="risk-chart-header">
        <div>
          <h3>Threat Risk Score Trend</h3>
          <p>Chronological risk score trajectory across monitored security events</p>
        </div>
        <div className="trend-threshold-indicators">
          <span className="threshold-pill critical">Critical Threshold (75+)</span>
          <span className="threshold-pill high">High Threshold (50+)</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="shortId"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />

            <Tooltip content={<TrendTooltip />} />

            {/* Threshold reference lines */}
            <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" opacity={0.6} />
            <ReferenceLine y={50} stroke="#f97316" strokeDasharray="3 3" opacity={0.4} />

            <Area
              type="monotone"
              dataKey="riskScore"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#riskScoreGradient)"
              activeDot={{ r: 6, fill: '#60a5fa', stroke: '#1e3a8a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
