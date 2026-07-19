import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/projects.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, Filter } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/approvals")({
  component: ApprovalsPage,
});

// Mocked pending approvals aggregated across projects.
const MOCK_APPROVALS = [
  { id: "ap-1", project: "healthcare-saas", stage: "Architecture Review", requestedBy: "Solution Agent", risk: "medium", age: "12m", summary: "Multi-region active-active proposed w/ Aurora Global." },
  { id: "ap-2", project: "fintech-ledger",  stage: "Cost > Threshold",   requestedBy: "FinOps Agent",   risk: "high",   age: "1h",  summary: "Projected monthly cost $18,400 exceeds team budget by 12%." },
  { id: "ap-3", project: "retail-platform", stage: "PII Handling",        requestedBy: "Security Agent", risk: "high",   age: "3h",  summary: "PII flowing into search index without tokenization." },
  { id: "ap-4", project: "healthcare-saas", stage: "Compliance Gate",     requestedBy: "Compliance",     risk: "low",    age: "5h",  summary: "HIPAA controls at 92% — signoff needed for the remaining 8%." },
];

const RISK_TONE: Record<string, string> = {
  high:   "text-destructive bg-destructive/10 border-destructive/40",
  medium: "text-warning bg-warning/10 border-warning/40",
  low:    "text-success bg-success/10 border-success/40",
};

function ApprovalsPage() {
  const list = useServerFn(listProjects);
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: () => list() });
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const filtered = MOCK_APPROVALS.filter((a) => filter === "all" || a.risk === filter);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Approval Center</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Human-in-the-loop, everywhere it matters</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Every gate that requires a human signoff across your projects, one queue.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending", value: String(filtered.length), tone: "text-warning" },
          { label: "Approved · 7d", value: "18", tone: "text-success" },
          { label: "Rejected · 7d", value: "3",  tone: "text-destructive" },
          { label: "Avg. response",   value: "1h 42m", tone: "text-aether" },
        ].map((k) => (
          <div key={k.label} className="glass-panel rounded-xl p-5">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`mt-1 text-2xl font-semibold font-mono ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex gap-1 rounded-lg border border-border/40 p-1 text-xs">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md capitalize transition ${filter === f ? "bg-aether/20 text-aether" : "text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      <section className="glass-panel rounded-xl divide-y divide-border/40">
        {filtered.map((a) => (
          <div key={a.id} className="p-5 flex items-start gap-4">
            <Clock className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{a.stage}</span>
                <Badge variant="outline" className={RISK_TONE[a.risk]}>{a.risk} risk</Badge>
                <span className="text-xs text-muted-foreground">· {a.project} · requested by {a.requestedBy}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90"><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve</Button>
                <Button size="sm" variant="outline"><XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject</Button>
                <span className="ml-2 text-xs text-muted-foreground">{a.age} ago</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No approvals matching this filter.</div>}
      </section>

      {projects && projects.length > 0 && (
        <section className="glass-panel rounded-xl p-6">
          <div className="font-semibold mb-3">Recent projects</div>
          <div className="grid gap-2 md:grid-cols-2">
            {projects.slice(0, 6).map((p) => (
              <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:border-aether/40 transition">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{String(p.cloud).toUpperCase()} · {p.status}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
