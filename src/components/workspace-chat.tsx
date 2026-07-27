import { Sparkles } from "lucide-react";
import { AssistantSurface } from "@/components/global-assistant";

const SUGGESTIONS = [
  "Explain the security architecture",
  "How can we reduce monthly cost by 20%?",
  "What are the compliance gaps?",
  "Suggest a DR strategy for eu-west-1",
];

export function WorkspaceChat({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Ask AetherOS · project {projectId.slice(0, 8)}
        </div>
      </div>
      <AssistantSurface
        suggestions={SUGGESTIONS}
        emptyTitle={`Ask about ${projectName}`}
        emptyDescription="Same assistant as everywhere else — your conversation follows you across the app."
      />
    </div>
  );
}
