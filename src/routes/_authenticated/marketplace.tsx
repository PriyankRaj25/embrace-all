import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Download, Package, Layers, ShieldCheck, Cloud, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketplace")({
  component: MarketplacePage,
});

type Item = { id: string; name: string; kind: "template" | "blueprint" | "policy-pack" | "agent-ext"; author: string; installs: string; rating: number; tags: string[]; summary: string };

const ITEMS: Item[] = [
  { id: "b-fintech-core", name: "Fintech Core Platform",         kind: "blueprint", author: "AetherOS Labs",    installs: "2.1k",  rating: 4.9, tags: ["aws","pci","event-driven"], summary: "Multi-region ledger, KMS-encrypted, PCI-DSS ready with event-driven core." },
  { id: "b-hipaa-saas",   name: "HIPAA SaaS Starter",            kind: "blueprint", author: "AetherOS Labs",    installs: "1.4k",  rating: 4.8, tags: ["aws","hipaa"],              summary: "Multi-tenant healthcare SaaS with PHI vault, audit log, MFA." },
  { id: "t-microservice", name: "Microservice on EKS",           kind: "template",  author: "Community",        installs: "8.7k",  rating: 4.7, tags: ["kubernetes","aws"],         summary: "Opinionated microservice: Helm chart, OTel, CI/CD, dashboards." },
  { id: "t-nextjs-edge",  name: "Next.js at the Edge",           kind: "template",  author: "Vercel Team",      installs: "12k",   rating: 4.9, tags: ["frontend","edge"],          summary: "Global Next.js with ISR + KV cache + WAF." },
  { id: "p-soc2",         name: "SOC 2 Control Pack",            kind: "policy-pack", author: "Compliance Co",  installs: "980",   rating: 4.8, tags: ["soc2","governance"],        summary: "70+ policy-as-code rules mapped to SOC 2 CC criteria." },
  { id: "p-well-arch",    name: "AWS Well-Architected Pack",     kind: "policy-pack", author: "AetherOS Labs",  installs: "3.3k",  rating: 4.9, tags: ["aws","best-practice"],      summary: "All 6 WA pillars encoded; run against any blueprint." },
  { id: "a-cost-hawk",    name: "Cost Hawk Agent",               kind: "agent-ext",   author: "FinOps Guild",   installs: "610",   rating: 4.6, tags: ["finops","agent"],           summary: "Extra FinOps agent focused on savings plans + reserved capacity." },
  { id: "a-threat-model", name: "Threat Modeling Agent",         kind: "agent-ext",   author: "SecOps Group",   installs: "540",   rating: 4.8, tags: ["security","agent"],         summary: "STRIDE + PASTA threat models attached to your architecture." },
];

const KIND_META: Record<Item["kind"], { icon: typeof Package; label: string; tone: string }> = {
  blueprint:   { icon: Layers,      label: "Blueprint",     tone: "text-aether bg-aether/10" },
  template:    { icon: Cloud,       label: "Template",      tone: "text-cyan-400 bg-cyan-400/10" },
  "policy-pack": { icon: ShieldCheck, label: "Policy Pack", tone: "text-amber-300 bg-amber-300/10" },
  "agent-ext": { icon: Bot,         label: "Agent",         tone: "text-emerald-300 bg-emerald-300/10" },
};

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | Item["kind"]>("all");
  const list = ITEMS.filter((i) => (kind === "all" || i.kind === kind) && (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || i.tags.join(" ").includes(q.toLowerCase())));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Marketplace</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Blueprints, templates & policy packs</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Curated by AetherOS + the community. Install into any project.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search marketplace…" className="pl-8" />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/40 p-1">
          {(["all","blueprint","template","policy-pack","agent-ext"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition ${kind === k ? "bg-aether/20 text-aether" : "text-muted-foreground hover:text-foreground"}`}>
              {k === "all" ? "All" : KIND_META[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => {
          const meta = KIND_META[i.kind];
          const Icon = meta.icon;
          return (
            <div key={i.id} className="glass-panel rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`rounded-md p-2 ${meta.tone}`}><Icon className="h-4 w-4" /></div>
                <Badge variant="outline" className="text-[10px] font-mono uppercase">{meta.label}</Badge>
              </div>
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-muted-foreground">by {i.author}</div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{i.summary}</p>
              <div className="flex flex-wrap gap-1">{i.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}</div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-300" /> {i.rating}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {i.installs}</span>
                </div>
                <Button size="sm" variant="outline">Install</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
