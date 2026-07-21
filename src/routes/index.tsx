import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Layers, ShieldCheck, Workflow, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AetherOS — AI operating system for enterprise engineering" },
      { name: "description", content: "AetherOS turns a business requirement into a validated, production-ready cloud architecture in minutes. Multi-agent AI designs, governs, and generates the entire blueprint." },
      { property: "og:title", content: "AetherOS — AI operating system for enterprise engineering" },
      { property: "og:description", content: "Multi-agent AI designs, governs, and generates enterprise cloud architectures from natural language." },
    ],
  }),
  component: Landing,
});

const AGENTS = [
  "Planner", "Requirements", "Domain", "Solution", "Cloud", "Security",
  "Compliance", "FinOps", "Reliability", "IaC", "Docs", "Reviewer",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-foreground text-background text-[11px] font-mono font-bold">Æ</div>
            <span className="font-medium tracking-tight text-sm">AetherOS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs text-muted-foreground">
            <a href="#agents" className="hover:text-foreground transition">Agents</a>
            <a href="#flow" className="hover:text-foreground transition">Workflow</a>
            <a href="#trust" className="hover:text-foreground transition">Trust</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              <Link to="/dashboard">Open app <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.06),transparent_70%)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
            v1.0 · Multi-agent architecture engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mt-8 text-6xl md:text-8xl font-semibold tracking-[-0.04em] leading-[0.95]"
          >
            The AI operating<br />system for<br />
            <span className="text-gradient-aether">enterprise engineering.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            Describe a system in plain language. Twelve specialised agents plan, design, validate,
            cost, harden, and generate a production-ready blueprint — with the audit trail to prove it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-full">
              <Link to="/dashboard">Start designing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 rounded-full border-border">
              <Link to="/projects/$projectId" params={{ projectId: "demo" }}>
                <Play className="mr-2 h-4 w-4" /> Watch the demo
              </Link>
            </Button>
          </motion.div>

          {/* Hero visual: floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-24 relative mx-auto max-w-4xl"
          >
            <div className="glass-heavy rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                <div className="ml-3 text-[10px] font-mono text-muted-foreground">HealthTracker Pro — orchestrating…</div>
              </div>
              <div className="grid grid-cols-[1fr_1.4fr] min-h-[280px]">
                <div className="border-r border-border p-4 space-y-2">
                  {AGENTS.slice(0, 6).map((a, i) => (
                    <div key={a} className={`rounded-md border border-border px-3 py-2 flex items-center gap-2 text-xs ${i === 2 ? "bg-secondary/60" : ""}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${i < 2 ? "bg-foreground" : i === 2 ? "bg-foreground animate-pulse" : "bg-muted-foreground/40"}`} />
                      {a}
                    </div>
                  ))}
                </div>
                <div className="p-6 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Domain Agent · 2.4s</div>
                  <div className="text-sm leading-relaxed">Bounded contexts identified — <span className="text-foreground">Device Fleet</span>, <span className="text-foreground">Biometric Ingest</span>, <span className="text-foreground">Clinical Workspace</span>, <span className="text-foreground">ML Inference</span>.</div>
                  <div className="h-px bg-border my-4" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full w-1/2 shimmer bg-foreground/60" />
                    </div>
                    Solution Agent thinking…
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-x-8 -bottom-8 h-32 bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.08),transparent_70%)] blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="relative px-6 py-32 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">01 · Agent stack</div>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">Twelve agents. One blueprint.</h2>
            <p className="mt-4 text-muted-foreground">Each specialised. Coordinated by a planner. Every artifact reviewed. Nothing hallucinated into production.</p>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="bg-background p-6 group hover:bg-secondary/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">A{String(i + 1).padStart(2, "0")}</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 group-hover:bg-foreground transition" />
                </div>
                <div className="mt-8 text-lg font-medium">{a}</div>
                <div className="mt-1 text-xs text-muted-foreground">Agent</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="relative px-6 py-32 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">02 · Workflow</div>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">From requirement to Terraform in under ten minutes.</h2>

          <div className="mt-16 grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
            {[
              { icon: Sparkles, step: "01", title: "Describe", body: "Write a plain-English requirement. Add compliance, cloud, and scale hints." },
              { icon: Workflow, step: "02", title: "Orchestrate", body: "Watch twelve agents plan, design, and validate — with full reasoning traces." },
              { icon: Layers,   step: "03", title: "Ship",       body: "Export architecture diagrams, cost models, Terraform, and audit evidence." },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="bg-background p-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">{step}</span>
                  <Icon className="h-4 w-4 text-foreground/60" />
                </div>
                <div className="mt-10 text-2xl font-medium">{title}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="relative px-6 py-32 border-t border-border">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">03 · Trust</div>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">Enterprise-grade by default.</h2>
            <p className="mt-4 text-muted-foreground">Every artifact is signed, every decision is logged, every gate is auditable. Human-in-the-loop approvals stop rollouts you didn&apos;t bless.</p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {[
                { icon: ShieldCheck, label: "HIPAA · SOC2 · GDPR" },
                { icon: Cpu,         label: "Deterministic reruns" },
                { icon: Zap,         label: "Sub-10 min blueprint" },
                { icon: Layers,      label: "Multi-cloud native" },
              ].map(({ icon: I, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-muted-foreground"><I className="h-4 w-4" /> {label}</div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-8 font-mono text-xs leading-relaxed text-muted-foreground overflow-hidden">
            <div className="text-foreground">$ aetheros run</div>
            <div className="mt-2">→ planner       <span className="text-foreground">✓ 0.8s</span></div>
            <div>→ requirements  <span className="text-foreground">✓ 1.6s</span></div>
            <div>→ domain        <span className="text-foreground">✓ 2.4s</span></div>
            <div>→ solution      <span className="text-foreground">✓ 4.1s</span></div>
            <div>→ cloud         <span className="text-foreground">✓ 3.2s</span></div>
            <div>→ security      <span className="text-foreground">✓ 2.9s</span></div>
            <div>→ compliance    <span className="text-foreground">✓ 3.4s</span></div>
            <div>→ finops        <span className="text-foreground">✓ 2.1s</span></div>
            <div>→ reliability   <span className="text-foreground">✓ 2.8s</span></div>
            <div>→ iac           <span className="text-foreground">✓ 5.6s</span></div>
            <div>→ docs          <span className="text-foreground">✓ 2.2s</span></div>
            <div>→ reviewer      <span className="text-foreground">✓ 1.9s</span></div>
            <div className="mt-3 text-foreground">blueprint ready · 33.0s · $187,420/mo forecast</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-32 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em]">Design your next system.</h2>
          <p className="mt-4 text-muted-foreground">Stop stitching diagrams by hand. Ship a validated blueprint tonight.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-full">
              <Link to="/dashboard">Open AetherOS <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 rounded-full border-border">
              <Link to="/projects/$projectId" params={{ projectId: "demo" }}>Explore the demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-muted-foreground">
          <div>© AetherOS · Salt & Pepper edition</div>
          <div className="font-mono">v1.0.0</div>
        </div>
      </footer>
    </div>
  );
}
