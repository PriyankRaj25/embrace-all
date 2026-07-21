import { AetherChat } from "@/components/ai-chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AetherOS Chat — AI Architecture Workspace" },
      { name: "description", content: "Chat with AetherOS to design, review, and explain enterprise cloud architectures." },
      { property: "og:title", content: "AetherOS Chat — AI Architecture Workspace" },
      { property: "og:description", content: "AI-first architecture chat for enterprise engineering blueprints." },
    ],
  }),
  component: ChatThreadRoute,
});

function ChatThreadRoute() {
  const { threadId } = Route.useParams();
  return <AetherChat threadId={threadId} />;
}