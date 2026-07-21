import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string; cta?: { label: string; to: string; params?: Record<string, string> } };

const INTRO: Msg[] = [
  {
    role: "assistant",
    content:
      "Hi — I'm the AetherOS demo agent. I can walk you through the HealthTracker Pro blueprint we just generated: 12 specialised agents, HIPAA-grade architecture, $187k/mo forecast. Ask me anything, or pick a starter below.",
  },
];

const STARTERS = [
  "What does the demo project do?",
  "Show me the architecture",
  "How much does it cost to run?",
  "How is compliance handled?",
];

export function DemoChat() {
  const [messages, setMessages] = useState<Msg[]>(INTRO);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setThinking(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    setMessages((m) => [...m, reply(q)]);
    setThinking(false);
  }

  return (
    <div className="glass-heavy rounded-3xl overflow-hidden flex flex-col h-[560px] shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-7 w-7 grid place-items-center rounded-lg neumorph-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-foreground breathe" />
          </div>
          <div>
            <div className="text-sm font-medium leading-tight">Demo agent</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">online · no login required</div>
          </div>
        </div>
        <Link
          to="/projects/$projectId"
          params={{ projectId: "demo" }}
          className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          open demo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.role === "user" ? "flex justify-end" : ""}
            >
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md neumorph-sm px-4 py-2 text-sm">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{m.content}</div>
                  {m.cta && (
                    <Link
                      to={m.cta.to}
                      params={m.cta.params as never}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:opacity-80 transition group"
                    >
                      {m.cta.label}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </div>
        )}
        {messages.length <= 1 && !thinking && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full glass-subtle px-3 py-1.5 text-[11px] hover:bg-secondary/60 hover:text-foreground transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-border/60 p-3"
      >
        <div className="relative neumorph-inset rounded-2xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the demo project…"
            className="w-full bg-transparent px-4 py-3 pr-12 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background disabled:opacity-30 hover:opacity-90 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function reply(q: string): Msg {
  const l = q.toLowerCase();
  if (l.includes("what") && (l.includes("demo") || l.includes("project") || l.includes("do"))) {
    return {
      role: "assistant",
      content:
        "HealthTracker Pro is a HIPAA-grade wearables platform. 12 AetherOS agents designed it end-to-end: ingest for 3M biometric events/sec, ML inference on Inferentia, PHI encryption with per-tenant KMS, and a full audit trail. The whole blueprint was generated in under 60 seconds.",
      cta: { label: "Open the demo workspace", to: "/projects/$projectId", params: { projectId: "demo" } },
    };
  }
  if (l.includes("arch") || l.includes("diagram") || l.includes("system")) {
    return {
      role: "assistant",
      content:
        "The architecture spans four bounded contexts — Device Fleet, Biometric Ingest, Clinical Workspace, and ML Inference — on AWS EKS with Kafka MSK. There's an interactive Mermaid diagram with zoom, pan, and node isolation.",
      cta: { label: "View architecture diagram", to: "/projects/$projectId/architecture", params: { projectId: "demo" } },
    };
  }
  if (l.includes("cost") || l.includes("spend") || l.includes("finops") || l.includes("price") || l.includes("much")) {
    return {
      role: "assistant",
      content:
        "$187,420/mo forecasted spend. Top lines: GPU inference ($64k), Aurora Global ($28k), MSK ($22k), EKS ($18k). The FinOps agent flagged three savings levers worth ~23% blended — Inferentia migration, MSK tiered storage, and Glacier IR for cold PHI.",
      cta: { label: "See full blueprint", to: "/projects/$projectId/blueprint", params: { projectId: "demo" } },
    };
  }
  if (l.includes("compl") || l.includes("hipaa") || l.includes("gdpr") || l.includes("soc")) {
    return {
      role: "assistant",
      content:
        "Coverage: HIPAA 47/49 controls, SOC2 62/64, GDPR full. Two open items — BAA log rotation policy and quarterly access-review evidence — are surfaced with citations in the Compliance artifact.",
      cta: { label: "Open the blueprint", to: "/projects/$projectId/blueprint", params: { projectId: "demo" } },
    };
  }
  if (l.includes("secur") || l.includes("threat") || l.includes("risk")) {
    return {
      role: "assistant",
      content:
        "Per-tenant KMS with HSM backing, mTLS via App Mesh, envelope-encrypted PHI rotated every 90 days, IAM scoped per bounded context. The Reviewer agent scored the posture 87/100 with one open risk on egress allowlisting.",
    };
  }
  if (l.includes("agent") || l.includes("how") && l.includes("work")) {
    return {
      role: "assistant",
      content:
        "AetherOS coordinates 12 agents: Planner → Requirements → Domain → Solution → Cloud → Security → Compliance → FinOps → Reliability → IaC → Docs → Reviewer. Each runs with typed schemas and shared context. You watch them reason in real time.",
    };
  }
  return {
    role: "assistant",
    content:
      "The demo has the full artifact set — architecture, IaC modules, compliance matrix, FinOps forecast, audit timeline. Try asking about cost, compliance, or the architecture, or jump straight in.",
    cta: { label: "Launch demo workspace", to: "/projects/$projectId", params: { projectId: "demo" } },
  };
}
