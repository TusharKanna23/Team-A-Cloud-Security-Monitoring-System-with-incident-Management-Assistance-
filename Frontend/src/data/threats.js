/**
 * SkyShield Cybersecurity Knowledge Base - Threat Library Data
 * Standardized repository of enterprise cybersecurity threats, IOCs,
 * MITRE ATT&CK mappings, affected systems, and mitigation playbooks.
 */

export const THREAT_CATEGORIES = [
  "All Categories",
  "Authentication & Credential Access",
  "Web Application Security",
  "Client-Side Attack",
  "Social Engineering",
  "Malicious Code Execution",
  "Availability & Denial of Service",
  "Privilege Escalation",
  "Access Control Violation",
  "Network Eavesdropping & Interception",
  "Extortion & Cryptovirology"
];

export const SEVERITY_LEVELS = ["All Severities", "Critical", "High", "Medium", "Low"];

export const threats = [
  {
    id: "THREAT-001",
    name: "Brute Force Attack",
    category: "Authentication & Credential Access",
    severity: "High",
    mitreAttack: {
      id: "T1110",
      tactic: "Credential Access",
      technique: "Brute Force (Password Guessing & Spraying)"
    },
    description:
      "Automated and continuous submission of numerous usernames or passwords to guess authentication credentials, targeting cloud IAM endpoints, SSH bastions, and enterprise single sign-on (SSO) portals.",
    indicatorsOfCompromise: [
      "Rapid succession of HTTP 401/403 responses from identical or rotating IP subnets (>50 attempts/minute)",
      "Unusual surge in failed authentication logs within CloudTrail, Okta, or Keycloak",
      "Repeated login attempts across diverse accounts using identical common passwords (password spraying)",
      "Source IP addresses associated with known Tor exit nodes, bulletproof proxies, or VPN exit points (e.g., 185.220.101.5)"
    ],
    affectedSystems: [
      "Cloud IAM & OAuth 2.0 Identity Providers",
      "SSH Bastion Hosts & RDP Endpoints",
      "Enterprise SSO & VPN Gateways",
      "Customer-Facing Auth REST APIs"
    ],
    potentialImpact:
      "Account takeover, unauthorized lateral movement into cloud infrastructure, compromise of privileged administrative identities, and potential credential dumping.",
    mitigationSteps: [
      "Enforce multi-factor authentication (MFA/FIDO2) across all administrative and standard user accounts.",
      "Implement adaptive rate limiting and exponential backoff after 5 consecutive failed attempts.",
      "Deploy Geo-IP and IP reputation filtering at the Cloudflare / AWS WAF edge.",
      "Enable account lockout policies and automated anomaly alerts via SIEM correlation rules."
    ],
    recommendedActions: [
      "Temporarily block the attacking IP or autonomous system (ASN) at the cloud perimeter firewall.",
      "Trigger immediate password reset and invalidate active refresh tokens for targeted user accounts.",
      "Review audit trails for any successful login originating from the suspect IP addresses."
    ],
    defaultMetrics: {
      severity: 75,
      impact: 70,
      likelihood: 85
    }
  },
  {
    id: "THREAT-002",
    name: "SQL Injection",
    category: "Web Application Security",
    severity: "Critical",
    mitreAttack: {
      id: "T1190",
      tactic: "Initial Access",
      technique: "Exploit Public-Facing Application (SQLi)"
    },
    description:
      "Insertion or injection of malicious SQL statements into web input fields or API query parameters, allowing attackers to manipulate backend database queries, bypass authentication, and exfiltrate sensitive data.",
    indicatorsOfCompromise: [
      "Query string parameters containing SQL control sequences: `' OR '1'='1`, `UNION SELECT`, `SLEEP()`, `--`",
      "Unexpected database syntax error logs in application backend (PostgreSQL / MySQL drivers)",
      "Sudden abnormal spike in HTTP response payload sizes indicative of bulk database table dumping",
      "WAF alert signatures matching OWASP SQLi Core Rule Set (CRS 942xxx)"
    ],
    affectedSystems: [
      "Relational Database Instances (PostgreSQL, MySQL, Amazon Aurora)",
      "Backend API Services (Spring Boot, Node.js, Django)",
      "Customer Data Repositories & Order Management Databases",
      "Legacy SQL Data Access Layers without ORM parameterization"
    ],
    potentialImpact:
      "Total compromise of relational database confidentiality and integrity, unauthorized data exfiltration (PII/financial records), and arbitrary execution of administrative database procedures.",
    mitigationSteps: [
      "Mandate parameterized queries or type-safe ORMs (Spring Data JPA / Hibernate) across all data access tiers.",
      "Apply strict principle of least privilege to database service accounts, disabling DDL execution permissions.",
      "Enable database query logging and continuous WAF payload inspection at the API gateway layer.",
      "Implement rigorous input validation and whitelisting on all request parameters and REST payloads."
    ],
    recommendedActions: [
      "Isolate affected backend API service pods and terminate suspicious active database connections.",
      "Deploy virtual WAF patches immediately to intercept the specific URI payload pattern.",
      "Initiate database transaction log forensic review to determine the exact scope of accessed or extracted tables."
    ],
    defaultMetrics: {
      severity: 95,
      impact: 90,
      likelihood: 65
    }
  },
  {
    id: "THREAT-003",
    name: "Cross-Site Scripting (XSS)",
    category: "Client-Side Attack",
    severity: "Medium",
    mitreAttack: {
      id: "T1059.007",
      tactic: "Execution",
      technique: "Command and Scripting Interpreter: JavaScript (XSS)"
    },
    description:
      "Flaws enabling adversaries to inject client-side scripts into web pages viewed by other users. Upon execution in the victim's browser, the malicious script can hijack sessions, steal cookies, or redirect users to malicious domains.",
    indicatorsOfCompromise: [
      "HTTP GET/POST parameters containing HTML/JavaScript payloads: `<script>`, `onload=`, `onerror=alert()`, `javascript:`",
      "Content Security Policy (CSP) violation reports triggered by unauthorized inline script execution",
      "Users reporting unexpected browser pop-ups, malicious iframe overlays, or automated token theft",
      "Unsanitized user comments or profile fields rendering dynamic executable HTML tags"
    ],
    affectedSystems: [
      "Client-Facing Single Page Applications (React, Vue, Angular)",
      "Customer Portal & SOC Web Dashboards",
      "Session Management & Authentication Cookies (non-HttpOnly)",
      "Public Support Forums & Rich-Text User Generated Content"
    ],
    potentialImpact:
      "Session token hijacking, impersonation of authenticated users or SOC administrators, credential theft via fake login forms, and client-side web defacement.",
    mitigationSteps: [
      "Enforce rigorous contextual output encoding and HTML sanitization (e.g., DOMPurify) before rendering dynamic text.",
      "Set `HttpOnly`, `Secure`, and `SameSite=Strict` flags on all sensitive authentication and session cookies.",
      "Deploy strict Content Security Policy (CSP) headers disallowing `unsafe-inline` and unauthorized external script origins.",
      "Utilize modern frontend frameworks with native automatic XSS protection enabled."
    ],
    recommendedActions: [
      "Revoke compromised session tokens and force session re-authentication for affected users.",
      "Sanitize or remove the offending stored database entries containing malicious script tags.",
      "Deploy an emergency CSP header configuration via CDN/Edge proxy to restrict unauthorized script execution."
    ],
    defaultMetrics: {
      severity: 60,
      impact: 55,
      likelihood: 60
    }
  },
  {
    id: "THREAT-004",
    name: "Phishing",
    category: "Social Engineering",
    severity: "High",
    mitreAttack: {
      id: "T1566",
      tactic: "Initial Access",
      technique: "Phishing (Spearphishing Link & Attachment)"
    },
    description:
      "Deceptive social engineering communications designed to manipulate employees or administrators into revealing sensitive credentials, installing malware, or authorizing unauthorized cloud infrastructure transactions.",
    indicatorsOfCompromise: [
      "Inbound emails featuring spoofed executive sender addresses, typosquatted domain names, or deceptive homoglyphs",
      "DKIM, SPF, or DMARC authentication alignment failure headers in incoming mail servers",
      "Links resolving to newly registered, low-reputation domains mimicking corporate single sign-on portals",
      "Suspicious inbound attachments containing malicious macro-enabled documents or nested archive files (.zip, .iso)"
    ],
    affectedSystems: [
      "Corporate Email Gateways (Google Workspace, Microsoft Exchange)",
      "Employee Laptops, Mobile Devices, and Workstations",
      "Corporate Identity Management & VPN Portals",
      "Internal Communication Channels (Slack, Teams)"
    ],
    potentialImpact:
      "Initial compromise of internal network perimeter, theft of employee credentials, subsequent lateral expansion, and financial fraud or BEC (Business Email Compromise).",
    mitigationSteps: [
      "Enforce strict email security protocols including DMARC policy `p=reject`, SPF, and cryptographic DKIM signing.",
      "Mandate hardware-backed FIDO2 / WebAuthn tokens to achieve phishing-resistant multi-factor authentication.",
      "Implement automated email gateway sandbox detonation for external attachments and embedded URLs.",
      "Conduct regular recurring security awareness simulations and interactive training across all departments."
    ],
    recommendedActions: [
      "Purge the reported phishing email from all recipient enterprise mailboxes via central mail server controls.",
      "Blacklist the fraudulent domain and associated hosting IP addresses across corporate DNS resolvers and secure web gateways.",
      "Reset passwords and examine cloud audit logs for any recipient who accessed the malicious phishing link."
    ],
    defaultMetrics: {
      severity: 75,
      impact: 75,
      likelihood: 80
    }
  },
  {
    id: "THREAT-005",
    name: "Malware",
    category: "Malicious Code Execution",
    severity: "Critical",
    mitreAttack: {
      id: "T1204",
      tactic: "Execution",
      technique: "User Execution: Malicious File / Malicious Process Spawning"
    },
    description:
      "Malicious software programs—including Trojans, rootkits, cryptominers, and botnet agents—engineered to compromise server integrity, establish command-and-control (C2) beacons, exfiltrate data, or consume compute resources.",
    indicatorsOfCompromise: [
      "Endpoint Detection and Response (EDR) alerts flagging known SHA-256 malware signatures or heuristically anomalous binaries",
      "Unexpected process spawning with high CPU usage (e.g., hidden cryptominer processes like xmrig)",
      "Periodic outbound network beacons on non-standard ports to unclassified dynamic DNS hostnames (C2 traffic)",
      "Modifications to system startup scripts, systemd services, or Windows registry `Run` keys"
    ],
    affectedSystems: [
      "Cloud Virtual Machines (AWS EC2, GCP Compute Engine, Azure VMs)",
      "Container Hosts & Kubernetes Worker Nodes",
      "Developer Workstations & Build Infrastructure",
      "Internal File Servers and Shared Object Storage"
    ],
    potentialImpact:
      "Full server takeover, unauthorized cryptomining leading to massive cloud billing spikes, persistent backdoor access, and data exfiltration to adversary infrastructure.",
    mitigationSteps: [
      "Deploy continuous Endpoint Detection and Response (EDR) agents with automated threat isolation capabilities.",
      "Enforce application allowlisting and restrict executable file writes to temporary directories (`/tmp`, `C:\\Temp`).",
      "Ensure timely operating system and kernel security patching via automated immutable image pipelines.",
      "Enforce egress network filtering, allowing connections only to verified external dependency repositories."
    ],
    recommendedActions: [
      "Quarantine and network-isolate the infected host or pod immediately from the virtual private cloud (VPC).",
      "Capture volatile memory dump and disk snapshot for digital forensics and reverse-engineering.",
      "Block C2 IP addresses and file hashes across all perimeter firewalls and EDR management consoles."
    ],
    defaultMetrics: {
      severity: 90,
      impact: 85,
      likelihood: 65
    }
  },
  {
    id: "THREAT-006",
    name: "DDoS Attack",
    category: "Availability & Denial of Service",
    severity: "High",
    mitreAttack: {
      id: "T1498",
      tactic: "Impact",
      technique: "Network Denial of Service (Direct & Reflection/Amplification)"
    },
    description:
      "Volumetric, protocol, or application-layer flood attacks executed by botnets to overwhelm cloud networking, edge balancers, or server compute capacity, rendering critical web services unavailable to legitimate users.",
    indicatorsOfCompromise: [
      "Massive sudden surge in incoming bandwidth (Gbps/Tbps) saturating edge ingress routers",
      "Anomalous distribution of traffic originating from thousands of disparate global residential IP addresses",
      "Abnormal spikes in HTTP requests per second (RPS) targeting resource-heavy endpoints (e.g., complex search APIs)",
      "Elevated HTTP 502/503/504 gateway timeout errors and surging latency metrics on application load balancers"
    ],
    affectedSystems: [
      "Application Load Balancers & Ingress Gateways",
      "Public-Facing Web Applications & Customer APIs",
      "Authoritative DNS Infrastructure",
      "Cloud Edge Transit Gateways & Direct Connect Interfaces"
    ],
    potentialImpact:
      "Service outage for legitimate customers, SLA breach penalties, loss of user trust, cloud auto-scaling cost surges, and masking of concurrent lateral penetration attempts.",
    mitigationSteps: [
      "Deploy managed cloud DDoS protection services (e.g., AWS Shield Advanced, Cloudflare Magic Transit).",
      "Implement multi-layer rate limiting, CAPTCHA challenges, and IP reputation filtering at CDN edges.",
      "Architect auto-scaling groups with decoupled asynchronous queues and resilient caching tiers.",
      "Ensure upstream DNS redundancy across multiple distinct authoritative DNS providers."
    ],
    recommendedActions: [
      "Activate maximum DDoS mitigation mode (e.g., Cloudflare 'Under Attack' mode or AWS Shield proactive engagement).",
      "Drop offending traffic patterns (e.g., specific HTTP headers, protocol flags, or geographic origins) at the edge WAF.",
      "Scale up backend caching nodes to absorb repeated read requests without exhausting database worker threads."
    ],
    defaultMetrics: {
      severity: 80,
      impact: 80,
      likelihood: 70
    }
  },
  {
    id: "THREAT-007",
    name: "Privilege Escalation",
    category: "Privilege Escalation",
    severity: "Critical",
    mitreAttack: {
      id: "T1068",
      tactic: "Privilege Escalation",
      technique: "Exploitation for Privilege Escalation (Kernel & Misconfigurations)"
    },
    description:
      "Exploitation of software bugs, kernel vulnerabilities, unquoted service paths, or cloud IAM role misconfigurations to elevate low-privilege user privileges to administrative (`root` or `Administrator`) access.",
    indicatorsOfCompromise: [
      "Execution of known privilege escalation scripts (e.g., `linpeas.sh`, `winpeas.exe`, `dirty cow/pipe` exploits)",
      "Non-root service accounts invoking `sudo` commands or spawning interactive `/bin/bash` with SUID bits set",
      "CloudTrail logs indicating unexpected `iam:AttachRolePolicy`, `iam:CreateAccessKey`, or `iam:PutUserPolicy` events",
      "Sudden group membership changes adding standard accounts to `Domain Admins`, `wheel`, or `Administrator` groups"
    ],
    affectedSystems: [
      "Linux Operating System Kernels & System Daemons",
      "Windows Server Domain Controllers & Active Directory",
      "Cloud IAM Role Hierarchy & AssumeRole Policies",
      "Container Runtimes & Kubernetes Cluster Role Bindings"
    ],
    potentialImpact:
      "Complete compromise of administrative controls, evasion of existing security boundaries, tampering with audit logging pipelines, and deployment of stealth backdoors across the fleet.",
    mitigationSteps: [
      "Enforce least-privilege role assignments and implement IAM permission boundaries with dual-approval requirements.",
      "Perform automated vulnerability scanning and rapid patching of operating system kernels and core utilities.",
      "Audit and restrict SUID/SGID binaries on all production container images and base VM templates.",
      "Deploy container security profiles (AppArmor, Seccomp, SELinux) and disable privileged container execution."
    ],
    recommendedActions: [
      "Immediately revoke elevated permissions and session credentials for the implicated account.",
      "Quarantine the host to halt ongoing administrative exploitation and lateral pivoting.",
      "Conduct an emergency audit of newly created cloud credentials, API keys, and IAM policy bindings."
    ],
    defaultMetrics: {
      severity: 95,
      impact: 95,
      likelihood: 55
    }
  },
  {
    id: "THREAT-008",
    name: "Unauthorized Access",
    category: "Access Control Violation",
    severity: "High",
    mitreAttack: {
      id: "T1078",
      tactic: "Defense Evasion / Persistence",
      technique: "Valid Accounts (Cloud & Local Accounts)"
    },
    description:
      "Access gained by an individual or process to restricted resources, databases, or cloud configuration panels without explicit authorization or valid administrative business justification.",
    indicatorsOfCompromise: [
      "Successful authentication to cloud consoles from unusual geographic locations or impossible travel velocity",
      "Audit records displaying access to confidential storage buckets (S3 / GCS) by atypical service accounts",
      "Access attempts occurring outside normal business operating hours with high volumes of file reads",
      "API calls executing sensitive administrative operations without matching ticket or deployment ID"
    ],
    affectedSystems: [
      "Cloud Storage Buckets (Amazon S3, Google Cloud Storage)",
      "Production Database Repositories & Sensitive Data Tables",
      "Cloud Provider Management Consoles (AWS Management Console, Azure Portal)",
      "Internal Microservice APIs without Mutual TLS (mTLS)"
    ],
    potentialImpact:
      "Breach of sensitive corporate confidentiality, intellectual property theft, compliance regulatory violations (GDPR/HIPAA/SOC2), and potential tampering with production configurations.",
    mitigationSteps: [
      "Implement Zero Trust Network Access (ZTNA) requiring continuous contextual identity verification.",
      "Enforce condition-based access controls restricting console logins to compliant corporate-managed devices.",
      "Encrypt all sensitive data at rest using customer-managed encryption keys (CMEK) with fine-grained access audits.",
      "Configure automated alerting for anomalous IAM access patterns using behavioral baseline analytics."
    ],
    recommendedActions: [
      "Instantly revoke active session tokens and rotate access keys for the associated user account.",
      "Lock down access permissions on the affected storage buckets or databases to read-only containment mode.",
      "Examine cloud access logs to catalogue every resource accessed, read, or modified during the unauthorized session."
    ],
    defaultMetrics: {
      severity: 85,
      impact: 80,
      likelihood: 60
    }
  },
  {
    id: "THREAT-009",
    name: "Man-in-the-Middle Attack",
    category: "Network Eavesdropping & Interception",
    severity: "Medium",
    mitreAttack: {
      id: "T1557",
      tactic: "Credential Access / Collection",
      technique: "Adversary-in-the-Middle (ARP / DNS Spoofing & SSL Stripping)"
    },
    description:
      "Interception, monitoring, or alteration of digital communications between two parties without their knowledge, typically achieved via ARP poisoning, Rogue Wi-Fi access points, DNS spoofing, or SSL/TLS stripping.",
    indicatorsOfCompromise: [
      "Browser TLS certificate warning alerts (untrusted certificate authority, expired or self-signed certs)",
      "Unusual ARP table broadcast collisions or duplicate MAC addresses detected within internal network subnets",
      "DNS query responses resolving corporate hostnames to unexpected external or non-routable IP addresses",
      "HTTP downgrade connections detected where mandatory HTTPS redirection was expected"
    ],
    affectedSystems: [
      "Client-to-Cloud Network Transmission Channels",
      "Internal VPC Microservice Communication Links",
      "Remote Worker Public Wi-Fi Connections",
      "Internal DNS Resolvers and Gateway Routers"
    ],
    potentialImpact:
      "Interception of unencrypted credentials, session tokens, and business communications; injection of malicious payloads into transmitted application traffic; credential replay.",
    mitigationSteps: [
      "Enforce HTTP Strict Transport Security (HSTS) with long max-age and preloading across all web properties.",
      "Mandate mutual TLS (mTLS) for all service-to-service microservice communications inside Kubernetes/VPCs.",
      "Enforce secure company VPN or ZTNA tunnel for all remote worker connections on untrusted public networks.",
      "Implement Dynamic ARP Inspection (DAI) and DHCP Snooping across enterprise networking equipment."
    ],
    recommendedActions: [
      "Verify and renew compromised TLS certificates; revoke suspect intermediate certificates immediately.",
      "Flush internal DNS cache tables and inspect local routing tables for unauthorized static gateway routes.",
      "Instruct users experiencing certificate validation warnings to disconnect immediately from untrusted access points."
    ],
    defaultMetrics: {
      severity: 70,
      impact: 65,
      likelihood: 45
    }
  },
  {
    id: "THREAT-010",
    name: "Ransomware",
    category: "Extortion & Cryptovirology",
    severity: "Critical",
    mitreAttack: {
      id: "T1486",
      tactic: "Impact",
      technique: "Data Encrypted for Impact (Cryptovirology)"
    },
    description:
      "Malicious software engineered to systematically locate, exfiltrate, and strongly encrypt organizational files and database volumes, demanding cryptocurrency ransom payments in exchange for decryption keys.",
    indicatorsOfCompromise: [
      "Massive rapid file rename operations appending atypical extensions (e.g., `.locked`, `.crypted`, `.enc`)",
      "Sudden deletion of Volume Shadow Copies (`vssadmin delete shadows`) and local system backup catalogs",
      "Generation of ransom note files (`README_TO_DECRYPT.txt`, `HOW_TO_RESTORE.html`) across shared directories",
      "Heavy disk I/O activity coupled with high sustained CPU utilization executing cryptographic algorithms",
      "Outbound data transfers exfiltrating large compressed archives prior to active encryption (double extortion)"
    ],
    affectedSystems: [
      "Enterprise File Servers & Network Attached Storage (NAS)",
      "Cloud Virtual Machines & Operating System Disks",
      "Cloud Database Backups & Object Storage Repositories",
      "Domain Controllers & Employee File Shares"
    ],
    potentialImpact:
      "Catastrophic halt of business operations, permanent data destruction, extortion with threat of public confidential data release, reputational damage, and massive regulatory fines.",
    mitigationSteps: [
      "Maintain offline, immutable, write-once-read-many (WORM) backups with air-gapped isolation.",
      "Deploy behavior-based anti-ransomware EDR agents capable of intercepting mass encryption and terminating processes.",
      "Implement strict network segmentation between user workstations, application servers, and backup repositories.",
      "Restrict Windows PowerShell and script execution policies via centrally enforced Group Policy Objects (GPOs)."
    ],
    recommendedActions: [
      "Immediately sever network connectivity for all infected systems by disabling NICs or isolating VLANs.",
      "Notify corporate incident response team, legal counsel, and executive cybersecurity leadership.",
      "Verify backup integrity and prepare clean-state recovery procedures from immutable snapshots."
    ],
    defaultMetrics: {
      severity: 100,
      impact: 100,
      likelihood: 60
    }
  }
];

export default threats;

