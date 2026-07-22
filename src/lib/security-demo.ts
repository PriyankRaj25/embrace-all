// Mock data for the Security Agent module — investor demo only.
export type Severity = "critical" | "high" | "medium" | "low";

export const securityKpis = {
  score: 72,
  criticalRisks: 3,
  activeAttackPaths: 7,
  complianceScore: 88,
  cloudAssets: 1284,
  internetFacing: 42,
  highRiskIam: 11,
  aiRecommendations: 18,
};

export const aiInsight =
  "AI has identified 3 critical attack paths that could lead to production database access. Recommended remediation can reduce overall risk by 82%.";

export const recentEvents: { id: string; when: string; severity: Severity; title: string; source: string }[] = [
  { id: "e1", when: "2 min ago",  severity: "critical", title: "Public S3 bucket 'hp-prod-patient-exports' detected",       source: "AWS · us-east-1" },
  { id: "e2", when: "14 min ago", severity: "high",     title: "IAM role 'analytics-lambda' escalated to AdministratorAccess", source: "IAM · 123456789012" },
  { id: "e3", when: "38 min ago", severity: "high",     title: "Unusual egress from prod EKS node to unknown IP",             source: "GuardDuty" },
  { id: "e4", when: "1 hr ago",   severity: "medium",   title: "TLS 1.0 detected on internal LB 'billing-int-lb'",            source: "Config" },
  { id: "e5", when: "3 hr ago",   severity: "low",      title: "New developer added to prod GitHub org",                       source: "GitHub" },
];

export const aiRecommendations = [
  { id: "r1", impact: 34, title: "Rotate 4 long-lived IAM access keys older than 180 days", effort: "5 min" },
  { id: "r2", impact: 22, title: "Restrict security group sg-0d21 to VPC-internal traffic",  effort: "2 min" },
  { id: "r3", impact: 18, title: "Enforce IMDSv2 on 37 EC2 instances",                        effort: "10 min" },
  { id: "r4", impact: 12, title: "Enable S3 Block Public Access at org level",                effort: "1 min" },
];

// ---------- Attack paths ----------
export type AttackNode = {
  id: string;
  label: string;
  kind: "internet" | "edge" | "compute" | "identity" | "data" | "asset";
  risk: number;
  difficulty: "trivial" | "easy" | "moderate" | "hard";
  mitre: string[];
  impact: string;
  fixes: string[];
};

export const attackPath: AttackNode[] = [
  { id: "n1", label: "Internet",                       kind: "internet", risk: 0,  difficulty: "trivial",  mitre: ["TA0001"],           impact: "Untrusted source",                                          fixes: [] },
  { id: "n2", label: "Public ALB · api.healthtracker", kind: "edge",     risk: 65, difficulty: "easy",     mitre: ["T1190"],            impact: "Perimeter breach vector",                                    fixes: ["Enable WAF managed rules", "Rate-limit /auth endpoints"] },
  { id: "n3", label: "EC2 · api-worker-4",             kind: "compute",  risk: 78, difficulty: "moderate", mitre: ["T1068", "T1611"],   impact: "Foothold on VPC private subnet",                             fixes: ["Enforce IMDSv2", "Patch CVE-2025-2013", "Restrict egress"] },
  { id: "n4", label: "IAM Role · analytics-lambda",    kind: "identity", risk: 92, difficulty: "easy",     mitre: ["T1078.004", "T1550"], impact: "AdministratorAccess assumable via SSRF",                    fixes: ["Downscope to read-only S3", "Add condition aws:SourceVpc"] },
  { id: "n5", label: "RDS · hp-prod-patients",         kind: "data",     risk: 88, difficulty: "hard",     mitre: ["T1213", "T1567"],   impact: "PHI exfiltration · 1.2M patient records",                    fixes: ["Enable IAM DB auth", "Force in-VPC access only"] },
  { id: "n6", label: "Customer PHI · 1.2M rows",       kind: "asset",    risk: 100, difficulty: "hard",    mitre: ["TA0010"],           impact: "HIPAA-reportable breach · est. $6.4M regulatory + notification exposure", fixes: [] },
];

export const otherPaths = [
  { id: "p2", title: "GitHub OIDC → over-privileged deploy role → prod EKS", risk: 84, hops: 4 },
  { id: "p3", title: "Public SSM parameter → RDS master credentials",         risk: 79, hops: 3 },
  { id: "p4", title: "Compromised laptop → VPN → jump host → billing DB",     risk: 71, hops: 5 },
];

// ---------- Knowledge graph ----------
export type GraphNode = { id: string; label: string; group: string; x: number; y: number; risk?: number };
export type GraphEdge = { from: string; to: string; label?: string };

export const graphNodes: GraphNode[] = [
  { id: "acct", label: "AWS · 1234-5678", group: "account", x: 50, y: 12 },
  { id: "vpc",  label: "vpc-prod",         group: "network", x: 50, y: 28 },
  { id: "sg1",  label: "sg-api",           group: "network", x: 22, y: 44 },
  { id: "sg2",  label: "sg-data",          group: "network", x: 78, y: 44 },
  { id: "ec2",  label: "EC2 · api-worker", group: "compute", x: 14, y: 62, risk: 78 },
  { id: "eks",  label: "EKS · payments",   group: "compute", x: 34, y: 62 },
  { id: "lam",  label: "Lambda · analytics", group: "compute", x: 54, y: 62, risk: 92 },
  { id: "rds",  label: "RDS · patients",   group: "data",    x: 74, y: 62, risk: 88 },
  { id: "s3",   label: "S3 · exports",     group: "data",    x: 92, y: 62, risk: 95 },
  { id: "role", label: "IAM · admin-lambda", group: "iam",   x: 40, y: 82, risk: 92 },
  { id: "dev",  label: "Dev · a.lovelace", group: "human",   x: 62, y: 82 },
  { id: "repo", label: "GitHub · hp-api",  group: "code",    x: 82, y: 82 },
];

export const graphEdges: GraphEdge[] = [
  { from: "acct", to: "vpc" },
  { from: "vpc",  to: "sg1" },
  { from: "vpc",  to: "sg2" },
  { from: "sg1",  to: "ec2" },
  { from: "sg1",  to: "eks" },
  { from: "sg1",  to: "lam" },
  { from: "sg2",  to: "rds" },
  { from: "sg2",  to: "s3" },
  { from: "lam",  to: "role", label: "assumes" },
  { from: "role", to: "rds",  label: "read/write" },
  { from: "role", to: "s3",   label: "*" },
  { from: "dev",  to: "repo" },
  { from: "repo", to: "eks",  label: "deploys" },
];

export const graphSuggestedQuestions = [
  "Which IAM roles have admin access?",
  "Show internet-facing workloads",
  "What resources can reach production databases?",
  "Which apps use deprecated encryption?",
];

export const graphAnswers: Record<string, { text: string; highlight: string[] }> = {
  "Which IAM roles have admin access?": {
    text: "1 role currently holds AdministratorAccess: analytics-lambda. It is assumable from the Lambda function that receives untrusted webhook input, forming the critical path to hp-prod-patients.",
    highlight: ["role", "lam", "rds"],
  },
  "Show internet-facing workloads": {
    text: "The ALB in front of EC2 · api-worker is the only public entry point. All data-tier resources are private, though sg-data trusts sg-api broadly.",
    highlight: ["ec2", "sg1"],
  },
  "What resources can reach production databases?": {
    text: "Lambda · analytics and EKS · payments can reach RDS via the analytics-lambda role and sg-data respectively. Only payments is expected — the Lambda path is unintended.",
    highlight: ["lam", "eks", "rds", "role"],
  },
  "Which apps use deprecated encryption?": {
    text: "S3 · exports still allows AES-128 and TLS 1.0 uploads. Recommend enforcing TLS 1.2+ bucket policy and SSE-KMS.",
    highlight: ["s3"],
  },
};

// ---------- Threat model ----------
export const threatModel = {
  stride: [
    { kind: "Spoofing",              count: 2, notes: "Missing JWT audience check on /billing" },
    { kind: "Tampering",             count: 1, notes: "Client-computed pricing accepted server-side" },
    { kind: "Repudiation",           count: 3, notes: "Audit log gap between API and worker tier" },
    { kind: "Information Disclosure",count: 5, notes: "S3 exports bucket lacks Block Public Access" },
    { kind: "Denial of Service",     count: 2, notes: "No WAF rate-limit on /auth" },
    { kind: "Elevation of Privilege",count: 4, notes: "analytics-lambda has AdministratorAccess" },
  ],
  boundaries: [
    { name: "Internet → Edge",   controls: ["WAF", "Rate limiting", "TLS 1.2+"] },
    { name: "Edge → App",        controls: ["mTLS", "AuthN", "AuthZ (RBAC)"] },
    { name: "App → Data",        controls: ["IAM DB auth", "KMS envelope encryption", "Field-level PHI encryption"] },
    { name: "CI/CD → Cloud",     controls: ["OIDC short-lived tokens", "Signed images", "Policy-as-code"] },
  ],
  controls: [
    "Enable AWS WAF managed rules on api ALB",
    "Downscope analytics-lambda IAM role to least privilege",
    "Enforce SSE-KMS on hp-prod-* buckets",
    "Add anomaly detection on RDS read patterns",
    "Rotate all long-lived IAM keys, enforce OIDC in CI",
  ],
};

// ---------- Fix engine ----------
export const detectedIssues = [
  {
    id: "iss-1",
    title: "IAM role 'analytics-lambda' has AdministratorAccess",
    severity: "critical" as Severity,
    rootCause: "Wildcard action Allow *:* attached during initial bootstrap and never scoped down.",
    impact: "Full account takeover if the Lambda is compromised via untrusted webhook input.",
    fix: `# Terraform patch — least-privilege replacement
- resource "aws_iam_role_policy_attachment" "analytics_admin" {
-   role       = aws_iam_role.analytics_lambda.name
-   policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
- }
+ data "aws_iam_policy_document" "analytics" {
+   statement {
+     actions   = ["s3:GetObject", "s3:ListBucket"]
+     resources = [aws_s3_bucket.analytics.arn, "\${aws_s3_bucket.analytics.arn}/*"]
+     condition {
+       test     = "StringEquals"
+       variable = "aws:SourceVpc"
+       values   = [aws_vpc.prod.id]
+     }
+   }
+ }`,
  },
  {
    id: "iss-2",
    title: "S3 bucket 'hp-prod-patient-exports' is publicly readable",
    severity: "critical" as Severity,
    rootCause: "Bucket ACL grants READ to AllUsers; Block Public Access disabled at bucket level.",
    impact: "Any anonymous internet user can enumerate and download PHI export archives.",
    fix: `resource "aws_s3_bucket_public_access_block" "exports" {
  bucket                  = aws_s3_bucket.exports.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
  },
  {
    id: "iss-3",
    title: "Security group sg-0d21 allows 0.0.0.0/0 on port 5432",
    severity: "high" as Severity,
    rootCause: "Debug rule from Q1 migration was never removed.",
    impact: "Postgres directly reachable from the internet.",
    fix: `- cidr_blocks = ["0.0.0.0/0"]
+ cidr_blocks = [aws_vpc.prod.cidr_block]`,
  },
];

// ---------- Red team ----------
export const redTeam = {
  successRate: 12,
  blocked: 88,
  coverage: 74,
  scenarios: [
    { name: "Credential Theft",       last: "4m ago",  outcome: "blocked", detection: "SecretsManager anomaly" },
    { name: "Privilege Escalation",   last: "12m ago", outcome: "success", detection: "None — gap in IAM analyzer" },
    { name: "Lateral Movement",       last: "22m ago", outcome: "blocked", detection: "GuardDuty · Recon" },
    { name: "Container Escape",       last: "36m ago", outcome: "blocked", detection: "Falco rule TR-004" },
    { name: "Public Bucket Discovery",last: "1h ago",  outcome: "success", detection: "Delayed · 41min" },
    { name: "Secret Leakage (GitHub)",last: "2h ago",  outcome: "blocked", detection: "gitleaks pre-commit" },
  ],
  mitreHeatmap: [
    { tactic: "Initial Access",     cov: 92 },
    { tactic: "Execution",          cov: 78 },
    { tactic: "Persistence",        cov: 61 },
    { tactic: "Privilege Escalation", cov: 44 },
    { tactic: "Defense Evasion",    cov: 55 },
    { tactic: "Credential Access",  cov: 82 },
    { tactic: "Discovery",          cov: 71 },
    { tactic: "Lateral Movement",   cov: 68 },
    { tactic: "Collection",         cov: 63 },
    { tactic: "Exfiltration",       cov: 74 },
    { tactic: "Impact",             cov: 80 },
  ],
};

// ---------- Zero trust ----------
export const zeroTrust = {
  identities: 214,
  overPermissioned: 47,
  segments: 12,
  suggestions: [
    { id: "zt1", from: "Lambda · analytics",   permission: "AdministratorAccess", suggested: "s3:Get* on analytics/*" },
    { id: "zt2", from: "EC2 · api-worker-4",   permission: "TCP 5432 → RDS · patients", suggested: "Deny — route via payments service" },
    { id: "zt3", from: "IAM user · j.doe",     permission: "iam:PassRole *",       suggested: "Scope to specific role ARNs" },
    { id: "zt4", from: "EKS SA · payments-sa", permission: "secretsmanager:*",     suggested: "GetSecretValue on payments/* only" },
  ],
};

// ---------- Compliance ----------
export const compliance = {
  frameworks: [
    { name: "SOC 2",     score: 91, failed: 4,  passed: 132, evidence: 18 },
    { name: "ISO 27001", score: 87, failed: 9,  passed: 108, evidence: 22 },
    { name: "NIST 800-53", score: 79, failed: 21, passed: 202, evidence: 41 },
    { name: "CIS AWS",   score: 84, failed: 12, passed: 174, evidence: 9  },
    { name: "PCI DSS",   score: 76, failed: 14, passed: 88,  evidence: 27 },
    { name: "HIPAA",     score: 82, failed: 6,  passed: 74,  evidence: 15 },
  ],
  topGaps: [
    "Encrypt EBS volumes at rest for 12 legacy instances",
    "Enable CloudTrail multi-region in 'sandbox' account",
    "Document quarterly access reviews for prod IAM",
    "MFA enforcement missing on 3 break-glass accounts",
  ],
};

// ---------- Copilot canned answers ----------
export const copilotSuggestions = [
  "Explain my biggest security risks",
  "Show the most critical attack path",
  "How can I reduce my attack surface?",
  "Generate a remediation plan",
  "What is preventing SOC 2 compliance?",
  "Which assets are publicly exposed?",
];

export const copilotAnswers: Record<string, string> = {
  "Explain my biggest security risks":
    "The dominant risk is the analytics-lambda role holding AdministratorAccess while sitting behind an untrusted webhook endpoint. Combined with a publicly-readable exports bucket, this yields two independent paths to PHI. Fixing both reduces overall risk by ~82%.",
  "Show the most critical attack path":
    "Internet → Public ALB → EC2 api-worker-4 → assume analytics-lambda (Admin) → RDS hp-prod-patients → 1.2M PHI records. Blast radius: HIPAA-reportable breach. Easiest break in the chain is the IAM role.",
  "How can I reduce my attack surface?":
    "Enable S3 Block Public Access org-wide, downscope 4 over-privileged roles, enforce IMDSv2, and put WAF managed rules on the api ALB. Estimated 15 minutes of work, ~34 point risk reduction.",
  "Generate a remediation plan":
    "Step 1 — Emergency: block-public-access on hp-prod-* buckets (1 min). Step 2 — Rotate long-lived keys (5 min). Step 3 — Replace analytics-lambda policy with least-privilege doc (10 min). Step 4 — Deploy WAF rules (10 min). Step 5 — Verify via red-team replay.",
  "What is preventing SOC 2 compliance?":
    "4 controls are failing: CC6.1 (excessive IAM), CC6.6 (encryption at rest for legacy EBS), CC7.2 (log coverage in sandbox), CC6.7 (MFA on break-glass). None are structural — all are configuration fixes.",
  "Which assets are publicly exposed?":
    "3 assets: ALB api.healthtracker (expected), S3 hp-prod-patient-exports (unexpected — critical), and SSM parameter /prod/db/master (unexpected — high). Recommend immediate remediation of the latter two.",
};
