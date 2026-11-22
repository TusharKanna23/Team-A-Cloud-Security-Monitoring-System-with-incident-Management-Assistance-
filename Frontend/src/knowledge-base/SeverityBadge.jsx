import React from 'react';

/**
 * SeverityBadge Component
 * Enterprise SOC severity indicator with color-coded dark navy styling
 * Supports Critical, High, Medium, Low
 */
export default function SeverityBadge({ severity, showDot = true, size = 'normal' }) {
  const normalizedSeverity = (severity || 'LOW').toUpperCase();

  const getSeverityClass = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-high';
      case 'MEDIUM':
        return 'badge-medium';
      case 'LOW':
      default:
        return 'badge-low';
    }
  };

  return (
    <span className={`soc-severity-badge ${getSeverityClass(normalizedSeverity)} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {showDot && <span className="severity-pulse-dot" />}
      {severity || 'Low'}
    </span>
  );
}
