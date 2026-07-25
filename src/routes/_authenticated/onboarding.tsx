import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Cloud, KeyRound, User,
  Sparkles, LayoutGrid, Shield, Rocket, Building2,
} from "lucide-react";
import {
  CLOUD_META, PROVIDER_META, addKey, completeOnboarding, getOrg,
  saveOrg, seedFirstMember, type CloudProvider, type LlmProvider,
} from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const STEPS = [
  { key: "profile",  label: "Profile & org",   icon: User },
  { key: "cloud",    label: "Cloud target",     icon: Cloud },
  { key: "keys",     label: "Bring your keys",  icon: KeyRound },
  { key: "tour",     label: "Product tour",     icon: Sparkles },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [cloud, setCloud] = useState<CloudProvider>("aws");
  const [region, setRegion] = useState("us-east-1");
  const [compliance, setCompliance] = useState<string[]>(["SOC 2"]);
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [alias, setAlias] = useState("Production key");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
      const org = getOrg();
      if (org.name) setOrgName(org.name);
    });
  }, []);

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  function finish() {
    saveOrg({
      name: orgName || "My workspace",
      slug: (orgName || "workspace").toLowerCase().replace(/\s+/g, "-"),
      cloud, regions: [region], compliance,
    });
    seedFirstMember(email, name);
    if (secret.trim()) {
      addKey(provider, alias || PROVIDER_META[provider].label, secret);
    }
    completeOnboarding();
    toast.success("Workspace ready");
    navigate({ to: "/dashboard" });
  }

  function skip() {
    saveOrg({
      name: orgName || "My workspace",
      slug: "workspace", cloud, regions: [region], compliance,
    });
    seedFirstMember(email, name);
    completeOnboarding();
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[280px_1fr]">
      {/* Rail */}
      <aside className="hidden lg:flex flex-col border-r border-border/60 glass-subtle p-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg neumorph-sm text-xs font-mono font-bold">Æ</div>
          <div>
            <div className="text-sm font-medium leading-tight">AetherOS</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">setup</div>
          </div>
        </div>
        <div className="mt-10 space-y-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "neumorph-sm" : done ? "text-muted-foreground" : "text-muted-foreground/60"
              }`}>
                <div className={`h-6 w-6 grid place-items-center rounded-lg ${
                  done ? "bg-foreground text-background" : active ? "neumorph-sm" : "glass-subtle"
                }`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">
                    Step {i + 1}
                  </div>
                  <div className="leading-tight">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          You can change any of this later in Settings.
        </div>
      </aside>

      {/* Content */}
      <main className="p-8 lg:p-14 max-w-3xl w-full">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{STEPS[step].label}</h1>

        <div className="mt-8 glass-panel rounded-2xl p-6 space-y-5">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground">Tell us who you are and what to call the workspace.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" icon={User}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="neumorph-inset border-transparent" placeholder="Ada Lovelace" />
                </Field>
                <Field label="Email" icon={User}>
                  <Input value={email} disabled className="neumorph-inset border-transparent" />
                </Field>
                <Field label="Workspace name" icon={Building2}>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="neumorph-inset border-transparent" placeholder="Acme Platform Team" />
                </Field>
                <Field label="Role in company" icon={Shield}>
                  <Input defaultValue="Staff Engineer" className="neumorph-inset border-transparent" />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">Where should AetherOS design and deploy your blueprints?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(CLOUD_META) as CloudProvider[]).map((c) => {
                  const meta = CLOUD_META[c];
                  const active = cloud === c;
                  return (
                    <button
                      key={c}
                      onClick={() => { setCloud(c); setRegion(meta.regions[0]); }}
                      className={`text-left rounded-xl p-4 transition ${active ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        <div className="text-sm font-medium">{meta.label}</div>
                        {active && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{meta.blurb}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <Field label="Primary region" icon={Cloud}>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-9 rounded-md neumorph-inset px-3 text-sm bg-transparent">
                    {CLOUD_META[cloud].regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Compliance targets" icon={Shield}>
                  <div className="flex flex-wrap gap-1.5">
                    {["SOC 2", "HIPAA", "GDPR", "PCI-DSS", "ISO 27001"].map((p) => {
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
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Optional — bring your own LLM key. Your key is stored only in this browser and used for your agent runs.
              </p>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
                {(Object.keys(PROVIDER_META) as LlmProvider[]).map((p) => {
                  const active = provider === p;
                  return (
                    <button key={p} onClick={() => setProvider(p)}
                      className={`rounded-xl p-3 text-left transition ${active ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}>
                      <div className="text-xs font-medium">{PROVIDER_META[p].label}</div>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <Field label="Alias" icon={KeyRound}>
                  <Input value={alias} onChange={(e) => setAlias(e.target.value)} className="neumorph-inset border-transparent" />
                </Field>
                <Field label={`${PROVIDER_META[provider].label} secret`} icon={KeyRound}>
                  <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
                    placeholder={PROVIDER_META[provider].placeholder}
                    className="neumorph-inset border-transparent font-mono text-xs" />
                </Field>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                {PROVIDER_META[provider].hint}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">A quick look at what you can do next.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TourCard icon={LayoutGrid} title="Projects dashboard"
                  body="Every blueprint you generate lives here with cost, agents, and status." />
                <TourCard icon={Sparkles} title="Multi-agent orchestration"
                  body="12 specialist agents design your architecture in parallel, streaming reasoning live." />
                <TourCard icon={Shield} title="Security Agent"
                  body="Attack paths, threat models, autonomous remediation and continuous red-teaming." />
                <TourCard icon={Rocket} title="Investor demo"
                  body="Launch the HealthTracker Pro walkthrough from the dashboard anytime." />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">Skip setup</Button>
            {step < STEPS.length - 1 ? (
              <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={next}>
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={finish}>
                Enter workspace <Rocket className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  );
}

function TourCard({ icon: Icon, title, body }: { icon: typeof User; title: string; body: string }) {
  return (
    <div className="glass-subtle rounded-xl p-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 grid place-items-center rounded-lg neumorph-sm"><Icon className="h-3.5 w-3.5" /></div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
