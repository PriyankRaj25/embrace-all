import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/lib/projects.functions";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_PROJECT_ID, demoProject, demoArtifacts } from "@/lib/demo-blueprint";

export const Route = createFileRoute("/_authenticated/projects/$projectId/architecture")({
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const { projectId } = Route.useParams();
  const isDemo = projectId === DEMO_PROJECT_ID;
  const get = useServerFn(getProject);
  const { data: fetched, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get({ data: { id: projectId } }),
    enabled: !isDemo,
  });
  const data = isDemo
    ? { project: demoProject, artifacts: Object.entries(demoArtifacts).map(([kind, d]) => ({ kind, data: d })) }
    : fetched;

  if (!isDemo && (isLoading || !data)) return <div className="p-8 text-sm text-muted-foreground">Loading architecture…</div>;
  if (!data) return null;

  const byKind: Record<string, unknown> = {};
  data.artifacts.forEach((a) => { byKind[a.kind] = a.data; });
  const solution = byKind.solution as Parameters<typeof ArchitectureDiagram>[0]["solution"];
  const cloud = byKind.cloud as Parameters<typeof ArchitectureDiagram>[0]["cloud"];

  function downloadSvg() {
    const svg = document.querySelector(".mermaid-host svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data!.project.name.replace(/\s+/g, "-").toLowerCase()}-architecture.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 px-8 py-5 flex items-center justify-between bg-background/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/projects/$projectId" params={{ projectId }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Architecture</div>
            <h1 className="text-lg font-semibold">{data.project.name}</h1>
          </div>
          <Badge variant="outline" className="font-mono ml-2">{data.project.cloud}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={downloadSvg}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export SVG
        </Button>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <ArchitectureDiagram solution={solution} cloud={cloud} />

        {solution?.pattern && (
          <div className="glass-panel rounded-xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Pattern</div>
            <div className="text-sm">{solution.pattern}</div>
          </div>
        )}

        {cloud?.networking && (
          <div className="glass-panel rounded-xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Networking</div>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div><div className="text-muted-foreground">VPC</div><div>{cloud.networking.vpc}</div></div>
              <div><div className="text-muted-foreground">Ingress</div><div>{cloud.networking.ingress}</div></div>
              <div><div className="text-muted-foreground">Subnets</div><div>{cloud.networking.subnets?.join(", ")}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
