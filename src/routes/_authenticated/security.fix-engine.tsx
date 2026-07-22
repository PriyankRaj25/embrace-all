import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { detectedIssues, type Severity } from "@/lib/security-demo";
import { Wrench, GitPullRequest, Undo2, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/security/fix-engine")({
  component: FixEngine,
});

const SEV: Record<Severity, string> = {
  critical: "text-foreground border-foreground/40 bg-foreground/10",
  high:     "text-foreground border-foreground/25",
  medium:   "text-muted-foreground border-border",
  low:      "text-muted-foreground border-border/60",
};

const WORKFLOW = [
  "Issue detected",
  "AI generates fix",
  "GitHub PR created",
  "Human approval",
  "Deployment",
  "Verification",
  "Issue resolved",
];

function FixEngine() {
  const [selectedId, setSelectedId] = useState(detectedIssues[0].id);
  const [step, setStep] = useState(1);
  const issue = detectedIssues.find((i) => i.id === selectedId)!;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Autonomous Fix Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-authored remediation with human-in-the-loop approval.</p>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <aside className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1 mb-1">Open issues</div>
          {detectedIssues.map((i) => (
            <button
              key={i.id}
              onClick={() => { setSelectedId(i.id); setStep(1); }}
              className={`w-full text-left p-3 rounded-xl transition ${selectedId === i.id ? "neumorph-sm" : "hover:bg-accent/30"}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${SEV[i.severity]}`}>{i.severity}</span>
              </div>
              <div className="text-[12px] leading-tight">{i.title}</div>
            </button>
          ))}
        </aside>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Issue</div>
                <h2 className="mt-1 text-base font-medium">{issue.title}</h2>
              </div>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${SEV[issue.severity]}`}>{issue.severity}</span>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <Detail label="Root cause" value={issue.rootCause} />
              <Detail label="Business impact" value={issue.impact} />
            </div>
          </div>

          {/* Workflow */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Remediation workflow</div>
              <div className="text-[10px] font-mono text-muted-foreground">step {step} / {WORKFLOW.length}</div>
            </div>
            <ol className="flex items-center gap-2 overflow-x-auto pb-2">
              {WORKFLOW.map((w, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={w} className="flex items-center gap-2 shrink-0">
                    <div className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-mono transition ${
                      done ? "bg-foreground text-background" : active ? "neumorph-sm pulse-ring" : "neumorph-inset text-muted-foreground"
                    }`}>{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</div>
                    <span className={`text-[11px] ${done || active ? "text-foreground" : "text-muted-foreground"}`}>{w}</span>
                    {i < WORKFLOW.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.min(WORKFLOW.length, s + 1))}><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Fix</Button>
              <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.max(1, s + 1))}>View Terraform Diff</Button>
              <Button size="sm" onClick={() => setStep(3)}><GitPullRequest className="h-3.5 w-3.5 mr-1.5" /> Create Pull Request</Button>
              <Button size="sm" variant="ghost" onClick={() => setStep(1)}><Undo2 className="h-3.5 w-3.5 mr-1.5" /> Rollback Plan</Button>
            </div>
          </div>

          {/* Fix code */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4" />
              <div className="text-sm font-medium">AI-generated fix</div>
              <span className="ml-auto text-[9px] font-mono uppercase tracking-widest text-muted-foreground">terraform</span>
            </div>
            <pre className="neumorph-inset rounded-xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">
{issue.fix}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="neumorph-inset rounded-lg p-3">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-[12px] leading-relaxed">{value}</div>
    </div>
  );
}
