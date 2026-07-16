import { type AgentKey } from "@/lib/agents";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/**
 * Renders each agent's structured output with a domain-specific view.
 * Falls back to pretty-printed JSON for unknown shapes.
 */
export function ArtifactView({ kind, data }: { kind: AgentKey; data: unknown }) {
  const d = data as Record<string, unknown>;
  switch (kind) {
    case "requirements": return <Requirements d={d} />;
    case "domain":       return <Domain d={d} />;
    case "solution":     return <Solution d={d} />;
    case "cloud":        return <CloudView d={d} />;
    case "security":     return <Security d={d} />;
    case "compliance":   return <Compliance d={d} />;
    case "finops":       return <Cost d={d} />;
    case "reliability":  return <Reliability d={d} />;
    case "iac":          return <IaC d={d} />;
    case "docs":         return <Docs d={d} />;
    case "reviewer":     return <Review d={d} />;
    default:             return <Json d={d} />;
  }
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
    {children}
  </div>
);

const Json = ({ d }: { d: unknown }) => (
  <pre className="text-[11px] font-mono text-muted-foreground overflow-auto rounded-md bg-secondary/40 p-3">
    {JSON.stringify(d, null, 2)}
  </pre>
);

function Requirements({ d }: { d: Record<string, unknown> }) {
  const functional = (d.functional as string[]) ?? [];
  const nonFunctional = (d.non_functional as { category: string; requirement: string }[]) ?? [];
  const constraints = (d.constraints as string[]) ?? [];
  return (
    <div>
      {d.summary ? <p className="text-sm mb-4">{String(d.summary)}</p> : null}
      <Section title="Functional">
        <ul className="space-y-1.5">{functional.map((f, i) => (
          <li key={i} className="text-sm flex gap-2"><span className="text-aether font-mono text-xs">FR-{String(i + 1).padStart(2, "0")}</span>{f}</li>
        ))}</ul>
      </Section>
      <Section title="Non-functional">
        <ul className="space-y-1.5">{nonFunctional.map((n, i) => (
          <li key={i} className="text-sm">
            <Badge variant="outline" className="mr-2 text-[10px]">{n.category}</Badge>
            {n.requirement}
          </li>
        ))}</ul>
      </Section>
      {constraints.length > 0 && (
        <Section title="Constraints">
          <ul className="space-y-1 text-sm text-muted-foreground">{constraints.map((c, i) => <li key={i}>• {c}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}

function Domain({ d }: { d: Record<string, unknown> }) {
  const contexts = (d.bounded_contexts as { name: string; purpose: string; entities: string[] }[]) ?? [];
  return (
    <div className="space-y-3">
      {contexts.map((c, i) => (
        <div key={i} className="glass-panel rounded-md p-3">
          <div className="font-semibold text-sm">{c.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{c.purpose}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {c.entities.map((e) => <Badge key={e} variant="outline" className="font-mono text-[10px]">{e}</Badge>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Solution({ d }: { d: Record<string, unknown> }) {
  const components = (d.components as { id: string; name: string; kind: string; description: string }[]) ?? [];
  return (
    <div>
      <Section title="Pattern"><div className="text-sm">{d.pattern as string}</div></Section>
      <Section title="Components">
        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.id} className="rounded-md border border-border/60 p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-aether">{c.id}</span>
                <span className="font-semibold text-sm">{c.name}</span>
                <Badge variant="outline" className="text-[10px]">{c.kind}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CloudView({ d }: { d: Record<string, unknown> }) {
  const services = (d.services as { name: string; service: string; purpose: string; tier: string }[]) ?? [];
  const net = d.networking as { vpc: string; subnets: string[]; ingress: string } | undefined;
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Badge className="bg-aether/20 text-aether border-aether/40 font-mono">{d.provider as string}</Badge>
        <Badge variant="outline" className="font-mono">{d.region as string}</Badge>
      </div>
      <Section title="Services">
        <div className="space-y-1.5">
          {services.map((s, i) => (
            <div key={i} className="rounded-md border border-border/60 p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{s.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{s.service}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.purpose}</div>
              <Badge variant="outline" className="mt-1.5 text-[10px]">{s.tier}</Badge>
            </div>
          ))}
        </div>
      </Section>
      {net && (
        <Section title="Networking">
          <div className="text-xs font-mono text-muted-foreground space-y-1">
            <div>vpc: <span className="text-foreground">{net.vpc}</span></div>
            <div>ingress: <span className="text-foreground">{net.ingress}</span></div>
            <div>subnets: <span className="text-foreground">{net.subnets.join(", ")}</span></div>
          </div>
        </Section>
      )}
    </div>
  );
}

function Security({ d }: { d: Record<string, unknown> }) {
  const iam = (d.iam as { role: string; permissions: string }[]) ?? [];
  const enc = d.encryption as { at_rest: string; in_transit: string; key_management: string } | undefined;
  const network = (d.network as string[]) ?? [];
  return (
    <div>
      <Section title="IAM roles">
        <div className="space-y-1.5">
          {iam.map((r, i) => (
            <div key={i} className="rounded-md border border-border/60 p-2.5">
              <div className="font-mono text-xs text-aether">{r.role}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.permissions}</div>
            </div>
          ))}
        </div>
      </Section>
      {enc && (
        <Section title="Encryption">
          <div className="text-xs space-y-1">
            <div><span className="text-muted-foreground">At rest:</span> {enc.at_rest}</div>
            <div><span className="text-muted-foreground">In transit:</span> {enc.in_transit}</div>
            <div><span className="text-muted-foreground">KMS:</span> {enc.key_management}</div>
          </div>
        </Section>
      )}
      {network.length > 0 && (
        <Section title="Network segmentation">
          <ul className="text-xs space-y-1 text-muted-foreground">{network.map((n, i) => <li key={i}>• {n}</li>)}</ul>
        </Section>
      )}
      {d.secrets_management && <Section title="Secrets"><div className="text-xs">{d.secrets_management as string}</div></Section>}
    </div>
  );
}

function Compliance({ d }: { d: Record<string, unknown> }) {
  const fw = (d.frameworks as { framework: string; status: string; controls: { id: string; title: string; evidence: string }[] }[]) ?? [];
  return (
    <div className="space-y-3">
      {fw.map((f, i) => (
        <div key={i} className="glass-panel rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{f.framework}</div>
            <Badge className={
              f.status === "covered" ? "bg-success/20 text-success border-success/40" :
              f.status === "partial" ? "bg-warning/20 text-warning border-warning/40" :
              "bg-destructive/20 text-destructive border-destructive/40"
            } variant="outline">{f.status}</Badge>
          </div>
          <div className="mt-2 space-y-1.5">
            {f.controls.map((c) => (
              <div key={c.id} className="text-xs">
                <span className="font-mono text-aether mr-1.5">{c.id}</span>
                <span className="font-medium">{c.title}</span>
                <div className="text-muted-foreground mt-0.5">{c.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Cost({ d }: { d: Record<string, unknown> }) {
  const total = d.total_monthly_usd as number;
  const breakdown = (d.breakdown as { category: string; monthly_usd: number; notes: string }[]) ?? [];
  const levers = (d.optimization_levers as string[]) ?? [];
  const chartData = breakdown.map((b) => ({ name: b.category, value: b.monthly_usd }));
  return (
    <div>
      <div className="text-3xl font-semibold text-gradient-aether mb-1">${total.toFixed(0)}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
      <div className="text-xs text-muted-foreground mb-4">Estimated monthly cost</div>
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: "oklch(0.68 0.02 260)" }} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", fontSize: 12 }} />
            <Bar dataKey="value" radius={4}>
              {chartData.map((_, i) => <Cell key={i} fill={`oklch(0.72 0.19 ${285 - i * 15})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Section title="Breakdown">
        <div className="space-y-1.5">
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between items-start text-xs">
              <div>
                <div className="font-medium">{b.category}</div>
                <div className="text-muted-foreground">{b.notes}</div>
              </div>
              <div className="font-mono text-aether">${b.monthly_usd.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </Section>
      {levers.length > 0 && (
        <Section title="Optimization levers">
          <ul className="text-xs space-y-1 text-muted-foreground">{levers.map((l, i) => <li key={i}>• {l}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}

function Reliability({ d }: { d: Record<string, unknown> }) {
  const scenarios = (d.failure_scenarios as { scenario: string; mitigation: string }[]) ?? [];
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="RPO" value={`${d.rpo_minutes}m`} />
        <Stat label="RTO" value={`${d.rto_minutes}m`} />
        <Stat label="SLA" value={d.availability_target as string} />
      </div>
      <Section title="Strategy"><div className="text-sm">{d.strategy as string}</div></Section>
      <Section title="Failure scenarios">
        <div className="space-y-2">
          {scenarios.map((s, i) => (
            <div key={i} className="rounded-md border border-border/60 p-2.5">
              <div className="text-sm font-medium flex gap-2 items-start"><AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />{s.scenario}</div>
              <div className="text-xs text-muted-foreground mt-1 pl-5">→ {s.mitigation}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2 text-center">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-gradient-aether">{value}</div>
    </div>
  );
}

function IaC({ d }: { d: Record<string, unknown> }) {
  const modules = (d.modules as { name: string; filename: string; code: string }[]) ?? [];
  return (
    <div>
      <Badge variant="outline" className="mb-3 font-mono">{d.language as string}</Badge>
      <div className="space-y-3">
        {modules.map((m, i) => (
          <div key={i} className="rounded-md border border-border/60 overflow-hidden">
            <div className="flex items-center justify-between bg-secondary/60 px-3 py-1.5 border-b border-border/60">
              <span className="text-xs font-medium">{m.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{m.filename}</span>
            </div>
            <pre className="text-[11px] font-mono p-3 overflow-x-auto text-muted-foreground">{m.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function Docs({ d }: { d: Record<string, unknown> }) {
  const adrs = (d.adrs as { id: string; title: string; decision: string; rationale: string }[]) ?? [];
  return (
    <div>
      <Section title="Overview">
        <p className="text-sm text-muted-foreground whitespace-pre-line">{d.overview as string}</p>
      </Section>
      <Section title="Architecture Decision Records">
        <div className="space-y-2">
          {adrs.map((a) => (
            <div key={a.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-aether">{a.id}</span>
                <span className="font-semibold text-sm">{a.title}</span>
              </div>
              <div className="text-xs mb-1"><span className="text-muted-foreground">Decision:</span> {a.decision}</div>
              <div className="text-xs"><span className="text-muted-foreground">Rationale:</span> {a.rationale}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Review({ d }: { d: Record<string, unknown> }) {
  const risks = (d.risks as { severity: string; issue: string; recommendation: string }[]) ?? [];
  const strengths = (d.strengths as string[]) ?? [];
  const verdict = d.verdict as string;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Badge className={
          verdict === "approve" ? "bg-success/20 text-success border-success/40" :
          verdict === "approve_with_notes" ? "bg-warning/20 text-warning border-warning/40" :
          "bg-destructive/20 text-destructive border-destructive/40"
        } variant="outline">
          {verdict === "approve" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : verdict === "block" ? <XCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
          {verdict.replace("_", " ")}
        </Badge>
        <div className="text-2xl font-semibold text-gradient-aether">{d.overall_score as number}<span className="text-xs text-muted-foreground">/100</span></div>
      </div>
      <Section title="Strengths">
        <ul className="text-xs space-y-1 text-muted-foreground">{strengths.map((s, i) => <li key={i}>✓ {s}</li>)}</ul>
      </Section>
      <Section title="Risks">
        <div className="space-y-2">
          {risks.map((r, i) => (
            <div key={i} className="rounded-md border border-border/60 p-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  r.severity === "high" ? "text-destructive border-destructive/40" :
                  r.severity === "medium" ? "text-warning border-warning/40" :
                  "text-muted-foreground"
                }>{r.severity}</Badge>
                <span className="text-sm font-medium">{r.issue}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">→ {r.recommendation}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
