import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Bell, Cpu, ShieldCheck, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [notify, setNotify] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
    });
  }, []);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Account</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your workspace, model defaults, and notifications.</p>
      </header>

      <Section icon={User} title="Profile" desc="How the agents address you and where results are sent.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="neumorph-inset border-transparent" />
          </Field>
          <Field label="Email">
            <Input value={email} disabled className="neumorph-inset border-transparent" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => toast.success("Profile saved")}>
            Save profile
          </Button>
        </div>
      </Section>

      <Section icon={Cpu} title="Model" desc="Default model used by the orchestrator across all agents.">
        <div className="grid gap-2 sm:grid-cols-2">
          {["google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5", "openai/gpt-5-mini"].map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`text-left rounded-xl p-3 transition ${model === m ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}
            >
              <div className="text-sm font-medium">{m.split("/")[1]}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">{m.split("/")[0]}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" desc="Get pinged when agents complete or need approval.">
        <Toggle label="Email me when a blueprint finishes" value={notify} onChange={setNotify} />
        <Toggle label="Auto-approve low-risk stages" value={autoApprove} onChange={setAutoApprove} />
      </Section>

      <Section icon={ShieldCheck} title="Governance" desc="Policies enforced across every generated blueprint.">
        <div className="grid gap-2 sm:grid-cols-2">
          {["HIPAA", "SOC 2 Type II", "GDPR residency", "PCI-DSS"].map((p) => (
            <div key={p} className="flex items-center justify-between rounded-lg glass-subtle px-3 py-2">
              <span className="text-sm">{p}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">enforced</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={KeyRound} title="API access" desc="Programmatic access for CI/CD and integrations.">
        <div className="flex items-center gap-2">
          <Input value="sk_live_••••••••••••••••" disabled className="neumorph-inset border-transparent font-mono text-xs" />
          <Button variant="outline" size="sm" onClick={() => toast.info("Contact support to rotate")}>Rotate</Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: typeof User; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 grid place-items-center rounded-xl neumorph-sm shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg glass-subtle px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
