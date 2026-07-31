// Admin-side credits: monitoring metrics, incident feed, manual adjustments.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { LedgerEntry } from "@/lib/credits";
import {
  adminAdjustCredits as adminAdjustFn,
  adminRefundEntry as adminRefundFn,
  getOpsMetrics,
  isCreditAdmin,
  listAdminAccounts,
  listAdminAudit,
  listAdminLedger,
  listIncidents,
  recordIncident as recordIncidentFn,
  resolveIncident as resolveIncidentFn,
} from "@/lib/credits-admin.functions";

export type IncidentKind =
  | "enforcement_failure"
  | "idempotency_conflict"
  | "rate_limited"
  | "insufficient_credits"
  | "refund_anomaly"
  | "stream_refund";

export type CreditIncident = {
  id: string;
  user_id: string | null;
  email: string | null;
  kind: IncidentKind;
  severity: "info" | "warning" | "critical";
  surface: string;
  message: string;
  request_id: string | null;
  metadata: Record<string, unknown>;
  resolved_at: string | null;
  created_at: string;
};

export type OpsAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export type OpsMetrics = {
  window_hours: number;
  generated_at: string;
  charges: number;
  charge_count: number;
  refunds: number;
  refund_count: number;
  refund_rate: number;
  incidents: Partial<Record<IncidentKind, number>>;
  open_critical: number;
  enforcement_failures: number;
  idempotency_conflicts: number;
  top_refunders: { user_id: string; charged: number; refunded: number; refund_rate: number }[];
  series: { bucket: string; charged: number; refunded: number }[];
  alerts: OpsAlert[];
};

export type AdminAccount = {
  user_id: string;
  email: string | null;
  plan: string;
  period: string;
  included: number;
  topups: number;
  used: number;
  remaining: number;
  updated_at: string;
};

export type AdminAuditEntry = {
  id: string;
  actor_id: string;
  actor_email: string | null;
  target_user_id: string;
  target_email: string | null;
  action: string;
  amount: number | null;
  reason: string;
  entry_id: string | null;
  before_snapshot: Record<string, unknown>;
  after_snapshot: Record<string, unknown>;
  created_at: string;
};

export function useIsCreditAdmin() {
  const fn = useServerFn(isCreditAdmin);
  return useQuery({
    queryKey: ["credits", "is-admin"],
    queryFn: () => fn({ data: undefined }),
    retry: false,
    staleTime: 60_000,
  });
}

export function useOpsMetrics(hours = 24) {
  const fn = useServerFn(getOpsMetrics);
  return useQuery({
    queryKey: ["credits", "ops-metrics", hours],
    queryFn: () => fn({ data: { hours } }),
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useIncidents(limit = 50, onlyOpen = false) {
  const fn = useServerFn(listIncidents);
  return useQuery({
    queryKey: ["credits", "incidents", limit, onlyOpen],
    queryFn: () => fn({ data: { limit, onlyOpen } }),
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useAdminAccounts(search = "", limit = 50) {
  const fn = useServerFn(listAdminAccounts);
  return useQuery({
    queryKey: ["credits", "admin-accounts", search, limit],
    queryFn: () => fn({ data: { search: search || undefined, limit } }),
    retry: false,
  });
}

export function useAdminLedger(userId: string | null, limit = 50) {
  const fn = useServerFn(listAdminLedger);
  return useQuery({
    queryKey: ["credits", "admin-ledger", userId, limit],
    queryFn: () => fn({ data: { userId: userId as string, limit } }),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useAdminAudit(limit = 60) {
  const fn = useServerFn(listAdminAudit);
  return useQuery({
    queryKey: ["credits", "admin-audit", limit],
    queryFn: () => fn({ data: { limit } }),
    retry: false,
  });
}

export function useAdminCreditActions() {
  const qc = useQueryClient();
  const adjust = useServerFn(adminAdjustFn);
  const refund = useServerFn(adminRefundFn);
  const resolve = useServerFn(resolveIncidentFn);
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["credits"] });

  const adjustMutation = useMutation({
    mutationFn: (input: {
      userId: string;
      amount: number;
      label: string;
      kind: "topup" | "adjustment" | "decrement";
      reason: string;
    }) => adjust({ data: input }),
    onSettled: invalidate,
  });

  const refundMutation = useMutation({
    mutationFn: (input: { entryId: string; reason: string; amount?: number }) => refund({ data: input }),
    onSettled: invalidate,
  });

  const resolveMutation = useMutation({
    mutationFn: (incidentId: string) => resolve({ data: { incidentId } }),
    onSettled: invalidate,
  });

  return { adjustMutation, refundMutation, resolveMutation };
}

/** Fire-and-forget incident reporting from client surfaces. */
export function useIncidentReporter() {
  const fn = useServerFn(recordIncidentFn);
  return (input: {
    kind: IncidentKind;
    message: string;
    severity?: "info" | "warning" | "critical";
    surface?: string;
    requestId?: string;
    metadata?: Record<string, string | number | boolean | null>;
  }) => {
    void fn({
      data: {
        severity: "warning",
        surface: "app",
        ...input,
      },
    }).catch(() => undefined);
  };
}

export type { LedgerEntry };
