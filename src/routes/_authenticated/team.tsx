import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Plus, Trash2, Copy, ShieldCheck, User as UserIcon, Crown, Mail,
} from "lucide-react";
import {
  addInvite, canManage, getMyRole, listInvites, listMembers, removeMember,
  setMemberRole, setMyRole, type Member, type Role,
} from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [myRole, setLocalRole] = useState<Role>("admin");
  const [invitesCount, setInvitesCount] = useState(0);

  useEffect(() => { refresh(); }, []);
  function refresh() {
    setMembers(listMembers());
    setInvitesCount(listInvites().length);
    setLocalRole(getMyRole());
  }

  function invite() {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return toast.error("Invalid email");
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return toast.error("Already invited");
    }
    const inv = addInvite(email.toLowerCase(), role);
    toast.success(`Invite sent to ${email}`, {
      description: `Token ${inv.token} • role: ${role}`,
    });
    setEmail("");
    refresh();
  }

  function copyInviteLink(m: Member) {
    const inv = listInvites().find((i) => i.email === m.email);
    if (!inv) return;
    const url = `${window.location.origin}/auth?invite=${inv.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  const admins = members.filter((m) => m.role === "admin").length;
  const active = members.filter((m) => m.status === "active").length;

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Invite teammates, manage roles, and configure access.
          </p>
        </div>
        <div className="flex gap-2 text-center">
          <Stat label="Members" value={members.length} />
          <Stat label="Active" value={active} />
          <Stat label="Admins" value={admins} />
          <Stat label="Invites" value={invitesCount} />
        </div>
      </header>

      {/* My role toggle (demo) */}
      <section className="glass-panel rounded-2xl p-4 flex items-center gap-4">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="text-muted-foreground">You are viewing this workspace as</span>{" "}
          <span className="font-medium">{myRole}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {(["admin", "member"] as Role[]).map((r) => (
            <button key={r}
              onClick={() => { setMyRole(r); setLocalRole(r); toast.success(`Now viewing as ${r}`); }}
              className={`text-xs px-3 py-1.5 rounded-full ${myRole === r ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* Invite */}
      <section className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 grid place-items-center rounded-xl neumorph-sm"><Plus className="h-4 w-4" /></div>
          <div>
            <h2 className="font-medium">Invite a teammate</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invites are frontend-only in this demo — a shareable token is generated.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com"
              className="neumorph-inset border-transparent" disabled={!canManage()} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Role</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              disabled={!canManage()}
              className="w-full h-9 rounded-md neumorph-inset px-3 text-sm bg-transparent">
              <option value="admin">Admin — full control</option>
              <option value="member">Member — build & view</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={invite} disabled={!canManage()}
              className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto">
              <Mail className="h-4 w-4 mr-1.5" /> Send invite
            </Button>
          </div>
        </div>
        {!canManage() && (
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
            Members can't invite others. Switch to admin above.
          </div>
        )}
      </section>

      {/* Members table */}
      <section className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border/60">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Members</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {members.length} total
          </span>
        </div>
        {members.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No members yet — complete onboarding to seed your workspace.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-foreground text-background grid place-items-center text-xs font-semibold">
                  {m.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.name || m.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                  {m.status === "invited" ? (
                    <span className="px-2 py-0.5 rounded-full glass-subtle text-muted-foreground">Invited</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full neumorph-sm">Active</span>
                  )}
                </div>
                <select value={m.role} disabled={!canManage()}
                  onChange={(e) => { setMemberRole(m.id, e.target.value as Role); refresh(); }}
                  className="h-8 rounded-md neumorph-inset px-2 text-xs bg-transparent">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                {m.role === "admin" ? <Crown className="h-3.5 w-3.5 text-muted-foreground" /> : <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                {m.status === "invited" && (
                  <Button size="sm" variant="ghost" onClick={() => copyInviteLink(m)} title="Copy invite link">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={!canManage()}
                  onClick={() => { removeMember(m.id); refresh(); toast.success("Removed"); }}
                  className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Roles cheat sheet */}
      <section className="glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-medium mb-3">Role permissions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard role="admin" perms={[
            "Invite & remove members",
            "Manage LLM keys & cloud targets",
            "Approve blueprints",
            "Delete projects",
          ]} />
          <RoleCard role="member" perms={[
            "Create projects & run agents",
            "Comment on artifacts",
            "View blueprints & audit logs",
            "Cannot manage team or billing",
          ]} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-subtle rounded-xl px-4 py-2">
      <div className="text-lg font-semibold leading-tight">{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function RoleCard({ role, perms }: { role: Role; perms: string[] }) {
  const Icon = role === "admin" ? Crown : UserIcon;
  return (
    <div className="glass-subtle rounded-xl p-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 grid place-items-center rounded-lg neumorph-sm"><Icon className="h-3.5 w-3.5" /></div>
        <div className="text-sm font-medium capitalize">{role}</div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {perms.map((p) => (
          <li key={p} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
