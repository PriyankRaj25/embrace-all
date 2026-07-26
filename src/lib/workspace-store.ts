// Frontend-only workspace store for org, members, invites, BYO LLM keys,
// cloud prefs, and onboarding state. Everything lives in localStorage and is
// scoped by the currently signed-in user's email.

export type Role = "admin" | "member";
export type CloudProvider = "aws" | "azure" | "gcp" | "multi";
export type LlmProvider = "openai" | "anthropic" | "gemini" | "azure-openai" | "bedrock";

export type Member = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  status: "active" | "invited";
  invitedAt: string;
  lastActive?: string;
};

export type Invite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  at: string;
};

export type LlmKey = {
  id: string;
  provider: LlmProvider;
  alias: string;
  last4: string;
  model?: string;
  at: string;
  isDefault?: boolean;
};

export type Org = {
  name: string;
  slug: string;
  cloud: CloudProvider;
  regions: string[];
  compliance: string[];
  updatedAt: string;
};

export type Onboarding = {
  completed: boolean;
  step: number;
  completedAt?: string;
};

const K = {
  onboarding: "aether:onboarding",
  org: "aether:org",
  members: "aether:members",
  invites: "aether:invites",
  keys: "aether:llm-keys",
  role: "aether:my-role", // current user's role (mocked)
};

function parse<T>(raw: string | null, fb: T): T {
  if (!raw) return fb;
  try { return JSON.parse(raw) as T; } catch { return fb; }
}
function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  return parse(localStorage.getItem(k), fb);
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

// ---------- Onboarding ----------
export function getOnboarding(): Onboarding {
  return read<Onboarding>(K.onboarding, { completed: false, step: 0 });
}
export function setOnboarding(o: Partial<Onboarding>) {
  write(K.onboarding, { ...getOnboarding(), ...o });
}
export function completeOnboarding() {
  write(K.onboarding, { completed: true, step: 99, completedAt: new Date().toISOString() });
}
export function resetOnboarding() {
  write(K.onboarding, { completed: false, step: 0 });
}

// ---------- Org ----------
export function getOrg(): Org {
  return read<Org>(K.org, {
    name: "",
    slug: "",
    cloud: "aws",
    regions: ["us-east-1"],
    compliance: [],
    updatedAt: new Date().toISOString(),
  });
}
export function saveOrg(o: Partial<Org>) {
  write(K.org, { ...getOrg(), ...o, updatedAt: new Date().toISOString() });
}

// ---------- Members / Invites ----------
export function listMembers(): Member[] {
  return read<Member[]>(K.members, []);
}
export function seedFirstMember(email: string, name?: string) {
  const cur = listMembers();
  if (cur.length > 0) return;
  write(K.members, [{
    id: crypto.randomUUID(),
    email, name, role: "admin", status: "active",
    invitedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  }]);
  write(K.role, "admin");
}
export function addInvite(email: string, role: Role): Invite {
  const invite: Invite = {
    id: crypto.randomUUID(),
    email, role,
    token: crypto.randomUUID().slice(0, 8),
    at: new Date().toISOString(),
  };
  write(K.invites, [invite, ...read<Invite[]>(K.invites, [])]);
  write(K.members, [
    ...listMembers(),
    {
      id: invite.id, email, role, status: "invited",
      invitedAt: invite.at,
    } satisfies Member,
  ]);
  return invite;
}
export function listInvites(): Invite[] {
  return read<Invite[]>(K.invites, []);
}
export function removeMember(id: string) {
  write(K.members, listMembers().filter((m) => m.id !== id));
  write(K.invites, listInvites().filter((i) => i.id !== id));
}
export function setMemberRole(id: string, role: Role) {
  write(K.members, listMembers().map((m) => (m.id === id ? { ...m, role } : m)));
}

// ---------- RBAC ----------
export function getMyRole(): Role {
  return read<Role>(K.role, "admin");
}
export function setMyRole(r: Role) {
  write(K.role, r);
}
export function canManage(): boolean {
  return getMyRole() === "admin";
}

// ---------- LLM keys ----------
export function listKeys(): LlmKey[] {
  return read<LlmKey[]>(K.keys, []);
}
export function addKey(provider: LlmProvider, alias: string, secret: string, model?: string): LlmKey {
  const clean = secret.trim();
  const last4 = clean.slice(-4).padStart(4, "•");
  const entry: LlmKey = {
    id: crypto.randomUUID(),
    provider, alias, last4, model,
    at: new Date().toISOString(),
    isDefault: listKeys().length === 0,
  };
  write(K.keys, [entry, ...listKeys()]);
  return entry;
}
export function removeKey(id: string) {
  const next = listKeys().filter((k) => k.id !== id);
  if (next.length > 0 && !next.some((k) => k.isDefault)) next[0].isDefault = true;
  write(K.keys, next);
}
export function setDefaultKey(id: string) {
  write(K.keys, listKeys().map((k) => ({ ...k, isDefault: k.id === id })));
}

export const PROVIDER_META: Record<LlmProvider, { label: string; hint: string; placeholder: string }> = {
  openai:        { label: "OpenAI",        hint: "sk-… from platform.openai.com",             placeholder: "sk-..." },
  anthropic:     { label: "Anthropic",     hint: "sk-ant-… from console.anthropic.com",       placeholder: "sk-ant-..." },
  gemini:        { label: "Google Gemini", hint: "API key from aistudio.google.com",          placeholder: "AIza..." },
  "azure-openai":{ label: "Azure OpenAI",  hint: "Resource key from Azure portal",            placeholder: "azure-key" },
  bedrock:       { label: "AWS Bedrock",   hint: "Access key ID / secret pair (paste secret)",placeholder: "aws-secret" },
};

export const CLOUD_META: Record<CloudProvider, { label: string; regions: string[]; blurb: string }> = {
  aws:   { label: "Amazon Web Services", regions: ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"], blurb: "Most mature. Deep compliance surface." },
  azure: { label: "Microsoft Azure",     regions: ["eastus", "westeurope", "centralindia"],              blurb: "Best for Microsoft-heavy estates." },
  gcp:   { label: "Google Cloud",        regions: ["us-central1", "europe-west1", "asia-south1"],       blurb: "Strong data & ML primitives." },
  multi: { label: "Multi-cloud",         regions: ["multi-region"],                                     blurb: "Portable IaC across providers." },
};

// ---------- Cloud accounts (multi-cloud) ----------
export type CloudAccount = {
  id: string;
  provider: CloudProvider;
  label: string;
  identifier: string;   // account id / subscription id / project id
  auth: string;         // role ARN / tenant / service-account email
  regions: string[];
  mode: "read-only" | "deploy";
  status: "connected" | "pending";
  at: string;
};

export type SecurityConfig = {
  frameworks: string[];
  continuousScan: boolean;
  autoRemediate: "off" | "propose" | "auto";
  redTeam: boolean;
  zeroTrust: boolean;
  dataResidency: string;
};

const K2 = {
  accounts: "aether:cloud-accounts",
  security: "aether:security-config",
};

export function listCloudAccounts(): CloudAccount[] {
  return read<CloudAccount[]>(K2.accounts, []);
}
export function addCloudAccount(a: Omit<CloudAccount, "id" | "at" | "status"> & { status?: CloudAccount["status"] }): CloudAccount {
  const entry: CloudAccount = {
    ...a,
    status: a.status ?? "connected",
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  write(K2.accounts, [entry, ...listCloudAccounts()]);
  return entry;
}
export function removeCloudAccount(id: string) {
  write(K2.accounts, listCloudAccounts().filter((a) => a.id !== id));
}

export function getSecurityConfig(): SecurityConfig {
  return read<SecurityConfig>(K2.security, {
    frameworks: ["SOC 2"],
    continuousScan: true,
    autoRemediate: "propose",
    redTeam: false,
    zeroTrust: true,
    dataResidency: "us",
  });
}
export function saveSecurityConfig(c: Partial<SecurityConfig>) {
  write(K2.security, { ...getSecurityConfig(), ...c });
}

export const CLOUD_CONNECT_META: Record<CloudProvider, {
  idLabel: string; idPlaceholder: string; authLabel: string; authPlaceholder: string; steps: string[];
}> = {
  aws: {
    idLabel: "Account ID", idPlaceholder: "123456789012",
    authLabel: "Cross-account role ARN", authPlaceholder: "arn:aws:iam::123456789012:role/AetherOSAgent",
    steps: [
      "Create an IAM role trusting AetherOS (external ID shown below)",
      "Attach SecurityAudit + ViewOnlyAccess (add PowerUser for deploy mode)",
      "Paste the role ARN — the agent assumes it read-only first",
    ],
  },
  azure: {
    idLabel: "Subscription ID", idPlaceholder: "00000000-0000-0000-0000-000000000000",
    authLabel: "Tenant ID / App registration", authPlaceholder: "tenant-id : app-id",
    steps: [
      "Register an app in Entra ID and grant Reader on the subscription",
      "Add Security Reader for posture scanning",
      "Paste tenant + app id",
    ],
  },
  gcp: {
    idLabel: "Project ID", idPlaceholder: "acme-platform-prod",
    authLabel: "Service account email", authPlaceholder: "aetheros@acme-platform.iam.gserviceaccount.com",
    steps: [
      "Create a service account with Viewer + Security Reviewer",
      "Enable workload identity federation for AetherOS",
      "Paste the service account email",
    ],
  },
  multi: {
    idLabel: "Landing zone", idPlaceholder: "acme-global-lz",
    authLabel: "Federation identifier", authPlaceholder: "aetheros-federation",
    steps: [
      "Connect each provider individually after setup",
      "AetherOS normalizes resources into one graph",
      "Blueprints stay portable across providers",
    ],
  },
};
