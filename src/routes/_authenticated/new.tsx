import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createProject } from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, X } from "lucide-react";

const EXAMPLES = [
  "Build a multi-tenant healthcare SaaS platform for 20 million users with HIPAA compliance on AWS.",
  "Design a real-time fraud detection pipeline processing 100k transactions per second on GCP.",
  "Create a global e-commerce backend with sub-100ms latency and PCI compliance on Azure.",
];

const COMPLIANCE_OPTIONS = ["HIPAA", "SOC2", "GDPR", "PCI-DSS", "ISO 27001", "FedRAMP"];

export const Route = createFileRoute("/_authenticated/new")({
  component: NewProject,
});

function NewProject() {
  const create = useServerFn(createProject);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [requirement, setRequirement] = useState("");
  const [cloud, setCloud] = useState<"aws" | "azure" | "gcp" | "multi">("aws");
  const [compliance, setCompliance] = useState<string[]>([]);
  const [scale, setScale] = useState("");

  const mut = useMutation({
    mutationFn: () => create({ data: { name, requirement, cloud, compliance, scale_hint: scale || null } }),
    onSuccess: ({ id }) => {
      toast.success("Project created — orchestrating agents…");
      navigate({ to: "/projects/$projectId", params: { projectId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create project"),
  });

  function toggle(c: string) {
    setCompliance((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-aether">New Project</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Describe your system.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tell AetherOS what you&apos;re building. The agents will design the rest.</p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!name || !requirement) return; mut.mutate(); }}
        className="glass-panel rounded-2xl p-8 space-y-6"
      >
        <div>
          <Label htmlFor="name">Project name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Healthcare SaaS platform" className="mt-1.5" />
        </div>

        <div>
          <div className="flex items-end justify-between">
            <Label htmlFor="req">Business requirement</Label>
            <span className="text-xs text-muted-foreground font-mono">{requirement.length}/4000</span>
          </div>
          <Textarea id="req" required value={requirement} onChange={(e) => setRequirement(e.target.value)}
            placeholder="Build a multi-tenant SaaS for..." rows={5} className="mt-1.5 font-mono text-sm" maxLength={4000} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setRequirement(ex)}
                className="text-[11px] rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-aether/40 transition"
              >
                <Sparkles className="inline h-3 w-3 mr-1" />
                {ex.slice(0, 60)}…
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cloud provider</Label>
            <Select value={cloud} onValueChange={(v) => setCloud(v as "aws")}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aws">AWS</SelectItem>
                <SelectItem value="azure">Azure</SelectItem>
                <SelectItem value="gcp">GCP</SelectItem>
                <SelectItem value="multi">Multi-cloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="scale">Scale hint (optional)</Label>
            <Input id="scale" value={scale} onChange={(e) => setScale(e.target.value)} placeholder="20M users, 1B events/day" className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label>Compliance requirements</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPLIANCE_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => toggle(c)}>
                <Badge variant={compliance.includes(c) ? "default" : "outline"}
                  className={compliance.includes(c) ? "bg-aether text-primary-foreground hover:bg-aether/90" : "hover:border-aether/40"}
                >
                  {c}
                  {compliance.includes(c) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full glow-aether" disabled={mut.isPending}>
          {mut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Provisioning…</> : "Design my architecture →"}
        </Button>
      </form>
    </div>
  );
}
