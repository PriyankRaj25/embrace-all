import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminAccounts,
  useAdminAudit,
  useAdminCreditActions,
  useAdminLedger,
  useIncidents,
  useIsCreditAdmin,
  useOpsMetrics,
  type AdminAccount,
} from "@/lib/credits-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/credits")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Credit Operations · AetherOS Admin" },
      {
        name: "description",
        content:
          "Admin console for AetherOS credit enforcement: monitoring, incident alerts, refunds and manual balance adjustments with full audit trails.",
      },
      { property: "og:title", content: "Credit Operations · AetherOS Admin" },
      {
        property: "og:description",
        content: "Monitor credit enforcement failures, idempotency conflicts and refund rates; adjust balances with audit trails.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCreditsPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass-subtle rounded-xl border border-border/60 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-medium tracking-tight">{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function AdminCreditsPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCreditAdmin();
  const [hours, setHours] = useState(24);
  const metrics = useOpsMetrics(hours);
  const incidents = useIncidents(60, false);
  const audit = useAdminAudit(60);
  const [search, setSearch] = useState("");
  const accounts = useAdminAccounts(search);
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const ledger = useAdminLedger(selected?.user_id ?? null, 60);
  const { adjustMutation, refundMutation, resolveMutation } = useAdminCreditActions();

  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("Support credit");

  if (adminLoading) return <div className="p-8 text-sm text-muted-foreground">Checking permissions…</div>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10">
        <div className="glass-panel rounded-2xl border border-border/60 p-8 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-medium tracking-tight">Admin access required</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Credit operations are restricted to workspace administrators.
          </p>
        </div>
      </div>
    );
  }

  const m = metrics.data;

  async function runAdjust(kind: "topup" | "adjustment" | "decrement") {
    if (!selected) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter a positive amount");
    const res = await adjustMutation.mutateAsync({
      userId: selected.user_id,
      amount: value,
      kind,
      label: `${kind === "topup" ? "Admin top-up" : kind === "decrement" ? "Admin decrement" : "Admin credit"} · ${reason}`,
      reason,
    });
    if (res?.ok) toast.success(`${kind} of ${value} credits recorded`);
    else toast.error("Action failed");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Admin</div>
          <h1 className="text-2xl font-medium tracking-tight">Credit operations</h1>
          <p className="text-sm text-muted-foreground">
            Enforcement monitoring, alerting and manual adjustments — every action is audited.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 24, 168].map((h) => (
            <Button
              key={h}
              size="sm"
              variant={hours === h ? "default" : "outline"}
              className="h-7 text-[11px]"
              onClick={() => setHours(h)}
            >
              {h === 1 ? "1h" : h === 24 ? "24h" : "7d"}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="h-7" onClick={() => void metrics.refetch()}>
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {(m?.alerts?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {m!.alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "glass-panel flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
                a.severity === "critical" ? "border-destructive/60 bg-destructive/5" : "border-border/70",
              )}
            >
              <AlertTriangle
                className={cn("mt-0.5 h-4 w-4 shrink-0", a.severity === "critical" && "text-destructive")}
              />
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Charged"
          value={`${Number(m?.charges ?? 0).toLocaleString()} cr`}
          hint={`${m?.charge_count ?? 0} charges · last ${m?.window_hours ?? hours}h`}
        />
        <Stat
          label="Refunded"
          value={`${Number(m?.refunds ?? 0).toLocaleString()} cr`}
          hint={`${m?.refund_count ?? 0} refunds`}
        />
        <Stat
          label="Refund rate"
          value={`${Number(m?.refund_rate ?? 0)}%`}
          hint="alert at 10% · critical at 25%"
        />
        <Stat
          label="Enforcement failures"
          value={String(m?.enforcement_failures ?? 0)}
          hint={`${m?.idempotency_conflicts ?? 0} idempotency conflicts`}
        />
      </div>

      <Tabs defaultValue="incidents">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="mt-4 space-y-3">
          <div className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <Activity className="h-3 w-3" /> Enforcement incident feed
            </div>
            {incidents.isLoading ? (
              <p className="mt-3 text-xs text-muted-foreground">Loading incidents…</p>
            ) : (incidents.data?.length ?? 0) === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No incidents recorded in this window.</p>
            ) : (
              <div className="mt-3 divide-y divide-border/60">
                {incidents.data!.map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                            i.severity === "critical"
                              ? "border-destructive/50 bg-destructive/10 text-destructive"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {i.kind.replace(/_/g, " ")}
                        </span>
                        <span className="truncate">{i.message}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {new Date(i.created_at).toLocaleString()} · {i.surface}
                        {i.email ? ` · ${i.email}` : ""}
                        {i.request_id ? ` · req ${i.request_id.slice(0, 8)}` : ""}
                        {i.resolved_at ? " · resolved" : ""}
                      </div>
                    </div>
                    {!i.resolved_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 shrink-0 text-[10px]"
                        disabled={resolveMutation.isPending}
                        onClick={async () => {
                          await resolveMutation.mutateAsync(i.id);
                          toast.success("Incident resolved");
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Highest refund rates
            </div>
            {(m?.top_refunders?.length ?? 0) === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No refunds in this window.</p>
            ) : (
              <div className="mt-3 divide-y divide-border/60">
                {m!.top_refunders.map((r) => (
                  <div key={r.user_id} className="flex items-center justify-between py-2 font-mono text-[11px]">
                    <span className="truncate text-muted-foreground">{r.user_id.slice(0, 8)}…</span>
                    <span>
                      {Number(r.refunded).toLocaleString()} / {Number(r.charged).toLocaleString()} cr ·{" "}
                      <span className={cn(Number(r.refund_rate) >= 25 && "text-destructive")}>{r.refund_rate}%</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4 grid gap-3 lg:grid-cols-[320px_1fr]">
          <div className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="h-9 pl-8 text-xs"
              />
            </div>
            <div className="mt-3 max-h-[420px] space-y-1 overflow-auto">
              {(accounts.data ?? []).map((a) => (
                <button
                  key={a.user_id}
                  onClick={() => setSelected(a)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                    selected?.user_id === a.user_id
                      ? "border-foreground/40 bg-foreground/5"
                      : "border-border/50 hover:bg-foreground/5",
                  )}
                >
                  <div className="truncate">{a.email ?? a.user_id}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {a.plan} · {Number(a.remaining).toLocaleString()} cr left · used {Number(a.used).toLocaleString()}
                  </div>
                </button>
              ))}
              {(accounts.data?.length ?? 0) === 0 && (
                <p className="py-3 text-xs text-muted-foreground">No accounts found.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {!selected ? (
              <div className="glass-subtle grid h-40 place-items-center rounded-xl border border-border/60 text-xs text-muted-foreground">
                Select an account to adjust credits.
              </div>
            ) : (
              <>
                <div className="glass-panel rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <Wallet className="h-3 w-3" /> {selected.email ?? selected.user_id}
                  </div>
                  <div className="mt-1 text-2xl font-medium tracking-tight">
                    {Number(selected.remaining).toLocaleString()} cr
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selected.plan} · {selected.period} · included {selected.included.toLocaleString()} + topups{" "}
                    {selected.topups.toLocaleString()} − used {Number(selected.used).toLocaleString()}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="numeric"
                      placeholder="Amount"
                      className="h-9 text-xs"
                    />
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (audited)"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" disabled={adjustMutation.isPending} onClick={() => void runAdjust("topup")}>
                      Top up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={adjustMutation.isPending}
                      onClick={() => void runAdjust("adjustment")}
                    >
                      Credit back (reduce used)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={adjustMutation.isPending}
                      onClick={() => void runAdjust("decrement")}
                    >
                      Decrement
                    </Button>
                  </div>
                </div>

                <div className="glass-subtle rounded-xl border border-border/60 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Ledger · {selected.email ?? "account"}
                  </div>
                  {ledger.isLoading ? (
                    <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
                  ) : (
                    <div className="mt-3 max-h-[360px] divide-y divide-border/60 overflow-auto">
                      {(ledger.data ?? []).map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                          <div className="min-w-0">
                            <div className="truncate">{e.label}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {new Date(e.created_at).toLocaleString()} · {e.entry_type} · {e.kind}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-mono">
                              {Number(e.credits) > 0 ? "-" : "+"}
                              {Math.abs(Number(e.credits))} cr
                            </span>
                            {e.entry_type === "charge" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px]"
                                disabled={refundMutation.isPending}
                                onClick={async () => {
                                  const res = await refundMutation.mutateAsync({
                                    entryId: e.id,
                                    reason: reason || "admin refund",
                                  });
                                  if (res?.ok) toast.success(`Refunded ${res.refunded} cr`);
                                  else
                                    toast.error(
                                      res?.reason === "already_refunded" ? "Already refunded" : "Refund failed",
                                    );
                                }}
                              >
                                refund
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(ledger.data?.length ?? 0) === 0 && (
                        <p className="py-3 text-xs text-muted-foreground">No ledger entries.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Admin action audit trail
            </div>
            {audit.isLoading ? (
              <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
            ) : (audit.data?.length ?? 0) === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No admin adjustments recorded yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border/60">
                {audit.data!.map((a) => (
                  <div key={a.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        <span className="font-medium">{a.action}</span> {Number(a.amount ?? 0).toLocaleString()} cr ·{" "}
                        {a.target_email ?? a.target_user_id}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      by {a.actor_email ?? a.actor_id} · {a.reason} · remaining{" "}
                      {String(a.before_snapshot?.remaining ?? "—")} → {String(a.after_snapshot?.remaining ?? "—")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
