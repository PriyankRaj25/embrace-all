import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize2, Download, RotateCcw, ImageDown, Database, CloudCog, Route as RouteIcon } from "lucide-react";

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

export function buildMermaid(solution?: Solution, cloud?: Cloud, orientation: "LR" | "TB" = "LR"): string {
  const lines: string[] = [`flowchart ${orientation}`];
  lines.push("  classDef edge fill:#0b1220,stroke:#6366f1,color:#e0e7ff");
  lines.push("  classDef svc  fill:#1e1b4b,stroke:#8b5cf6,color:#ede9fe");
  lines.push("  classDef data fill:#0f172a,stroke:#22d3ee,color:#cffafe");
  lines.push("  classDef ext  fill:#111827,stroke:#f59e0b,color:#fde68a,stroke-dasharray:4 3");
  lines.push("  classDef hi   stroke:#f472b6,stroke-width:3px");

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
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [source, setSource] = useState<string>("");
  const [orientation, setOrientation] = useState<"LR" | "TB">("LR");
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const src = useMemo(() => buildMermaid(solution, cloud, orientation), [solution, cloud, orientation]);

  useEffect(() => {
    let cancelled = false;
    setSource(src);
    setRendered(false);
    (async () => {
      try {
        const { svg } = await mermaid.render(`arch-${Math.random().toString(36).slice(2)}`, src);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setErr(null);
          setRendered(true);
          const svgEl = hostRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "none";
            svgEl.style.height = "auto";
            svgEl.querySelectorAll<SVGGElement>("g.node").forEach((n) => {
              n.style.cursor = "pointer";
              n.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = n.getAttribute("id") ?? "";
                const clean = id.replace(/^flowchart-/, "").replace(/-\d+$/, "");
                setSelected((s) => (s === clean ? null : clean));
              });
            });
          }
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Diagram render failed");
          setRendered(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  // Highlight selected node + connected edges
  useEffect(() => {
    if (!hostRef.current) return;
    const svgEl = hostRef.current.querySelector("svg");
    if (!svgEl) return;
    svgEl.querySelectorAll<SVGGElement>("g.node").forEach((n) => {
      const id = (n.getAttribute("id") ?? "").replace(/^flowchart-/, "").replace(/-\d+$/, "");
      n.style.opacity = !selected || id === selected ? "1" : "0.35";
    });
    svgEl.querySelectorAll<SVGPathElement>(".edgePath path, .flowchart-link").forEach((p) => {
      p.style.opacity = selected ? "0.2" : "1";
    });
    if (selected) {
      svgEl.querySelectorAll<SVGGElement>(".edgePaths .edgePath").forEach((ep) => {
        const cls = ep.getAttribute("class") ?? "";
        if (cls.includes(selected)) {
          ep.style.opacity = "1";
          ep.querySelectorAll<SVGPathElement>("path").forEach((p) => { p.style.opacity = "1"; p.style.stroke = "#f472b6"; });
        } else {
          ep.querySelectorAll<SVGPathElement>("path").forEach((p) => { p.style.stroke = ""; });
        }
      });
    } else {
      svgEl.querySelectorAll<SVGPathElement>(".edgePath path").forEach((p) => { p.style.stroke = ""; });
    }
  }, [selected, source]);

  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 4));
  const zoomOut = () => setScale((s) => Math.max(s / 1.2, 0.3));
  const reset = () => { setScale(1); setTx(0); setTy(0); setSelected(null); };
  const fit = useCallback(() => {
    const svg = hostRef.current?.querySelector("svg");
    const stage = stageRef.current;
    if (!svg || !stage) return;
    const sr = svg.getBoundingClientRect();
    const cr = stage.getBoundingClientRect();
    const s = Math.min(cr.width / sr.width * scale * 0.95, cr.height / sr.height * scale * 0.95);
    setScale(Math.max(0.3, Math.min(s, 3)));
    setTx(0); setTy(0);
  }, [scale]);

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setScale((s) => Math.min(4, Math.max(0.3, s * (e.deltaY < 0 ? 1.1 : 0.9))));
  }
  function onDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  }
  function onUp() { dragRef.current = null; }

  function downloadSvg() {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "architecture.svg"; a.click();
    URL.revokeObjectURL(url);
  }
  function downloadPng() {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
    img.onload = () => {
      const rect = svg.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * 2; canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url; a.download = "architecture.png"; a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = svg64;
  }

  if (!solution?.components?.length && !cloud?.services?.length) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-sm text-muted-foreground">
        No architecture data yet. Run the orchestrator to generate the solution and cloud artifacts.
      </div>
    );
  }

  const comps = solution?.components ?? [];
  const selectedComp = selected ? comps.find((c) => sanitize(c.id || c.name) === selected) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-border/60 overflow-hidden">
          <button onClick={() => setOrientation("LR")} className={`px-2.5 py-1 text-[10px] font-mono ${orientation === "LR" ? "bg-aether/20 text-foreground" : "text-muted-foreground"}`}>LR</button>
          <button onClick={() => setOrientation("TB")} className={`px-2.5 py-1 text-[10px] font-mono border-l border-border/60 ${orientation === "TB" ? "bg-aether/20 text-foreground" : "text-muted-foreground"}`}>TB</button>
        </div>
        <Button size="sm" variant="outline" onClick={zoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
        <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
        <Button size="sm" variant="outline" onClick={zoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={fit}><Maximize2 className="h-3.5 w-3.5 mr-1.5" />Fit</Button>
        <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset</Button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadSvg}><Download className="h-3.5 w-3.5 mr-1.5" />SVG</Button>
          <Button size="sm" variant="outline" onClick={downloadPng}><ImageDown className="h-3.5 w-3.5 mr-1.5" />PNG</Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="glass-panel rounded-xl relative overflow-hidden h-[560px] cursor-grab active:cursor-grabbing select-none"
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onClick={() => setSelected(null)}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center" }}
        >
          {err ? (
            <TopologyFallback solution={solution} cloud={cloud} selected={selected} onSelect={setSelected} />
          ) : (
            <div ref={hostRef} className={cn("mermaid-host", !rendered && "opacity-0")} />
          )}
        </div>
        {!rendered && !err && <div className="absolute inset-0 grid place-items-center text-xs font-mono text-muted-foreground">Rendering topology…</div>}
        {err && <div className="absolute bottom-2 left-2 text-xs text-warning font-mono">Mermaid fallback active: {err}</div>}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground bg-background/60 rounded px-2 py-1">
          drag to pan · ⌘/Ctrl + scroll to zoom · click node to isolate
        </div>
      </div>

      {selectedComp && (
        <div className="glass-panel rounded-md p-4 border-aether/50 border">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-aether">{selectedComp.id}</span>
            <span className="font-semibold text-sm">{selectedComp.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{selectedComp.kind}</span>
          </div>
          {selectedComp.description && <p className="text-xs text-muted-foreground">{selectedComp.description}</p>}
        </div>
      )}

      <details className="text-[10px] font-mono text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Mermaid source</summary>
        <pre className="mt-2 p-3 rounded-md bg-secondary/40 overflow-auto">{source}</pre>
      </details>
    </div>
  );
}

function TopologyFallback({
  solution,
  cloud,
  selected,
  onSelect,
}: {
  solution?: Solution;
  cloud?: Cloud;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const components = solution?.components ?? [];
  const dataFlow = solution?.data_flow ?? [];
  return (
    <div className="grid h-full w-full grid-cols-[1fr_260px] gap-4 p-6">
      <div className="relative grid auto-rows-min grid-cols-3 content-center gap-4">
        {components.map((component) => {
          const id = sanitize(component.id || component.name);
          const isSelected = selected === id;
          const KindIcon = component.kind?.toLowerCase().includes("data") || component.kind?.toLowerCase().includes("db")
            ? Database
            : component.kind?.toLowerCase().includes("gateway") || component.kind?.toLowerCase().includes("edge")
              ? RouteIcon
              : CloudCog;
          return (
            <button
              key={id}
              className={`rounded-lg border p-3 text-left transition ${isSelected ? "border-aether bg-aether/15" : "border-border/60 bg-secondary/30 hover:border-aether/50"}`}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(isSelected ? null : id);
              }}
              type="button"
            >
              <div className="flex items-start gap-2">
                <KindIcon className="mt-0.5 size-4 text-aether" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{component.name}</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">{component.kind}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="rounded-lg border border-border/60 bg-background/70 p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">{cloud?.provider ?? "Cloud"}</div>
        <div className="mt-1 text-sm text-muted-foreground">{cloud?.region ?? "Target topology"}</div>
        <div className="mt-4 space-y-2">
          {dataFlow.map((flow, index) => (
            <div key={`${flow.from}-${flow.to}-${index}`} className="rounded-md bg-secondary/40 px-3 py-2 text-xs">
              <span className="font-mono text-aether">{flow.from}</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-mono text-aether">{flow.to}</span>
              {flow.label && <div className="mt-1 text-muted-foreground">{flow.label}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
