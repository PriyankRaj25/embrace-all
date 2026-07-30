import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ChargeResult, CreditSnapshot, LedgerEntry, ResetLog } from "@/lib/credits";

const PlanSchema = z.enum(["starter", "team", "scale", "enterprise"]).optional();
const KindSchema = z.enum(["vega_message", "agent_run", "security_scan", "blueprint"]);

/** Authoritative balance + plan rate-limit windows. */
export const getCreditSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: PlanSchema }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: snap, error } = await context.supabase.rpc("credit_snapshot", {
      _plan: data.plan,
    });
    if (error) throw new Error(error.message);
    return snap as unknown as CreditSnapshot;
  });

/** Deduct credits. Enforces balance + per-minute/per-day plan limits atomically. */
export const chargeCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: KindSchema,
        label: z.string().min(1).max(200),
        multiplier: z.number().min(0).max(100).default(1),
        requestId: z.string().min(6).max(120).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        plan: PlanSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("consume_credits", {
      _kind: data.kind,
      _label: data.label,
      _multiplier: data.multiplier,
      _request_id: data.requestId,
      _metadata: (data.metadata ?? {}) as never,
      _plan: data.plan,
    });
    if (error) throw new Error(error.message);
    return result as unknown as ChargeResult;
  });

/** Refund a charge in full or in part (e.g. a failed stream). */
export const refundCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entryId: z.string().uuid(),
        reason: z.string().min(1).max(200).default("refund"),
        amount: z.number().positive().max(100000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("refund_credits", {
      _entry_id: data.entryId,
      _reason: data.reason,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return result as unknown as ChargeResult;
  });

/** Manual adjustment or top-up (demo checkout / support credit). */
export const adjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().min(-100000).max(100000),
        label: z.string().min(1).max(200),
        kind: z.enum(["topup", "adjustment"]).default("adjustment"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("adjust_credits", {
      _amount: data.amount,
      _label: data.label,
      _kind: data.kind,
    });
    if (error) throw new Error(error.message);
    return result as unknown as ChargeResult;
  });

/** Per-message usage breakdown (charges, refunds, adjustments, resets). */
export const listCreditLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("credit_ledger")
      .select("id,period,entry_type,kind,label,credits,balance_after,request_id,reverses_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as LedgerEntry[];
  });

/** Monthly reset audit log. */
export const listCreditResets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("credit_resets")
      .select("id,from_period,to_period,used_before,topups_before,included_before,plan,created_at")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ResetLog[];
  });
