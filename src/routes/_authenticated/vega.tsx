import { createFileRoute } from "@tanstack/react-router";
import { AssistantSurface } from "@/components/global-assistant";

export const Route = createFileRoute("/_authenticated/vega")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vega — your AetherOS assistant" },
      { name: "description", content: "Chat with Vega, the single AetherOS agent that carries context across projects, security, cost and compliance." },
      { property: "og:title", content: "Vega — your AetherOS assistant" },
      { property: "og:description", content: "One assistant across the whole workspace: architecture, security, cost and compliance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VegaPage,
});

const SUGGESTIONS = [
  "Design a HIPAA-ready microservice platform on AWS",
  "Where is my biggest security exposure right now?",
  "Cut my monthly cloud spend by 20%",
  "Summarise compliance gaps for SOC 2",
];

function VegaPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 px-6 h-14 shrink-0">
        <div className="grid h-7 w-7 place-items-center rounded-lg neumorph-sm text-[11px] font-mono font-bold">V</div>
        <div className="min-w-0">
          <h1 className="text-sm font-medium tracking-tight leading-tight">Vega</h1>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            one assistant · every page
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
        <AssistantSurface
          suggestions={SUGGESTIONS}
          emptyTitle="Vega — one assistant, everywhere"
          emptyDescription="Architecture, security, cost, compliance. The same conversation follows you across the whole workspace."
        />
      </div>
    </div>
  );
}
