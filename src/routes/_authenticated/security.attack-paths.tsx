import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { attackPath, otherPaths, type AttackNode } from "@/lib/security-demo";
import { Sparkles, Play, ChevronRight, ShieldAlert, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/security/attack-paths")({
  component: AttackPaths,
});

function AttackPaths() {
  const [selectedId, setSelectedId] = useState<string>(attackPath[3].id);
  const [simIdx, setSimIdx] = useState<number | null>(null);
  const [explain, setExplain] = useState(false);
  const selected = useMemo(() => attackPath.find((n) => n.id === selectedId)!, [selectedId]);

  function simulate() {
    setSimIdx(0);
    const step = (i: number) => {
      if (i >= attackPath.length) { setSimIdx(null); return; }
      setSimIdx(i);
      setTimeout(() => step(i + 1), 700);
    };
    step(0);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Attack Path Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">Autonomous discovery of exploitable paths from internet to crown-jewel data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExplain((v) => !v)}><Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Explain</Button>
          <Button size="sm" onClick={simulate}><Play className="h-3.5 w-3.5 mr-1.5" /> Simulate Attack</Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Critical path #1</div>
              <h2 className="text-sm font-medium mt-0.5">Internet → Customer PHI</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> risk 96</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> 6 hops</span>
            </div>
          </div>

          {/* Path visualization */}
          <ol className="relative">
            {attackPath.map((n, i) => {
              const active = simIdx !== null && i <= simIdx;
              const isSel = selectedId === n.id;
              return (
                <li key={n.id} className="relative pl-10 pb-6 last:pb-0">
                  {i < attackPath.length - 1 && (
                    <span className={`absolute left-4 top-8 bottom-0 w-px transition-colors ${active ? "bg-foreground" : "bg-border"}`} />
                  )}
                  <button
                    onClick={() => setSelectedId(n.id)}
                    className={`absolute left-0 top-1 h-8 w-8 rounded-full grid place-items-center text-[10px] font-mono transition ${
                      isSel ? "bg-foreground text-background" : active ? "neumorph-sm" : "neumorph-inset text-muted-foreground"
                    } ${active ? "pulse-ring" : ""}`}
                  >
                    {i + 1}
                  </button>
                  <button
                    onClick={() => setSelectedId(n.id)}
                    className={`w-full text-left rounded-xl p-3 transition ${isSel ? "neumorph-sm" : "hover:bg-accent/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-medium">{n.label}</div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{n.kind}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{n.impact}</div>
                  </button>
                </li>
              );
            })}
          </ol>

          {explain && (
            <div className="mt-4 glass-subtle rounded-xl p-4 fade-up">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> AI Explanation</div>
              <p className="text-[13px] leading-relaxed">
                An attacker reaches the public ALB, exploits an SSRF in the api-worker EC2 to reach the instance metadata service, then assumes the analytics-lambda role via a cached STS token. That role holds AdministratorAccess and can read hp-prod-patients directly. The weakest link is the IAM role — removing AdministratorAccess collapses the entire chain and yields an estimated <span className="font-semibold text-foreground">82% risk reduction</span>.
              </p>
            </div>
          )}
        </div>

        {/* Detail rail */}
        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Selected node</div>
            <h3 className="mt-1 text-base font-medium">{selected.label}</h3>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Risk score" value={String(selected.risk)} />
              <Stat label="Difficulty" value={selected.difficulty} />
            </dl>

            <div className="mt-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">MITRE ATT&CK</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.mitre.map((m) => (
                  <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60">{m}</span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Business impact</div>
              <p className="text-[12px] leading-relaxed">{selected.impact}</p>
            </div>

            {selected.fixes.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Recommended fixes</div>
                <ul className="space-y-1.5">
                  {selected.fixes.map((f) => (
                    <li key={f} className="text-[12px] flex items-start gap-2"><Zap className="h-3 w-3 mt-0.5 shrink-0" /> {f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Other active paths</div>
            <ul className="space-y-2">
              {otherPaths.map((p) => (
                <li key={p.id} className="p-3 rounded-lg hover:bg-accent/30 transition flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] leading-tight">{p.title}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">risk {p.risk} · {p.hops} hops</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="neumorph-inset rounded-lg p-3">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}
