import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { threatModel } from "@/lib/security-demo";
import { FileCode2, Cloud, Cpu, FileImage, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/security/threat-model")({
  component: ThreatModel;
});

const SOURCES = [
  { id: "tf",   label: "Terraform",        icon: FileCode2, desc: "envs/prod/main.tf" },
  { id: "cfn",  label: "CloudFormation",   icon: Cloud,     desc: "stacks/api.yaml" },
  { id: "diag", label: "Architecture Diagram", icon: FileImage, desc: "architecture.png" },
  { id: "k8s",  label: "Kubernetes Manifest", icon: Cpu,     desc: "helm/payments" },
] as const;

function ThreatModel() {
  const [source, setSource] = useState<string>("tf");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 900);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">AI Threat Model Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Point at any infra source and generate STRIDE, MITRE, and trust-boundary analysis.</p>
      </header>

      <div className="glass-panel rounded-2xl p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Source</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            const active = source === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`text-left rounded-xl p-4 transition ${active ? "neumorph-sm" : "neumorph-inset hover:neumorph-sm"}`}
              >
                <Icon className="h-4 w-4" />
                <div className="mt-2 text-sm font-medium">{s.label}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={generate} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Analyzing…" : "Generate threat model"}
          </Button>
          {loading && <span className="text-[10px] font-mono text-muted-foreground shimmer bg-clip-text text-transparent">reading resources · mapping trust boundaries · scoring STRIDE</span>}
        </div>
      </div>

      {generated && (
        <div className="space-y-4 fade-up">
          <div className="glass-panel rounded-2xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Executive summary</div>
            <p className="mt-2 text-sm leading-relaxed">
              17 threats identified across 4 trust boundaries. Elevation of Privilege dominates (4 findings) driven by over-permissive IAM. Recommend 5 baseline controls — implementing them collapses the top 3 attack chains.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">STRIDE analysis</div>
              <ul className="space-y-2">
                {threatModel.stride.map((s) => (
                  <li key={s.kind} className="flex items-start gap-3 p-3 rounded-lg neumorph-inset">
                    <div className="text-xl font-semibold w-8 text-center">{s.count}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{s.kind}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{s.notes}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Trust boundaries</div>
              <ol className="relative">
                {threatModel.boundaries.map((b, i) => (
                  <li key={b.name} className="pl-8 pb-4 relative">
                    <span className="absolute left-0 top-1 h-6 w-6 rounded-full grid place-items-center text-[10px] font-mono neumorph-sm">{i + 1}</span>
                    {i < threatModel.boundaries.length - 1 && <span className="absolute left-3 top-7 bottom-0 w-px bg-border" />}
                    <div className="text-[13px] font-medium flex items-center gap-1.5">{b.name} <ArrowRight className="h-3 w-3 text-muted-foreground" /></div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {b.controls.map((c) => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60">{c}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4" />
              <div className="text-sm font-medium">Recommended security controls</div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {threatModel.controls.map((c) => (
                <li key={c} className="text-[12px] flex items-start gap-2 p-3 rounded-lg neumorph-inset">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground mt-1.5 shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
