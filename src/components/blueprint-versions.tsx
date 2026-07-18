import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Save, Download, Trash2, GitCompare } from "lucide-react";
import { listSnapshots, saveSnapshot, deleteSnapshot, type BlueprintSnapshot } from "@/lib/local-store";
import { supabase } from "@/integrations/supabase/client";

export function BlueprintVersions({
  projectId, projectName, currentData,
}: {
  projectId: string;
  projectName: string;
  currentData: { project: unknown; artifacts: Record<string, unknown> };
}) {
  const [versions, setVersions] = useState<BlueprintSnapshot[]>([]);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("you");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setVersions(listSnapshots(projectId));
    supabase.auth.getUser().then(({ data }) => data.user?.email && setEmail(data.user.email));
  }, [projectId]);

  function snap() {
    const l = label.trim() || `v${versions.length + 1}`;
    saveSnapshot(projectId, { label: l, note: note.trim() || undefined, author: email, data: currentData });
    setVersions(listSnapshots(projectId));
    setLabel(""); setNote("");
  }

  function download(v: BlueprintSnapshot) {
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${v.label}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function remove(id: string) {
    deleteSnapshot(projectId, id);
    setVersions(listSnapshots(projectId));
    setCompareIds((c) => c.filter((x) => x !== id));
  }

  function toggleCompare(id: string) {
    setCompareIds((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2));
  }

  const [a, b] = compareIds.map((id) => versions.find((v) => v.id === id)!).filter(Boolean);
  const diff = a && b ? computeDiff(a, b) : null;

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-aether" />
        <h2 className="text-lg font-semibold">Version History</h2>
        <Badge variant="outline" className="ml-2">{versions.length}</Badge>
      </div>

      <div className="grid grid-cols-[1fr_2fr_auto] gap-2 mb-4">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. v1.2)" className="text-xs" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" className="text-xs" />
        <Button size="sm" onClick={snap}><Save className="h-3.5 w-3.5 mr-1.5" />Snapshot</Button>
      </div>

      {versions.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No snapshots yet. Save the current blueprint to start tracking versions.</div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => {
            const active = compareIds.includes(v.id);
            return (
              <div key={v.id} className={`rounded-md border p-3 flex items-center gap-3 transition ${active ? "border-aether/60 bg-aether/5" : "border-border/60"}`}>
                <button onClick={() => toggleCompare(v.id)} className="shrink-0" title="Toggle compare">
                  <GitCompare className={`h-4 w-4 ${active ? "text-aether" : "text-muted-foreground"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-aether">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(v.at).toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground">· {v.author}</span>
                  </div>
                  {v.note && <div className="text-xs text-muted-foreground mt-0.5 truncate">{v.note}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => download(v)} title="Download JSON">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(v.id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {diff && (
        <div className="mt-5 rounded-md border border-aether/40 p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-aether mb-2">
            Diff · {a.label} → {b.label}
          </div>
          {diff.length === 0 ? (
            <div className="text-xs text-muted-foreground">No changes detected.</div>
          ) : (
            <ul className="text-xs space-y-1 font-mono">
              {diff.map((d, i) => (
                <li key={i} className={
                  d.type === "added" ? "text-success" :
                  d.type === "removed" ? "text-destructive" :
                  "text-warning"
                }>
                  {d.type === "added" ? "+ " : d.type === "removed" ? "− " : "~ "}{d.path}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

type DiffEntry = { type: "added" | "removed" | "changed"; path: string };
function computeDiff(a: BlueprintSnapshot, b: BlueprintSnapshot): DiffEntry[] {
  const keys = new Set([...Object.keys(a.data.artifacts), ...Object.keys(b.data.artifacts)]);
  const out: DiffEntry[] = [];
  keys.forEach((k) => {
    const av = a.data.artifacts[k];
    const bv = b.data.artifacts[k];
    if (av && !bv) out.push({ type: "removed", path: k });
    else if (!av && bv) out.push({ type: "added", path: k });
    else if (JSON.stringify(av) !== JSON.stringify(bv)) out.push({ type: "changed", path: k });
  });
  return out;
}
