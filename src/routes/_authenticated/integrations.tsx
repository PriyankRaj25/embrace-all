import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Cloud, Database, GitBranch, Github, Slack, KeyRound, ShieldCheck,
  LineChart, Container, Zap, CircuitBoard, Search, Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/integrations")({
  component: IntegrationsPage,
});

type Category = "cloud" | "source" | "chatops" | "observability" | "secrets" | "data";

interface Connector {
  key: string; name: string; category: Category; icon: typeof Cloud; desc: string;
}

const CONNECTORS: Connector[] = [
  { key: "aws",       name: "AWS",          category: "cloud",         icon: Cloud,        desc: "Provision IaC and read cost/usage from your AWS accounts." },
  { key: "azure",     name: "Azure",        category: "cloud",         icon: Cloud,        desc: "Deploy Bicep/Terraform to Azure subscriptions." },
  { key: "gcp",       name: "GCP",          category: "cloud",         icon: Cloud,        desc: "Deploy to GCP projects with per-environment IAM." },
  { key: "github",    name: "GitHub",       category: "source",        icon: Github,       desc: "Open PRs with generated IaC and docs." },
  { key: "gitlab",    name: "GitLab",       category: "source",        icon: GitBranch,    desc: "Merge requests + CI hooks for blueprint deploys." },
  { key: "slack",     name: "Slack",        category: "chatops",       icon: Slack,        desc: "Approval requests and agent notifications in-channel." },
  { key: "datadog",   name: "Datadog",      category: "observability", icon: LineChart,    desc: "Ingest telemetry to feed the Reliability agent." },
  { key: "grafana",   name: "Grafana Cloud",category: "observability", icon: LineChart,    desc: "Dashboards auto-provisioned from blueprint." },
  { key: "vault",     name: "HashiCorp Vault", category: "secrets",    icon: KeyRound,     desc: "Store & rotate secrets referenced by IaC." },
  { key: "1password", name: "1Password",    category: "secrets",       icon: ShieldCheck,  desc: "Team secret sharing for engineers." },
  { key: "snowflake", name: "Snowflake",    category: "data",          icon: Database,     desc: "Model data warehouse layer inside blueprints." },
  { key: "docker",    name: "Docker Hub",   category: "data",          icon: Container,    desc: "Base image scanning against policy." },
  { key: "pagerduty", name: "PagerDuty",    category: "observability", icon: Zap,          desc: "Route incidents defined by the Reliability agent." },
  { key: "terraform", name: "Terraform Cloud", category: "cloud",      icon: CircuitBoard, desc: "Remote runs and state management." },
];

const CATS: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cloud", label: "Cloud" },
  { key: "source", label: "Source control" },
  { key: "chatops", label: "ChatOps" },
  { key: "observability", label: "Observability" },
  { key: "secrets", label: "Secrets" },
  { key: "data", label: "Data" },
];

export default function IntegrationsPage() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [connected, setConnected] = useState<Record<string, boolean>>({
    github: true, slack: true, aws: true,
  });

  const list = CONNECTORS
    .filter((c) => cat === "all" || c.category === cat)
    .filter((c) => (c.name + c.desc).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Integrations</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Connect AetherOS to your stack</h1>
        <p className="mt-2 text-muted-foreground">MCP-powered connectors let agents read context and take action across your tools.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATS.map((t) => (
            <button
              key={t.key}
              onClick={() => setCat(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md border transition ${
                cat === t.key ? "bg-aether/20 border-aether/40 text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const isOn = connected[c.key];
          return (
            <div key={c.key} className="glass-panel rounded-xl p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary/70 p-2 ring-1 ring-border">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] uppercase">{c.category}</Badge>
                  </div>
                </div>
                {isOn && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-success">
                    <Check className="h-3 w-3" /> connected
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground flex-1">{c.desc}</p>
              <Button
                size="sm"
                variant={isOn ? "outline" : "default"}
                className="mt-4"
                onClick={() => {
                  setConnected((s) => ({ ...s, [c.key]: !s[c.key] }));
                  toast.success(isOn ? `${c.name} disconnected` : `${c.name} connected`);
                }}
              >
                {isOn ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
