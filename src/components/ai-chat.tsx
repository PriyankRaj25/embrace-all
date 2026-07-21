"use client";

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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  createChatThread,
  ensureChatThread,
  removeChatThread,
  updateThreadMessages,
  writeChatThreads,
  type ChatThread,
} from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Bot,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquarePlus,
  Network,
  PanelLeft,
  Send,
  Trash2,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const STARTERS = [
  "Design a HIPAA-grade wearables architecture for 50M users on AWS.",
  "Review the demo blueprint like an investor diligence memo.",
  "Turn a fintech payments idea into cloud architecture, risks, and monthly cost.",
];

export function AetherChat({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>(() => ensureChatThread(threadId).threads);

  useEffect(() => {
    setThreads((current) => {
      if (current.some((thread) => thread.id === threadId)) return current;
      const next = [createChatThread(threadId), ...current];
      writeChatThreads(next);
      return next;
    });
  }, [threadId]);

  const activeThread = threads.find((thread) => thread.id === threadId) ?? threads[0] ?? createChatThread(threadId);

  const createThread = () => {
    const thread = createChatThread();
    setThreads((current) => {
      const next = [thread, ...current];
      writeChatThreads(next);
      return next;
    });
    navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  };

  const deleteThread = (id: string) => {
    setThreads((current) => {
      const next = removeChatThread(current, id);
      if (id === threadId) {
        navigate({ to: "/chat/$threadId", params: { threadId: next[0].id }, replace: true });
      }
      return next;
    });
  };

  const persistMessages = useCallback((messages: UIMessage[]) => {
    setThreads((current) => updateThreadMessages(current, threadId, messages));
  }, [threadId]);

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-background text-foreground lg:grid-cols-[auto_1fr]">
      <aside
        className={cn(
          "hidden border-r border-border/40 bg-sidebar/80 backdrop-blur-xl lg:flex lg:flex-col",
          sidebarOpen ? "w-80" : "w-16",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground glow-aether">
            <span className="font-mono text-sm font-bold">Æ</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="font-semibold tracking-tight">AetherOS</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AI-first workspace</div>
            </div>
          )}
          <Button className="ml-auto" size="icon" variant="ghost" onClick={() => setSidebarOpen((open) => !open)}>
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button className={cn("w-full", !sidebarOpen && "px-0")} onClick={createThread} size={sidebarOpen ? "default" : "icon"}>
            <MessageSquarePlus className="size-4" />
            {sidebarOpen && "New chat"}
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-3">
          <div className="space-y-1 pb-4">
            {threads.map((thread) => (
              <div key={thread.id} className="group flex items-center gap-1">
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  className={cn(
                    "min-w-0 flex-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent/70 hover:text-foreground",
                    thread.id === activeThread.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                    !sidebarOpen && "grid place-items-center px-0",
                  )}
                >
                  {sidebarOpen ? <span className="block truncate">{thread.title}</span> : <Bot className="size-4" />}
                </Link>
                {sidebarOpen && (
                  <Button
                    aria-label="Delete conversation"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => deleteThread(thread.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {sidebarOpen && (
          <div className="border-t border-border/40 p-3 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/projects/$projectId/architecture" params={{ projectId: "demo" }}>
                  <Workflow className="size-3.5" /> Diagram
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/projects/$projectId/blueprint" params={{ projectId: "demo" }}>
                  <FileText className="size-3.5" /> Blueprint
                </Link>
              </Button>
            </div>
          </div>
        )}
      </aside>

      <main className="grid min-w-0 grid-cols-1 xl:grid-cols-[1fr_320px]">
        <section className="flex min-h-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border/40 px-4 md:px-6">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">{activeThread.title}</h1>
              <p className="text-xs text-muted-foreground">Chat with the architecture operating system.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/auth"><LayoutDashboard className="size-3.5" /> Workspace</Link>
              </Button>
            </div>
          </header>

          <ChatConversation
            key={activeThread.id}
            initialMessages={activeThread.messages}
            onMessagesChange={persistMessages}
            threadId={activeThread.id}
          />
        </section>

        <aside className="hidden border-l border-border/40 bg-background/60 p-5 xl:block">
          <div className="text-[10px] font-mono uppercase tracking-widest text-aether">Investor demo</div>
          <h2 className="mt-2 text-xl font-semibold">HealthTracker Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A populated enterprise blueprint with architecture diagram, audit trail, cost model, compliance controls, and Terraform modules.
          </p>

          <div className="mt-5 grid gap-2">
            <Button asChild className="justify-start" variant="outline">
              <Link to="/projects/$projectId" params={{ projectId: "demo" }}>
                <Building2 className="size-4" /> Open workspace
              </Link>
            </Button>
            <Button asChild className="justify-start" variant="outline">
              <Link to="/projects/$projectId/architecture" params={{ projectId: "demo" }}>
                <Network className="size-4" /> Explore diagram
              </Link>
            </Button>
            <Button asChild className="justify-start" variant="outline">
              <Link to="/projects/$projectId/blueprint" params={{ projectId: "demo" }}>
                <FileText className="size-4" /> Read blueprint
              </Link>
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3 text-sm">
            {[
              ["12", "specialized agents"],
              ["99.99%", "target SLA"],
              ["$187k", "monthly forecast"],
              ["5", "Terraform modules"],
            ].map(([value, label]) => (
              <div key={label} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-aether">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

function ChatConversation({
  threadId,
  initialMessages,
  onMessagesChange,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => toast.error(err.message || "AI request failed"),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange, status, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const submit = async (text: string) => {
    await sendMessage({ text });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <>
      <Conversation>
        <ScrollArea className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
            {messages.length === 0 ? (
              <ConversationEmptyState className="min-h-[52vh]" icon={<div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground glow-aether">Æ</div>}>
                <div className="max-w-2xl text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-aether">AetherOS chat</div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Start with intent. Get architecture.</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Ask for a cloud design, cost model, compliance review, Terraform plan, or investor-ready blueprint walkthrough.
                  </p>
                  <div className="mt-6 grid gap-2 text-left">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground transition hover:border-aether/50 hover:text-foreground"
                        onClick={() => void submit(starter)}
                        type="button"
                      >
                        <Send className="mr-2 inline size-3.5 text-aether" />
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => <RenderedMessage key={message.id} message={message} />)
            )}

            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>AetherOS is reasoning across the blueprint…</Shimmer>
                </MessageContent>
              </Message>
            )}
            {error && <div className="text-sm text-destructive">{error.message}</div>}
            <div ref={bottomRef} />
          </ConversationContent>
        </ScrollArea>
      </Conversation>

      <div className="border-t border-border/40 bg-background/80 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl">
          <PromptInput onSubmit={(message) => submit(message.text)}>
            <PromptInputTextarea ref={textareaRef} disabled={isBusy} />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} disabled={status === "submitted"} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
}

function RenderedMessage({ message }: { message: UIMessage }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, index) => {
          if (part.type === "text") return <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>;
          return (
            <div key={`${message.id}-${index}`} className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
              {part.type}
            </div>
          );
        })}
      </MessageContent>
    </Message>
  );
}