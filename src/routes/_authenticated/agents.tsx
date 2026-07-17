import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AGENTS, type AgentTier } from "@/lib/agents";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Compass, ListChecks, Boxes, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye, Search,
} from "lucide-react";

const ICONS: Record<string, typeof Compass> = {
  Compass, ListChecks, Boxes, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye,
};

const TIERS: { key: AgentTier | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "discovery", label: "Discovery" },
  { key: "architecture", label: "Architecture" },
  { key: "governance", label: "Governance" },
  { key: "generation", label: "Generation" },
  { key: "review", label: "Review" },
];

export const Route = createFileRoute("/_authenticated/agents")({
  component: AgentsCatalog,
});

function AgentsCatalog() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<AgentTier | "all">("all");

  const list = useMemo(() => {
    return AGENTS.filter((a) => tier === "all" || a.tier === tier)
      .filter((a) => (a.name + a.role).toLowerCase().includes(q.toLowerCase()));
  }, [q, tier]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Agent Catalog</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Twelve specialists. One orchestrator.</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Every agent owns a narrow, auditable slice of the blueprint. Filter by discipline or search by capability.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TIERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTier(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md border transition ${
                tier === t.key
                  ? "bg-aether/20 border-aether/40 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => {
          const Icon = ICONS[a.icon] ?? Compass;
          return (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel rounded-xl p-5 hover:border-aether/40 transition group"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-aether/10 p-2 ring-1 ring-aether/30 group-hover:bg-aether/20 transition">
                  <Icon className="h-5 w-5 text-aether" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{a.name}</h3>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">{a.tier}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.role}</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    ready · avg 4.2s
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-16">
            No agents match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
