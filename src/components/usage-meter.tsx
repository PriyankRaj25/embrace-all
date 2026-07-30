import { Link } from "@tanstack/react-router";
import { Zap, RotateCcw, ArrowDownRight, ArrowUpRight, History, Gauge } from "lucide-react";
import { toast } from "sonner";
import {
  CREDIT_COST,
  TOPUP_PACKS,
  useCreditActions,
  useCreditLedger,
  useCreditResets,
  useCreditSummary,
  type LedgerEntry,
  type UsageKind,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export { useCreditSummary };

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
      <Link to="/billing" className="block text-[10px] text-muted-foreground transition hover:text-foreground">
        {s.low ? "Low balance — top up →" : "Manage usage →"}
      </Link>
    </div>
  );
}

/** Live plan quotas — shown before requests fail. */
export function QuotaStrip({ className, kinds }: { className?: string; kinds?: UsageKind[] }) {
  const s = useCreditSummary();
  const limits = s.limits;
  if (!limits) return null;
  const keys = (kinds ?? (Object.keys(limits) as UsageKind[])).filter((k) => limits[k]);

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {keys.map((k) => {
        const w = limits[k];
        const tight = w.remaining_minute <= 1 || w.remaining_day <= 3;
        return (
          <span
            key={k}
            title={`${w.used_minute}/${w.per_minute} this minute · ${w.used_day}/${w.per_day} today`}
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[10px] backdrop-blur-md",
              tight
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border/60 bg-background/40 text-muted-foreground",
            )}
          >
            {k.replace(/_/g, " ")} · {w.remaining_minute}/min · {w.remaining_day}/day
          </span>
        );
      })}
    </div>
  );
}

function EntryIcon({ e }: { e: LedgerEntry }) {
  if (e.entry_type === "reset") return <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />;
  if (e.credits < 0 || e.entry_type === "refund" || e.entry_type === "topup")
    return <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />;
  return <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />;
}

/** Full usage panel for the billing page. */
export function UsagePanel() {
  const s = useCreditSummary();
  const ledger = useCreditLedger(60);
  const resets = useCreditResets();
  const { chargeMutation, refundMutation, adjustMutation } = useCreditActions();

  const entries = ledger.data ?? [];
  const refunded = new Set(entries.filter((e) => e.reverses_id).map((e) => e.reverses_id as string));

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl border border-border/60 p-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Credit balance · {s.period || "—"} · {s.plan}
            </div>
            <div className="mt-1 text-3xl font-medium tracking-tight">{s.remaining.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {s.used.toLocaleString()} used of {s.total.toLocaleString()} ({s.included.toLocaleString()} included
              {s.topups > 0 ? ` + ${s.topups.toLocaleString()} topped up` : ""})
            </div>
          </div>
          <div className="text-right text-[10px] font-mono text-muted-foreground">
            server-enforced · resets monthly
          </div>
        </div>
        <Bar pct={s.pct} low={s.low} />
      </div>

      <div className="glass-subtle rounded-xl border border-border/60 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Gauge className="h-3 w-3" /> Rate limits remaining
        </div>
        <QuotaStrip />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
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
              disabled={adjustMutation.isPending}
              onClick={async () => {
                const res = await adjustMutation.mutateAsync({
                  amount: p.credits,
                  label: `Top-up ${p.credits} credits (${p.price})`,
                  kind: "topup",
                });
                if (res?.ok) toast.success(`Added ${p.credits.toLocaleString()} credits`);
                else toast.error("Top-up failed");
              }}
            >
              <span>{p.credits.toLocaleString()} cr</span>
              <span className="font-mono text-xs text-muted-foreground">{p.price}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-subtle rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Usage ledger · per-message breakdown
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px]"
            disabled={chargeMutation.isPending}
            onClick={async () => {
              const res = await chargeMutation.mutateAsync({
                kind: "security_scan",
                label: "Manual test charge",
              });
              if (!res?.ok) toast.error(res?.reason === "rate_limited" ? "Rate limited" : "Insufficient credits");
            }}
          >
            test charge
          </Button>
        </div>
        {ledger.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading ledger…</p>
        ) : entries.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No usage recorded yet this period.</p>
        ) : (
          <div className="mt-3 divide-y divide-border/60">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <EntryIcon e={e} />
                  <div className="min-w-0">
                    <div className="truncate">{e.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()} · {e.entry_type} · {e.kind}
                      {e.balance_after !== null ? ` · balance ${Number(e.balance_after).toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono">{Number(e.credits) > 0 ? "-" : "+"}{Math.abs(Number(e.credits))} cr</span>
                  {e.entry_type === "charge" && !refunded.has(e.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px]"
                      disabled={refundMutation.isPending}
                      onClick={async () => {
                        const res = await refundMutation.mutateAsync({ entryId: e.id, reason: "manual refund" });
                        if (res?.ok) toast.success(`Refunded ${res.refunded} cr`);
                        else toast.error(res?.reason === "already_refunded" ? "Already refunded" : "Refund failed");
                      }}
                    >
                      refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-subtle rounded-xl border border-border/60 p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <History className="h-3 w-3" /> Monthly reset audit log
        </div>
        {(resets.data ?? []).length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No resets recorded yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border/60">
            {(resets.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 text-xs">
                <span>
                  {r.from_period} → {r.to_period}{" "}
                  <span className="text-muted-foreground">({r.plan})</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {Number(r.used_before).toLocaleString()} used · {r.topups_before.toLocaleString()} top-ups cleared
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
