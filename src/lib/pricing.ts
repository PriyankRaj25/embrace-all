// Frontend-only pricing + billing state (demo). Nothing leaves the browser.

export type PlanId = "starter" | "team" | "scale" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number | null; // null = custom
  yearly: number | null;
  agentRuns: string;
  highlights: string[];
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solo architects exploring AetherOS.",
    monthly: 0,
    yearly: 0,
    agentRuns: "50 agent runs / month",
    highlights: [
      "Vega assistant (shared context)",
      "1 cloud account, read-only",
      "Blueprints + architecture diagrams",
      "Community support",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For product teams shipping real infrastructure.",
    monthly: 79,
    yearly: 790,
    agentRuns: "1,000 agent runs / month",
    popular: true,
    highlights: [
      "All 12 design agents",
      "Up to 5 cloud accounts",
      "Bring your own LLM keys",
      "Version history + artifact comments",
      "Email support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For platform orgs with security and FinOps mandates.",
    monthly: 349,
    yearly: 3490,
    agentRuns: "10,000 agent runs / month",
    highlights: [
      "Security Agent suite + red team",
      "Continuous compliance (SOC 2, HIPAA, PCI)",
      "Autonomous fix engine",
      "RBAC, audit trail, SSO",
      "Priority support + shared Slack",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Private deployment, custom governance, dedicated agents.",
    monthly: null,
    yearly: null,
    agentRuns: "Unlimited agent runs",
    highlights: [
      "VPC / on-prem deployment",
      "Custom agents & policy packs",
      "Data residency guarantees",
      "Dedicated solutions architect",
      "99.9% uptime SLA",
    ],
  },
];

export const USAGE_ADDONS = [
  { label: "Extra agent runs", price: "$0.04 / run" },
  { label: "Continuous security scanning", price: "$0.02 / resource / day" },
  { label: "Managed LLM tokens (no BYO key)", price: "at cost + 10%" },
  { label: "Extra cloud account", price: "$25 / month" },
];

export type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  kind: "card" | "invoice" | "paypal";
  isDefault?: boolean;
};

export type Billing = {
  plan: PlanId;
  cycle: "monthly" | "yearly";
  methods: PaymentMethod[];
  updatedAt: string;
};

const KEY = "aether:billing";

const FALLBACK: Billing = {
  plan: "starter",
  cycle: "monthly",
  methods: [],
  updatedAt: new Date().toISOString(),
};

export function getBilling(): Billing {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...FALLBACK, ...(JSON.parse(raw) as Billing) } : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function saveBilling(patch: Partial<Billing>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...getBilling(), ...patch, updatedAt: new Date().toISOString() }),
  );
}

export function addPaymentMethod(m: Omit<PaymentMethod, "id" | "isDefault">) {
  const cur = getBilling();
  const entry: PaymentMethod = { ...m, id: crypto.randomUUID(), isDefault: cur.methods.length === 0 };
  saveBilling({ methods: [entry, ...cur.methods] });
  return entry;
}

export function removePaymentMethod(id: string) {
  const next = getBilling().methods.filter((m) => m.id !== id);
  if (next.length && !next.some((m) => m.isDefault)) next[0].isDefault = true;
  saveBilling({ methods: next });
}

export function setDefaultPaymentMethod(id: string) {
  saveBilling({ methods: getBilling().methods.map((m) => ({ ...m, isDefault: m.id === id })) });
}

export const INVOICES = [
  { id: "INV-2041", date: "2026-07-01", amount: "$79.00", status: "Paid" },
  { id: "INV-1987", date: "2026-06-01", amount: "$79.00", status: "Paid" },
  { id: "INV-1930", date: "2026-05-01", amount: "$79.00", status: "Paid" },
];

export function brandFromNumber(num: string) {
  const n = num.replace(/\s/g, "");
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  return "Card";
}
