import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ShieldAlert, Gavel, FileCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/governance")({
  component: GovernancePage,
});

const POLICIES = [
  { id: "P-001", title: "Encryption at rest required", scope: "All datastores", severity: "high", enforced: true },
  { id: "P-002", title: "IAM least-privilege review", scope: "All roles", severity: "high", enforced: true },
  { id: "P-003", title: "PII must remain in-region", scope: "EU workloads", severity: "high", enforced: true },
  { id: "P-004", title: "Multi-AZ for production data", scope: "Production", severity: "medium", enforced: true },
  { id: "P-005", title: "Cost alert threshold $10k/mo", scope: "All projects", severity: "medium", enforced: false },
  { id: "P-006", title: "Approved base images only", scope: "Container workloads", severity: "medium", enforced: true },
];

const APPROVAL_LOG = [
  { at: "2 min ago",  project: "HealthCloud SaaS",   stage: "Blueprint",             actor: "you", state: "approved" },
  { at: "18 min ago", project: "Retail Order Engine", stage: "Security & Compliance", actor: "you", state: "approved" },
  { at: "1h ago",     project: "FinTech Ledger",      stage: "Architecture",          actor: "you", state: "approved" },
  { at: "3h ago",     project: "Streaming Analytics", stage: "Architecture",          actor: "you", state: "changes_requested" },
  { at: "yesterday",  project: "IoT Fleet Manager",   stage: "Blueprint",             actor: "you", state: "approved" },
];

const RISK_QUEUE = [
  { severity: "high",   project: "FinTech Ledger",      finding: "Cross-region replication uses default KMS key" },
  { severity: "medium", project: "Streaming Analytics", finding: "Auto-scaling upper bound may exhaust NAT bandwidth" },
  { severity: "low",    project: "IoT Fleet Manager",   finding: "Documentation missing runbook for cold-storage restore" },
];

export default function GovernancePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Governance</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Policies, approvals & risk</h1>
        <p className="mt-2 text-muted-foreground">
          Enforce architectural policy across every AI-generated blueprint. Review pending approvals and open risks.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={FileCheck}  label="Policies enforced"     value="5 / 6" />
        <Stat icon={Gavel}      label="Approvals this week"    value="12"     tone="aether" />
        <Stat icon={ShieldAlert} label="Open risks"            value="3"      tone="warn" />
      </div>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Policies</h2>
          <Button size="sm" variant="outline">+ New policy</Button>
        </div>
        <div className="divide-y divide-border/40">
          {POLICIES.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 py-3"
            >
              <div className="font-mono text-[10px] text-muted-foreground w-16">{p.id}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.scope}</div>
              </div>
              <Badge variant="outline" className={
                p.severity === "high" ? "border-destructive/40 text-destructive" :
                "border-border/60 text-muted-foreground"
              }>{p.severity}</Badge>
              <Badge variant={p.enforced ? "default" : "outline"} className={p.enforced ? "bg-success text-primary-foreground" : ""}>
                {p.enforced ? "Enforced" : "Advisory"}
              </Badge>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold mb-4">Approval log</h2>
          <div className="space-y-3">
            {APPROVAL_LOG.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className={`mt-0.5 rounded-md p-1 ${a.state === "approved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {a.state === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    <span className="font-medium">{a.project}</span>
                    <span className="text-muted-foreground"> · {a.stage}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.actor} · {a.at}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{a.state.replace("_"," ")}</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold mb-4">Risk queue</h2>
          <div className="space-y-3">
            {RISK_QUEUE.map((r, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                  r.severity === "high" ? "text-destructive" :
                  r.severity === "medium" ? "text-warning" : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.finding}</div>
                  <div className="text-xs text-muted-foreground">{r.project}</div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">{r.severity}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: string; tone?: "aether" | "warn" }) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${tone === "aether" ? "bg-aether/15 text-aether" : tone === "warn" ? "bg-warning/15 text-warning" : "bg-secondary text-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
