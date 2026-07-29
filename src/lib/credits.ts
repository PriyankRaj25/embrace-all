// Frontend-only credits + usage metering (demo). Persisted in localStorage.
import { getBilling, type PlanId } from "@/lib/pricing";

export type UsageKind = "vega_message" | "agent_run" | "security_scan" | "blueprint";

export type LedgerEntry = {
  id: string;
  kind: UsageKind;
  label: string;
  credits: number;
  at: string;
};

export type CreditsState = {
  period: string; // YYYY-MM
  used: number;
  ledger: LedgerEntry[];
  topups: number;
};

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

const KEY = "aether:credits";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const FALLBACK = (): CreditsState => ({
  period: currentPeriod(),
  used: 0,
  ledger: [],
  topups: 0,
});

export function getCredits(): CreditsState {
  if (typeof window === "undefined") return FALLBACK();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FALLBACK();
    const parsed = { ...FALLBACK(), ...(JSON.parse(raw) as CreditsState) };
    if (parsed.period !== currentPeriod()) return FALLBACK(); // monthly reset
    return parsed;
  } catch {
    return FALLBACK();
  }
}

function save(state: CreditsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("aether:credits"));
}

export function creditAllowance() {
  const { plan } = getBilling();
  return PLAN_CREDITS[plan] + getCredits().topups;
}

export function creditSummary() {
  const state = getCredits();
  const included = PLAN_CREDITS[getBilling().plan];
  const total = included + state.topups;
  const remaining = Math.max(0, total - state.used);
  return {
    ...state,
    included,
    total,
    remaining,
    pct: total === 0 ? 0 : Math.min(100, (state.used / total) * 100),
    low: remaining / Math.max(1, total) < 0.15,
  };
}

export function consumeCredits(kind: UsageKind, label: string, multiplier = 1) {
  const state = getCredits();
  const credits = CREDIT_COST[kind] * multiplier;
  const entry: LedgerEntry = {
    id: crypto.randomUUID(),
    kind,
    label,
    credits,
    at: new Date().toISOString(),
  };
  save({ ...state, used: state.used + credits, ledger: [entry, ...state.ledger].slice(0, 80) });
  return entry;
}

export function topUpCredits(amount: number) {
  const state = getCredits();
  save({ ...state, topups: state.topups + amount });
}

export function resetCredits() {
  save(FALLBACK());
}

export const TOPUP_PACKS = [
  { credits: 500, price: "$19" },
  { credits: 2500, price: "$79" },
  { credits: 10000, price: "$249" },
];
