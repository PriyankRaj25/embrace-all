import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Network, GitBranch, ScanSearch, Wrench, Swords, Lock, FileCheck2, Sparkles, Send, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copilotSuggestions, copilotAnswers } from "@/lib/security-demo";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityLayout,
});

const TABS = [
  { to: "/security",                  label: "Overview",         icon: LayoutDashboard, exact: true },
  { to: "/security/attack-paths",     label: "Attack Paths",     icon: GitBranch },
  { to: "/security/knowledge-graph",  label: "Knowledge Graph",  icon: Network },
  { to: "/security/threat-model",     label: "Threat Model",     icon: ScanSearch },
  { to: "/security/fix-engine",       label: "Fix Engine",       icon: Wrench },
  { to: "/security/red-team",         label: "Red Team",         icon: Swords },
  { to: "/security/zero-trust",       label: "Zero Trust",       icon: Lock },
  { to: "/security/compliance",       label: "Compliance",       icon: FileCheck2 },
] as const;

function SecurityLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 glass-subtle">
        <div className="flex items-center gap-3 px-6 h-14">
          <div className="grid h-8 w-8 place-items-center rounded-lg neumorph-sm">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium tracking-tight">Security Agent</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">autonomous cloud security</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" /> live · monitoring 1,284 assets
          </div>
        </div>
        <nav className="flex items-center gap-1 px-4 overflow-x-auto">
          {TABS.map((t) => {
            const active = "exact" in t && t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex items-center gap-1.5 px-3 h-10 text-[12px] border-b-2 transition ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <Copilot />
    </div>
  );
}

function Copilot() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "I'm your Security Copilot. Ask about risks, attack paths, compliance, or exposed assets." },
  ]);

  function ask(prompt: string) {
    const answer = copilotAnswers[prompt] ?? "Analyzing telemetry across 1,284 assets… based on current posture, I'd prioritize downscoping the analytics-lambda role and enforcing Block Public Access.";
    setMsgs((m) => [...m, { role: "user", text: prompt }, { role: "ai", text: answer }]);
    setQ("");
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid place-items-center h-12 w-12 rounded-full neumorph text-foreground hover:scale-105 transition pulse-ring"
          aria-label="Open Security Copilot"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[70vh] flex flex-col glass-heavy rounded-2xl overflow-hidden fade-up">
          <div className="flex items-center gap-2 px-4 h-11 border-b border-border/60">
            <Sparkles className="h-3.5 w-3.5" />
            <div className="text-xs font-medium">Security Copilot</div>
            <span className="ml-auto text-[9px] font-mono uppercase tracking-widest text-muted-foreground">demo mode</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`text-[12px] leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block max-w-[90%] px-3 py-2 rounded-lg ${m.role === "user" ? "bg-foreground text-background" : "glass-subtle"}`}>{m.text}</div>
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {copilotSuggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="text-[10px] px-2 py-1 rounded-full border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q.trim()); }}
            className="p-2 border-t border-border/60 flex items-center gap-2"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask the Security Copilot…"
              className="flex-1 bg-transparent text-xs px-3 py-2 outline-none neumorph-inset rounded-lg border-transparent"
            />
            <Button size="icon" className="h-8 w-8" type="submit"><Send className="h-3.5 w-3.5" /></Button>
          </form>
        </div>
      )}
    </>
  );
}
