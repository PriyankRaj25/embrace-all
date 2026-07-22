import { createFileRoute, Link } from "@tanstack/react-router";
import { securityKpis, aiInsight, recentEvents, aiRecommendations, type Severity } from "@/lib/security-demo";
import { AlertTriangle, Route as RouteIcon, ShieldCheck, Cloud, Globe, KeyRound, Sparkles, ArrowRight, TrendingUp, Cpu } from "lucide-react";

export const Route = createFileRoute("/_authenticated/security/")({
  component: Overview,
});

const SEV_STYLE: Record<Severity, string> = {
  critical: "text-foreground border-foreground/40 bg-foreground/10",
  high:     "text-foreground border-foreground/25 bg-foreground/[.06]",
  medium:   "text-muted-foreground border-border",
  low:      "text-muted-foreground border-border/60",
};

function Overview() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Executive posture across cloud, identity, and delivery.</p>
        </div>
        <Link to="/security/attack-paths" className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          Investigate critical paths <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {/* AI Insight banner */}
      <div className="glass-heavy rounded-2xl p-5 flex gap-4 items-start fade-up">
        <div className="grid h-9 w-9 place-items-center rounded-xl neumorph-sm shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AI Insight</div>
          <p className="mt-1 text-sm leading-relaxed">{aiInsight}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/security/attack-paths" className="text-[11px] px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition">View attack paths</Link>
            <Link to="/security/fix-engine" className="text-[11px] px-3 py-1.5 rounded-full border border-border/60 hover:bg-accent transition">Generate remediation</Link>
          </div>
        </div>
        <ScoreRing value={securityKpis.score} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={AlertTriangle} label="Critical risks"       value={securityKpis.criticalRisks} sub="requires action" />
        <Kpi icon={RouteIcon}     label="Active attack paths"   value={securityKpis.activeAttackPaths} sub="7 hops avg" />
        <Kpi icon={ShieldCheck}   label="Compliance score"      value={`${securityKpis.complianceScore}%`} sub="across 6 frameworks" />
        <Kpi icon={Cloud}         label="Cloud assets"          value={securityKpis.cloudAssets.toLocaleString()} sub="AWS · GCP · Azure" />
        <Kpi icon={Globe}         label="Internet facing"       value={securityKpis.internetFacing} sub="2 unexpected" />
        <Kpi icon={KeyRound}      label="High-risk IAM"         value={securityKpis.highRiskIam} sub="over-privileged" />
        <Kpi icon={Sparkles}      label="AI recommendations"    value={securityKpis.aiRecommendations} sub="auto-generated" />
        <Kpi icon={TrendingUp}    label="Risk trend (7d)"       value="−14%" sub="improving" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Events */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Recent events</div>
              <h2 className="text-sm font-medium mt-0.5">Security telemetry</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">last 3 hours</span>
          </div>
          <ul className="space-y-2">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition">
                <span className={`mt-0.5 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${SEV_STYLE[e.severity]}`}>{e.severity}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-tight">{e.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">{e.source} · {e.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AI recommendations</div>
              <h2 className="text-sm font-medium mt-0.5">Highest-impact fixes</h2>
            </div>
            <Link to="/security/fix-engine" className="text-[10px] font-mono text-muted-foreground hover:text-foreground">view all →</Link>
          </div>
          <ul className="space-y-2">
            {aiRecommendations.map((r) => (
              <li key={r.id} className="p-3 rounded-lg neumorph-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[13px] leading-tight">{r.title}</div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono">−{r.impact}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">risk</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> AI · {r.effort}</div>
                  <button className="text-[10px] px-2 py-1 rounded border border-border/60 hover:bg-accent">Apply</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Cloud; label: string; value: string | number; sub: string }) {
  return (
    <div className="neumorph-sm rounded-xl p-4 hover:scale-[1.01] transition">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <div className="text-[10px] font-mono uppercase tracking-widest">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[10px] font-mono text-muted-foreground">{sub}</div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="currentColor" className="text-border" strokeWidth="4" fill="none" />
        <circle cx="32" cy="32" r={r} stroke="currentColor" className="text-foreground" strokeWidth="4" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{value}</div>
    </div>
  );
}
