
const threatData = [
  {
    id: 1,
    threatName: "Brute Force Attack",
    eventType: "FAILED_LOGIN",
    description:
      "Repeated login attempts using incorrect passwords to gain unauthorized access.",
    severity: "HIGH",
    detectionRule: "5 or more failed login attempts within 5 minutes.",
    recommendation:
      "Monitor login attempts, investigate the source IP, and enable account lockout.",
    riskWeight: 30,
    isActive: true
  },
  {
    id: 2,
    threatName: "Unauthorized Access",
    eventType: "UNAUTHORIZED_ACCESS",
    description:
      "An unauthorized user attempts to access restricted cloud resources.",
    severity: "CRITICAL",
    detectionRule: "Access attempt to a restricted resource without permission.",
    recommendation:
      "Review access permissions and investigate the user's activity.",
    riskWeight: 40,
    isActive: true
  },
  {
    id: 3,
    threatName: "Suspicious Data Access",
    eventType: "DATA_ACCESS",
    description:
      "Unusual access or downloading of sensitive cloud information.",
    severity: "HIGH",
    detectionRule: "Unusual data access volume or unexpected download activity.",
    recommendation:
      "Review data access logs and verify the user's identity.",
    riskWeight: 35,
    isActive: true
  },
  {
    id: 4,
    threatName: "Public Storage Exposure",
    eventType: "STORAGE_EXPOSURE",
    description:
      "Cloud storage resources are exposed publicly without proper authorization.",
    severity: "CRITICAL",
    detectionRule: "Storage bucket or resource allows unintended public access.",
    recommendation:
      "Restrict public access and review storage permissions.",
    riskWeight: 40,
    isActive: true
  },
  {
    id: 5,
    threatName: "Suspicious Network Activity",
    eventType: "NETWORK_ACTIVITY",
    description:
      "Unusual network traffic that may indicate malicious activity.",
    severity: "MEDIUM",
    detectionRule: "Unexpected traffic patterns or unusual connection attempts.",
    recommendation:
      "Analyze network logs and investigate suspicious connections.",
    riskWeight: 20,
    isActive: true
  },
  {
    id: 6,
    threatName: "Malware Activity",
    eventType: "MALWARE_DETECTED",
    description:
      "Potential malicious software activity detected in a monitored system.",
    severity: "CRITICAL",
    detectionRule: "Known malware signature or suspicious process behavior detected.",
    recommendation:
      "Isolate the affected resource and perform a security investigation.",
    riskWeight: 40,
    isActive: true
  }
];

export default threatData;
