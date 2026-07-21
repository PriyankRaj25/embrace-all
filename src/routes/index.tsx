import { ensureChatThread } from "@/lib/chat-store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AetherOS — AI Architecture Chat" },
      { name: "description", content: "An AI-first workspace for designing, reviewing, and generating enterprise cloud architecture blueprints." },
      { property: "og:title", content: "AetherOS — AI Architecture Chat" },
      { property: "og:description", content: "Start with a chat and generate investor-ready cloud architecture blueprints." },
    ],
  }),
  component: ChatHome,
});

function ChatHome() {
  const navigate = useNavigate();
  const [threadId] = useState(() => (typeof window === "undefined" ? null : ensureChatThread().thread.id));

  useEffect(() => {
    if (!threadId) return;
    navigate({ to: "/chat/$threadId", params: { threadId }, replace: true });
  }, [navigate, threadId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground glow-aether">Æ</div>
        <p className="mt-4 text-sm text-muted-foreground">Opening AetherOS chat…</p>
      </div>
    </div>
  );
}
