import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/projects.functions";
import { Badge } from "@/components/ui/badge";
import { Activity, Bot, MessageSquareText, GitCommit, ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

const FEED = [
  { icon: Bot,               tone: "text-aether",     title: "Solution Agent completed",   detail: "generated architecture for healthcare-saas",   ts: "2m ago" },
  { icon: ShieldCheck,       tone: "text-success",    title: "Compliance passed",          detail: "HIPAA control coverage reached 92% on fintech-ledger", ts: "6m ago" },
  { icon: User,              tone: "text-warning",    title: "Approval requested",         detail: "Cost overrun on fintech-ledger — awaiting @sara",   ts: "18m ago" },
  { icon: MessageSquareText, tone: "text-cyan-300",   title: "Comment added",              detail: "James Chen commented on retail-platform IaC",       ts: "34m ago" },
  { icon: GitCommit,         tone: "text-emerald-300",title: "Blueprint v4 snapshot",      detail: "healthcare-saas — automated version cut",           ts: "1h ago" },
  { icon: Bot,               tone: "text-aether",     title: "FinOps Agent projected",     detail: "$14,220/mo projected for retail-platform prod",     ts: "2h ago" },
];

function ActivityPage() {
  const list = useServerFn(listProjects);
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: () => list() });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Activity Feed</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Everything that happened, in one stream</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Agent completions, approvals, comments, snapshots — all your engineering activity across projects.</p>
      </header>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-aether" /><h2 className="font-semibold">Live feed</h2></div>
        <div className="space-y-4 relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border/40" />
          {FEED.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="relative flex gap-4 pl-0">
                <div className={`h-8 w-8 rounded-full grid place-items-center bg-background border border-border/40 z-10 ${f.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 rounded-lg border border-border/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{f.title}</div>
                    <span className="text-xs text-muted-foreground shrink-0">{f.ts}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{f.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {projects && projects.length > 0 && (
        <section className="glass-panel rounded-xl p-6">
          <div className="font-semibold mb-3">Jump into a project</div>
          <div className="flex flex-wrap gap-2">
            {projects.slice(0, 8).map((p) => (
              <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}>
                <Badge variant="outline" className="hover:border-aether/40 transition cursor-pointer py-1.5">{p.name}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
