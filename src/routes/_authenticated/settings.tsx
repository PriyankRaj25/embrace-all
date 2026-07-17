import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Bell, Palette, Cpu, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notif, setNotif] = useState({ approvals: true, cost: true, risk: true, weekly: false });
  const [defaultCloud, setDefaultCloud] = useState<"aws" | "azure" | "gcp">("aws");
  const [model, setModel] = useState("gpt-5.5");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
    });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Settings</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspace preferences</h1>
      </header>

      <Section icon={User} title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="mt-1.5" />
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={() => toast.success("Profile updated")}>Save profile</Button>
      </Section>

      <Section icon={Cpu} title="Orchestrator defaults">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Default cloud</Label>
            <div className="mt-1.5 flex gap-2">
              {(["aws","azure","gcp"] as const).map((c) => (
                <button key={c}
                  onClick={() => setDefaultCloud(c)}
                  className={`px-3 py-1.5 rounded-md text-xs uppercase font-mono border transition ${
                    defaultCloud === c ? "bg-aether/20 border-aether/40" : "border-border/60 text-muted-foreground"
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Reasoning model</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {["gpt-5.5","gpt-5.5-mini","claude-4.5"].map((m) => (
                <button key={m}
                  onClick={() => setModel(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition ${
                    model === m ? "bg-aether/20 border-aether/40" : "border-border/60 text-muted-foreground"
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <div className="divide-y divide-border/40">
          {(
            [
              ["approvals", "Approval requests",      "When an agent stage requires human approval"],
              ["cost",      "Cost anomalies",         "When a project exceeds its projected monthly spend"],
              ["risk",      "New risks",              "When the Reviewer flags a high-severity issue"],
              ["weekly",    "Weekly digest",          "Portfolio summary every Monday"],
            ] as const
          ).map(([k, label, desc]) => (
            <div key={k} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Switch checked={notif[k]} onCheckedChange={(v) => setNotif((s) => ({ ...s, [k]: v }))} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Palette} title="Appearance">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border/60 p-3 bg-background ring-1 ring-aether/40">
            <div className="text-xs font-mono text-muted-foreground">Dark · Aether</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3 opacity-60">
            <div className="text-xs font-mono text-muted-foreground">Light</div>
            <Badge variant="outline" className="mt-1 text-[10px]">Soon</Badge>
          </div>
        </div>
      </Section>

      <Section icon={KeyRound} title="API keys">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Personal access token</div>
            <div className="text-xs text-muted-foreground">Use to trigger orchestrator runs from CI.</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.success("Token generated")}>Generate</Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-aether" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
