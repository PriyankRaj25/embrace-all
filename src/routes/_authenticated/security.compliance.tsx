import { createFileRoute } from "@tanstack/react-router";
import { compliance } from "@/lib/security-demo";
import { FileCheck2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/security/compliance")({
  component: ComplianceCenter,
});

function ComplianceCenter() {
  const [generated, setGenerated] = useState<string | null>(null);
  const [selected, setSelected] = useState(compliance.frameworks[0].name);
  const f = compliance.frameworks.find((x) => x.name === selected)!;

  function generateReport() {
    setGenerated(null);
    setTimeout(() => setGenerated(`${f.name} audit package · ${f.evidence} evidence artifacts collected · ${f.passed} passing controls · ${f.failed} exceptions documented`), 900);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Security Agent</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Compliance Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Continuous audit readiness across major frameworks.</p>
        </div>
        <Button size="sm" onClick={generateReport}><Download className="h-3.5 w-3.5 mr-1.5" /> Generate Audit Report</Button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {compliance.frameworks.map((fw) => (
          <button
            key={fw.name}
            onClick={() => setSelected(fw.name)}
            className={`text-left rounded-xl p-4 transition ${selected === fw.name ? "neumorph-sm" : "neumorph-inset hover:neumorph-sm"}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{fw.name}</div>
              <FileCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className="text-2xl font-semibold">{fw.score}%</div>
              <div className="text-[10px] font-mono text-muted-foreground pb-1">score</div>
            </div>
            <div className="mt-2 h-1.5 rounded-full neumorph-inset overflow-hidden">
              <div className="h-full bg-foreground" style={{ width: `${fw.score}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground">
              <div><span className="text-foreground">{fw.passed}</span> pass</div>
              <div><span className="text-foreground">{fw.failed}</span> fail</div>
              <div><span className="text-foreground">{fw.evidence}</span> evid.</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">{f.name} · Detail</div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Passed" value={f.passed} />
            <Stat label="Failed" value={f.failed} />
            <Stat label="Evidence" value={f.evidence} />
            <Stat label="Audit readiness" value={`${f.score}%`} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            <div className="text-sm font-medium">AI recommendations · Top gaps</div>
          </div>
          <ul className="space-y-2">
            {compliance.topGaps.map((g) => (
              <li key={g} className="text-[12px] p-3 rounded-lg neumorph-inset flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground mt-1.5 shrink-0" /> {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {generated && (
        <div className="glass-heavy rounded-2xl p-5 fade-up">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Report ready</div>
          <p className="mt-2 text-sm">{generated}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF</Button>
            <Button size="sm" variant="outline">Share with auditor</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="neumorph-inset rounded-lg p-3">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
