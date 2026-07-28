import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Check, Trash2, Receipt, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PLANS, USAGE_ADDONS, INVOICES, getBilling, saveBilling, addPaymentMethod,
  removePaymentMethod, setDefaultPaymentMethod, brandFromNumber, type PlanId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Billing & plans — AetherOS" },
      { name: "description", content: "Manage your AetherOS subscription, payment methods, usage add-ons and invoices." },
      { property: "og:title", content: "Billing & plans — AetherOS" },
      { property: "og:description", content: "Manage your AetherOS subscription, payment methods, usage add-ons and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const [billing, setBilling] = useState(() => getBilling());
  const [checkout, setCheckout] = useState<PlanId | null>(null);

  function refresh() {
    setBilling(getBilling());
  }

  function confirmCheckout(plan: PlanId) {
    saveBilling({ plan });
    setCheckout(null);
    refresh();
    toast.success(`Switched to the ${PLANS.find((p) => p.id === plan)?.name} plan`, {
      description: "Demo checkout — no card was charged.",
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10 space-y-8">
      <header className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Account</div>
        <h1 className="text-2xl font-medium tracking-tight">Billing & plans</h1>
        <p className="text-sm text-muted-foreground">
          Current plan: <span className="text-foreground">{PLANS.find((p) => p.id === billing.plan)?.name}</span> ·{" "}
          {billing.cycle}
        </p>
      </header>

      <Tabs defaultValue="plans">
        <TabsList className="glass-subtle p-1">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="methods">Payment methods</TabsTrigger>
          <TabsTrigger value="usage">Usage & add-ons</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-5 space-y-4">
          <div className="flex items-center gap-1 rounded-full glass-subtle p-1 text-xs w-fit">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => { saveBilling({ cycle: c }); refresh(); }}
                className={cn(
                  "rounded-full px-3 py-1.5 capitalize transition",
                  billing.cycle === c ? "neumorph-sm text-foreground" : "text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => {
              const price = billing.cycle === "yearly" ? plan.yearly : plan.monthly;
              const active = billing.plan === plan.id;
              return (
                <div key={plan.id} className={cn("glass-panel rounded-2xl border border-border/60 p-5", active && "ring-1 ring-foreground/30")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{plan.name}</div>
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    </div>
                    {active && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-background">
                        current
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    {price === null ? (
                      <span className="text-xl font-medium">Custom</span>
                    ) : (
                      <>
                        <span className="text-2xl font-medium">${price}</span>
                        <span className="text-[11px] text-muted-foreground">/{billing.cycle === "yearly" ? "yr" : "mo"}</span>
                      </>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 shrink-0 text-foreground/70" /> {h}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant={active ? "outline" : "default"}
                    disabled={active}
                    onClick={() => setCheckout(plan.id)}
                    className={cn("mt-4 w-full rounded-full", !active && "bg-foreground text-background hover:bg-foreground/90")}
                  >
                    {active ? "Current plan" : plan.monthly === null ? "Request quote" : "Upgrade"}
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="methods" className="mt-5 space-y-4">
          <AddMethod onAdded={refresh} />
          <div className="space-y-2">
            {billing.methods.length === 0 && (
              <div className="glass-subtle rounded-xl border border-border/60 p-6 text-center text-xs text-muted-foreground">
                No payment method yet. Add a card, PayPal or invoicing to enable paid plans.
              </div>
            )}
            {billing.methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl neumorph-sm p-3">
                {m.kind === "card" ? <CreditCard className="h-4 w-4" /> : m.kind === "paypal" ? <Wallet className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs">{m.brand} ···· {m.last4}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{m.exp}</div>
                </div>
                {m.isDefault ? (
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">default</span>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDefaultPaymentMethod(m.id); refresh(); }}>
                    Make default
                  </Button>
                )}
                <button
                  onClick={() => { removePaymentMethod(m.id); refresh(); toast.success("Payment method removed"); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Agent runs", value: "412 / 1,000" },
              { label: "Cloud accounts", value: "2 / 5" },
              { label: "Security scans", value: "1,840 resources" },
            ].map((s) => (
              <div key={s.label} className="glass-panel rounded-xl border border-border/60 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-lg font-medium tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="glass-subtle rounded-xl border border-border/60 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Add-on rates</div>
            <div className="mt-3 space-y-2">
              {USAGE_ADDONS.map((a) => (
                <div key={a.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="font-mono">{a.price}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-5">
          <div className="glass-subtle rounded-xl border border-border/60 divide-y divide-border/60">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 text-xs">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono">{inv.id}</span>
                <span className="text-muted-foreground">{inv.date}</span>
                <span className="ml-auto font-mono">{inv.amount}</span>
                <span className="text-muted-foreground">{inv.status}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CheckoutDialog
        planId={checkout}
        cycle={billing.cycle}
        onClose={() => setCheckout(null)}
        onConfirm={confirmCheckout}
      />
    </div>
  );
}

function AddMethod({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  function submit() {
    const digits = number.replace(/\D/g, "");
    if (digits.length < 12 || !exp) {
      toast.error("Enter a valid card number and expiry");
      return;
    }
    addPaymentMethod({ kind: "card", brand: brandFromNumber(digits), last4: digits.slice(-4), exp });
    setOpen(false);
    setNumber(""); setExp(""); setCvc("");
    onAdded();
    toast.success("Payment method added", { description: "Stored locally for this demo." });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Add card
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>Add a card</DialogTitle>
            <DialogDescription>Demo checkout — details never leave this browser.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc">Card number</Label>
              <Input id="cc" inputMode="numeric" placeholder="4242 4242 4242 4242" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="04/29" value={exp} onChange={(e) => setExp(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={submit} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              Save card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size="sm" variant="outline" className="rounded-full"
        onClick={() => { addPaymentMethod({ kind: "paypal", brand: "PayPal", last4: "acct", exp: "linked" }); onAdded(); toast.success("PayPal linked"); }}
      >
        <Wallet className="mr-1.5 h-3.5 w-3.5" /> Link PayPal
      </Button>
      <Button
        size="sm" variant="outline" className="rounded-full"
        onClick={() => { addPaymentMethod({ kind: "invoice", brand: "Invoicing", last4: "NET30", exp: "annual" }); onAdded(); toast.success("Invoicing enabled"); }}
      >
        <Landmark className="mr-1.5 h-3.5 w-3.5" /> Pay by invoice
      </Button>
    </div>
  );
}

function CheckoutDialog({
  planId, cycle, onClose, onConfirm,
}: {
  planId: PlanId | null;
  cycle: "monthly" | "yearly";
  onClose: () => void;
  onConfirm: (p: PlanId) => void;
}) {
  const plan = PLANS.find((p) => p.id === planId);
  const price = plan ? (cycle === "yearly" ? plan.yearly : plan.monthly) : null;

  return (
    <Dialog open={!!planId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-panel">
        <DialogHeader>
          <DialogTitle>{plan?.monthly === null ? "Talk to sales" : `Confirm ${plan?.name}`}</DialogTitle>
          <DialogDescription>
            {plan?.monthly === null
              ? "We'll reach out with a custom quote for private deployment and dedicated agents."
              : "Demo checkout — no card is charged and nothing is sent to a payment processor."}
          </DialogDescription>
        </DialogHeader>
        {plan?.monthly !== null && (
          <div className="rounded-xl neumorph-sm p-4 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{plan?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Billing</span><span className="capitalize">{cycle}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Included</span><span>{plan?.agentRuns}</span></div>
            <div className="flex justify-between border-t border-border/60 pt-1.5 text-sm">
              <span>Total today</span><span className="font-medium">${price}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={() => planId && onConfirm(planId)}
          >
            {plan?.monthly === null ? "Request quote" : "Pay & activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
