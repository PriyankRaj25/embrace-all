// Client-side persistence for comments, blueprint snapshots and audit-log entries.
// Kept intentionally frontend-only; scopes everything by project id + current user email.

export type Comment = {
  id: string;
  author: string;
  body: string;
  at: string;
  kind: string; // artifact kind
};

export type BlueprintSnapshot = {
  id: string;
  label: string;
  at: string;
  author: string;
  note?: string;
  data: { project: unknown; artifacts: Record<string, unknown> };
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
  category: "run" | "approval" | "comment" | "snapshot" | "system";
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

const KEY = {
  comments: (pid: string) => `aether:comments:${pid}`,
  snapshots: (pid: string) => `aether:snapshots:${pid}`,
  audit: (pid: string) => `aether:audit:${pid}`,
};

// ---------- Comments ----------
export function listComments(pid: string, kind?: string): Comment[] {
  if (typeof window === "undefined") return [];
  const all = safeParse<Comment[]>(localStorage.getItem(KEY.comments(pid)), []);
  return kind ? all.filter((c) => c.kind === kind) : all;
}

export function addComment(pid: string, c: Omit<Comment, "id" | "at">): Comment {
  const entry: Comment = { ...c, id: crypto.randomUUID(), at: new Date().toISOString() };
  const all = listComments(pid);
  all.push(entry);
  localStorage.setItem(KEY.comments(pid), JSON.stringify(all));
  appendAudit(pid, { actor: c.author, action: `commented on ${c.kind}`, detail: c.body.slice(0, 140), category: "comment" });
  return entry;
}

export function deleteComment(pid: string, id: string) {
  const all = listComments(pid).filter((c) => c.id !== id);
  localStorage.setItem(KEY.comments(pid), JSON.stringify(all));
}

// ---------- Snapshots ----------
export function listSnapshots(pid: string): BlueprintSnapshot[] {
  if (typeof window === "undefined") return [];
  return safeParse<BlueprintSnapshot[]>(localStorage.getItem(KEY.snapshots(pid)), []);
}

export function saveSnapshot(pid: string, s: Omit<BlueprintSnapshot, "id" | "at">): BlueprintSnapshot {
  const entry: BlueprintSnapshot = { ...s, id: crypto.randomUUID(), at: new Date().toISOString() };
  const all = listSnapshots(pid);
  all.unshift(entry);
  localStorage.setItem(KEY.snapshots(pid), JSON.stringify(all.slice(0, 25)));
  appendAudit(pid, { actor: s.author, action: `saved snapshot "${s.label}"`, detail: s.note, category: "snapshot" });
  return entry;
}

export function deleteSnapshot(pid: string, id: string) {
  const all = listSnapshots(pid).filter((s) => s.id !== id);
  localStorage.setItem(KEY.snapshots(pid), JSON.stringify(all));
}

// ---------- Audit ----------
export function listAudit(pid: string): AuditEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<AuditEntry[]>(localStorage.getItem(KEY.audit(pid)), []);
}

export function appendAudit(pid: string, e: Omit<AuditEntry, "id" | "at">): AuditEntry {
  const entry: AuditEntry = { ...e, id: crypto.randomUUID(), at: new Date().toISOString() };
  const all = listAudit(pid);
  all.push(entry);
  localStorage.setItem(KEY.audit(pid), JSON.stringify(all.slice(-500)));
  return entry;
}
