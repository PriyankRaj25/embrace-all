import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, XCircle, Shield, Cpu, Wallet, Wrench, Leaf, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/well-architected")({
  component: WellArchitectedPage,
});

type Finding = { title: string; status: "pass" | "warn" | "fail"; detail: string };
type Pillar = { key: string; name: string; icon: typeof Shield; score: number; summary: string; findings: Finding[] };

const PILLARS: Pillar[] = [
  { key: "sec", name: "Security", icon: Shield, score: 92, summary: "Strong IAM, encryption everywhere; one gap on step-up MFA.",
    findings: [
      { title: "Encryption at rest + in transit",         status: "pass", detail: "KMS-managed keys, TLS 1.3 across services." },
      { title: "Least-privilege IAM",                     status: "pass", detail: "All roles scoped to resource ARNs; no wildcards." },
      { title: "Step-up MFA on privileged admin",         status: "warn", detail: "WebAuthn planned but not enforced." },
    ] },
  { key: "rel", name: "Reliability", icon: Cpu, score: 87, summary: "Multi-AZ; multi-region planned for tier-1 only.",
    findings: [
      { title: "Multi-AZ across all data stores",         status: "pass", detail: "Aurora, ElastiCache, OpenSearch multi-AZ enabled." },
      { title: "Chaos testing cadence",                   status: "warn", detail: "GameDays quarterly, target monthly." },
      { title: "Recovery runbooks automated",             status: "pass", detail: "18 of 20 runbooks are one-click." },
    ] },
  { key: "perf", name: "Performance Efficiency", icon: Wrench, score: 84, summary: "Right-sized compute; caching layers strong.",
    findings: [
      { title: "Right-sized compute",                     status: "pass", detail: "Karpenter + spot mix optimal." },
      { title: "Read-through caching",                    status: "pass", detail: "Redis cluster hits >92% on hot paths." },
      { title: "Async event pipeline latency",            status: "warn", detail: "P99 6.4s vs 3s target." },
    ] },
  { key: "cost", name: "Cost Optimization", icon: Wallet, score: 78, summary: "Reserved capacity underused; savings on table.",
    findings: [
      { title: "Savings Plans coverage",                  status: "warn", detail: "62% of eligible compute covered." },
      { title: "Storage lifecycle policies",              status: "pass", detail: "S3 intelligent-tiering + archive after 90d." },
      { title: "Idle resource reaper",                    status: "fail", detail: "No automated cleanup for dev sandboxes." },
    ] },
  { key: "ops", name: "Operational Excellence", icon: ScrollText, score: 90, summary: "Strong CI/CD, observability, and playbook coverage.",
    findings: [
      { title: "Blue/green + canary deploys",             status: "pass", detail: "All prod deploys use progressive rollout." },
      { title: "Central observability",                   status: "pass", detail: "OTel across every service; SLOs defined." },
      { title: "Post-incident review discipline",         status: "warn", detail: "8 of 10 P2+ incidents reviewed within SLA." },
    ] },
  { key: "sust", name: "Sustainability", icon: Leaf, score: 71, summary: "Green regions preferred; workloads still fixed-scale.",
    findings: [
      { title: "Region carbon intensity",                 status: "pass", detail: "80% of workloads in low-carbon regions." },
      { title: "Auto-shutdown for non-prod",              status: "warn", detail: "Half of dev fleets idle nights/weekends." },
      { title: "ARM (Graviton) adoption",                 status: "warn", detail: "34% of compute on Graviton." },
    ] },
];

const ICON: Record<Finding["status"], typeof CheckCircle2> = { pass: CheckCircle2, warn: AlertCircle, fail: XCircle };
const TONE: Record<Finding["status"], string> = { pass: "text-success bg-success/10", warn: "text-warning bg-warning/10", fail: "text-destructive bg-destructive/10" };

function WellArchitectedPage() {
  const overall = Math.round(PILLARS.reduce((s, p) => s + p.score, 0) / PILLARS.length);
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Well-Architected Review</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Six pillars, continuously evaluated</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Reviewer agent scores every blueprint against the AWS Well-Architected Framework.</p>
      </header>

      <div className="glass-panel rounded-xl p-6 flex items-center gap-6">
        <div className="text-6xl font-semibold font-mono text-gradient-aether">{overall}</div>
        <div className="flex-1">
          <div className="font-semibold">Overall score</div>
          <p className="text-sm text-muted-foreground">Averaged across six pillars, weighted by criticality.</p>
          <Progress value={overall} className="mt-3 h-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.key} className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-aether" /><span className="font-semibold">{p.name}</span></div>
                <Badge variant="outline" className="font-mono">{p.score}</Badge>
              </div>
              <Progress value={p.score} className="h-1.5" />
              <p className="mt-3 text-sm text-muted-foreground">{p.summary}</p>
              <div className="mt-3 space-y-2">
                {p.findings.map((f) => {
                  const FIcon = ICON[f.status];
                  return (
                    <div key={f.title} className="flex items-start gap-2 text-xs">
                      <div className={`rounded p-1 ${TONE[f.status]}`}><FIcon className="h-3 w-3" /></div>
                      <div>
                        <div className="font-medium">{f.title}</div>
                        <div className="text-muted-foreground">{f.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
