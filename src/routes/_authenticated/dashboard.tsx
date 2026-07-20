import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, deleteProject } from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Sparkles, Cloud, DollarSign, Clock, Workflow, FileText, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const STATUS_STYLES: Record<string, string> = {
  draft:             "bg-muted text-muted-foreground",
  running:           "bg-aether/20 text-aether border-aether/40",
  awaiting_approval: "bg-warning/20 text-warning border-warning/40",
  completed:         "bg-success/20 text-success border-success/40",
  failed:            "bg-destructive/20 text-destructive border-destructive/40",
};

function Dashboard() {
  const list = useServerFn(listProjects);
  const del = useServerFn(deleteProject);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => list(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Project deleted"); qc.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-aether">Projects</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your blueprints</h1>
          <p className="mt-2 text-sm text-muted-foreground">Every architecture AetherOS has designed for you.</p>
        </div>
        <Button asChild className="glow-aether">
          <Link to="/new"><PlusCircle className="h-4 w-4 mr-2" /> New Project</Link>
        </Button>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading projects…</div>}

      {!isLoading && (!projects || projects.length === 0) && (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-aether" />
          <h2 className="mt-4 text-xl font-semibold">No projects yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Describe a business requirement — AetherOS will design the whole architecture.</p>
          <Button asChild className="mt-6 glow-aether" onClick={() => navigate({ to: "/new" })}>
            <Link to="/new"><PlusCircle className="h-4 w-4 mr-2" /> Create your first project</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {projects?.map((p) => (
          <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
            className="group glass-panel rounded-xl p-5 hover:border-aether/40 transition flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{p.name}</h3>
                <Badge className={STATUS_STYLES[p.status] ?? ""} variant="outline">{p.status.replace("_"," ")}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{p.requirement}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5"><Cloud className="h-3 w-3" /> {p.cloud}</span>
                {p.estimated_monthly_cost != null && (
                  <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> ${Number(p.estimated_monthly_cost).toFixed(0)}/mo</span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(p.created_at))} ago</span>
                {p.compliance?.map((c: string) => (
                  <span key={c} className="rounded-sm bg-secondary/70 px-1.5 py-0.5">{c}</span>
                ))}
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={(e) => { e.preventDefault(); if (confirm("Delete this project?")) delMut.mutate(p.id); }}
              className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
