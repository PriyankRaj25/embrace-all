import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain the security architecture",
  "How can we reduce monthly cost by 20%?",
  "What are the compliance gaps?",
  "Suggest a DR strategy for eu-west-1",
];

export function WorkspaceChat({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
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
    // Frontend-only mock reply — keeps the demo responsive without a live model.
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 800));
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: mockReply(q, projectName),
      },
    ]);
    setThinking(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Ask AetherOS · project {projectId.slice(0, 8)}</div>
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-muted-foreground">
            <p>Ask anything about this blueprint. Agents will reason across artifacts.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-secondary/60 hover:text-foreground transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={m.role === "user" ? "flex justify-end" : ""}
            >
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-foreground text-background px-3.5 py-2 text-sm">
                  {m.content}
                </div>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-border p-3"
      >
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Message the agents…"
            rows={2}
            className="resize-none bg-secondary/40 border-border pr-12 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="absolute right-2 bottom-2 grid h-7 w-7 place-items-center rounded-md bg-foreground text-background disabled:opacity-40 hover:opacity-90 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function mockReply(q: string, name: string): string {
  const l = q.toLowerCase();
  if (l.includes("cost") || l.includes("finops") || l.includes("save")) {
    return `Three levers cut ${name} spend materially:\n\n• Right-size ML inference (GPU → Inferentia) — ~$28k/mo\n• Kafka tiered storage on MSK — ~$11k/mo\n• Move cold PHI to Glacier IR after 90d — ~$6k/mo\n\nExpected blended savings: 23%.`;
  }
  if (l.includes("security") || l.includes("threat")) {
    return `Security posture:\n\n• Per-tenant KMS keys with HSM backing\n• mTLS between all services via App Mesh\n• PHI encrypted with envelope keys, rotated 90d\n• IAM roles scoped to bounded contexts\n\nOpen risk: broaden anomaly-scoring egress allowlist.`;
  }
  if (l.includes("compliance") || l.includes("hipaa") || l.includes("gdpr")) {
    return `Compliance coverage:\n\n• HIPAA — 47/49 controls (missing: BAA log rotation policy)\n• SOC2 — 62/64 (missing: quarterly access review evidence)\n• GDPR — full coverage; residency enforced via region tags\n\nCompliance Agent flagged 2 items — see the Compliance tab.`;
  }
  if (l.includes("dr") || l.includes("disaster") || l.includes("failover")) {
    return `Recommended DR for eu-west-1:\n\n• Active-passive to eu-central-1\n• RPO 30s via Aurora Global\n• RTO ≤ 5m via Route53 failover\n• Cross-region KMS replication\n\nEstimated additional spend: $9,400/mo.`;
  }
  return `Reviewing ${name} artifacts…\n\nBased on the current blueprint, the pattern is production-viable. Reviewer Agent gave it 87/100. The largest open risk is inference cost scaling non-linearly past 3M events/sec — worth a load test before rollout.`;
}
