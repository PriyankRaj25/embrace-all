import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, Shield, UserPlus, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationPage,
});

const TEAMS = [
  { name: "Platform Engineering", members: 12, projects: 8, lead: "Sara Okoye" },
  { name: "Data & Analytics",     members: 7,  projects: 4, lead: "Priya Menon" },
  { name: "Security",             members: 4,  projects: 12, lead: "James Chen" },
  { name: "Application Squad",    members: 9,  projects: 6, lead: "Marcus Riehl" },
];

const MEMBERS = [
  { name: "Sara Okoye",   email: "sara@acme.com",   role: "Owner",     team: "Platform Engineering" },
  { name: "Priya Menon",  email: "priya@acme.com",  role: "Admin",     team: "Data & Analytics" },
  { name: "James Chen",   email: "james@acme.com",  role: "Reviewer",  team: "Security" },
  { name: "Marcus Riehl", email: "marcus@acme.com", role: "Architect", team: "Application Squad" },
  { name: "Alex Rivera",  email: "alex@acme.com",   role: "Viewer",    team: "Application Squad" },
];

const ROLE_TONE: Record<string, string> = {
  Owner: "bg-aether/20 text-aether border-aether/40",
  Admin: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",
  Reviewer: "bg-amber-300/10 text-amber-200 border-amber-300/30",
  Architect: "bg-emerald-300/10 text-emerald-200 border-emerald-300/30",
  Viewer: "bg-muted text-muted-foreground",
};

function OrganizationPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Organization</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Teams, members & roles</h1>
          <p className="mt-2 text-muted-foreground max-w-3xl">Structure your engineering org — agents route work by team ownership.</p>
        </div>
        <Button className="bg-aether hover:bg-aether/90"><UserPlus className="h-4 w-4 mr-2" /> Invite people</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Members", value: "32", icon: Users },
          { label: "Teams", value: "4", icon: Building2 },
          { label: "SSO", value: "Enforced", icon: Shield },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-panel rounded-xl p-5 flex items-center gap-4">
              <div className="rounded-md p-2 bg-aether/10 text-aether"><Icon className="h-4 w-4" /></div>
              <div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="text-xl font-semibold font-mono">{k.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4"><Building2 className="h-4 w-4 text-aether" /><h2 className="font-semibold">Teams</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          {TEAMS.map((t) => (
            <div key={t.name} className="rounded-lg border border-border/40 p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.name}</div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{t.members} members</span>
                <span>·</span>
                <span>{t.projects} projects</span>
                <span>·</span>
                <span>Led by {t.lead}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4"><Users className="h-4 w-4 text-aether" /><h2 className="font-semibold">Members</h2></div>
        <div className="divide-y divide-border/40">
          {MEMBERS.map((m) => (
            <div key={m.email} className="py-3 flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-aether to-aether-glow grid place-items-center text-xs font-mono text-primary-foreground">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.email} · {m.team}</div>
              </div>
              <Badge variant="outline" className={ROLE_TONE[m.role]}>{m.role}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
