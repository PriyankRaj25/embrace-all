import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/lib/projects.functions";
import { AGENT_BY_KEY, STAGE_ORDER, type AgentKey } from "@/lib/agents";
import { ArtifactView } from "@/components/artifact-view";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ClipboardList } from "lucide-react";
import { BlueprintVersions } from "@/components/blueprint-versions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/blueprint")({
  component: Blueprint,
});

function Blueprint() {
  const { projectId } = Route.useParams();
  const get = useServerFn(getProject);
  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get({ data: { id: projectId } }),
  });

  if (isLoading || !data) return <div className="p-8 text-sm text-muted-foreground">Loading blueprint…</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project: any = data.project;
  const artifactsByKind: Record<string, unknown> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.artifacts.forEach((a: any) => { artifactsByKind[a.kind] = a.data; });

  function downloadJson() {
    const blob = new Blob([JSON.stringify({ project: data!.project, artifacts: artifactsByKind }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kinds = STAGE_ORDER.filter((k) => k !== "planner" && artifactsByKind[k]) as AgentKey[];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 px-8 py-5 flex items-center justify-between bg-background/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/projects/$projectId" params={{ projectId }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Blueprint</div>
            <h1 className="text-lg font-semibold">{project.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/projects/$projectId/audit" params={{ projectId }}>
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Audit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export JSON
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* Summary */}
        {/* @ts-expect-error tsgo widens JSX children through generic Query data */}
        <SummaryCard project={project} />


        {/* Architecture diagram */}
        {(artifactsByKind.solution || artifactsByKind.cloud) && (
          <section className="glass-panel rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-aether">§</span> Architecture Diagram
            </h2>
            <ArchitectureDiagram
              solution={artifactsByKind.solution as Parameters<typeof ArchitectureDiagram>[0]["solution"]}
              cloud={artifactsByKind.cloud as Parameters<typeof ArchitectureDiagram>[0]["cloud"]}
            />
          </section>
        )}

        {/* Sections */}
        <div className="space-y-8">
          {kinds.map((k) => (
            <section key={k} className="glass-panel rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-aether">§</span> {AGENT_BY_KEY[k].name.replace(" Agent", "")}
              </h2>
              <ArtifactView kind={k} data={artifactsByKind[k]} />
            </section>
          ))}
        </div>

        <div className="mt-8">
          <BlueprintVersions
            projectId={projectId}
            projectName={project.name}
            currentData={{ project, artifacts: artifactsByKind }}
          />
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SummaryCard({ project }: { project: any }) {
  const compliance: string[] = Array.isArray(project.compliance) ? project.compliance : [];
  const cost = project.estimated_monthly_cost;
  return (
    <div className="glass-panel rounded-2xl p-8 mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge className="bg-aether/20 text-aether border-aether/40 font-mono">{String(project.cloud)}</Badge>
        {compliance.map((c) => (<Badge key={c} variant="outline">{c}</Badge>))}
        {cost != null ? (
          <Badge variant="outline" className="ml-auto">${Number(cost).toFixed(0)}/mo</Badge>
        ) : null}
      </div>
      <p className="text-lg leading-relaxed">{String(project.requirement ?? "")}</p>
    </div>
  );
}
