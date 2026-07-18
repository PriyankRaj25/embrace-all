import { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment, listComments, type Comment } from "@/lib/local-store";
import { supabase } from "@/integrations/supabase/client";

export function ArtifactComments({ projectId, kind }: { projectId: string; kind: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("you");

  useEffect(() => {
    setComments(listComments(projectId, kind));
    supabase.auth.getUser().then(({ data }) => data.user?.email && setEmail(data.user.email));
  }, [projectId, kind]);

  function submit() {
    const text = body.trim();
    if (!text) return;
    addComment(projectId, { author: email, kind, body: text });
    setBody("");
    setComments(listComments(projectId, kind));
  }

  function remove(id: string) {
    deleteComment(projectId, id);
    setComments(listComments(projectId, kind));
  }

  return (
    <div className="mt-6 border-t border-border/40 pt-4">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
        <MessageSquare className="h-3 w-3" /> Comments · {comments.length}
      </div>
      <div className="space-y-2 mb-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-md border border-border/50 p-2.5 group">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono text-aether">{c.author}</div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-muted-foreground">{new Date(c.at).toLocaleString()}</div>
                <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="text-xs whitespace-pre-wrap">{c.body}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No comments yet — start a review thread.</div>
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave feedback on this artifact…"
          rows={2}
          className="text-xs resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <Button size="sm" onClick={submit} disabled={!body.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
