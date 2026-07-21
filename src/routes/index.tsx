import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Layers, ShieldCheck, Workflow, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoChat } from "@/components/demo-chat";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AetherOS — AI operating system for enterprise engineering" },
      { name: "description", content: "Describe a system in plain English. Twelve AI agents design, govern, and generate a production-ready cloud blueprint in minutes." },
      { property: "og:title", content: "AetherOS — AI operating system for enterprise engineering" },
      { property: "og:description", content: "Describe a system in plain English. Twelve AI agents design, govern, and generate a production-ready cloud blueprint in minutes." },
    ],
  }),
  component: Landing,
});

const AGENTS = ["Planner","Requirements","Domain","Solution","Cloud","Security","Compliance","FinOps","Reliability","IaC","Docs","Reviewer"];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-md neumorph-sm text-[11px] font-mono font-bold">Æ</div>
            <span className="font-medium tracking-tight text-sm">AetherOS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs text-muted-foreground">
            <a href="#demo" className="hover:text-foreground transition">Live demo</a>
            <a href="#agents" className="hover:text-foreground transition">Agents</a>
            <a href="#flow" className="hover:text-foreground transition">Workflow</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
              <Link to="/dashboard">Open app <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero + Live Demo Chat */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 aurora [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground breathe" />
              v1.0 · try the demo agent, no signup
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="mt-6 text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.98]"
            >
              An AI agent<br />that engineers<br />
              <span className="text-gradient-aether">your next system.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="mt-6 max-w-xl text-base text-muted-foreground leading-relaxed"
            >
              Describe it in plain English. Twelve specialised agents plan, design, cost, harden, and ship a production-ready blueprint — with the audit trail to prove it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-full">
                <Link to="/dashboard">Start designing <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 rounded-full border-border glass-subtle">
                <Link to="/projects/$projectId" params={{ projectId: "demo" }}>
                  <Play className="mr-2 h-4 w-4" /> Watch the demo
                </Link>
              </Button>
            </motion.div>

            <div className="mt-10 flex items-center gap-5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> HIPAA · SOC2</span>
              <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> multi-cloud</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> ~60s blueprint</span>
            </div>
          </div>

          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-8 aurora blur-2xl opacity-70 pointer-events-none" />
            <DemoChat />
          </motion.div>
        </div>
      </section>

      {/* Agents — condensed */}
      <section id="agents" className="relative px-6 py-24 border-t border-border/60">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">01 · Agent stack</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Twelve agents. One blueprint.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Each specialised. Coordinated by a planner. Nothing hallucinated into production.</p>
          </div>
          <div className="mt-10 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="neumorph-sm rounded-xl p-4 group hover:translate-y-[-2px] transition"
              >
                <div className="text-[9px] font-mono text-muted-foreground">A{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-3 text-sm font-medium">{a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow — condensed */}
      <section id="flow" className="relative px-6 py-24 border-t border-border/60">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">02 · Workflow</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-3xl">Requirement to Terraform in under ten minutes.</h2>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, step: "01", title: "Describe", body: "Plain English requirement, plus compliance and cloud hints." },
              { icon: Workflow, step: "02", title: "Orchestrate", body: "Watch twelve agents reason live — every decision logged." },
              { icon: Layers,   step: "03", title: "Ship",       body: "Export diagrams, cost models, Terraform, and audit evidence." },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">{step}</span>
                  <div className="h-8 w-8 grid place-items-center rounded-lg neumorph-sm">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-6 text-lg font-medium">{title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 border-t border-border/60">
        <div className="mx-auto max-w-3xl text-center glass-heavy rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em]">Design your next system.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Ship a validated blueprint tonight.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-full">
              <Link to="/dashboard">Open AetherOS <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 rounded-full glass-subtle">
              <Link to="/projects/$projectId" params={{ projectId: "demo" }}>Explore the demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-muted-foreground">
          <div>© AetherOS · Salt &amp; Pepper edition</div>
          <div className="font-mono">v1.0.0</div>
        </div>
      </footer>
    </div>
  );
}
