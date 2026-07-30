import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageSquare, X, Minimize2, Trash2 } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import { quotaFor, useCreditSnapshot, type CreditSnapshot } from "@/lib/credits";
import { UsageMeter, QuotaStrip } from "@/components/usage-meter";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const STORAGE_KEY = "aetheros.global-chat.v1";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

type AssistantCtx = {
  messages: UIMessage[];
  status: ReturnType<typeof useChat>["status"];
  send: (text: string) => void;
  stop: () => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  snapshot?: CreditSnapshot;
};

const Ctx = createContext<AssistantCtx | null>(null);

export function useGlobalAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalAssistant must be used inside GlobalAssistantProvider");
  return ctx;
}

export function GlobalAssistantProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState<UIMessage[]>(() => loadMessages());
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  const qc = useQueryClient();
  const { data: snapshot } = useCreditSnapshot();
  const snapRef = useRef<CreditSnapshot | undefined>(undefined);
  snapRef.current = snapshot;

  // Bearer token lets the backend enforce credits + rate limits per user.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          const res = await fetch(input as RequestInfo, { ...init, headers });
          if (res.status === 402 || res.status === 429) {
            toast.error(await res.clone().text());
          }
          void qc.invalidateQueries({ queryKey: ["credits"] });
          return res;
        },
      }),
    [qc],
  );
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "aetheros-global",
    messages: initial,
    transport,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
  }, [messages]);

  const send = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      // Pre-flight quota check so the user sees the limit before the request fails.
      const gate = quotaFor(snapRef.current, "vega_message");
      if (!gate.allowed) {
        toast.error(gate.reason ?? "Quota exceeded");
        return;
      }
      void sendMessage({ text: `${value}\n\n[context: user is on ${pathRef.current}]` });
    },
    [sendMessage],
  );

  const clear = useCallback(() => {
    setMessages([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, [setMessages]);

  const value = useMemo(
    () => ({ messages, status, send, stop, clear, open, setOpen, snapshot }),
    [messages, status, send, stop, clear, open, snapshot],
  );


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .replace(/\n\n\[context: user is on [^\]]*\]$/, "");
}

export function AssistantSurface({
  className,
  suggestions = [],
  emptyTitle = "Vega — one assistant, everywhere",
  emptyDescription = "Ask about architecture, security, cost or compliance — context follows you across pages.",
}: {
  className?: string;
  suggestions?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { messages, status, send, stop } = useGlobalAssistant();
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {/* ambient glass glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      >
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-foreground/[0.06] blur-3xl animate-breathe" />
      </div>

      <Conversation className="flex-1">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState title={emptyTitle} description={emptyDescription}>
                <div className="mx-auto max-w-md space-y-3 rounded-2xl glass-panel border border-border/50 p-6 text-center backdrop-blur-xl">
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl neumorph-sm text-xs font-mono font-bold">
                    V
                  </div>
                  <h3 className="text-sm font-medium">{emptyTitle}</h3>
                  <p className="text-xs text-muted-foreground">{emptyDescription}</p>
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-md transition hover:border-border hover:bg-secondary/60 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent
                    className={cn(
                      message.role === "user"
                        ? "rounded-2xl border border-border/50 bg-primary text-primary-foreground shadow-sm"
                        : "border-none bg-transparent p-0 text-foreground",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <MessageResponse>{textOf(message)}</MessageResponse>
                    ) : (
                      textOf(message)
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
            {status === "submitted" && <Shimmer className="text-xs">Thinking…</Shimmer>}
          </ConversationContent>
        </div>
      </Conversation>

      <div className="border-t border-border/60 bg-background/30 p-3 backdrop-blur-xl">
        <PromptInput
          className="neumorph-inset rounded-2xl border-transparent bg-background/40 backdrop-blur-xl"
          onSubmit={(message) => send(message.text)}
        >
          <PromptInputTextarea
            autoFocus
            rows={2}
            className="min-h-16 bg-transparent"
            placeholder="Ask Vega anything…"
          />
          <PromptInputFooter className="items-center justify-between">
            <UsageMeter compact />
            <PromptInputSubmit status={status} disabled={busy && status === "submitted"} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <QuotaStrip kinds={["vega_message"]} />
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">
          1 credit per message · charged by the backend only when a reply is produced
        </p>
      </div>
    </div>
  );
}

export function GlobalAssistantDock() {
  const { open, setOpen, clear } = useGlobalAssistant();

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full neumorph-sm glass-panel px-4 py-2.5 text-sm transition hover:opacity-90"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Vega
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl glass-panel border border-border/60 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-lg neumorph-sm text-[10px] font-mono font-bold">V</div>
            <div className="flex-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Vega · AetherOS agent
            </div>
            <button onClick={clear} title="Clear conversation" className="text-muted-foreground hover:text-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setOpen(false)} title="Minimize" className="text-muted-foreground hover:text-foreground">
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setOpen(false)} title="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <AssistantSurface />
        </div>
      )}
    </>
  );
}
