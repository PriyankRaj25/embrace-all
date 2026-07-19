import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, User, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/adrs")({
  component: AdrsPage,
});

type Status = "accepted" | "proposed" | "superseded" | "deprecated";
type ADR = { id: string; title: string; status: Status; date: string; author: string; tags: string[]; context: string; decision: string };

const ADRS: ADR[] = [
  { id: "ADR-001", title: "Adopt event-driven architecture for order flow", status: "accepted", date: "2026-03-14", author: "Sara Okoye",
    tags: ["architecture","messaging"], context: "Sync REST created tight coupling and cascading failures.", decision: "Use domain events over Kafka; enforce outbox pattern in publishers." },
  { id: "ADR-002", title: "Aurora Postgres as default OLTP", status: "accepted", date: "2026-03-22", author: "Priya Menon",
    tags: ["database","aws"], context: "Multiple OLTP options in flight; team fragmentation on Postgres vs MySQL.", decision: "Aurora Postgres for all new services; MySQL only for legacy carve-outs." },
  { id: "ADR-003", title: "Deploy to multi-region active-active", status: "proposed", date: "2026-05-02", author: "Marcus Riehl",
    tags: ["reliability","dr"], context: "SLA promises 99.99% with 4-hr RTO; single region cannot meet.", decision: "Adopt active-active across us-east-1 and eu-west-1 for tier-1 services." },
  { id: "ADR-004", title: "OpenTelemetry for all observability", status: "accepted", date: "2026-04-11", author: "James Chen",
    tags: ["observability"], context: "Vendor lock-in and metric fragmentation.", decision: "Instrument every service with OTel; export to any backend." },
  { id: "ADR-005", title: "Deprecate custom RBAC in favor of Keto", status: "superseded", date: "2025-11-08", author: "Sara Okoye",
    tags: ["security","iam"], context: "Hand-rolled RBAC hard to audit.", decision: "Adopt ORY Keto for authorization decisions." },
];

const TONE: Record<Status, string> = {
  accepted:   "bg-success/10 text-success border-success/40",
  proposed:   "bg-aether/10 text-aether border-aether/40",
  superseded: "bg-muted text-muted-foreground",
  deprecated: "bg-destructive/10 text-destructive border-destructive/40",
};

function AdrsPage() {
  const [q, setQ] = useState("");
  const list = ADRS.filter((a) => q === "" || a.title.toLowerCase().includes(q.toLowerCase()) || a.tags.join(" ").includes(q.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Architecture Decision Records</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Every architectural decision, versioned</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">The Documentation agent generates an ADR for every material choice, so no decision is lost.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ADRs…" className="pl-8" />
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <details key={a.id} className="glass-panel rounded-xl group">
            <summary className="cursor-pointer p-5 flex items-start gap-4">
              <BookOpen className="h-4 w-4 text-aether mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-muted-foreground">{a.id}</span>
                  <span className="font-medium">{a.title}</span>
                  <Badge variant="outline" className={TONE[a.status]}>{a.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{a.date}</span>
                  {a.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}
                </div>
              </div>
            </summary>
            <div className="px-5 pb-5 pt-0 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Context</div>
                <p className="text-sm">{a.context}</p>
              </div>
              <div className="rounded-lg border border-aether/30 p-4 bg-aether/5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-aether mb-1">Decision</div>
                <p className="text-sm">{a.decision}</p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
