import { createFileRoute } from "@tanstack/react-router";
import { redTeam } from "@/lib/security-demo";
import { Swords, Shield, Target, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/security/red-team")({
  component: RedTeam,
});

function RedTeam() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Continuous AI Red Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">Simulated adversarial campaigns run continuously against your environment.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Swords}   label="Attack success rate" value={`${redTeam.successRate}%`} sub="lower is better" />
        <Kpi icon={Shield}   label="Blocked attacks"      value={`${redTeam.blocked}%`} sub="24h rolling" />
        <Kpi icon={Target}   label="Security coverage"    value={`${redTeam.coverage}%`} sub="MITRE tactics" />
        <Kpi icon={Activity} label="Campaigns running"    value="6" sub="autonomous" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Attack scenarios</div>
          <ul className="space-y-2">
            {redTeam.scenarios.map((s) => (
              <li key={s.name} className="p-3 rounded-lg neumorph-inset flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${s.outcome === "success" ? "bg-foreground" : "bg-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{s.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">detection: {s.detection}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-mono uppercase tracking-widest ${s.outcome === "success" ? "text-foreground" : "text-muted-foreground"}`}>{s.outcome === "success" ? "attacker won" : "blocked"}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{s.last}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">MITRE ATT&CK coverage heatmap</div>
          <ul className="space-y-2">
            {redTeam.mitreHeatmap.map((t) => (
              <li key={t.tactic} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-[11px]">{t.tactic}</div>
                <div className="flex-1 h-3 rounded neumorph-inset overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${t.cov}%` }} />
                </div>
                <div className="w-10 text-right text-[10px] font-mono text-muted-foreground">{t.cov}%</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Live timeline · AI red team</div>
        <ol className="relative pl-4 space-y-3">
          {redTeam.scenarios.map((s, i) => (
            <li key={s.name} className="relative">
              <span className="absolute -left-4 top-1 h-2 w-2 rounded-full bg-foreground" />
              {i < redTeam.scenarios.length - 1 && <span className="absolute -left-3 top-3 bottom-[-1rem] w-px bg-border" />}
              <div className="text-[12px]"><span className="font-mono text-muted-foreground">{s.last}</span> · attempted <span className="font-medium">{s.name}</span> · {s.outcome === "success" ? "no detection triggered" : "blocked by control"}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Swords; label: string; value: string; sub: string }) {
  return (
    <div className="neumorph-sm rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <div className="text-[10px] font-mono uppercase tracking-widest">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[10px] font-mono text-muted-foreground">{sub}</div>
    </div>
  );
}
