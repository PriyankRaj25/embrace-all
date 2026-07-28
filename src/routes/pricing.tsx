import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, USAGE_ADDONS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pricing — AetherOS agent platform plans" },
      { name: "description", content: "Simple plans for AI-designed cloud architecture: free Starter, Team at $79/mo, Scale at $349/mo, and custom Enterprise deployments." },
      { property: "og:title", content: "Pricing — AetherOS agent platform plans" },
      { property: "og:description", content: "Free Starter, Team at $79/mo, Scale at $349/mo, plus usage add-ons and custom Enterprise deployments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-md neumorph-sm text-[11px] font-mono font-bold">Æ</div>
            <span className="font-medium tracking-tight text-sm">AetherOS</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
              <Link to="/dashboard">Open app <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative px-6 pt-32 pb-20">
        <div className="absolute inset-0 aurora [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground breathe" /> pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Pay for outcomes, not seats</h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              Every plan includes Vega, the single assistant that carries context across your whole workspace.
            </p>

            <div className="inline-flex items-center gap-1 rounded-full glass-subtle p-1 text-xs">
              <button
                onClick={() => setYearly(false)}
                className={cn("rounded-full px-3 py-1.5 transition", !yearly && "neumorph-sm text-foreground", yearly && "text-muted-foreground")}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={cn("rounded-full px-3 py-1.5 transition", yearly && "neumorph-sm text-foreground", !yearly && "text-muted-foreground")}
              >
                Yearly · 2 months free
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price = yearly ? plan.yearly : plan.monthly;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "glass-panel rounded-2xl border border-border/60 p-5 flex flex-col",
                    plan.popular && "neumorph ring-1 ring-foreground/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{plan.name}</div>
                    {plan.popular && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-background">
                        popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground min-h-8">{plan.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {price === null ? (
                      <span className="text-2xl font-medium tracking-tight">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-medium tracking-tight">${price}</span>
                        <span className="text-[11px] text-muted-foreground">/{yearly ? "year" : "month"}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-muted-foreground">{plan.agentRuns}</div>

                  <ul className="mt-4 space-y-2 flex-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 shrink-0 text-foreground/70" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="sm"
                    variant={plan.popular ? "default" : "outline"}
                    className={cn("mt-5 rounded-full", plan.popular && "bg-foreground text-background hover:bg-foreground/90")}
                  >
                    <Link to="/billing">
                      {plan.monthly === null ? "Talk to sales" : plan.monthly === 0 ? "Start free" : "Choose plan"}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-10 glass-subtle rounded-2xl border border-border/60 p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Usage add-ons</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {USAGE_ADDONS.map((a) => (
                <div key={a.label} className="rounded-xl neumorph-sm p-3">
                  <div className="text-xs">{a.label}</div>
                  <div className="mt-1 text-[11px] font-mono text-muted-foreground">{a.price}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Cards, PayPal and invoicing supported. This demo runs checkout locally — no real charges.
          </p>
        </div>
      </section>
    </div>
  );
}
