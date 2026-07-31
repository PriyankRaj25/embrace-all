import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AdminAccount,
  AdminAuditEntry,
  CreditIncident,
  OpsMetrics,
} from "@/lib/credits-admin";
import type { LedgerEntry } from "@/lib/credits";

const IncidentKind = z.enum([
  "enforcement_failure",
  "idempotency_conflict",
  "rate_limited",
  "insufficient_credits",
  "refund_anomaly",
  "stream_refund",
]);

/** Whether the signed-in user holds the admin role. */
export const isCreditAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("is_current_user_admin");
    if (error) return false;
    return Boolean(data);
  });

/** Aggregate credit-enforcement health for the monitoring dashboard. */
export const getOpsMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ hours: z.number().int().min(1).max(720).default(24) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: metrics, error } = await context.supabase.rpc("credit_ops_metrics", {
      _hours: data.hours,
    });
    if (error) throw new Error(error.message);
    return metrics as unknown as OpsMetrics;
  });

/** Incident feed: enforcement failures, idempotency conflicts, denials. */
export const listIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ limit: z.number().int().min(1).max(200).default(50), onlyOpen: z.boolean().default(false) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("admin_credit_incidents", {
      _limit: data.limit,
      _only_open: data.onlyOpen,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CreditIncident[];
  });

export const resolveIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ incidentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("resolve_credit_incident", {
      _incident_id: data.incidentId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Record an enforcement anomaly (called by the app when a charge misbehaves). */
export const recordIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: IncidentKind,
        message: z.string().min(1).max(500),
        severity: z.enum(["info", "warning", "critical"]).default("warning"),
        surface: z.string().min(1).max(80).default("app"),
        requestId: z.string().max(120).optional(),
        metadata: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("log_credit_incident", {
      _kind: data.kind,
      _message: data.message,
      _severity: data.severity,
      _surface: data.surface,
      _request_id: data.requestId,
      _metadata: (data.metadata ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** All credit accounts (admin), optionally filtered by email. */
export const listAdminAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ search: z.string().max(120).optional(), limit: z.number().int().min(1).max(200).default(50) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("admin_credit_accounts", {
      _search: data.search ?? null,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AdminAccount[];
  });

/** Any user's ledger (admin). */
export const listAdminLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ userId: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("admin_credit_ledger", {
      _user_id: data.userId,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as LedgerEntry[];
  });

/** Full audit trail of admin credit actions. */
export const listAdminAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("admin_credit_audit", {
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AdminAuditEntry[];
  });

/** Manual top-up / credit adjustment / decrement on any account. */
export const adminAdjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().positive().max(1_000_000),
        label: z.string().min(1).max(200),
        kind: z.enum(["topup", "adjustment", "decrement"]).default("topup"),
        reason: z.string().min(1).max(300).default("admin adjustment"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("admin_adjust_user_credits", {
      _user_id: data.userId,
      _amount: data.amount,
      _label: data.label,
      _kind: data.kind,
      _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return result as unknown as { ok: boolean; entry_id?: string };
  });

/** Admin refund of any charge, full or partial. */
export const adminRefundEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entryId: z.string().uuid(),
        reason: z.string().min(1).max(300).default("admin refund"),
        amount: z.number().positive().max(1_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("admin_refund_entry", {
      _entry_id: data.entryId,
      _reason: data.reason,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return result as unknown as { ok: boolean; reason?: string; refunded?: number };
  });
