import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Compass, ListChecks, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye, Boxes,
  ArrowRight, Sparkles, Zap, Layers, GitBranch,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, typeof Compass> = {
  Compass, ListChecks, Boxes, Network, Cloud, ShieldCheck, Gavel,
  DollarSign, HeartPulse, Code2, BookOpen, ScanEye,
};

const MODULES = [
  { title: "Requirements Intelligence", desc: "Convert natural-language business goals into structured technical requirements." },
  { title: "Solution Architecture",     desc: "Pattern selection, component boundaries and interaction design." },
  { title: "Cloud Reasoning Engine",    desc: "AWS, Azure, or GCP — service selection, networking, topology." },
  { title: "Security & IAM Strategy",   desc: "Least-privilege roles, encryption, secrets, segmentation." },
  { title: "Compliance Mapping",        desc: "HIPAA, SOC 2, GDPR, PCI — controls mapped to your design." },
  { title: "FinOps Projections",        desc: "Monthly cost breakdowns and optimization levers." },
  { title: "Reliability & DR",          desc: "RPO/RTO, failure scenarios, disaster recovery." },
  { title: "Infrastructure as Code",    desc: "Terraform modules for the entire architecture." },
  { title: "Documentation & ADRs",      desc: "Living architecture docs and decision records." },
];

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.19 285 / 0.4), transparent 70%)" }} aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.15 210 / 0.3), transparent 70%)" }} aria-hidden />

      <Nav />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1 text-xs font-mono tracking-wide text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-aether pulse-ring" />
            AI OPERATING SYSTEM · v1 preview
          </div>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
            The intelligence layer{" "}
            <span className="text-gradient-aether">above</span> your cloud.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Describe your business requirement. AetherOS orchestrates a swarm of AI agents that design, validate, and generate a production-ready enterprise architecture — in minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base font-medium glow-aether">
              <Link to="/auth">Launch Workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-base">
              <a href="#agents">See the agents</a>
            </Button>
          </div>

          {/* Requirement preview card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-16 w-full max-w-3xl rounded-2xl glass-panel p-6 text-left shadow-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-aether" /> aetheros://new-project
            </div>
            <p className="mt-4 text-lg leading-relaxed">
              <span className="text-muted-foreground">$ </span>
              Build a multi-tenant healthcare SaaS platform for 20 million users with HIPAA compliance on AWS.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-mono">
              {["planning", "requirements", "domain", "solution", "cloud", "security", "compliance", "finops", "reliability", "iac", "docs", "review"].map((s, i) => (
                <motion.span key={s}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }}
                  className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-muted-foreground"
                >{s}</motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* WHY */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 border-t border-border/40">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            { icon: Zap,      title: "Weeks → Minutes", desc: "Architecture, security, compliance and cost decisions collapsed into a single AI-orchestrated run." },
            { icon: Layers,   title: "Evidence-based",  desc: "Each agent grounds its output in the previous stage. Every decision is traceable." },
            { icon: GitBranch,title: "Production-ready",desc: "Terraform, ADRs, DR strategy, and reviewer sign-off out of the box." },
          ].map((f) => (
            <div key={f.title} className="glass-panel rounded-xl p-6">
              <f.icon className="h-6 w-6 text-aether" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-widest text-aether">core modules</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">A complete engineering blueprint.</h2>
          <p className="mt-3 text-muted-foreground">Every module a senior architect would produce, generated coherently and reviewed before you ship.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <motion.div key={m.title}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl p-5 hover:border-aether/40 transition"
            >
              <div className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-2 font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="relative mx-auto max-w-7xl px-6 py-24 border-t border-border/40">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-widest text-aether">agent architecture</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Twelve specialists, one orchestrator.</h2>
          <p className="mt-3 text-muted-foreground">Discovery, architecture, governance, generation and review — each agent owns a narrow, auditable slice of the blueprint.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => {
            const Icon = ICONS[a.icon] ?? Compass;
            return (
              <motion.div key={a.key}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-xl p-5 group"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-aether/10 p-2 ring-1 ring-aether/30 group-hover:bg-aether/20 transition">
                    <Icon className="h-5 w-5 text-aether" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{a.name}</h3>
                      <span className="rounded-sm bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{a.tier}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.role}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-4xl px-6 py-32 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          From idea to <span className="text-gradient-aether">production-ready</span> in minutes.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Stop making architecture decisions in isolation. Let the operating system reason across your entire stack.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 px-8 text-base glow-aether">
          <Link to="/auth">Start building <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs font-mono text-muted-foreground">
        AetherOS · AI Operating System for Enterprise Engineering
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-aether to-aether-glow glow-aether">
          <span className="font-mono font-bold text-primary-foreground">Æ</span>
        </div>
        <span className="font-semibold tracking-tight">AetherOS</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
        <a href="#agents" className="hover:text-foreground transition">Agents</a>
        <a href="#agents" className="hover:text-foreground transition">Modules</a>
        <Link to="/auth" className="hover:text-foreground transition">Sign in</Link>
      </nav>
      <Button asChild size="sm" className="glow-aether">
        <Link to="/auth">Launch</Link>
      </Button>
    </header>
  );
}
