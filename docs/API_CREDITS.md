# Credits & Metering API

Server-enforced usage metering for AetherOS. The browser **never** mutates a balance:
it reads an authoritative snapshot and the backend deducts credits only after it
confirms the work (Vega reply produced, agent pipeline accepted).

Last updated: 2026-07-30

---

## 1. Data model

| Table | Purpose |
| --- | --- |
| `credit_accounts` | One row per user: `plan`, `period` (YYYY-MM), `included`, `topups`, `used`. |
| `credit_ledger` | Append-only per-event breakdown: `entry_type` (`charge \| refund \| adjustment \| topup \| reset`), `kind`, `label`, `credits`, `balance_after`, `request_id` (idempotency), `reverses_id`, `metadata`. |
| `credit_resets` | Monthly reset audit log: `from_period`, `to_period`, `used_before`, `topups_before`, `included_before`, `plan`. |

RLS: users may only `SELECT` their own rows. All mutations happen inside
`SECURITY DEFINER` functions scoped to `auth.uid()`; no client write grants exist.

## 2. Pricing & plan limits

Cost per unit (`public.credit_cost`):

| Kind | Credits |
| --- | --- |
| `vega_message` | 1 |
| `security_scan` | 2 |
| `agent_run` | 4 |
| `blueprint` | 12 |

Included credits + rate limits (`public.credit_plan_config`):

| Plan | Included | messages/min · day | agent runs/min · day | scans/min · day | blueprints/min · day |
| --- | --- | --- | --- | --- | --- |
| starter | 200 | 10 · 100 | 2 · 20 | 4 · 40 | 1 · 5 |
| team | 4,000 | 30 · 1,500 | 6 · 300 | 10 · 400 | 3 · 60 |
| scale | 40,000 | 90 · 10,000 | 20 · 2,000 | 40 · 4,000 | 10 · 400 |
| enterprise | 250,000 | 300 · 100,000 | 100 · 20,000 | 200 · 40,000 | 40 · 4,000 |

## 3. Database RPCs (authenticated only)

### `credit_snapshot(_plan text default null) -> jsonb`
Ensures the account exists, applies the monthly rollover (writing a `credit_resets`
row + a `reset` ledger entry), and returns:

```jsonc
{
  "plan": "team", "period": "2026-07",
  "included": 4000, "topups": 500, "used": 132,
  "total": 4500, "remaining": 4368,
  "limits": {
    "vega_message": { "cost": 1, "per_minute": 30, "per_day": 1500,
                      "used_minute": 2, "used_day": 88,
                      "remaining_minute": 28, "remaining_day": 1412 }
  }
}
```

### `consume_credits(_kind, _label, _multiplier, _request_id, _metadata, _plan) -> jsonb`
Atomic: idempotency check → rollover → rate-limit windows → balance → debit + ledger row.

```jsonc
{ "ok": true, "entry_id": "uuid", "charged": 1, "snapshot": { … } }
{ "ok": false, "reason": "rate_limited", "window": "minute", "limit": 30, "retry_after_seconds": 60, "snapshot": { … } }
{ "ok": false, "reason": "insufficient_credits", "required": 4, "remaining": 1, "snapshot": { … } }
{ "ok": true, "idempotent": true, "entry_id": "uuid", "charged": 1 }   // replayed request_id
```

### `refund_credits(_entry_id uuid, _reason text, _amount numeric default null) -> jsonb`
Full or partial reversal of a `charge`. Never over-refunds (`already_refunded`).

### `adjust_credits(_amount numeric, _label text, _kind 'topup'|'adjustment') -> jsonb`
`topup` increases `topups`; `adjustment` reduces `used` (support credit).

## 4. Server functions (`src/lib/credits.functions.ts`)

All use `requireSupabaseAuth`; the bearer token is attached automatically.

| Function | Method | Input | Returns |
| --- | --- | --- | --- |
| `getCreditSnapshot` | GET | `{ plan? }` | `CreditSnapshot` |
| `chargeCredits` | POST | `{ kind, label, multiplier?, requestId?, metadata?, plan? }` | `ChargeResult` |
| `refundCredits` | POST | `{ entryId, reason?, amount? }` | `ChargeResult` |
| `adjustCredits` | POST | `{ amount, label, kind? }` | `ChargeResult` |
| `listCreditLedger` | GET | `{ limit? ≤ 200 }` | `LedgerEntry[]` |
| `listCreditResets` | GET | — | `ResetLog[]` |

## 5. HTTP route: `POST /api/chat`

Requires `Authorization: Bearer <supabase access token>` for **both** modes.

**Chat mode** — body `{ messages: UIMessage[], plan? }`:
1. Validate bearer.
2. `consume_credits('vega_message', …, request_id=<uuid>)`.
3. `402` when out of credits, `429` when rate limited (body carries the human message).
4. Stream the reply; on stream error the charge is refunded automatically.

**Orchestration mode** — body `{ projectId, plan? }`:
1. Validate bearer + project ownership (RLS).
2. `consume_credits('agent_run', …)` before the pipeline starts → `402` / `429` as above.
3. NDJSON event stream; if the pipeline throws, the agent-run charge is refunded.

| Status | Meaning |
| --- | --- |
| 200 | Streaming response (usage already recorded) |
| 401 | Missing/invalid bearer token |
| 402 | Insufficient credits |
| 429 | Plan rate limit hit (per minute or per day) |
| 500 | Missing `LOVABLE_API_KEY` or database error |

## 6. Client usage (`src/lib/credits.ts`)

```tsx
const { remaining, total, pct, low, limits } = useCreditSummary();   // React Query
const gate = quotaFor(snapshot, "vega_message");                     // pre-flight check
if (!gate.allowed) toast.error(gate.reason);

const { chargeMutation, refundMutation, adjustMutation } = useCreditActions();
```

UI surfaces:
- `UsageMeter` — sidebar / chat balance bar.
- `QuotaStrip` — remaining per-minute and per-day quota chips (shown in Vega's composer **before** a request fails).
- `UsagePanel` (Billing) — balance, quotas, per-entry ledger with refund buttons, top-ups, monthly reset audit log.

---

## 7. Monitoring & alerting

### `credit_incidents`
Append-only enforcement telemetry written by the server (and by the client transport for
unexpected responses).

| Column | Notes |
| --- | --- |
| `kind` | `enforcement_failure \| idempotency_conflict \| rate_limited \| insufficient_credits \| refund_failure \| transport_error` |
| `severity` | `info \| warning \| critical` |
| `surface` | `chat \| orchestration \| client \| admin` |
| `message`, `request_id`, `entry_id`, `metadata` | Diagnostic payload |
| `resolved_at`, `resolved_by` | Set by an admin from the ops console |

### `credit_ops_metrics(_hours int default 24) -> jsonb` (admin only)
Health report for the window:

```jsonc
{
  "window_hours": 24,
  "charges": 1820, "charge_count": 940,
  "refunds": 96, "refund_count": 41, "refund_rate": 5.3,
  "enforcement_failures": 0, "idempotency_conflicts": 2, "rate_limited": 7,
  "top_refunders": [{ "user_id": "…", "charged": 220, "refunded": 60, "refund_rate": 27.3 }],
  "alerts": [{ "id": "refund_rate", "severity": "critical", "title": "…", "detail": "…" }]
}
```

Alert thresholds: refund rate ≥ 10% (warning) / ≥ 25% (critical); any enforcement failure
(critical); ≥ 3 idempotency conflicts (warning).

## 8. Admin RPCs (require `has_role(auth.uid(),'admin')`)

| RPC | Purpose |
| --- | --- |
| `admin_adjust_user_credits(_user_id, _amount, _kind, _label, _reason)` | `topup` (adds to `topups`), `adjustment` (reduces `used`), `decrement` (increases `used`) |
| `admin_refund_entry(_entry_id, _reason, _amount)` | Refund any user's charge |
| `admin_list_accounts(_search, _limit)` | Balance list with email lookup |
| `admin_list_ledger(_user_id, _limit)` | Any user's ledger |
| `admin_list_incidents(_limit, _unresolved_only)` | Incident feed |
| `admin_resolve_incident(_id)` | Mark an incident handled |
| `admin_list_audit(_limit)` | Admin action audit trail |

Every admin mutation writes a `credit_admin_audit` row: `actor_id`, `target_user_id`,
`action`, `amount`, `reason`, `before_snapshot`, `after_snapshot`, `created_at`.

## 9. Admin server functions (`src/lib/credits-admin.functions.ts`)

`isCreditAdmin`, `getOpsMetrics`, `listIncidents`, `resolveIncident`, `listAdminAccounts`,
`listAdminLedger`, `adminAdjustCredits`, `adminRefundEntry`, `listAdminAudit` — all behind
`requireSupabaseAuth` plus a server-side `has_role` check (403 for non-admins).

Hooks live in `src/lib/credits-admin.ts` (`useIsCreditAdmin`, `useOpsMetrics`, `useIncidents`,
`useAdminAccounts`, `useAdminLedger`, `useAdminAudit`, `useAdminCreditActions`).

## 10. Preflight quota UI

`preflightWarning(snapshot, kind, multiplier)` in `src/components/usage-meter.tsx` returns a
`warning` (< 10% balance, ≤ 20% of the per-minute window, ≤ 10% of the daily window) or
`blocked` verdict *before* a request is sent. `<QuotaWarning />` renders it inline — mounted
above Vega's composer and above the project workspace run controls.

## 11. Admin console

`/admin/credits` (sidebar → Account → **Credit ops**, admin only): metric tiles, live alerts,
incident feed with resolve, per-account balance search, top-up / credit-back / decrement,
per-entry refunds and the full audit trail.
