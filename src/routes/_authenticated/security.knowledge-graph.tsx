import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { graphNodes, graphEdges, graphSuggestedQuestions, graphAnswers } from "@/lib/security-demo";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/security/knowledge-graph")({
  component: KnowledgeGraph,
});

const GROUP_STYLE: Record<string, string> = {
  account: "fill-[oklch(0.25_0_0)] stroke-foreground",
  network: "fill-[oklch(0.18_0_0)] stroke-border",
  compute: "fill-[oklch(0.15_0_0)] stroke-border",
  data:    "fill-[oklch(0.15_0_0)] stroke-border",
  iam:     "fill-[oklch(0.15_0_0)] stroke-border",
  human:   "fill-[oklch(0.15_0_0)] stroke-border",
  code:    "fill-[oklch(0.15_0_0)] stroke-border",
};

function KnowledgeGraph() {
  const [answer, setAnswer] = useState<{ text: string; highlight: string[] } | null>(null);
  const [q, setQ] = useState("");
  const [hover, setHover] = useState<string | null>(null);

  function ask(prompt: string) {
    const a = graphAnswers[prompt] ?? { text: "The graph shows contextual relationships across identities, workloads, and data. Try one of the suggested questions.", highlight: [] };
    setAnswer(a);
    setQ("");
  }

  const highlight = answer?.highlight ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Security Knowledge Graph</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask questions across accounts, identities, workloads, code, and people.</p>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden" style={{ minHeight: 540 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[540px]">
            {graphEdges.map((e, i) => {
              const a = graphNodes.find((n) => n.id === e.from)!;
              const b = graphNodes.find((n) => n.id === e.to)!;
              const on = highlight.includes(e.from) && highlight.includes(e.to);
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="currentColor"
                  className={on ? "text-foreground" : "text-border"}
                  strokeWidth={on ? 0.35 : 0.15}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {graphNodes.map((n) => {
              const on = highlight.includes(n.id);
              const isHover = hover === n.id;
              return (
                <g key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle
                    cx={n.x} cy={n.y}
                    r={on || isHover ? 2.8 : 2}
                    className={`${GROUP_STYLE[n.group]} ${on ? "stroke-foreground" : ""}`}
                    strokeWidth={on ? 0.4 : 0.15}
                    vectorEffect="non-scaling-stroke"
                  />
                  {n.risk && n.risk >= 85 && (
                    <circle cx={n.x} cy={n.y} r={4} fill="none" className="stroke-foreground/40" strokeWidth={0.15} vectorEffect="non-scaling-stroke">
                      <animate attributeName="r" from="2.5" to="5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
          {/* Labels overlay */}
          <div className="absolute inset-4 pointer-events-none">
            {graphNodes.map((n) => (
              <div
                key={n.id}
                className={`absolute -translate-x-1/2 mt-3 text-[9px] font-mono whitespace-nowrap transition ${
                  highlight.includes(n.id) || hover === n.id ? "text-foreground" : "text-muted-foreground/70"
                }`}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                {n.label}
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-4 flex gap-3 text-[9px] font-mono text-muted-foreground">
            {Object.keys(GROUP_STYLE).map((g) => (
              <span key={g} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> {g}</span>
            ))}
          </div>
        </div>

        <aside className="glass-panel rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <div className="text-sm font-medium">Ask the graph</div>
          </div>
          <p className="text-[11px] text-muted-foreground">Natural-language questions across your cloud footprint.</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {graphSuggestedQuestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="text-[10px] px-2 py-1 rounded-full border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground transition">
                {s}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-4 glass-subtle rounded-xl p-3 fade-up">
              <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">AI answer</div>
              <p className="text-[12px] leading-relaxed">{answer.text}</p>
              {answer.highlight.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-muted-foreground">Highlighted: {answer.highlight.join(", ")}</div>
              )}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q.trim()); }} className="mt-auto pt-3 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Which lambdas can read PHI?"
              className="flex-1 bg-transparent text-xs px-3 py-2 outline-none neumorph-inset rounded-lg border-transparent"
            />
            <Button size="icon" className="h-8 w-8" type="submit"><Send className="h-3.5 w-3.5" /></Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
