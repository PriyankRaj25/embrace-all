import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, CheckCircle2, Clock, XCircle, Rocket, PlayCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/deployments")({
  component: DeploymentsPage,
});

type Stage = { name: string; status: "success" | "running" | "failed" | "pending" };
type Pipeline = { id: string; project: string; env: "dev" | "staging" | "prod"; commit: string; author: string; triggered: string; stages: Stage[] };

const PIPELINES: Pipeline[] = [
  { id: "run-2891", project: "healthcare-saas", env: "prod",    commit: "a1b2c3d", author: "sara@acme.com",   triggered: "12m ago",
    stages: [ { name: "Plan", status: "success" }, { name: "Policy", status: "success" }, { name: "Apply", status: "running" }, { name: "Verify", status: "pending" } ] },
  { id: "run-2890", project: "fintech-ledger",  env: "staging", commit: "9e8f7d6", author: "priya@acme.com",  triggered: "1h ago",
    stages: [ { name: "Plan", status: "success" }, { name: "Policy", status: "success" }, { name: "Apply", status: "success" }, { name: "Verify", status: "success" } ] },
  { id: "run-2889", project: "retail-platform", env: "prod",    commit: "4c5b6a7", author: "james@acme.com",  triggered: "3h ago",
    stages: [ { name: "Plan", status: "success" }, { name: "Policy", status: "failed" },  { name: "Apply", status: "pending" }, { name: "Verify", status: "pending" } ] },
];

const ICON = { success: CheckCircle2, running: Clock, failed: XCircle, pending: Clock };
const TONE = { success: "text-success", running: "text-aether animate-pulse", failed: "text-destructive", pending: "text-muted-foreground/50" };
const ENV_TONE = { prod: "bg-rose-500/10 text-rose-300 border-rose-500/30", staging: "bg-amber-500/10 text-amber-300 border-amber-500/30", dev: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };

function DeploymentsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Deployments</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pipelines & release control</h1>
          <p className="mt-2 text-muted-foreground max-w-3xl">Every apply of generated IaC, gated by policy checks and human approvals.</p>
        </div>
        <Button className="bg-aether hover:bg-aether/90"><Rocket className="h-4 w-4 mr-2" /> New deployment</Button>
      </header>

      <div className="space-y-3">
        {PIPELINES.map((p) => (
          <div key={p.id} className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <Badge variant="outline" className={`uppercase font-mono ${ENV_TONE[p.env]}`}>{p.env}</Badge>
              <span className="font-medium">{p.project}</span>
              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1"><GitBranch className="h-3 w-3" /> {p.commit}</span>
              <span className="text-xs text-muted-foreground">{p.author}</span>
              <span className="ml-auto text-xs text-muted-foreground">{p.triggered}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {p.stages.map((s, idx) => {
                const Icon = ICON[s.status];
                return (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 ${s.status === "running" ? "border-aether/50 bg-aether/5" : ""}`}>
                      <Icon className={`h-3.5 w-3.5 ${TONE[s.status]}`} />
                      <span className="text-sm">{s.name}</span>
                    </div>
                    {idx < p.stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/50" />}
                  </div>
                );
              })}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm"><PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Rerun</Button>
                <Button variant="outline" size="sm">Logs</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
