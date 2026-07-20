/**
 * Rich demo blueprint used for investor / marketing demos.
 * Renders through the same UI as a real project — but with no backend calls.
 */
import type { AgentKey } from "./agents";

export const DEMO_PROJECT_ID = "demo";

export const demoProject = {
  id: DEMO_PROJECT_ID,
  name: "HealthTracker Pro — HIPAA-grade Wearables Platform",
  requirement:
    "Build a global, HIPAA-compliant wearables platform that ingests 2M+ biometric events/sec, powers real-time clinician dashboards, and exposes an ML inference API for anomaly detection. Multi-region active/active, 99.99% SLA, sub-200ms p95 read latency.",
  cloud: "aws",
  compliance: ["HIPAA", "SOC2", "GDPR", "ISO-27001"],
  scale_hint: "50M end-users · 2M events/sec ingest · 12 clinical partners",
  status: "completed",
  current_stage: "reviewer",
  estimated_monthly_cost: 187_420,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
};

export const demoArtifacts: Record<Exclude<AgentKey, "planner">, unknown> = {
  requirements: {
    summary:
      "A HIPAA-regulated telemetry platform for wearable devices. Must sustain millions of events per second, satisfy PHI handling and residency rules across US and EU, and give clinicians a live dashboard plus programmatic API access for anomaly detection.",
    functional: [
      "Ingest biometric events (HR, SpO2, ECG, glucose, motion) from BLE and cellular wearables",
      "Real-time clinician dashboard with patient cohort filters, alert triage, and audit log",
      "ML inference endpoint that returns anomaly probability under 150ms p95",
      "Provider onboarding portal with role-based access, MFA and delegated admin",
      "Longitudinal patient timeline with 7-year retention and clinician annotations",
      "FHIR R4 export for downstream EHR integrations (Epic, Cerner, Athena)",
    ],
    non_functional: [
      { category: "Scalability", requirement: "Sustain 2M events/sec sustained, 5M peak, with linear cost scaling" },
      { category: "Latency", requirement: "p95 dashboard read < 200ms globally, ML inference < 150ms p95" },
      { category: "Availability", requirement: "99.99% monthly SLA per region, RTO ≤ 5m, RPO ≤ 30s" },
      { category: "Security", requirement: "PHI encrypted at rest and in transit, per-tenant KMS keys, HSM-backed" },
      { category: "Compliance", requirement: "HIPAA (US), GDPR (EU), SOC2 Type II, ISO-27001" },
      { category: "Observability", requirement: "OpenTelemetry traces on 100% requests, structured audit for PHI access" },
    ],
    constraints: [
      "Data residency: EU patient PHI must never leave eu-west-1",
      "No third-party analytics that would receive PHI",
      "Signed BAAs required with every processor",
      "Rollout must not exceed $250k/month infra budget in year 1",
    ],
  },

  domain: {
    bounded_contexts: [
      { name: "Device Fleet",       purpose: "Wearable registration, firmware, session tokens.",             entities: ["Device", "Firmware", "SessionToken", "PairingRequest"] },
      { name: "Biometric Ingest",   purpose: "High-throughput write path for time-series telemetry.",       entities: ["Reading", "Batch", "Deduplication", "Watermark"] },
      { name: "Clinical Workspace", purpose: "Clinician-facing views, cohorts, alerts, annotations.",       entities: ["Patient", "Cohort", "Alert", "Annotation", "CareTeam"] },
      { name: "ML Inference",       purpose: "Realtime + batch anomaly scoring across models.",             entities: ["Model", "InferenceRun", "FeatureVector", "AnomalyScore"] },
      { name: "Consent & PHI Vault",purpose: "Consent capture, PHI segregation and access ledger.",         entities: ["Consent", "PHIRecord", "AccessLogEntry", "Purpose"] },
      { name: "Interop / FHIR",     purpose: "Bidirectional FHIR exchange with EHRs.",                      entities: ["Observation", "Practitioner", "Encounter", "Bundle"] },
    ],
  },

  solution: {
    pattern: "Event-driven microservices with CQRS on the clinical read path and a streaming lakehouse for analytics + ML.",
    components: [
      { id: "edge_gw",   name: "Edge API Gateway",     kind: "gateway",  description: "Global anycast ingress, JWT verification, rate limiting and mTLS termination." },
      { id: "ingest",    name: "Telemetry Ingest",     kind: "service",  description: "Stateless writer, validates and enriches events, writes to Kafka." },
      { id: "bus",       name: "Event Bus",            kind: "queue",    description: "Kafka multi-AZ with per-tenant topics and 7-day retention." },
      { id: "hotstore",  name: "Time-series Hot Store",kind: "database", description: "TimescaleDB hypertable for 30-day rolling clinical read window." },
      { id: "lake",      name: "Lakehouse",            kind: "data",     description: "S3 + Iceberg for long-term retention, feature engineering and ML training." },
      { id: "ml_svc",    name: "ML Inference Service", kind: "service",  description: "GPU-backed real-time anomaly scoring; canary + shadow deploys." },
      { id: "clin_api",  name: "Clinician API",        kind: "api",      description: "GraphQL federation for dashboards, cohorts, alerts, annotations." },
      { id: "web",       name: "Clinician Web App",    kind: "edge",     description: "React on CloudFront, streaming SSR, per-tenant theming." },
      { id: "fhir",      name: "FHIR Interop",         kind: "service",  description: "FHIR R4 endpoint, SMART-on-FHIR auth, EHR outbound queues." },
      { id: "phi_vault", name: "PHI Vault",            kind: "database", description: "Per-tenant KMS-encrypted RDS, mediated by an access ledger." },
      { id: "audit",     name: "Audit Ledger",         kind: "data",     description: "Append-only PHI access log, replicated to compliance region." },
    ],
    data_flow: [
      { from: "edge_gw",  to: "ingest",   label: "events" },
      { from: "ingest",   to: "bus",      label: "kafka" },
      { from: "bus",      to: "hotstore", label: "consumer" },
      { from: "bus",      to: "lake",     label: "sink" },
      { from: "bus",      to: "ml_svc",   label: "score" },
      { from: "ml_svc",   to: "clin_api", label: "alerts" },
      { from: "hotstore", to: "clin_api", label: "reads" },
      { from: "phi_vault",to: "clin_api", label: "PHI (mediated)" },
      { from: "clin_api", to: "web",      label: "graphql" },
      { from: "clin_api", to: "audit",    label: "access log" },
      { from: "clin_api", to: "fhir",     label: "export" },
    ],
    connections: [],
  },

  cloud: {
    provider: "AWS",
    region: "us-east-1 (primary), eu-west-1 (residency), us-west-2 (DR)",
    services: [
      { name: "CloudFront + Global Accelerator", service: "cloudfront",   purpose: "Global edge for web app + API",         tier: "Edge" },
      { name: "API Gateway (HTTP)",              service: "apigw",        purpose: "mTLS ingress + JWT auth",                tier: "Ingress" },
      { name: "EKS (Graviton)",                  service: "eks",          purpose: "Microservices runtime, per-tenant NS",   tier: "Compute" },
      { name: "MSK Serverless",                  service: "kafka",        purpose: "Event backbone (2M events/sec)",         tier: "Streaming" },
      { name: "Aurora PostgreSQL + Timescale",   service: "aurora",       purpose: "Hot clinical read store, 30d rolling",   tier: "Data" },
      { name: "S3 + Iceberg",                    service: "s3",           purpose: "Lakehouse for long-term PHI",             tier: "Data" },
      { name: "SageMaker Inference (g5)",        service: "sagemaker",    purpose: "Realtime anomaly scoring",                tier: "ML" },
      { name: "KMS + CloudHSM",                  service: "kms",          purpose: "Per-tenant CMKs, HSM-backed",             tier: "Security" },
      { name: "GuardDuty + Security Hub",        service: "guardduty",    purpose: "Threat detection + posture mgmt",         tier: "Security" },
      { name: "CloudTrail Lake",                 service: "cloudtrail",   purpose: "Immutable audit sink, cross-region",      tier: "Audit" },
    ],
    networking: {
      vpc: "10.20.0.0/16 (per-region), Transit Gateway hub",
      subnets: ["private-app", "private-data", "public-ingress", "isolated-phi"],
      ingress: "CloudFront → Global Accelerator → API Gateway (mTLS) → internal NLB",
    },
  },

  security: {
    iam: [
      { role: "ingest.writer",        permissions: "kafka:Produce on telemetry.*; kms:Encrypt on tenant-CMK" },
      { role: "clinician.reader",     permissions: "read hotstore for assigned cohort; PHI vault reads mediated by access ledger" },
      { role: "ml.inference",         permissions: "sagemaker:Invoke; read feature-store; no PHI read" },
      { role: "fhir.exporter",        permissions: "read PHI vault for consented purpose; write to EHR outbound queue" },
      { role: "auditor.readonly",     permissions: "read CloudTrail Lake + access ledger; no data plane access" },
    ],
    encryption: {
      at_rest: "AES-256 via per-tenant KMS CMKs, HSM-backed; automatic yearly rotation",
      in_transit: "TLS 1.3 everywhere; mTLS between services in-mesh",
      key_management: "AWS KMS + CloudHSM for compliance-material keys; envelope encryption for large blobs",
    },
    network: [
      "PHI subnets isolated (no NAT, no IGW); egress via inspection VPC only",
      "Service mesh (Istio) enforcing SPIFFE identities and per-namespace policies",
      "WAF with managed rulesets + custom rate limits per tenant",
      "Private link endpoints for every AWS service (no PHI over public internet)",
    ],
    secrets_management:
      "Secrets Manager with per-tenant rotation Lambdas; short-lived DB creds via IAM auth; app secrets injected via IRSA.",
  },

  compliance: {
    frameworks: [
      {
        framework: "HIPAA",
        status: "covered",
        controls: [
          { id: "164.312(a)", title: "Access Control",           evidence: "SPIFFE identities + per-tenant IAM boundary; access ledger on all PHI reads." },
          { id: "164.312(b)", title: "Audit Controls",           evidence: "CloudTrail Lake + append-only PHI access log; 7y retention." },
          { id: "164.312(c)", title: "Integrity",                evidence: "Object lock on lakehouse buckets; row-level checksums on hot store." },
          { id: "164.312(e)", title: "Transmission Security",    evidence: "TLS 1.3 external, mTLS internal; no PHI over public routes." },
        ],
      },
      {
        framework: "SOC2 Type II",
        status: "covered",
        controls: [
          { id: "CC6.1", title: "Logical Access",         evidence: "SSO + MFA enforced; JIT elevation with break-glass alerts." },
          { id: "CC7.2", title: "Change Management",      evidence: "Signed IaC via OIDC; policy-as-code checks pre-merge." },
          { id: "A1.2", title: "Availability Monitoring", evidence: "SLO dashboards + burn-rate alerts wired to on-call rotation." },
        ],
      },
      {
        framework: "GDPR",
        status: "partial",
        controls: [
          { id: "Art.17", title: "Right to Erasure",   evidence: "Tenant-key crypto-shred implemented; lakehouse tombstone job needs to reach steady state." },
          { id: "Art.30", title: "Records of Processing", evidence: "Purpose registry linked to consent capture; auto-generated ROPA export." },
          { id: "Art.44", title: "Cross-border Transfer", evidence: "EU PHI pinned to eu-west-1; SCCs signed with US processors." },
        ],
      },
      {
        framework: "ISO-27001",
        status: "partial",
        controls: [
          { id: "A.5.15", title: "Access Control Policy", evidence: "Documented; awaiting external audit sign-off in Q3." },
          { id: "A.8.24", title: "Cryptography",          evidence: "Per-tenant CMKs, HSM-backed; formal key ceremony scheduled." },
        ],
      },
    ],
  },

  finops: {
    total_monthly_usd: 187_420,
    breakdown: [
      { category: "Compute (EKS + GPU)",  monthly_usd: 62_400, notes: "Graviton for stateless; g5.2xlarge for ML autoscaled 4–24 pods" },
      { category: "Streaming (MSK)",      monthly_usd: 28_900, notes: "MSK Serverless, 2M events/sec sustained" },
      { category: "Data (Aurora + S3)",   monthly_usd: 41_300, notes: "Aurora I/O-optimized, S3 Intelligent-Tiering with Glacier IR after 90d" },
      { category: "Networking + Edge",    monthly_usd: 18_600, notes: "CloudFront + Global Accelerator + inter-region peering" },
      { category: "Security + KMS",       monthly_usd:  8_900, notes: "CloudHSM cluster, GuardDuty, Security Hub, WAF" },
      { category: "Observability",        monthly_usd: 12_400, notes: "OTEL collectors, Grafana Cloud, log lake with 30d hot / 1y cold" },
      { category: "Backups + DR",         monthly_usd: 14_920, notes: "Cross-region replication, snapshot lifecycle, DR runbooks tested monthly" },
    ],
    optimization_levers: [
      "Move stateless workloads to Graviton (est. 22% compute save)",
      "Adopt Iceberg partition evolution to reduce lakehouse scan cost by 35%",
      "Shift async ML batches to Spot with checkpointing (est. 55% ML save)",
      "Compress OTEL span attributes; sample 20% for non-PHI paths",
      "Reserved capacity for baseline Aurora writer (est. 18% DB save)",
    ],
  },

  reliability: {
    rpo_minutes: 0.5,
    rto_minutes: 5,
    availability_target: "99.99%",
    strategy:
      "Multi-region active/active with cell-based tenant sharding. Kafka mirrored across regions with idempotent producers. Aurora Global Database with < 1s replica lag. Chaos GameDays quarterly with automated failover drills.",
    failure_scenarios: [
      { scenario: "Primary region AZ loss",            mitigation: "Multi-AZ everything; automatic reroute in ≤30s via NLB health checks." },
      { scenario: "Full region outage (us-east-1)",    mitigation: "Route53 health-based failover to us-west-2; Aurora Global promoted in ≤3m." },
      { scenario: "Kafka partition hot spot",          mitigation: "Sticky keying with automatic rebalancer; overload sheds to spill topic." },
      { scenario: "ML model rollout regression",       mitigation: "Shadow deploy 100% traffic for 24h; auto-rollback on drift > 3σ." },
      { scenario: "PHI encryption key compromise",     mitigation: "Per-tenant crypto-shred + rotate; access ledger blast radius report ≤ 60s." },
      { scenario: "Runaway tenant traffic",            mitigation: "Per-tenant WAF rate limits + circuit breakers at ingest and clinician API." },
    ],
  },

  iac: {
    language: "Terraform (HCL) + CDK for cross-account bootstrap",
    modules: [
      {
        name: "networking",
        filename: "modules/networking/main.tf",
        code: `module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.1"

  name = "aether-\${var.env}-\${var.region}"
  cidr = "10.20.0.0/16"

  azs             = ["\${var.region}a", "\${var.region}b", "\${var.region}c"]
  private_subnets = ["10.20.10.0/24", "10.20.11.0/24", "10.20.12.0/24"]
  public_subnets  = ["10.20.20.0/24", "10.20.21.0/24", "10.20.22.0/24"]
  intra_subnets   = ["10.20.30.0/24", "10.20.31.0/24", "10.20.32.0/24"] # PHI isolated

  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_flow_log      = true
  flow_log_destination_type = "cloud-watch-logs"
}`,
      },
      {
        name: "kafka-msk",
        filename: "modules/streaming/msk.tf",
        code: `resource "aws_msk_serverless_cluster" "telemetry" {
  cluster_name = "aether-telemetry-\${var.env}"

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.msk.id]
  }

  client_authentication {
    sasl { iam { enabled = true } }
  }
}`,
      },
      {
        name: "eks-cluster",
        filename: "modules/compute/eks.tf",
        code: `module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.24.0"

  cluster_name    = "aether-\${var.env}"
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = false

  eks_managed_node_groups = {
    graviton = {
      ami_type       = "AL2_ARM_64"
      instance_types = ["m7g.large"]
      min_size = 6; max_size = 60; desired_size = 12
    }
    gpu = {
      ami_type       = "AL2_x86_64_GPU"
      instance_types = ["g5.2xlarge"]
      min_size = 2; max_size = 24; desired_size = 4
      taints = [{ key = "gpu"; value = "true"; effect = "NO_SCHEDULE" }]
    }
  }
}`,
      },
      {
        name: "kms-per-tenant",
        filename: "modules/security/kms.tf",
        code: `resource "aws_kms_key" "tenant" {
  for_each = toset(var.tenant_ids)

  description             = "PHI CMK for tenant \${each.value}"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  multi_region            = true

  policy = data.aws_iam_policy_document.tenant_key[each.value].json
}`,
      },
      {
        name: "aurora-global",
        filename: "modules/data/aurora.tf",
        code: `resource "aws_rds_global_cluster" "clinical" {
  global_cluster_identifier = "aether-clinical"
  engine                    = "aurora-postgresql"
  engine_version            = "16.3"
  storage_encrypted         = true
}`,
      },
    ],
  },

  docs: {
    overview:
      "AetherOS designed HealthTracker Pro as an event-driven, cell-based multi-region platform. The clinical read path is CQRS with a 30-day hot store; long-term PHI and ML training live in an Iceberg lakehouse. Realtime anomaly scoring runs on GPU inference pods behind the Kafka bus, and every PHI access is mediated through an append-only ledger.\n\nSecurity is anchored in per-tenant HSM-backed CMKs, mTLS in-mesh, and isolated PHI subnets. Reliability targets 99.99% via Aurora Global Database and Global Accelerator health-based failover, validated by quarterly GameDays. Cost is contained at ~$187k/month at 2M events/sec through Graviton, MSK Serverless and Spot-backed ML batches.",
    adrs: [
      { id: "ADR-001", title: "Kafka over Kinesis for backbone",       decision: "Adopt MSK Serverless as the primary event bus.", rationale: "Better multi-tenant isolation, MirrorMaker for DR, richer ecosystem for stream processing." },
      { id: "ADR-002", title: "Cell-based tenant sharding",             decision: "Tenants pinned to cells across regions.",         rationale: "Blast radius containment; regulatory pinning; simpler capacity math." },
      { id: "ADR-003", title: "Per-tenant KMS keys",                    decision: "Every tenant gets its own CMK.",                  rationale: "Enables crypto-shred for GDPR erasure and per-tenant compromise recovery." },
      { id: "ADR-004", title: "Iceberg over Delta for lakehouse",       decision: "Standardize on Apache Iceberg.",                  rationale: "Open format, engine flexibility, hidden partitioning simplifies retention." },
      { id: "ADR-005", title: "Shadow-then-canary ML rollout",          decision: "New models get 24h shadow + 5%/25%/100% canary.", rationale: "Clinical stakes demand drift + calibration checks before full exposure." },
    ],
  },

  reviewer: {
    verdict: "approve_with_notes",
    overall_score: 92,
    strengths: [
      "Blast radius controls (cell sharding + per-tenant CMK) are unusually strong",
      "Clear separation of PHI plane from analytics plane",
      "Cost trajectory stays inside stated budget through year 1",
      "Reliability strategy is testable and has explicit failure scenarios",
    ],
    risks: [
      { severity: "medium", issue: "GDPR crypto-shred hasn't been proven under load", recommendation: "Run a chaos GameDay that exercises tenant erasure end-to-end before GA." },
      { severity: "medium", issue: "ML feature store is single-region",              recommendation: "Replicate features to eu-west-1 or fall back to on-the-fly recompute." },
      { severity: "low",    issue: "OTEL sampling not defined per environment",       recommendation: "Codify 100% trace in prod for PHI paths, 20% elsewhere." },
      { severity: "low",    issue: "IaC repos not yet split by blast radius",         recommendation: "Split networking and per-tenant KMS into independent state files." },
    ],
  },
};

/** Timeline entries used by the workspace view. */
export const demoRuns = ([
  ["planner",     "Planning Agent",         "Decomposed request into 11 agent steps across 5 tiers.", 2100],
  ["requirements","Requirements Agent",     "Extracted 6 functional + 6 NFR + 4 constraints.",         3400],
  ["domain",      "Domain Modeling Agent",  "Identified 6 bounded contexts with 24 entities.",         2900],
  ["solution",    "Solution Architecture",  "Selected event-driven + CQRS pattern with 11 components.",4600],
  ["cloud",       "Cloud Architecture",     "Mapped to AWS multi-region topology across 3 regions.",   4100],
  ["security",    "Security & IAM Agent",   "Designed per-tenant KMS + SPIFFE mesh + PHI isolation.",  3800],
  ["compliance",  "Compliance Agent",       "HIPAA/SOC2 covered; GDPR/ISO partial with mitigations.",  3200],
  ["finops",      "FinOps Agent",           "Estimated $187k/mo with 5 optimization levers.",          2700],
  ["reliability", "Reliability Agent",      "99.99% SLA; RPO 30s RTO 5m; 6 failure scenarios.",         2500],
  ["iac",         "IaC Generation Agent",   "Emitted 5 Terraform modules (~430 lines).",               5300],
  ["docs",        "Documentation Agent",    "Produced overview + 5 ADRs.",                             2200],
  ["reviewer",    "Governance Reviewer",    "Verdict: approve_with_notes · score 92/100.",             3600],
] as const).map(([key, name, summary, duration_ms], i) => ({
  key: key as AgentKey,
  agent_key: key,
  agent_name: name,
  status: "completed" as const,
  summary,
  duration_ms,
  output: key === "planner" ? { steps: 11 } : demoArtifacts[key as Exclude<AgentKey, "planner">],
  started_at: new Date(Date.now() - 1000 * 60 * (60 - i * 3)).toISOString(),
  at: new Date(Date.now() - 1000 * 60 * (60 - i * 3)).toISOString(),
}));

export const demoApprovals = [
  { stage: "architecture", approved: true,  decided_at: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { stage: "security",     approved: true,  decided_at: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
  { stage: "blueprint",    approved: false },
];
