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
