import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProject, setApproval } from "@/lib/projects.functions";
import { AGENTS, AGENT_BY_KEY, APPROVAL_STAGES, STAGE_ORDER, type AgentKey } from "@/lib/agents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Compass, ListChecks, Boxes, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye, Loader2, Play,
  CheckCircle2, Circle, XCircle, ChevronRight, FileText, ArrowLeft, Workflow,
} from "lucide-react";
import { ArtifactView } from "@/components/artifact-view";
import { DEMO_PROJECT_ID, demoProject, demoRuns, demoApprovals, demoArtifacts } from "@/lib/demo-blueprint";
import { OrchestrationOverlay } from "@/components/orchestration-overlay";
import { WorkspaceChat } from "@/components/workspace-chat";
import { MessageSquare } from "lucide-react";


const ICONS: Record<string, typeof Compass> = {
  Compass, ListChecks, Boxes, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye,
};

type RunStatus = "pending" | "running" | "completed" | "failed";
interface TimelineItem {
  key: AgentKey;
  name: string;
  status: RunStatus;
  summary?: string;
  output?: unknown;
  duration_ms?: number;
  at: string;
}

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { projectId } = Route.useParams();
  const isDemo = projectId === DEMO_PROJECT_ID;
  const get = useServerFn(getProject);
  const approve = useServerFn(setApproval);
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentKey | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<AgentKey | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const streamStartedRef = useRef(false);


  const { data: fetched, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get({ data: { id: projectId } }),
    enabled: !isDemo,
  });
  const data = isDemo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ({ project: demoProject as any, runs: demoRuns as any, artifacts: Object.entries(demoArtifacts).map(([kind, output]) => ({ kind, data: output })), approvals: demoApprovals as any })
    : fetched;

  // Seed timeline from persisted runs
  useEffect(() => {
    if (!data) return;
    if (timeline.length > 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seed: TimelineItem[] = (data.runs as any[]).map((r: any) => ({
      key: r.agent_key as AgentKey,
      name: r.agent_name,
      status: r.status as RunStatus,
      summary: r.summary ?? undefined,
      output: r.output,
      duration_ms: r.duration_ms ?? undefined,
      at: r.started_at,
    }));
    // Dedupe by agent key — keep last (most recent) entry per agent
    const byKey = new Map<string, TimelineItem>();
    for (const s of seed) byKey.set(s.key, s);
    const deduped = Array.from(byKey.values());
    setTimeline(deduped);
    if (deduped.length && !selectedArtifact) {
      const completed = deduped.filter((s) => s.status === "completed" && s.key !== "planner");
      if (completed.length) setSelectedArtifact(completed[completed.length - 1].key);
    }
  }, [data, timeline.length, selectedArtifact]);

  const startOrchestrator = useCallback(async () => {
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;
    setRunning(true);
    setTimeline([]);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as
              | { type: "start"; agent: AgentKey; name: string; at: string }
              | { type: "complete"; agent: AgentKey; name: string; summary: string; output: unknown; at: string; duration_ms: number }
              | { type: "error"; agent: AgentKey; message: string }
              | { type: "done"; overall_status: string };

            if (ev.type === "start") {
              setActiveAgent(ev.agent);
              setTimeline((tl) => [...tl, { key: ev.agent, name: ev.name, status: "running", at: ev.at }]);
            } else if (ev.type === "complete") {
              setTimeline((tl) =>
                tl.map((t) => t.key === ev.agent
                  ? { ...t, status: "completed", summary: ev.summary, output: ev.output, duration_ms: ev.duration_ms }
                  : t,
                ),
              );
              setSelectedArtifact(ev.agent);
            } else if (ev.type === "error") {
              setTimeline((tl) =>
                tl.map((t) => t.key === ev.agent ? { ...t, status: "failed", summary: ev.message } : t),
              );
              toast.error(`${AGENT_BY_KEY[ev.agent].name}: ${ev.message}`);
            } else if (ev.type === "done") {
              setActiveAgent(null);
              toast.success("Blueprint complete");
            }
          } catch (err) {
            console.error("Failed to parse event", err, line);
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Orchestration failed");
    } finally {
      setRunning(false);
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    }
  }, [projectId, qc]);

  // Auto-start on draft projects
  useEffect(() => {
    if (isDemo) return;
    if (data?.project?.status === "draft" && !streamStartedRef.current) {
      void startOrchestrator();
    }
  }, [data?.project?.status, startOrchestrator, isDemo]);

  const approveMut = useMutation({
    mutationFn: (stage: string) => approve({ data: { project_id: projectId, stage, approved: true } }),
    onSuccess: () => { toast.success("Approved"); qc.invalidateQueries({ queryKey: ["project", projectId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!isDemo && (isLoading || !data)) return <div className="p-8 text-sm text-muted-foreground">Loading workspace…</div>;
  if (!data) return null;

  const project = data.project;
  const runByKey: Record<string, TimelineItem | undefined> = Object.fromEntries(timeline.map((t) => [t.key, t]));
  const completedArtifacts = timeline.filter((t) => t.status === "completed" && t.key !== "planner");

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-3 flex items-center justify-between bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold truncate">{project.name}</h1>
              <Badge variant="outline" className="font-mono text-[10px]">{project.cloud}</Badge>
              <Badge variant="outline" className="font-mono text-[10px]">{project.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-2xl">{project.requirement}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(runByKey.solution?.status === "completed" || runByKey.cloud?.status === "completed") && (
            <Button asChild variant="outline" size="sm">
              <Link to="/projects/$projectId/architecture" params={{ projectId }}>
                <Workflow className="h-3.5 w-3.5 mr-1.5" /> Architecture
              </Link>
            </Button>
          )}
          {project.status === "completed" && (
            <Button asChild variant="outline" size="sm">
              <Link to="/projects/$projectId/blueprint" params={{ projectId }}>
                <FileText className="h-3.5 w-3.5 mr-1.5" /> View Blueprint
              </Link>
            </Button>
          )}
          {(project.status === "failed" || project.status === "draft") && !running && (
            <Button size="sm" onClick={() => { streamStartedRef.current = false; void startOrchestrator(); }}>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run orchestrator
            </Button>
          )}
          <Button
            size="sm"
            variant={chatOpen ? "default" : "outline"}
            onClick={() => setChatOpen((v) => !v)}
            className={chatOpen ? "bg-foreground text-background hover:bg-foreground/90" : ""}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Ask
          </Button>
          {running && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {activeAgent ? AGENT_BY_KEY[activeAgent].name : "planning"}
            </div>
          )}
        </div>
      </header>

      <OrchestrationOverlay
        open={running}
        activeAgent={activeAgent}
        timeline={timeline}
        projectName={project.name}
        onClose={() => setRunning(false)}
      />


      {/* 3-column layout */}
      <div className="flex-1 grid grid-cols-[240px_1fr_480px] min-h-0">
        {/* Agent roster */}
        <aside className="border-r border-border/40 overflow-y-auto p-3 space-y-1 bg-sidebar/40">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Agents</div>
          {AGENTS.map((a) => {
            const Icon = ICONS[a.icon] ?? Compass;
            const run = runByKey[a.key];
            const status = run?.status ?? "pending";
            const isActive = activeAgent === a.key;
            return (
              <button
                key={a.key}
                onClick={() => run?.status === "completed" && setSelectedArtifact(a.key)}
                className={`w-full text-left rounded-md p-2 flex items-start gap-2.5 transition ${
                  selectedArtifact === a.key ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <div className={`rounded-md p-1.5 mt-0.5 ring-1 ${
                  isActive ? "bg-aether/30 ring-aether pulse-ring" :
                  status === "completed" ? "bg-success/20 ring-success/40" :
                  status === "failed" ? "bg-destructive/20 ring-destructive/40" :
                  "bg-secondary ring-border"
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{a.name}</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">
                    {status === "running" ? "thinking…" : status}
                  </div>
                </div>
                <StatusIcon status={status} />
              </button>
            );
          })}
        </aside>

        {/* Timeline */}
        <section className="min-w-0 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Engineering Timeline</div>
            {running && <span className="ml-2 text-[10px] font-mono text-muted-foreground animate-pulse">live</span>}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-3">
              <AnimatePresence>
                {timeline.map((item, i) => {
                  const spec = AGENT_BY_KEY[item.key];
                  const Icon = ICONS[spec.icon] ?? Compass;
                  return (
                    <motion.div
                      key={item.key + item.at}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`glass-panel rounded-lg p-4 ${item.status === "running" ? "border-aether/50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-md p-2 ${
                          item.status === "running" ? "bg-aether/20 shimmer" :
                          item.status === "completed" ? "bg-success/10" :
                          item.status === "failed" ? "bg-destructive/10" : "bg-secondary"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{item.name}</span>
                            <StatusIcon status={item.status} />
                            {item.duration_ms != null && (
                              <span className="text-[10px] font-mono text-muted-foreground">{(item.duration_ms / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                          {item.summary && (
                            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                          )}
                          {item.status === "running" && !item.summary && (
                            <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                              <div className="h-full w-1/3 shimmer" />
                            </div>
                          )}
                          {item.status === "completed" && item.key !== "planner" && (
                            <button
                              onClick={() => setSelectedArtifact(item.key)}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-aether hover:underline"
                            >
                              View artifact <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {timeline.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-16">
                  Waiting for orchestrator to start…
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Approval gates */}
          <div className="border-t border-border/40 px-6 py-3 flex flex-wrap gap-2">
            {APPROVAL_STAGES.map((stage) => {
              const gateReady = runByKey[stage.after]?.status === "completed";
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const approved = (data.approvals as any[]).find((a: any) => a.stage === stage.key)?.approved === true;
              return (
                <Button
                  key={stage.key} size="sm" variant={approved ? "default" : "outline"}
                  disabled={!gateReady || approved || approveMut.isPending}
                  onClick={() => approveMut.mutate(stage.key)}
                  className={approved ? "bg-success text-primary-foreground hover:bg-success/90" : ""}
                >
                  {approved ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : null}
                  {approved ? `${stage.label} ✓` : stage.label}
                </Button>
              );
            })}
          </div>
        </section>

        {/* Right rail: artifacts or chat */}
        <aside className="border-l border-border min-w-0 overflow-hidden flex flex-col bg-background/60">
          {chatOpen ? (
            <WorkspaceChat projectId={projectId} projectName={project.name} />
          ) : (
            <Tabs
              value={selectedArtifact ?? undefined}
              onValueChange={(v) => setSelectedArtifact(v as AgentKey)}
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-border">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Artifacts</div>
                <TabsList className="w-full h-auto flex-wrap justify-start bg-transparent p-0 gap-1">
                  {completedArtifacts.map((t) => (
                    <TabsTrigger key={t.key} value={t.key} className="text-[10px] px-2 py-1 h-auto data-[state=active]:bg-secondary data-[state=active]:text-foreground">
                      {AGENT_BY_KEY[t.key].name.replace(" Agent", "")}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                {STAGE_ORDER.filter((k) => k !== "planner").map((k) => {
                  const item = runByKey[k];
                  if (!item?.output) return null;
                  return (
                    <TabsContent key={k} value={k} className="p-4 mt-0">
                      <ArtifactView kind={k} data={item.output} />
                    </TabsContent>
                  );
                })}
                {completedArtifacts.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Artifacts appear here as agents complete.
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          )}
        </aside>
      </div>

    </div>
  );
}

function StatusIcon({ status }: { status: RunStatus }) {
  if (status === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-aether" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}
