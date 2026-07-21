import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { AGENT_BY_KEY, type AgentKey } from "@/lib/agents";

export type OverlayItem = {
  key: AgentKey;
  status: "pending" | "running" | "completed" | "failed";
  summary?: string;
  duration_ms?: number;
};

export function OrchestrationOverlay({
  open,
  activeAgent,
  timeline,
  projectName,
  onClose,
}: {
  open: boolean;
  activeAgent: AgentKey | null;
  timeline: OverlayItem[];
  projectName: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-2xl px-6"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            className="glass-heavy rounded-2xl w-full max-w-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Orchestrating</div>
                <div className="text-sm font-medium mt-0.5 truncate">{projectName}</div>
              </div>
              <div className="flex items-center gap-3">
                {activeAgent && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {AGENT_BY_KEY[activeAgent].name}
                  </div>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-2">
              {timeline.map((t) => {
                const spec = AGENT_BY_KEY[t.key];
                return (
                  <motion.div
                    key={t.key}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 rounded-md border border-border/60 p-3"
                  >
                    <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                      t.status === "completed" ? "bg-foreground" :
                      t.status === "running" ? "bg-foreground animate-pulse" :
                      t.status === "failed" ? "bg-destructive" : "bg-muted-foreground/40"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{spec.name}</span>
                        {t.duration_ms != null && <span className="text-[10px] font-mono text-muted-foreground">{(t.duration_ms / 1000).toFixed(1)}s</span>}
                      </div>
                      {t.summary && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.summary}</p>}
                      {t.status === "running" && !t.summary && (
                        <div className="mt-2 h-0.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full w-1/3 shimmer" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {timeline.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">Warming up agents…</div>
              )}
            </div>

            <div className="border-t border-border px-6 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>{timeline.filter((t) => t.status === "completed").length} / {timeline.length || 12} complete</span>
              <button onClick={onClose} className="hover:text-foreground">dismiss →</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
