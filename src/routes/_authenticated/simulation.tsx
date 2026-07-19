import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Zap, Flame, ShieldAlert, PlayCircle, CheckCircle2, Timer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

export const Route = createFileRoute("/_authenticated/simulation")({
  component: SimulationPage,
});

type Scenario = { key: string; name: string; icon: typeof Activity; desc: string; kpis: { label: string; value: string; ok: boolean }[] };

const SCENARIOS: Scenario[] = [
  { key: "load",    name: "Load & Scaling",        icon: Zap,         desc: "Simulate 10× traffic burst against the architecture.",
    kpis: [ { label: "P95 latency", value: "184 ms", ok: true }, { label: "Autoscale headroom", value: "42%", ok: true }, { label: "Cost delta / hr", value: "+$18.40", ok: true } ] },
  { key: "chaos",   name: "Chaos Engineering",     icon: Flame,       desc: "Kill a random AZ / pod / node group and observe blast radius.",
    kpis: [ { label: "MTTR", value: "42 s", ok: true }, { label: "Requests failed", value: "0.8%", ok: true }, { label: "Data loss", value: "0", ok: true } ] },
  { key: "dr",      name: "Disaster Recovery",     icon: ShieldAlert, desc: "Full region failover; validate RPO/RTO commitments.",
    kpis: [ { label: "RPO achieved", value: "42 s (< 60s)", ok: true }, { label: "RTO achieved", value: "8m 12s (< 15m)", ok: true }, { label: "Runbook steps", value: "18 automated", ok: true } ] },
];

const LATENCY = Array.from({ length: 24 }, (_, i) => ({ t: `${i}:00`, p50: 60 + Math.sin(i/3)*10 + i*0.5, p95: 140 + Math.sin(i/3)*25 + i*1.2, p99: 220 + Math.cos(i/2)*30 + i*1.8 }));
const THROUGHPUT = Array.from({ length: 24 }, (_, i) => ({ t: `${i}:00`, rps: 1200 + Math.sin(i/2)*400 + i*20 }));

function SimulationPage() {
  const [active, setActive] = useState("load");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(100);
  const scenario = SCENARIOS.find((s) => s.key === active)!;

  function run() {
    setRunning(true); setProgress(0);
    const i = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(i); setRunning(false); return 100; }
        return p + 4;
      });
    }, 80);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Simulation Engine</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Test the architecture before you build it</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Model load, failure, and disaster scenarios against the generated blueprint.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const isActive = s.key === active;
          return (
            <button key={s.key} onClick={() => setActive(s.key)}
              className={`glass-panel rounded-xl p-5 text-left transition ${isActive ? "border-aether/50 ring-1 ring-aether/30" : "hover:border-aether/30"}`}>
              <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-aether" /><div className="font-semibold">{s.name}</div></div>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </button>
          );
        })}
      </div>

      <section className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{scenario.name}</h2>
            <p className="text-sm text-muted-foreground">{scenario.desc}</p>
          </div>
          <Button onClick={run} disabled={running} className="bg-aether hover:bg-aether/90">
            {running ? <><Timer className="h-4 w-4 mr-2 animate-pulse" /> Running…</> : <><PlayCircle className="h-4 w-4 mr-2" /> Run simulation</>}
          </Button>
        </div>

        {running && <Progress value={progress} className="h-1" />}

        <div className="grid gap-3 md:grid-cols-3">
          {scenario.kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-border/40 p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold font-mono">{k.value}</span>
                {k.ok && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/40 p-4">
            <div className="flex items-center gap-2 mb-2"><Activity className="h-3.5 w-3.5 text-aether" /><div className="text-sm font-medium">Latency (ms)</div></div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={LATENCY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="t" hide /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Line dataKey="p50" stroke="hsl(var(--aether))" strokeWidth={1.5} dot={false} />
                <Line dataKey="p95" stroke="oklch(0.78 0.15 210)" strokeWidth={1.5} dot={false} />
                <Line dataKey="p99" stroke="oklch(0.72 0.19 25)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border/40 p-4">
            <div className="flex items-center gap-2 mb-2"><Zap className="h-3.5 w-3.5 text-aether" /><div className="text-sm font-medium">Throughput (RPS)</div></div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={THROUGHPUT}>
                <defs><linearGradient id="rpsG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="hsl(var(--aether))" stopOpacity={0.5} /><stop offset="1" stopColor="hsl(var(--aether))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="t" hide /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Area dataKey="rps" stroke="hsl(var(--aether))" strokeWidth={1.5} fill="url(#rpsG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 p-4">
          <div className="text-sm font-medium mb-2">Findings</div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Autoscaling policies handled the burst with 42% headroom to spare.</li>
            <li>One warm standby recommended in <Badge variant="outline" className="mx-1">eu-west-2</Badge> to hit target RTO.</li>
            <li>Consider Aurora Global Database to shrink RPO under 5s for tier-1 tables.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
