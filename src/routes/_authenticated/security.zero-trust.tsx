import { createFileRoute } from "@tanstack/react-router";
import { zeroTrust } from "@/lib/security-demo";
import { Lock, Users, Network, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/security/zero-trust")({
  component: ZeroTrust,
});

function ZeroTrust() {
  const [applied, setApplied] = useState<string[]>([]);
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Zero Trust · Continuous Hardening</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-driven least-privilege recommendations across identities and network paths.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={Users}   label="Identities"          value={zeroTrust.identities} sub="humans + workloads" />
        <Kpi icon={Lock}    label="Over-permissioned"   value={zeroTrust.overPermissioned} sub="AI-flagged" />
        <Kpi icon={Network} label="Network segments"    value={zeroTrust.segments} sub="micro-segmented" />
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AI recommendations</div>
            <h2 className="text-sm font-medium mt-0.5">Suggested access reductions</h2>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">simulated — review before applying</span>
        </div>
        <ul className="space-y-2">
          {zeroTrust.suggestions.map((s) => {
            const isApplied = applied.includes(s.id);
            return (
              <li key={s.id} className="p-4 rounded-xl neumorph-inset">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-mono text-muted-foreground">{s.from}</div>
                    <div className="mt-1 text-[13px] flex items-center gap-2 flex-wrap">
                      <span className="line-through text-muted-foreground">{s.permission}</span>
                      <span>→</span>
                      <span className="font-medium">{s.suggested}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isApplied ? (
                      <span className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> applied</span>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-7"><X className="h-3 w-3 mr-1" /> Dismiss</Button>
                        <Button size="sm" className="h-7" onClick={() => setApplied((a) => [...a, s.id])}>Review & apply</Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Lock; label: string; value: string | number; sub: string }) {
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
