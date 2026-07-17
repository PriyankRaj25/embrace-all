import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, XCircle, Gavel, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compliance")({
  component: CompliancePage,
});

type Status = "covered" | "partial" | "gap";
interface Control { id: string; title: string; status: Status; evidence: string }
interface Framework { key: string; name: string; description: string; coverage: number; controls: Control[] }

const FRAMEWORKS: Framework[] = [
  {
    key: "hipaa", name: "HIPAA", coverage: 92,
    description: "Health information privacy and security for US healthcare workloads.",
    controls: [
      { id: "164.312(a)", title: "Access control",           status: "covered", evidence: "IAM least-privilege roles, MFA enforced" },
      { id: "164.312(b)", title: "Audit controls",           status: "covered", evidence: "CloudTrail + centralized log archive" },
      { id: "164.312(c)", title: "Integrity",                status: "covered", evidence: "S3 object lock + KMS-signed writes" },
      { id: "164.312(d)", title: "Person/entity authentication", status: "partial", evidence: "SSO wired; step-up MFA on admin roles pending" },
      { id: "164.312(e)", title: "Transmission security",    status: "covered", evidence: "TLS 1.3 in transit, mTLS between services" },
    ],
  },
  {
    key: "soc2", name: "SOC 2 Type II", coverage: 88,
    description: "Trust services criteria: security, availability, processing integrity, confidentiality.",
    controls: [
      { id: "CC6.1",  title: "Logical access",         status: "covered", evidence: "Central identity provider + RBAC" },
      { id: "CC7.1",  title: "System monitoring",      status: "covered", evidence: "CloudWatch + PagerDuty integration" },
      { id: "CC7.2",  title: "Anomaly detection",      status: "partial", evidence: "GuardDuty on; ML anomaly runbook draft" },
      { id: "A1.2",   title: "Backup & recovery",      status: "covered", evidence: "Automated snapshots, 15min RPO" },
      { id: "C1.1",   title: "Confidential data handling", status: "covered", evidence: "KMS envelope encryption at rest" },
    ],
  },
  {
    key: "gdpr", name: "GDPR", coverage: 76,
    description: "EU data protection regulation for personal data of EU residents.",
    controls: [
      { id: "Art. 5",  title: "Data minimization",     status: "partial", evidence: "PII column tagging pending in ETL layer" },
      { id: "Art. 17", title: "Right to erasure",      status: "covered", evidence: "Purge worker + DPO approval workflow" },
      { id: "Art. 25", title: "Data protection by design", status: "covered", evidence: "PII vault w/ tokenization" },
      { id: "Art. 32", title: "Security of processing", status: "covered", evidence: "TLS 1.3, KMS, network segmentation" },
      { id: "Art. 44", title: "Cross-border transfer",  status: "gap",     evidence: "SCCs not yet in place for US replica" },
    ],
  },
  {
    key: "pci", name: "PCI-DSS", coverage: 84,
    description: "Payment card industry data security standard.",
    controls: [
      { id: "3.4",  title: "Render PAN unreadable",    status: "covered", evidence: "Tokenization vault (Stripe)" },
      { id: "4.1",  title: "Encrypt cardholder data over open networks", status: "covered", evidence: "TLS 1.3 everywhere" },
      { id: "8.3",  title: "Multi-factor authentication", status: "covered", evidence: "MFA on all admin & remote access" },
      { id: "10.1", title: "Audit trails",             status: "partial", evidence: "Log retention set to 6mo — 12mo required" },
      { id: "11.3", title: "Penetration testing",      status: "gap",     evidence: "No test scheduled this quarter" },
    ],
  },
];

const ICON: Record<Status, typeof CheckCircle2> = { covered: CheckCircle2, partial: AlertCircle, gap: XCircle };
const TONE: Record<Status, string> = {
  covered: "text-success bg-success/10",
  partial: "text-warning bg-warning/10",
  gap: "text-destructive bg-destructive/10",
};

export default function CompliancePage() {
  const [active, setActive] = useState<string>("hipaa");
  const fw = FRAMEWORKS.find((f) => f.key === active)!;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Compliance Library</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Every framework, mapped to your architecture</h1>
        <p className="mt-2 text-muted-foreground">The Compliance agent evaluates each blueprint against these standards.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {FRAMEWORKS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`glass-panel rounded-xl p-5 text-left transition ${active === f.key ? "border-aether/50 ring-1 ring-aether/30" : "hover:border-aether/30"}`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-aether" />
              <div className="font-semibold">{f.name}</div>
            </div>
            <div className="mt-3">
              <div className="flex items-end justify-between mb-1">
                <div className="text-2xl font-semibold">{f.coverage}%</div>
                <div className="text-[10px] font-mono text-muted-foreground">coverage</div>
              </div>
              <Progress value={f.coverage} className="h-1.5" />
            </div>
          </button>
        ))}
      </div>

      <section className="glass-panel rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-aether" />
              <h2 className="text-xl font-semibold">{fw.name}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{fw.description}</p>
          </div>
          <Badge variant="outline" className="font-mono">{fw.controls.length} controls</Badge>
        </div>

        <div className="divide-y divide-border/40">
          {fw.controls.map((c) => {
            const Icon = ICON[c.status];
            return (
              <div key={c.id} className="flex items-start gap-4 py-4">
                <div className={`rounded-md p-1.5 ${TONE[c.status]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
                    <span className="font-medium">{c.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.evidence}</p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">{c.status}</Badge>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
