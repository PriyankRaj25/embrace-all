import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles, Send, Loader2, CheckCircle2, AlertTriangle, Cpu, ShieldCheck, Radar, KeyRound, Route as RouteIcon, FileCheck2, Wrench, Brain } from "lucide-react";
import { Streamdown } from "streamdown";
import { securityKpis } from "@/lib/security-demo";

export const Route = createFileRoute("/_authenticated/security/")({
  component: Overview,
});

type AgentKey = "recon" | "threat_intel" | "iam_auditor" | "attack_path" | "compliance" | "remediation" | "synthesizer";
type AgentStatus = "idle" | "running" | "done" | "error";

const AGENTS: { key: AgentKey; name: string; role: string; icon: typeof Radar }[] = [
  { key: "recon",        name: "Recon Agent",          role: "Exposed surface",          icon: Radar },
  { key: "threat_intel", name: "Threat Intelligence",  role: "TTPs & CVEs",              icon: Brain },
  { key: "iam_auditor",  name: "IAM Auditor",          role: "Privilege drift",          icon: KeyRound },
  { key: "attack_path",  name: "Attack Path Analyst",  role: "Blast radius",             icon: RouteIcon },
  { key: "compliance",   name: "Compliance Agent",     role: "SOC2 · HIPAA · PCI",       icon: FileCheck2 },
  { key: "remediation",  name: "Remediation Engineer", role: "Auto-generated IaC fixes", icon: Wrench },
];

const SUGGESTIONS = [
  "Run a full posture assessment right now",
  "What is our most critical attack path?",
  "Are we SOC 2 audit-ready?",
  "Show me every PHI exposure risk",
  "Which IAM roles could take over the account?",
];

type Panel = { status: AgentStatus; text: string; startedAt?: number; durationMs?: number };

function initialPanels(): Record<AgentKey, Panel> {
  const obj = {} as Record<AgentKey, Panel>;
  for (const a of AGENTS) obj[a.key] = { status: "idle", text: "" };
  obj.synthesizer = { status: "idle", text: "" };
  return obj;
}

function Overview() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [panels, setPanels] = useState<Record<AgentKey, Panel>>(initialPanels());
  const abortRef = useRef<AbortController | null>(null);

  const runOrchestration = useCallback(async (q: string) => {
    if (!q.trim() || running) return;
    setRunning(true);
    setPanels(initialPanels());

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/security-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as
              | { type: "start"; agent: AgentKey }
              | { type: "delta"; agent: AgentKey; text: string }
              | { type: "done"; agent: AgentKey }
              | { type: "error"; agent?: AgentKey; message: string }
              | { type: "final" };

            setPanels((prev) => {
              const next = { ...prev };
              if (ev.type === "start" && ev.agent) {
                next[ev.agent] = { status: "running", text: "", startedAt: Date.now() };
              } else if (ev.type === "delta" && ev.agent) {
                const p = next[ev.agent] ?? { status: "running", text: "" };
                next[ev.agent] = { ...p, text: p.text + ev.text };
              } else if (ev.type === "done" && ev.agent) {
                const p = next[ev.agent];
                next[ev.agent] = { ...p, status: "done", durationMs: p.startedAt ? Date.now() - p.startedAt : undefined };
              } else if (ev.type === "error" && ev.agent) {
                next[ev.agent] = { ...(next[ev.agent] ?? { text: "" }), status: "error" };
              }
              return next;
            });
          } catch {
            /* skip malformed line */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [running]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const progress = useMemo(() => {
    const total = AGENTS.length;
    const done = AGENTS.filter((a) => panels[a.key].status === "done").length;
    return { done, total };
  }, [panels]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent · Live</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Multi-agent security orchestration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ask a question. Six specialists reason in parallel across your cloud, identity, and compliance surface.</p>
        </div>
        <Link to="/security/attack-paths" className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          Investigate critical paths <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Prompt input */}
      <form
        onSubmit={(e) => { e.preventDefault(); runOrchestration(query); }}
        className="glass-heavy rounded-2xl p-4 fade-up"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl neumorph-sm shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the security agents anything — e.g. what's our biggest risk right now?"
            disabled={running}
            className="flex-1 bg-transparent text-sm px-3 py-2 outline-none neumorph-inset rounded-lg disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={running || !query.trim()}
            className="h-9 px-4 rounded-lg bg-foreground text-background text-xs font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
          >
            {running ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Orchestrating</> : <><Send className="h-3.5 w-3.5" /> Run</>}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuery(s); runOrchestration(s); }}
              disabled={running}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        {(running || progress.done > 0) && (
          <div className="mt-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-foreground animate-pulse" : "bg-foreground"}`} />
            <span>{running ? "agents reasoning in parallel" : "orchestration complete"}</span>
            <div className="flex-1 h-0.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-foreground transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <span>{progress.done}/{progress.total}</span>
          </div>
        )}
      </form>

      {/* Agent grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {AGENTS.map((a) => {
          const p = panels[a.key];
          const Icon = a.icon;
          return (
            <div key={a.key} className={`glass-panel rounded-2xl p-4 flex flex-col min-h-[220px] transition ${p.status === "running" ? "ring-1 ring-foreground/20" : ""}`}>
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg neumorph-sm shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate">{a.name}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground truncate">{a.role}</div>
                </div>
                <StatusPill status={p.status} durationMs={p.durationMs} />
              </div>
              <div className="mt-3 flex-1 text-[12px] leading-relaxed text-foreground/90 overflow-hidden">
                {p.text ? (
                  <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:text-[11px] [&_pre]:text-[11px] [&_pre]:bg-secondary/50 [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto [&_ul]:pl-4 [&_ul]:list-disc [&_li]:my-0.5">
                    {p.text}
                  </Streamdown>
                ) : p.status === "running" ? (
                  <ThinkingSkeleton />
                ) : (
                  <div className="text-[11px] text-muted-foreground italic">Standing by…</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesizer */}
      {(panels.synthesizer.status !== "idle" || running) && (
        <div className="glass-heavy rounded-2xl p-5 fade-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg neumorph-sm">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Chief Synthesizer</div>
              <div className="text-sm font-medium">Executive brief</div>
            </div>
            <StatusPill status={panels.synthesizer.status} durationMs={panels.synthesizer.durationMs} />
          </div>
          <div className="text-[13px] leading-relaxed">
            {panels.synthesizer.text ? (
              <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:font-semibold [&_h3]:text-[13px] [&_h3]:mt-3 [&_h3]:font-semibold [&_ul]:pl-4 [&_ul]:list-disc">
                {panels.synthesizer.text}
              </Streamdown>
            ) : (
              <ThinkingSkeleton />
            )}
          </div>
        </div>
      )}

      {/* Ambient posture strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={AlertTriangle}  label="Critical risks"    value={securityKpis.criticalRisks} />
        <MiniStat icon={RouteIcon}      label="Attack paths"      value={securityKpis.activeAttackPaths} />
        <MiniStat icon={ShieldCheck}    label="Compliance"        value={`${securityKpis.complianceScore}%`} />
        <MiniStat icon={KeyRound}       label="High-risk IAM"     value={securityKpis.highRiskIam} />
      </div>
    </div>
  );
}

function StatusPill({ status, durationMs }: { status: AgentStatus; durationMs?: number }) {
  if (status === "running") {
    return <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-foreground"><Loader2 className="h-3 w-3 animate-spin" /> thinking</span>;
  }
  if (status === "done") {
    return <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> {durationMs ? `${(durationMs / 1000).toFixed(1)}s` : "done"}</span>;
  }
  if (status === "error") {
    return <span className="text-[9px] font-mono uppercase tracking-widest text-destructive">error</span>;
  }
  return <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">idle</span>;
}

function ThinkingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-2 rounded bg-secondary/60 shimmer w-4/5" />
      <div className="h-2 rounded bg-secondary/60 shimmer w-3/5" />
      <div className="h-2 rounded bg-secondary/60 shimmer w-2/3" />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Radar; label: string; value: string | number }) {
  return (
    <div className="neumorph-sm rounded-xl p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <div className="text-[9px] font-mono uppercase tracking-widest">{label}</div>
      </div>
      <div className="mt-1.5 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
