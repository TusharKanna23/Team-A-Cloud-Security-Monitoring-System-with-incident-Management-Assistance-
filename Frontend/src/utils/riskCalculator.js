/**
 * SkyShield Risk Engine - Risk Calculation & Classification Utilities
 * Implements weighted scoring algorithm and analytical helpers.
 *
 * Formula: Risk Score = (Severity * 0.4) + (Impact * 0.3) + (Likelihood * 0.3)
 * Values: 0 - 100
 * Classification:
 *   0 - 24  : Low
 *   25 - 49 : Medium
 *   50 - 74 : High
 *   75 - 100: Critical
 */

export const RISK_WEIGHTS = {
  severity: 0.4,
  impact: 0.3,
  likelihood: 0.3,
};

export const RISK_LEVELS = {
  LOW: {
    label: "Low",
    min: 0,
    max: 24,
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.4)",
    sla: "72 Hours",
    actionPriority: "Routine Monitoring"
  },
  MEDIUM: {
    label: "Medium",
    min: 25,
    max: 49,
    color: "#eab308",
    bgColor: "rgba(234, 179, 8, 0.15)",
    borderColor: "rgba(234, 179, 8, 0.4)",
    sla: "24 Hours",
    actionPriority: "Scheduled Remediation"
  },
  HIGH: {
    label: "High",
    min: 50,
    max: 74,
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    borderColor: "rgba(249, 115, 22, 0.4)",
    sla: "4 Hours",
    actionPriority: "Immediate Investigation"
  },
  CRITICAL: {
    label: "Critical",
    min: 75,
    max: 100,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    sla: "15 Minutes",
    actionPriority: "Emergency Containment"
  }
};

/**
 * Clamps input value strictly between 0 and 100
 */
export function clampMetric(value) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Calculates weighted risk score based on Severity, Impact, and Likelihood.
 * @param {number} severity - 0 to 100
 * @param {number} impact - 0 to 100
 * @param {number} likelihood - 0 to 100
 * @returns {number} Score rounded to nearest integer (0 to 100)
 */
export function calculateRiskScore(severity, impact, likelihood) {
  const s = clampMetric(severity);
  const i = clampMetric(impact);
  const l = clampMetric(likelihood);

  const rawScore = (s * RISK_WEIGHTS.severity) + (i * RISK_WEIGHTS.impact) + (l * RISK_WEIGHTS.likelihood);
  return Math.round(rawScore);
}

/**
 * Returns the risk classification details for a given score.
 * @param {number} score - 0 to 100
 * @returns {object} { label, color, bgColor, borderColor, sla, actionPriority }
 */
export function getRiskClassification(score) {
  const s = clampMetric(score);
  if (s >= 75) return RISK_LEVELS.CRITICAL;
  if (s >= 50) return RISK_LEVELS.HIGH;
  if (s >= 25) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/**
 * Computes risk distribution breakdown (counts and percentages) for a list of events.
 * @param {Array} events - List of events with calculated risk scores
 */
export function getRiskDistribution(events = []) {
  const counts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };

  events.forEach((ev) => {
    const classification = getRiskClassification(ev.riskScore);
    counts[classification.label] += 1;
  });

  const total = events.length || 1;

  return [
    { name: "Critical", value: counts.Critical, color: RISK_LEVELS.CRITICAL.color, percentage: Math.round((counts.Critical / total) * 100) },
    { name: "High", value: counts.High, color: RISK_LEVELS.HIGH.color, percentage: Math.round((counts.High / total) * 100) },
    { name: "Medium", value: counts.Medium, color: RISK_LEVELS.MEDIUM.color, percentage: Math.round((counts.Medium / total) * 100) },
    { name: "Low", value: counts.Low, color: RISK_LEVELS.LOW.color, percentage: Math.round((counts.Low / total) * 100) }
  ];
}

/**
 * Generates dynamic mitigation recommendation based on risk score and classification.
 */
export function generateMitigationRecommendation(score, threatName) {
  const level = getRiskClassification(score);
  const name = threatName || "Security Event";

  switch (level.label) {
    case "Critical":
      return `EMERGENCY ALERT: Active ${name} presents severe risk (${score}/100). Immediately isolate the target host/resource from VPC, revoke affected IAM credentials, and escalate to Tier-3 incident response team within ${level.sla}.`;
    case "High":
      return `HIGH PRIORITY: Elevate monitoring for ${name} (${score}/100). Deploy edge WAF blocks, terminate suspicious sessions, and verify data integrity on target infrastructure within ${level.sla}.`;
    case "Medium":
      return `MODERATE RISK: Review audit logs for ${name} (${score}/100). Apply rate-limiting, renew expiring credentials, and monitor for lateral movement within ${level.sla}.`;
    case "Low":
    default:
      return `LOW RISK: Routine anomaly noted for ${name} (${score}/100). Log event in SIEM for behavioral baseline analysis. No immediate intervention required.`;
  }
}
