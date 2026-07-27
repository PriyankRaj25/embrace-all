import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User, Bell, Cpu, ShieldCheck, KeyRound, Cloud, Users, Sparkles,
  Plus, Trash2, Star, StarOff,
} from "lucide-react";
import {
  CLOUD_META, PROVIDER_META, addKey, getOrg, listKeys, removeKey,
  resetOnboarding, saveOrg, setDefaultKey, type CloudProvider,
  type LlmKey, type LlmProvider,
} from "@/lib/workspace-store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [notify, setNotify] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [cloud, setCloud] = useState<CloudProvider>("aws");
  const [region, setRegion] = useState("us-east-1");
  const [compliance, setCompliance] = useState<string[]>([]);

  const [keys, setKeys] = useState<LlmKey[]>([]);
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [alias, setAlias] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
    });
    const org = getOrg();
    setOrgName(org.name);
    setCloud(org.cloud);
    setRegion(org.regions[0] ?? "us-east-1");
    setCompliance(org.compliance);
    setKeys(listKeys());
  }, []);

  function saveWorkspace() {
    saveOrg({ name: orgName, cloud, regions: [region], compliance });
    toast.success("Workspace saved");
  }

  function submitKey() {
    if (!secret.trim()) return toast.error("Paste your key first");
    addKey(provider, alias || PROVIDER_META[provider].label, secret);
    setKeys(listKeys());
    setSecret(""); setAlias("");
    toast.success("Key added — stored locally in this browser");
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Account</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your workspace, cloud targets, LLM keys and notifications.</p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto justify-start gap-1 glass-subtle p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="keys">LLM keys</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="tour">Tour</TabsTrigger>
        </TabsList>

      <TabsContent value="profile" className="mt-4 space-y-6">
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

      <Section icon={Cloud} title="Workspace & cloud" desc="Default cloud target, region and compliance envelope for new projects.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Workspace name">
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="neumorph-inset border-transparent" />
          </Field>
          <Field label="Primary region">
            <select value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full h-9 rounded-md neumorph-inset px-3 text-sm bg-transparent">
              {CLOUD_META[cloud].regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {(Object.keys(CLOUD_META) as CloudProvider[]).map((c) => (
            <button key={c}
              onClick={() => { setCloud(c); setRegion(CLOUD_META[c].regions[0]); }}
              className={`text-left rounded-xl p-3 transition ${cloud === c ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}>
              <div className="text-sm font-medium">{CLOUD_META[c].label}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">{c}</div>
            </button>
          ))}
        </div>
        <Field label="Compliance">
          <div className="flex flex-wrap gap-1.5">
            {["SOC 2", "HIPAA", "GDPR", "PCI-DSS", "ISO 27001", "FedRAMP"].map((p) => {
              const on = compliance.includes(p);
              return (
                <button key={p} type="button"
                  onClick={() => setCompliance(on ? compliance.filter((x) => x !== p) : [...compliance, p])}
                  className={`text-xs rounded-full px-2.5 py-1 transition ${on ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
                  {p}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="flex justify-end">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={saveWorkspace}>Save workspace</Button>
        </div>
      </Section>

      <Section icon={KeyRound} title="Bring your own LLM keys" desc="Keys are stored only in this browser (localStorage) and used for your agent runs.">
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
          {(Object.keys(PROVIDER_META) as LlmProvider[]).map((p) => (
            <button key={p} onClick={() => setProvider(p)}
              className={`rounded-xl p-3 text-left transition ${provider === p ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}>
              <div className="text-xs font-medium">{PROVIDER_META[p].label}</div>
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Alias">
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Production key" className="neumorph-inset border-transparent" />
          </Field>
          <Field label={`${PROVIDER_META[provider].label} secret`}>
            <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              placeholder={PROVIDER_META[provider].placeholder}
              className="neumorph-inset border-transparent font-mono text-xs" />
          </Field>
          <div className="flex items-end">
            <Button onClick={submitKey} className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          {keys.length === 0 ? (
            <div className="glass-subtle rounded-lg p-4 text-xs text-muted-foreground text-center">
              No keys yet — AetherOS will use the shared Lovable AI gateway.
            </div>
          ) : keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-lg glass-subtle px-3 py-2">
              <div className="h-7 w-7 grid place-items-center rounded-lg neumorph-sm shrink-0">
                <KeyRound className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{k.alias}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {PROVIDER_META[k.provider].label} · sk_•••{k.last4}
                </div>
              </div>
              <Button size="sm" variant="ghost"
                onClick={() => { setDefaultKey(k.id); setKeys(listKeys()); toast.success("Default updated"); }}>
                {k.isDefault ? <Star className="h-3.5 w-3.5 fill-current" /> : <StarOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => { removeKey(k.id); setKeys(listKeys()); toast.success("Removed"); }}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Cpu} title="Default model" desc="Fallback model for agents when no BYO key is set.">
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

      <Section icon={Users} title="Team" desc="Members, roles and invites live under Team.">
        <Link to="/team" className="inline-flex">
          <Button variant="outline" size="sm">Open team management →</Button>
        </Link>
      </Section>

      <Section icon={Bell} title="Notifications" desc="Get pinged when agents complete or need approval.">
        <Toggle label="Email me when a blueprint finishes" value={notify} onChange={setNotify} />
        <Toggle label="Auto-approve low-risk stages" value={autoApprove} onChange={setAutoApprove} />
      </Section>

      <Section icon={ShieldCheck} title="Governance" desc="Policies enforced across every generated blueprint.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(compliance.length ? compliance : ["Configure compliance above"]).map((p) => (
            <div key={p} className="flex items-center justify-between rounded-lg glass-subtle px-3 py-2">
              <span className="text-sm">{p}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">enforced</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Sparkles} title="Product tour" desc="Replay the onboarding walkthrough anytime.">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { resetOnboarding(); navigate({ to: "/onboarding" }); }}>
            Replay onboarding
          </Button>
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
