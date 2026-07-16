/**
 * AetherOS agent catalog — client-safe metadata + shared Zod schemas.
 * The server route imports schemas; the client imports catalog metadata.
 */
import { z } from "zod";

export type AgentKey =
  | "planner"
  | "requirements"
  | "domain"
  | "solution"
  | "cloud"
  | "security"
  | "compliance"
  | "finops"
  | "reliability"
  | "iac"
  | "docs"
  | "reviewer";

export type AgentTier = "discovery" | "architecture" | "governance" | "generation" | "review";

export interface AgentSpec {
  key: AgentKey;
  name: string;
  tier: AgentTier;
  role: string;
  icon: string; // lucide name
}

export const AGENTS: AgentSpec[] = [
  { key: "planner",      name: "Planning Agent",         tier: "discovery",    role: "Decomposes the request into an execution plan.",       icon: "Compass" },
  { key: "requirements", name: "Requirements Agent",     tier: "discovery",    role: "Extracts functional and non-functional requirements.", icon: "ListChecks" },
  { key: "domain",       name: "Domain Modeling Agent",  tier: "discovery",    role: "Identifies bounded contexts and core entities.",       icon: "Boxes" },
  { key: "solution",     name: "Solution Architecture",  tier: "architecture", role: "Designs high-level components and their interactions.", icon: "Network" },
  { key: "cloud",        name: "Cloud Architecture",     tier: "architecture", role: "Selects concrete cloud services and topology.",         icon: "Cloud" },
  { key: "security",     name: "Security & IAM Agent",   tier: "governance",   role: "Defines IAM, encryption, and network segmentation.",    icon: "ShieldCheck" },
  { key: "compliance",   name: "Compliance Agent",       tier: "governance",   role: "Maps design to regulatory controls.",                    icon: "Gavel" },
  { key: "finops",       name: "FinOps Agent",           tier: "governance",   role: "Estimates monthly cost and optimization levers.",        icon: "DollarSign" },
  { key: "reliability",  name: "Reliability Agent",      tier: "governance",   role: "Defines DR, RPO/RTO and failure scenarios.",             icon: "HeartPulse" },
  { key: "iac",          name: "IaC Generation Agent",   tier: "generation",   role: "Emits Terraform snippets for the target cloud.",         icon: "Code2" },
  { key: "docs",         name: "Documentation Agent",    tier: "generation",   role: "Produces architecture docs and ADRs.",                   icon: "BookOpen" },
  { key: "reviewer",     name: "Governance Reviewer",    tier: "review",       role: "Critiques the blueprint and flags risks.",                icon: "ScanEye" },
];

export const AGENT_BY_KEY: Record<AgentKey, AgentSpec> = Object.fromEntries(
  AGENTS.map((a) => [a.key, a]),
) as Record<AgentKey, AgentSpec>;

/* --- Schemas ---------------------------------------------------------- */

export const RequirementsSchema = z.object({
  summary: z.string(),
  functional: z.array(z.string()),
  non_functional: z.array(z.object({ category: z.string(), requirement: z.string() })),
  constraints: z.array(z.string()),
});

export const DomainSchema = z.object({
  bounded_contexts: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    entities: z.array(z.string()),
  })),
});

export const SolutionSchema = z.object({
  pattern: z.string(),
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    kind: z.string(),
    description: z.string(),
  })),
  connections: z.array(z.object({ from: z.string(), to: z.string(), label: z.string() })),
});

export const CloudSchema = z.object({
  provider: z.string(),
  region: z.string(),
  services: z.array(z.object({
    name: z.string(),
    service: z.string(),
    purpose: z.string(),
    tier: z.string(),
  })),
  networking: z.object({
    vpc: z.string(),
    subnets: z.array(z.string()),
    ingress: z.string(),
  }),
});

export const SecuritySchema = z.object({
  iam: z.array(z.object({ role: z.string(), permissions: z.string() })),
  encryption: z.object({ at_rest: z.string(), in_transit: z.string(), key_management: z.string() }),
  network: z.array(z.string()),
  secrets_management: z.string(),
});

export const ComplianceSchema = z.object({
  frameworks: z.array(z.object({
    framework: z.string(),
    status: z.enum(["covered","partial","gap"]),
    controls: z.array(z.object({ id: z.string(), title: z.string(), evidence: z.string() })),
  })),
});

export const CostSchema = z.object({
  total_monthly_usd: z.number(),
  breakdown: z.array(z.object({ category: z.string(), monthly_usd: z.number(), notes: z.string() })),
  optimization_levers: z.array(z.string()),
});

export const ReliabilitySchema = z.object({
  rpo_minutes: z.number(),
  rto_minutes: z.number(),
  strategy: z.string(),
  failure_scenarios: z.array(z.object({ scenario: z.string(), mitigation: z.string() })),
  availability_target: z.string(),
});

export const IacSchema = z.object({
  language: z.string(),
  modules: z.array(z.object({
    name: z.string(),
    filename: z.string(),
    code: z.string(),
  })),
});

export const DocsSchema = z.object({
  overview: z.string(),
  adrs: z.array(z.object({ id: z.string(), title: z.string(), decision: z.string(), rationale: z.string() })),
});

export const ReviewSchema = z.object({
  verdict: z.enum(["approve","approve_with_notes","block"]),
  strengths: z.array(z.string()),
  risks: z.array(z.object({ severity: z.enum(["low","medium","high"]), issue: z.string(), recommendation: z.string() })),
  overall_score: z.number(),
});

export const AGENT_SCHEMAS = {
  requirements: RequirementsSchema,
  domain: DomainSchema,
  solution: SolutionSchema,
  cloud: CloudSchema,
  security: SecuritySchema,
  compliance: ComplianceSchema,
  finops: CostSchema,
  reliability: ReliabilitySchema,
  iac: IacSchema,
  docs: DocsSchema,
  reviewer: ReviewSchema,
} as const;

export const AGENT_PROMPTS: Record<Exclude<AgentKey, "planner">, string> = {
  requirements: "Extract concrete functional requirements, non-functional requirements (categorized as performance, scalability, security, availability, etc.), and hard constraints from the business requirement. Be specific and numeric where possible.",
  domain: "Perform domain-driven design analysis. Identify 3-6 bounded contexts and the core entities within each. Ground in the business requirement.",
  solution: "Design a high-level architecture. Choose an appropriate pattern (microservices, event-driven, layered, serverless, etc.). Emit 5-10 components with stable ids and the connections between them. Prefer clarity over completeness.",
  cloud: "Select concrete cloud services for the requested provider. Include compute, data, networking, and observability. Choose a region appropriate to the requirement. Describe VPC/subnet strategy briefly.",
  security: "Design an IAM strategy (least-privilege roles), encryption at rest and in transit, key management, network segmentation, and secrets management approach.",
  compliance: "For each requested compliance framework (or reasonable defaults like SOC2 if none given), list the top 4-6 controls, their coverage status, and evidence provided by the architecture.",
  finops: "Estimate a realistic monthly cost in USD, broken down by category (compute, storage, network, data, observability, etc.). Provide 3-5 optimization levers.",
  reliability: "Define RPO/RTO in minutes appropriate to the workload, a DR strategy (backup, pilot-light, warm-standby, multi-region active-active), and 3-5 failure scenarios with mitigations. State an availability target (e.g. 99.9%).",
  iac: "Emit 3-5 Terraform module snippets in HCL for the most important resources (networking, primary compute, primary datastore, IAM). Keep each snippet short but valid.",
  docs: "Produce a concise architecture overview (2-3 paragraphs) and 3-5 Architecture Decision Records (ADRs) with id ADR-001 etc.",
  reviewer: "Critique the blueprint holistically. Return strengths, risks (severity + recommendation) and an overall_score 0-100. Verdict should be one of approve / approve_with_notes / block.",
};

export const STAGE_ORDER: AgentKey[] = [
  "planner","requirements","domain","solution","cloud",
  "security","compliance","finops","reliability","iac","docs","reviewer",
];

export const APPROVAL_STAGES = [
  { key: "architecture", label: "Approve Architecture", after: "cloud" as AgentKey },
  { key: "security",     label: "Approve Security & Compliance", after: "reliability" as AgentKey },
  { key: "blueprint",    label: "Approve Blueprint",   after: "reviewer" as AgentKey },
];
