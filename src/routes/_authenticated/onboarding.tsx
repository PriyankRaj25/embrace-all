import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Cloud, KeyRound, User,
  Sparkles, LayoutGrid, Shield, Rocket, Building2, Plug, Trash2, Loader2,
  ShieldCheck, Bot, Radar,
} from "lucide-react";
import {
  CLOUD_META, CLOUD_CONNECT_META, PROVIDER_META, addKey, completeOnboarding, getOrg,
  saveOrg, seedFirstMember, addCloudAccount, listCloudAccounts, removeCloudAccount,
  getSecurityConfig, saveSecurityConfig,
  type CloudProvider, type LlmProvider, type CloudAccount, type SecurityConfig,
} from "@/lib/workspace-store";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const STEPS = [
  { key: "profile",  label: "Profile & org",     icon: User,
    ai: "Tell me who you are. I'll shape every agent prompt around your org context." },
  { key: "cloud",    label: "Cloud accounts",    icon: Cloud,
    ai: "Connect one or many clouds. I assume read-only first, then map your estate into a single graph." },
  { key: "security", label: "Security posture",  icon: ShieldCheck,
    ai: "Pick your frameworks. My Security Agent runs continuous recon, attack-path and red-team passes." },
  { key: "keys",     label: "Bring your keys",   icon: KeyRound,
    ai: "Optional — route agent inference through your own model provider. Keys stay in your browser." },
  { key: "tour",     label: "Meet your agents",  icon: Sparkles,
    ai: "You're set. Here's the crew that will be working for you from the first prompt." },
] as const;

const FRAMEWORKS = ["SOC 2", "HIPAA", "GDPR", "PCI-DSS", "ISO 27001", "FedRAMP"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [cloud, setCloud] = useState<CloudProvider>("aws");
  const [region, setRegion] = useState("us-east-1");
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [alias, setAlias] = useState("Production key");
  const [secret, setSecret] = useState("");

  // cloud connect
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [acctId, setAcctId] = useState("");
  const [acctAuth, setAcctAuth] = useState("");
  const [acctMode, setAcctMode] = useState<CloudAccount["mode"]>("read-only");
  const [connecting, setConnecting] = useState(false);

  // security
  const [sec, setSec] = useState<SecurityConfig>(getSecurityConfig());

  const externalId = useMemo(() => `aether-${crypto.randomUUID().slice(0, 12)}`, []);
  const connectMeta = CLOUD_CONNECT_META[cloud];

  useEffect(() => {
    setAccounts(listCloudAccounts());
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
      const org = getOrg();
      if (org.name) setOrgName(org.name);
    });
  }, []);

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  function connectAccount() {
    if (!acctId.trim() || !acctAuth.trim()) {
      toast.error(`Add the ${connectMeta.idLabel.toLowerCase()} and ${connectMeta.authLabel.toLowerCase()}`);
      return;
    }
    setConnecting(true);
    window.setTimeout(() => {
      addCloudAccount({
        provider: cloud,
        label: `${CLOUD_META[cloud].label} · ${acctId.trim()}`,
        identifier: acctId.trim(),
        auth: acctAuth.trim(),
        regions: [region],
        mode: acctMode,
      });
      setAccounts(listCloudAccounts());
      setAcctId(""); setAcctAuth("");
      setConnecting(false);
      toast.success("Account linked — agent begins discovery on first run");
    }, 900);
  }

  function drop(id: string) {
    removeCloudAccount(id);
    setAccounts(listCloudAccounts());
  }

  function persist() {
    const providers = Array.from(new Set(accounts.map((a) => a.provider)));
    saveOrg({
      name: orgName || "My workspace",
      slug: (orgName || "workspace").toLowerCase().replace(/\s+/g, "-"),
      cloud: providers.length > 1 ? "multi" : (providers[0] ?? cloud),
      regions: Array.from(new Set(accounts.flatMap((a) => a.regions).concat(region))),
      compliance: sec.frameworks,
    });
    saveSecurityConfig(sec);
    seedFirstMember(email, name);
  }

  function finish() {
    persist();
    if (secret.trim()) addKey(provider, alias || PROVIDER_META[provider].label, secret);
    completeOnboarding();
    toast.success("Workspace ready");
    navigate({ to: "/dashboard" });
  }

  function skip() {
    persist();
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
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "neumorph-sm" : done ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
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
              </button>
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

        {/* AI copilot narration — AI-first framing on every step */}
        <div className="mt-4 flex items-start gap-3 glass-subtle rounded-xl p-3.5">
          <div className="h-7 w-7 shrink-0 grid place-items-center rounded-lg neumorph-sm animate-[breathe_4s_ease-in-out_infinite]">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">Setup agent</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{STEPS[step].ai}</p>
          </div>
        </div>

        <div className="mt-6 glass-panel rounded-2xl p-6 space-y-5">
          {step === 0 && (
            <>
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
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(CLOUD_META) as CloudProvider[]).map((c) => {
                  const meta = CLOUD_META[c];
                  const active = cloud === c;
                  const linked = accounts.filter((a) => a.provider === c).length;
                  return (
                    <button
                      key={c}
                      onClick={() => { setCloud(c); setRegion(meta.regions[0]); }}
                      className={`text-left rounded-xl p-4 transition ${active ? "neumorph-sm" : "glass-subtle hover:bg-secondary/40"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        <div className="text-sm font-medium">{meta.label}</div>
                        {linked > 0 && (
                          <span className="ml-auto text-[10px] font-mono rounded-full px-2 py-0.5 bg-foreground text-background">
                            {linked}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{meta.blurb}</div>
                    </button>
                  );
                })}
              </div>

              <div className="glass-subtle rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  How the agent connects
                </div>
                <ol className="space-y-1.5">
                  {connectMeta.steps.map((s, i) => (
                    <li key={s} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-foreground/70">{i + 1}.</span>{s}
                    </li>
                  ))}
                </ol>
                {cloud === "aws" && (
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-muted-foreground">External ID</span>
                    <code className="neumorph-inset rounded px-2 py-1">{externalId}</code>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={connectMeta.idLabel} icon={Plug}>
                  <Input value={acctId} onChange={(e) => setAcctId(e.target.value)}
                    placeholder={connectMeta.idPlaceholder}
                    className="neumorph-inset border-transparent font-mono text-xs" />
                </Field>
                <Field label={connectMeta.authLabel} icon={KeyRound}>
                  <Input value={acctAuth} onChange={(e) => setAcctAuth(e.target.value)}
                    placeholder={connectMeta.authPlaceholder}
                    className="neumorph-inset border-transparent font-mono text-xs" />
                </Field>
                <Field label="Primary region" icon={Cloud}>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-9 rounded-md neumorph-inset px-3 text-sm bg-transparent">
                    {CLOUD_META[cloud].regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Access mode" icon={Shield}>
                  <div className="flex gap-1.5">
                    {(["read-only", "deploy"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setAcctMode(m)}
                        className={`text-xs rounded-full px-3 py-1.5 transition ${acctMode === m ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Button onClick={connectAccount} disabled={connecting}
                className="bg-foreground text-background hover:bg-foreground/90">
                {connecting
                  ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Verifying access…</>
                  : <><Plug className="h-4 w-4 mr-1.5" /> Connect account</>}
              </Button>

              {accounts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Linked accounts · {accounts.length}
                  </div>
                  {accounts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 glass-subtle rounded-xl px-3.5 py-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <div className="min-w-0">
                        <div className="text-sm truncate">{a.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          {a.regions.join(", ")} · {a.mode}
                        </div>
                      </div>
                      <button onClick={() => drop(a.id)} className="ml-auto text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Compliance frameworks" icon={ShieldCheck}>
                <div className="flex flex-wrap gap-1.5">
                  {FRAMEWORKS.map((f) => {
                    const on = sec.frameworks.includes(f);
                    return (
                      <button key={f} type="button"
                        onClick={() => setSec({ ...sec, frameworks: on ? sec.frameworks.filter((x) => x !== f) : [...sec.frameworks, f] })}
                        className={`text-xs rounded-full px-2.5 py-1 transition ${on ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Autonomous remediation" icon={Radar}>
                <div className="flex gap-1.5">
                  {(["off", "propose", "auto"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setSec({ ...sec, autoRemediate: m })}
                      className={`text-xs rounded-full px-3 py-1.5 transition ${sec.autoRemediate === m ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
                      {m === "off" ? "Report only" : m === "propose" ? "Propose PRs" : "Auto-apply"}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-2 sm:grid-cols-3">
                <Toggle label="Continuous scanning" desc="Recon agent sweeps every 15 min"
                  on={sec.continuousScan} onClick={() => setSec({ ...sec, continuousScan: !sec.continuousScan })} />
                <Toggle label="Continuous red team" desc="Simulated MITRE ATT&CK runs"
                  on={sec.redTeam} onClick={() => setSec({ ...sec, redTeam: !sec.redTeam })} />
                <Toggle label="Zero-trust advisor" desc="Least-privilege IAM proposals"
                  on={sec.zeroTrust} onClick={() => setSec({ ...sec, zeroTrust: !sec.zeroTrust })} />
              </div>

              <Field label="Data residency" icon={Shield}>
                <select value={sec.dataResidency} onChange={(e) => setSec({ ...sec, dataResidency: e.target.value })}
                  className="w-full h-9 rounded-md neumorph-inset px-3 text-sm bg-transparent sm:w-64">
                  <option value="us">United States</option>
                  <option value="eu">European Union</option>
                  <option value="in">India</option>
                  <option value="apac">APAC</option>
                </select>
              </Field>
            </>
          )}

          {step === 3 && (
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

          {step === 4 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <TourCard icon={Sparkles} title="Architect crew"
                  body="12 specialists design your architecture in parallel, streaming reasoning live." />
                <TourCard icon={Shield} title="Security crew"
                  body="Recon, threat intel, IAM audit, attack path, compliance and remediation agents run continuously." />
                <TourCard icon={Cloud} title="Multi-cloud graph"
                  body={`${accounts.length || "Your"} linked account${accounts.length === 1 ? "" : "s"} normalized into one queryable estate.`} />
                <TourCard icon={LayoutGrid} title="Chat-first workspace"
                  body="Describe intent in plain language — agents pick the pages, artifacts and diffs for you." />
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

function Toggle({ label, desc, on, onClick }: { label: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-xl p-3.5 transition ${on ? "neumorph-sm" : "glass-subtle text-muted-foreground"}`}>
      <div className="flex items-center gap-2">
        <div className={`h-3.5 w-3.5 rounded-full ${on ? "bg-foreground" : "bg-muted-foreground/30"}`} />
        <div className="text-sm font-medium">{label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{desc}</div>
    </button>
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
