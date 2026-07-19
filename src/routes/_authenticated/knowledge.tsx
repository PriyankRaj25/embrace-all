import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Network, Database, Cloud, ShieldCheck, Boxes, Workflow, BookOpen, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/knowledge")({
  component: KnowledgePage,
});

type Node = { id: string; label: string; group: "service" | "pattern" | "standard" | "control" | "decision"; tags: string[]; summary: string };
type Edge = { from: string; to: string; kind: "implements" | "requires" | "relates" | "supersedes" };

const NODES: Node[] = [
  { id: "aws-rds", label: "AWS RDS (Aurora)", group: "service", tags: ["aws", "database", "managed"], summary: "Managed Postgres/MySQL with multi-AZ failover; anchor for OLTP workloads." },
  { id: "aws-s3", label: "AWS S3", group: "service", tags: ["aws", "storage"], summary: "Object storage w/ 11 9s durability; default for artifacts, backups, data lake." },
  { id: "aws-eks", label: "AWS EKS", group: "service", tags: ["aws", "kubernetes"], summary: "Managed control plane; pair w/ Fargate for burst, Karpenter for scale-out." },
  { id: "pat-microservices", label: "Microservices", group: "pattern", tags: ["architecture"], summary: "Bounded contexts owned by autonomous teams; enables independent deploy cadence." },
  { id: "pat-event-driven", label: "Event-Driven", group: "pattern", tags: ["messaging"], summary: "Producers publish domain events; consumers react asynchronously." },
  { id: "pat-multi-region", label: "Active-Active Multi-Region", group: "pattern", tags: ["reliability", "dr"], summary: "Two+ regions serve production traffic; DNS/global LB failover." },
  { id: "std-hipaa", label: "HIPAA", group: "standard", tags: ["compliance", "healthcare"], summary: "Administrative, physical & technical safeguards for PHI." },
  { id: "std-soc2", label: "SOC 2 Type II", group: "standard", tags: ["compliance", "trust"], summary: "Trust services criteria audited across 6-12 months." },
  { id: "ctl-encryption-rest", label: "Encryption at Rest", group: "control", tags: ["security"], summary: "KMS-managed keys w/ envelope encryption on all persistent stores." },
  { id: "ctl-mfa", label: "MFA on Privileged", group: "control", tags: ["security", "iam"], summary: "TOTP or WebAuthn required for admin & production access." },
  { id: "adr-postgres-default", label: "ADR-014 · Postgres as default OLTP", group: "decision", tags: ["decision", "database"], summary: "Adopt Postgres as default relational engine; Aurora on AWS." },
  { id: "adr-otel", label: "ADR-021 · OpenTelemetry", group: "decision", tags: ["observability"], summary: "OTel for traces/metrics/logs across all services." },
];

const EDGES: Edge[] = [
  { from: "adr-postgres-default", to: "aws-rds", kind: "implements" },
  { from: "pat-multi-region",     to: "aws-rds", kind: "requires" },
  { from: "aws-eks",              to: "pat-microservices", kind: "implements" },
  { from: "std-hipaa",            to: "ctl-encryption-rest", kind: "requires" },
  { from: "std-hipaa",            to: "ctl-mfa", kind: "requires" },
  { from: "std-soc2",             to: "ctl-mfa", kind: "requires" },
  { from: "pat-event-driven",     to: "pat-microservices", kind: "relates" },
  { from: "adr-otel",             to: "aws-eks", kind: "relates" },
];

const GROUP_META: Record<Node["group"], { icon: typeof Cloud; label: string; tone: string }> = {
  service:  { icon: Cloud,      label: "Cloud Service", tone: "text-aether bg-aether/10 border-aether/30" },
  pattern:  { icon: Workflow,   label: "Pattern",       tone: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  standard: { icon: ShieldCheck,label: "Standard",      tone: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
  control:  { icon: Boxes,      label: "Control",       tone: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  decision: { icon: BookOpen,   label: "Decision",      tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
};

export default function KnowledgePage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("aws-rds");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NODES;
    return NODES.filter((n) => n.label.toLowerCase().includes(s) || n.tags.some((t) => t.includes(s)));
  }, [q]);
  const node = NODES.find((n) => n.id === active)!;
  const related = EDGES.filter((e) => e.from === active || e.to === active)
    .map((e) => ({ edge: e, other: NODES.find((n) => n.id === (e.from === active ? e.to : e.from))! }))
    .filter((r) => r.other);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Knowledge Graph</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Engineering intelligence, connected</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Cloud services, patterns, standards, controls, and architectural decisions — the graph agents reason over.</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4 glass-panel rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search nodes, tags…" className="pl-8" />
          </div>
          <div className="divide-y divide-border/40 max-h-[560px] overflow-auto">
            {filtered.map((n) => {
              const meta = GROUP_META[n.group];
              const Icon = meta.icon;
              const isActive = n.id === active;
              return (
                <button key={n.id} onClick={() => setActive(n.id)}
                  className={`w-full text-left flex items-start gap-3 py-3 px-2 rounded transition ${isActive ? "bg-sidebar-accent/60" : "hover:bg-sidebar-accent/30"}`}>
                  <div className={`rounded-md p-1.5 border ${meta.tone}`}><Icon className="h-3.5 w-3.5" /></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{n.label}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{meta.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 md:col-span-8 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">{GROUP_META[node.group].label}</Badge>
                <h2 className="mt-2 text-2xl font-semibold">{node.label}</h2>
                <p className="mt-2 text-muted-foreground leading-relaxed">{node.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {node.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}
                </div>
              </div>
              <Database className="h-8 w-8 text-aether/40" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Network className="h-4 w-4 text-aether" />
              <h3 className="font-semibold">Relationships</h3>
              <Badge variant="outline" className="ml-auto font-mono">{related.length}</Badge>
            </div>
            <div className="space-y-2">
              {related.map(({ edge, other }) => (
                <button key={other.id} onClick={() => setActive(other.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border/40 p-3 hover:border-aether/40 transition text-left">
                  <Badge className="font-mono text-[10px] bg-aether/20 text-aether border-aether/40">{edge.kind}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{other.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{other.summary}</div>
                  </div>
                </button>
              ))}
              {related.length === 0 && <div className="text-sm text-muted-foreground">No relationships yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
