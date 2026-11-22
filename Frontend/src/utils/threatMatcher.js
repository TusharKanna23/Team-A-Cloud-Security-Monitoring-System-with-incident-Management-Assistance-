/**
 * SkyShield Threat Matcher Utility
 * Correlates real-time security events with standardized Knowledge Base threats,
 * pulling in MITRE ATT&CK intelligence, affected systems, and mitigation playbooks.
 */

import threats from '../data/threats';
import { calculateRiskScore, getRiskClassification, generateMitigationRecommendation } from './riskCalculator';

/**
 * Finds matching threat from the Knowledge Base based on threatId, name, or eventType
 * @param {object} event - Security event object
 * @returns {object|null} Matched threat catalog entry
 */
export function matchEventToThreat(event) {
  if (!event) return null;

  // 1. Direct ID match
  if (event.threatId) {
    const directMatch = threats.find(t => t.id === event.threatId);
    if (directMatch) return directMatch;
  }

  // 2. Threat name match (case-insensitive)
  if (event.threatName) {
    const nameMatch = threats.find(
      t => t.name.toLowerCase() === event.threatName.toLowerCase()
    );
    if (nameMatch) return nameMatch;
  }

  // 3. Heuristic eventType match
  if (event.eventType) {
    const typeUpper = event.eventType.toUpperCase();
    if (typeUpper.includes('SQL')) return threats.find(t => t.id === 'THREAT-002');
    if (typeUpper.includes('RANSOM')) return threats.find(t => t.id === 'THREAT-010');
    if (typeUpper.includes('LOGIN') || typeUpper.includes('BRUTE')) return threats.find(t => t.id === 'THREAT-001');
    if (typeUpper.includes('PRIVILEGE') || typeUpper.includes('ESCALAT')) return threats.find(t => t.id === 'THREAT-007');
    if (typeUpper.includes('DDOS') || typeUpper.includes('FLOOD')) return threats.find(t => t.id === 'THREAT-006');
    if (typeUpper.includes('UNAUTH') || typeUpper.includes('ACCESS')) return threats.find(t => t.id === 'THREAT-008');
    if (typeUpper.includes('MALWARE')) return threats.find(t => t.id === 'THREAT-005');
    if (typeUpper.includes('PHISH')) return threats.find(t => t.id === 'THREAT-004');
    if (typeUpper.includes('XSS')) return threats.find(t => t.id === 'THREAT-003');
    if (typeUpper.includes('MITM') || typeUpper.includes('INTERCEPT')) return threats.find(t => t.id === 'THREAT-009');
  }

  return null;
}

/**
 * Enriches a security event with correlated Knowledge Base intelligence and calculated risk assessment
 * @param {object} event - Raw security event
 * @returns {object} Comprehensive analysis report
 */
export function analyzeSecurityEvent(event) {
  const matchedThreat = matchEventToThreat(event);

  const severity = event.metrics?.severity ?? matchedThreat?.defaultMetrics?.severity ?? 50;
  const impact = event.metrics?.impact ?? matchedThreat?.defaultMetrics?.impact ?? 50;
  const likelihood = event.metrics?.likelihood ?? matchedThreat?.defaultMetrics?.likelihood ?? 50;

  const score = calculateRiskScore(severity, impact, likelihood);
  const classification = getRiskClassification(score);
  const mitigationAdvice = generateMitigationRecommendation(score, matchedThreat?.name || event.threatName);

  return {
    ...event,
    matchedThreat,
    calculatedMetrics: {
      severity,
      impact,
      likelihood
    },
    riskScore: score,
    riskClassification: classification,
    mitigationRecommendation: mitigationAdvice,
    iocList: matchedThreat ? matchedThreat.indicatorsOfCompromise : [],
    mitigationPlaybook: matchedThreat ? matchedThreat.mitigationSteps : [],
    triageActions: matchedThreat ? matchedThreat.recommendedActions : []
  };
}
