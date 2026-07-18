import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getProject } from "@/lib/projects.functions";
import { AGENT_BY_KEY, type AgentKey } from "@/lib/agents";
import { listAudit, listComments, listSnapshots, type AuditEntry } from "@/lib/local-store";
import { ArrowLeft, Play, CheckCircle2, XCircle, MessageSquare, Save, Filter, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/projects/$projectId/audit")({
  component: AuditPage,
});

type Row = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
  category: AuditEntry["category"];
};

function AuditPage() {
  const { projectId } = Route.useParams();
  const get = useServerFn(getProject);
  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get({ data: { id: projectId } }),
  });

  const [filter, setFilter] = useState<Row["category"] | "all">("all");
  const [local, setLocal] = useState<AuditEntry[]>([]);
  useEffect(() => {
    setLocal(listAudit(projectId));
    // Fold in comment + snapshot records that may pre-date audit logging
    const cs = listComments(projectId).map<AuditEntry>((c) => ({
      id: "c:" + c.id, at: c.at, actor: c.author,
      action: `commented on ${c.kind}`, detail: c.body, category: "comment",
    }));
    const ss = listSnapshots(projectId).map<AuditEntry>((s) => ({
      id: "s:" + s.id, at: s.at, actor: s.author,
      action: `saved snapshot "${s.label}"`, detail: s.note, category: "snapshot",
    }));
    const seen = new Set(listAudit(projectId).map((a) => a.id));
    setLocal((cur) => [...cur, ...cs.filter((c) => !seen.has(c.id)), ...ss.filter((s) => !seen.has(s.id))]);
  }, [projectId]);

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const runRows: Row[] = data.runs.map((r) => ({
      id: "r:" + r.id, at: r.started_at, actor: "orchestrator",
      action: `${AGENT_BY_KEY[r.agent_key as AgentKey]?.name ?? r.agent_name} · ${r.status}`,
      detail: r.summary ?? undefined, category: "run",
    }));
    const apr: Row[] = data.approvals.map((a) => ({
      id: "a:" + a.id, at: a.decided_at ?? a.created_at, actor: "reviewer",
      action: `${a.approved ? "approved" : "rejected"} gate "${a.stage}"`,
      detail: a.notes ?? undefined, category: "approval",
    }));
    return [...runRows, ...apr, ...local]
      .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
  }, [data, local]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.category === filter);

  function exportCsv() {
    const header = "timestamp,category,actor,action,detail\n";
    const body = filtered.map((r) =>
      [r.at, r.category, r.actor, r.action, (r.detail ?? "").replace(/"/g, '""')]
        .map((v) => `"${v}"`).join(","),
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data?.project.name.replace(/\s+/g, "-").toLowerCase() ?? "project"}-audit.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !data) return <div className="p-8 text-sm text-muted-foreground">Loading audit trail…</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 px-8 py-5 flex items-center justify-between bg-background/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/projects/$projectId" params={{ projectId }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Audit Trail</div>
            <h1 className="text-lg font-semibold">{data.project.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Filter className="h-3 w-3" />
          </div>
          {(["all", "run", "approval", "comment", "snapshot"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={filter === k ? "default" : "outline"}
              onClick={() => setFilter(k)}
              className="h-7 px-2 text-[10px] font-mono uppercase"
            >
              {k}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportCsv} className="ml-2">
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        <div className="glass-panel rounded-2xl p-2">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No events for this filter.</div>
          ) : (
            <ol className="relative">
              {filtered.map((r) => (
                <li key={r.id} className="flex gap-4 p-4 border-b border-border/30 last:border-0">
                  <div className="pt-1">{categoryIcon(r.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.action}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{r.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">· {r.actor}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.at).toLocaleString()}</span>
                    </div>
                    {r.detail && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function categoryIcon(c: Row["category"]) {
  const cls = "h-4 w-4";
  switch (c) {
    case "run": return <Play className={`${cls} text-aether`} />;
    case "approval": return <CheckCircle2 className={`${cls} text-success`} />;
    case "comment": return <MessageSquare className={`${cls} text-warning`} />;
    case "snapshot": return <Save className={`${cls} text-aether`} />;
    default: return <XCircle className={cls} />;
  }
}
