import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { creditSummary, topUpCredits, TOPUP_PACKS, CREDIT_COST } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function useCreditSummary() {
  const [summary, setSummary] = useState(() => creditSummary());
  const refresh = useCallback(() => setSummary(creditSummary()), []);
  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("aether:credits", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aether:credits", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);
  return summary;
}

function Bar({ pct, low }: { pct: number; low: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10 backdrop-blur-sm">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          low ? "bg-destructive/80" : "bg-foreground/70",
        )}
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  );
}

/** Compact meter for the sidebar / chat header. */
export function UsageMeter({ className, compact = false }: { className?: string; compact?: boolean }) {
  const s = useCreditSummary();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)} title={`${s.remaining.toLocaleString()} credits left`}>
        <Zap className={cn("h-3 w-3", s.low ? "text-destructive" : "text-muted-foreground")} />
        <div className="w-14"><Bar pct={s.pct} low={s.low} /></div>
        <span className="font-mono text-[10px] text-muted-foreground">{s.remaining.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className={cn("glass-panel rounded-xl border border-border/60 p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
          <Zap className="h-3 w-3" /> Credits
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {s.remaining.toLocaleString()} / {s.total.toLocaleString()}
        </span>
      </div>
      <Bar pct={s.pct} low={s.low} />
      <Link
        to="/billing"
        className="block text-[10px] text-muted-foreground transition hover:text-foreground"
      >
        {s.low ? "Low balance — top up →" : "Manage usage →"}
      </Link>
    </div>
  );
}

/** Full usage panel for the billing page. */
export function UsagePanel() {
  const s = useCreditSummary();

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl border border-border/60 p-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Credit balance · {s.period}
            </div>
            <div className="mt-1 text-3xl font-medium tracking-tight">{s.remaining.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {s.used.toLocaleString()} used of {s.total.toLocaleString()} ({s.included.toLocaleString()} included
              {s.topups > 0 ? ` + ${s.topups.toLocaleString()} topped up` : ""})
            </div>
          </div>
          <div className="text-right text-[10px] font-mono text-muted-foreground">
            resets monthly
          </div>
        </div>
        <Bar pct={s.pct} low={s.low} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(CREDIT_COST).map(([kind, cost]) => (
          <div key={kind} className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {kind.replace(/_/g, " ")}
            </div>
            <div className="mt-1 text-lg font-medium tracking-tight">{cost} cr</div>
          </div>
        ))}
      </div>

      <div className="glass-subtle rounded-xl border border-border/60 p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Top up credits</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {TOPUP_PACKS.map((p) => (
            <Button
              key={p.credits}
              variant="outline"
              className="justify-between"
              onClick={() => {
                topUpCredits(p.credits);
                toast.success(`Added ${p.credits.toLocaleString()} credits (demo)`);
              }}
            >
              <span>{p.credits.toLocaleString()} cr</span>
              <span className="font-mono text-xs text-muted-foreground">{p.price}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-subtle rounded-xl border border-border/60 p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Recent usage</div>
        {s.ledger.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No usage recorded yet this period.</p>
        ) : (
          <div className="mt-3 divide-y divide-border/60">
            {s.ledger.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-xs">
                <span className="truncate text-muted-foreground">{e.label}</span>
                <span className="ml-3 shrink-0 font-mono">-{e.credits} cr</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
