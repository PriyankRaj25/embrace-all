import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, TrendingUp, Gauge, Radio, Server, Timer } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/_authenticated/operations")({
  component: OperationsPage,
});

const HEALTH = Array.from({ length: 30 }, (_, i) => ({ d: `d${i}`, uptime: 99.9 + Math.sin(i/3)*0.05 - (i === 14 ? 0.3 : 0) }));
const INCIDENTS = Array.from({ length: 6 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun"][i], p1: [0,1,0,1,0,0][i], p2: [1,2,1,3,2,1][i], p3: [4,3,5,4,6,3][i] }));

const ACTIVE_INCIDENTS = [
  { id: "INC-2891", severity: "P2", service: "payment-gateway", summary: "Elevated 5xx from Stripe webhook consumer", started: "12m ago", status: "investigating" },
  { id: "INC-2887", severity: "P3", service: "search-index",    summary: "Reindex job lagging (backlog 8k docs)",   started: "1h ago",  status: "monitoring" },
];

const RECS = [
  { title: "Right-size 4 over-provisioned RDS instances", saving: "$1,240/mo", risk: "low" },
  { title: "Promote 3 t3.large → t3a.large (AMD)",       saving: "$180/mo",  risk: "low" },
  { title: "Enable S3 Intelligent-Tiering on logs bucket", saving: "$92/mo",  risk: "none" },
];

function OperationsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Continuous Operations</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Live health, incidents & continuous optimization</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">The Operations agents watch production and feed insights back into your blueprints.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Uptime · 30d", value: "99.982%", icon: Gauge,     tone: "text-success" },
          { label: "Active incidents", value: "2",   icon: AlertTriangle, tone: "text-warning" },
          { label: "MTTR (rolling)", value: "12m",   icon: Timer,     tone: "text-aether" },
          { label: "Services",   value: "38",         icon: Server,   tone: "text-cyan-400" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <Icon className={`h-4 w-4 ${k.tone}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold font-mono">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-aether" /><h2 className="font-semibold">Uptime (30 days)</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={HEALTH}>
              <defs><linearGradient id="upG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="hsl(var(--aether))" stopOpacity={0.5} /><stop offset="1" stopColor="hsl(var(--aether))" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="d" hide /><YAxis domain={[99.5, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              <Area dataKey="uptime" stroke="hsl(var(--aether))" strokeWidth={1.5} fill="url(#upG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-warning" /><h2 className="font-semibold">Incidents by severity</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={INCIDENTS}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              <Bar dataKey="p1" stackId="a" fill="oklch(0.65 0.22 25)" />
              <Bar dataKey="p2" stackId="a" fill="oklch(0.78 0.15 60)" />
              <Bar dataKey="p3" stackId="a" fill="hsl(var(--aether))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4"><Radio className="h-4 w-4 text-aether" /><h2 className="font-semibold">Active incidents</h2></div>
        <div className="divide-y divide-border/40">
          {ACTIVE_INCIDENTS.map((i) => (
            <div key={i.id} className="py-4 flex items-start gap-4">
              <Badge variant="outline" className={`font-mono ${i.severity === "P2" ? "text-warning border-warning/40" : "text-muted-foreground"}`}>{i.severity}</Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-muted-foreground">{i.id}</span>
                  <span className="font-medium">{i.service}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{i.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{i.summary}</p>
              </div>
              <div className="text-xs text-muted-foreground">{i.started}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-success" /><h2 className="font-semibold">Optimization recommendations</h2></div>
        <div className="space-y-3">
          {RECS.map((r) => (
            <div key={r.title} className="flex items-center gap-4 rounded-lg border border-border/40 p-4">
              <div className="flex-1">
                <div className="font-medium text-sm">{r.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Estimated saving</span>
                  <span className="font-mono text-success">{r.saving}</span>
                  <span>· Risk {r.risk}</span>
                </div>
              </div>
              <Progress value={r.risk === "none" ? 100 : r.risk === "low" ? 85 : 60} className="w-24 h-1.5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
