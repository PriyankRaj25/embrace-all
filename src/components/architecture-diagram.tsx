import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  themeVariables: {
    background: "transparent",
    primaryColor: "#1e1b4b",
    primaryTextColor: "#e0e7ff",
    primaryBorderColor: "#6366f1",
    lineColor: "#6366f1",
    secondaryColor: "#312e81",
    tertiaryColor: "#0f172a",
    clusterBkg: "rgba(99,102,241,0.06)",
    clusterBorder: "#6366f1",
  },
});

interface Solution {
  pattern?: string;
  components?: { id: string; name: string; kind: string; description?: string }[];
  data_flow?: { from: string; to: string; label?: string }[];
}
interface Cloud {
  provider?: string;
  region?: string;
  services?: { name: string; service: string; purpose?: string; tier?: string }[];
  networking?: { vpc?: string; subnets?: string[]; ingress?: string };
}

function sanitize(id: string) {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function shapeFor(kind = ""): [string, string] {
  const k = kind.toLowerCase();
  if (k.includes("db") || k.includes("data") || k.includes("store")) return [`[(`, `)]`];
  if (k.includes("queue") || k.includes("stream") || k.includes("event")) return [`>`, `]`];
  if (k.includes("cache")) return [`[[`, `]]`];
  if (k.includes("edge") || k.includes("cdn") || k.includes("gateway")) return [`{{`, `}}`];
  if (k.includes("service") || k.includes("api") || k.includes("worker")) return [`([`, `])`];
  return [`[`, `]`];
}

export function buildMermaid(solution?: Solution, cloud?: Cloud): string {
  const lines: string[] = ["flowchart LR"];
  lines.push("  classDef edge fill:#0b1220,stroke:#6366f1,color:#e0e7ff");
  lines.push("  classDef svc  fill:#1e1b4b,stroke:#8b5cf6,color:#ede9fe");
  lines.push("  classDef data fill:#0f172a,stroke:#22d3ee,color:#cffafe");
  lines.push("  classDef ext  fill:#111827,stroke:#f59e0b,color:#fde68a,stroke-dasharray:4 3");

  lines.push("  user((User)):::ext");

  const clusterName = cloud?.provider
    ? `${cloud.provider}${cloud.region ? ` · ${cloud.region}` : ""}`
    : "System";
  lines.push(`  subgraph cloud["${clusterName}"]`);

  const comps = solution?.components ?? [];
  const knownIds = new Set<string>();
  comps.forEach((c) => {
    const id = sanitize(c.id || c.name);
    knownIds.add(id);
    const [o, cl] = shapeFor(c.kind);
    const label = `${c.name}<br/><span style='font-size:10px;opacity:.7'>${(c.kind || "").toString()}</span>`;
    lines.push(`    ${id}${o}"${label}"${cl}`);
    const cls = c.kind?.toLowerCase().includes("data") || c.kind?.toLowerCase().includes("db")
      ? "data"
      : c.kind?.toLowerCase().includes("edge") || c.kind?.toLowerCase().includes("gateway")
        ? "edge" : "svc";
    lines.push(`    class ${id} ${cls}`);
  });

  (cloud?.services ?? []).forEach((s, i) => {
    const id = sanitize(`svc_${s.name}_${i}`);
    lines.push(`    ${id}["${s.name}<br/><span style='font-size:10px;opacity:.7'>${s.service}</span>"]`);
    lines.push(`    class ${id} svc`);
  });

  lines.push("  end");

  const flow = solution?.data_flow ?? [];
  if (flow.length) {
    flow.forEach((f) => {
      const from = sanitize(f.from);
      const to = sanitize(f.to);
      if (!knownIds.has(from) || !knownIds.has(to)) return;
      lines.push(`  ${from} ${f.label ? `-- ${f.label} -->` : "-->"} ${to}`);
    });
  } else if (comps.length >= 2) {
    for (let i = 0; i < comps.length - 1; i++) {
      lines.push(`  ${sanitize(comps[i].id || comps[i].name)} --> ${sanitize(comps[i + 1].id || comps[i + 1].name)}`);
    }
  }

  const firstId = comps[0] ? sanitize(comps[0].id || comps[0].name) : null;
  if (firstId) lines.push(`  user --> ${firstId}`);

  return lines.join("\n");
}

export function ArchitectureDiagram({ solution, cloud }: { solution?: Solution; cloud?: Cloud }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const src = buildMermaid(solution, cloud);
    setSource(src);
    (async () => {
      try {
        const { svg } = await mermaid.render(`arch-${Math.random().toString(36).slice(2)}`, src);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Diagram render failed");
      }
    })();
    return () => { cancelled = true; };
  }, [solution, cloud]);

  if (!solution?.components?.length && !cloud?.services?.length) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-sm text-muted-foreground">
        No architecture data yet. Run the orchestrator to generate the solution and cloud artifacts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-xl p-4 overflow-auto">
        <div ref={ref} className="mermaid-host [&_svg]:max-w-none [&_svg]:h-auto" />
        {err && <div className="text-xs text-destructive font-mono">{err}</div>}
      </div>
      <details className="text-[10px] font-mono text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Mermaid source</summary>
        <pre className="mt-2 p-3 rounded-md bg-secondary/40 overflow-auto">{source}</pre>
      </details>
    </div>
  );
}
