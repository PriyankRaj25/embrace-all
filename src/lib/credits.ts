// Server-enforced credits. The browser never mutates balance — it reads the
// authoritative snapshot and asks the backend to charge/refund.
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBilling, type PlanId } from "@/lib/pricing";
import {
  adjustCredits as adjustCreditsFn,
  chargeCredits as chargeCreditsFn,
  getCreditSnapshot,
  listCreditLedger,
  listCreditResets,
  refundCredits as refundCreditsFn,
} from "@/lib/credits.functions";

export type UsageKind = "vega_message" | "agent_run" | "security_scan" | "blueprint";
export type EntryType = "charge" | "refund" | "adjustment" | "topup" | "reset";

export const CREDIT_COST: Record<UsageKind, number> = {
  vega_message: 1,
  agent_run: 4,
  security_scan: 2,
  blueprint: 12,
};

export const PLAN_CREDITS: Record<PlanId, number> = {
  starter: 200,
  team: 4000,
  scale: 40000,
  enterprise: 250000,
};

/** Plan rate limits mirrored from the database (public.credit_plan_config). */
export const PLAN_RATE_LIMITS: Record<PlanId, Record<UsageKind, { per_minute: number; per_day: number }>> = {
  starter: {
    vega_message: { per_minute: 10, per_day: 100 },
    agent_run: { per_minute: 2, per_day: 20 },
    security_scan: { per_minute: 4, per_day: 40 },
    blueprint: { per_minute: 1, per_day: 5 },
  },
  team: {
    vega_message: { per_minute: 30, per_day: 1500 },
    agent_run: { per_minute: 6, per_day: 300 },
    security_scan: { per_minute: 10, per_day: 400 },
    blueprint: { per_minute: 3, per_day: 60 },
  },
  scale: {
    vega_message: { per_minute: 90, per_day: 10000 },
    agent_run: { per_minute: 20, per_day: 2000 },
    security_scan: { per_minute: 40, per_day: 4000 },
    blueprint: { per_minute: 10, per_day: 400 },
  },
  enterprise: {
    vega_message: { per_minute: 300, per_day: 100000 },
    agent_run: { per_minute: 100, per_day: 20000 },
    security_scan: { per_minute: 200, per_day: 40000 },
    blueprint: { per_minute: 40, per_day: 4000 },
  },
};

export type LimitWindow = {
  cost: number;
  per_minute: number;
  per_day: number;
  used_minute: number;
  used_day: number;
  remaining_minute: number;
  remaining_day: number;
};

export type CreditSnapshot = {
  plan: PlanId;
  period: string;
  included: number;
  topups: number;
  used: number;
  total: number;
  remaining: number;
  limits: Record<UsageKind, LimitWindow>;
};

export type ChargeResult = {
  ok: boolean;
  idempotent?: boolean;
  reason?: "rate_limited" | "insufficient_credits" | "entry_not_found" | "already_refunded";
  window?: "minute" | "day";
  limit?: number;
  retry_after_seconds?: number;
  required?: number;
  remaining?: number;
  entry_id?: string;
  charged?: number;
  refunded?: number;
  snapshot?: CreditSnapshot;
};

export type LedgerEntry = {
  id: string;
  period: string;
  entry_type: EntryType;
  kind: string;
  label: string;
  credits: number;
  balance_after: number | null;
  request_id: string | null;
  reverses_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ResetLog = {
  id: string;
  from_period: string;
  to_period: string;
  used_before: number;
  topups_before: number;
  included_before: number;
  plan: string;
  created_at: string;
};

export const TOPUP_PACKS = [
  { credits: 500, price: "$19" },
  { credits: 2500, price: "$79" },
  { credits: 10000, price: "$249" },
];

export const CREDITS_QUERY_KEY = ["credits", "snapshot"] as const;

export function summarize(snapshot?: CreditSnapshot | null) {
  const total = snapshot?.total ?? 0;
  const used = snapshot?.used ?? 0;
  const remaining = snapshot?.remaining ?? 0;
  return {
    plan: (snapshot?.plan ?? "starter") as PlanId,
    period: snapshot?.period ?? "",
    included: snapshot?.included ?? 0,
    topups: snapshot?.topups ?? 0,
    used,
    total,
    remaining,
    pct: total === 0 ? 0 : Math.min(100, (used / total) * 100),
    low: total > 0 && remaining / total < 0.15,
    limits: snapshot?.limits,
  };
}

/** Authoritative balance + quotas. Returns undefined while signed out. */
export function useCreditSnapshot() {
  const fn = useServerFn(getCreditSnapshot);
  const plan = typeof window === "undefined" ? "starter" : getBilling().plan;
  return useQuery({
    queryKey: [...CREDITS_QUERY_KEY, plan],
    queryFn: () => fn({ data: { plan } }),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useCreditSummary() {
  const { data, isLoading, refetch } = useCreditSnapshot();
  return { ...summarize(data), snapshot: data, isLoading, refetch };
}

export function useCreditLedger(limit = 50) {
  const fn = useServerFn(listCreditLedger);
  return useQuery({
    queryKey: ["credits", "ledger", limit],
    queryFn: () => fn({ data: { limit } }),
    retry: false,
  });
}

export function useCreditResets() {
  const fn = useServerFn(listCreditResets);
  return useQuery({ queryKey: ["credits", "resets"], queryFn: () => fn({ data: undefined }), retry: false });
}

/** Quota gate used by the UI before firing a request. */
export function quotaFor(snapshot: CreditSnapshot | undefined, kind: UsageKind, multiplier = 1) {
  const cost = CREDIT_COST[kind] * multiplier;
  if (!snapshot) return { allowed: true, cost, reason: null as null | string };
  const win = snapshot.limits?.[kind];
  if (snapshot.remaining < cost)
    return { allowed: false, cost, reason: `Not enough credits — ${cost} needed, ${snapshot.remaining} left.` };
  if (win && win.remaining_minute <= 0)
    return { allowed: false, cost, reason: `Rate limit reached (${win.per_minute}/min on ${snapshot.plan}). Retry in a minute.` };
  if (win && win.remaining_day <= 0)
    return { allowed: false, cost, reason: `Daily limit reached (${win.per_day}/day on ${snapshot.plan}).` };
  return { allowed: true, cost, reason: null };
}

export function useCreditActions() {
  const qc = useQueryClient();
  const charge = useServerFn(chargeCreditsFn);
  const refund = useServerFn(refundCreditsFn);
  const adjust = useServerFn(adjustCreditsFn);

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["credits"] });
  }, [qc]);

  const chargeMutation = useMutation({
    mutationFn: (input: {
      kind: UsageKind;
      label: string;
      multiplier?: number;
      requestId?: string;
      metadata?: Record<string, unknown>;
    }) => charge({ data: { ...input, multiplier: input.multiplier ?? 1, plan: getBilling().plan } }),
    onSettled: invalidate,
  });

  const refundMutation = useMutation({
    mutationFn: (input: { entryId: string; reason?: string; amount?: number }) =>
      refund({ data: { reason: "refund", ...input } }),
    onSettled: invalidate,
  });

  const adjustMutation = useMutation({
    mutationFn: (input: { amount: number; label: string; kind?: "topup" | "adjustment" }) =>
      adjust({ data: { kind: "adjustment", ...input } }),
    onSettled: invalidate,
  });

  return { chargeMutation, refundMutation, adjustMutation, invalidate };
}
