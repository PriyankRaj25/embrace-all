import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finops")({
  component: FinOpsPage,
});

const TREND = [
  { m: "Jan", spend: 8400,  forecast: 8900 },
  { m: "Feb", spend: 9100,  forecast: 9400 },
  { m: "Mar", spend: 9700,  forecast: 9800 },
  { m: "Apr", spend: 10250, forecast: 10500 },
  { m: "May", spend: 11020, forecast: 11300 },
  { m: "Jun", spend: 10480, forecast: 11800 },
  { m: "Jul", spend: 11220, forecast: 12100 },
];

const BREAKDOWN = [
  { cat: "Compute",     usd: 4820 },
  { cat: "Data",        usd: 2140 },
  { cat: "Network",     usd: 1210 },
  { cat: "Storage",     usd: 980 },
  { cat: "Observability", usd: 640 },
  { cat: "AI / GPU",    usd: 1430 },
];

const BY_PROJECT = [
  { name: "HealthCloud SaaS",   value: 4800 },
  { name: "FinTech Ledger",     value: 3100 },
  { name: "Streaming Analytics",value: 1980 },
  { name: "Retail Order Engine",value: 940 },
  { name: "IoT Fleet Manager",  value: 400 },
];

const LEVERS = [
  { title: "Right-size ECS tasks in HealthCloud",   save: 620, effort: "low" },
  { title: "Reserved instances (1yr) for FinTech",  save: 1180, effort: "low" },
  { title: "S3 lifecycle → Glacier IR for backups", save: 340, effort: "medium" },
  { title: "Switch NAT gateway to VPC endpoints",   save: 420, effort: "medium" },
  { title: "Aurora Serverless min ACU tuning",      save: 260, effort: "low" },
];

const COLORS = ["oklch(0.72 0.19 285)", "oklch(0.78 0.15 210)", "oklch(0.68 0.15 320)", "oklch(0.7 0.12 180)", "oklch(0.75 0.13 90)"];

export default function FinOpsPage() {
  const totalThisMonth = 11220;
  const forecast = 12100;
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-aether">FinOps</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cost intelligence across every blueprint</h1>
        <p className="mt-2 text-muted-foreground">Aggregated projections from the FinOps agent, with recommended optimizations.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Wallet}       label="This month"       value={`$${totalThisMonth.toLocaleString()}`} sub="+7.1% vs last" trend="up" />
        <Stat icon={TrendingUp}   label="Forecast (EoM)"   value={`$${forecast.toLocaleString()}`} sub="within budget" />
        <Stat icon={DollarSign}   label="Potential savings" value="$2,820" sub="5 recommendations" tone="aether" />
        <Stat icon={TrendingDown} label="Waste avoided"    value="$1,180" sub="last 30d" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Spend & forecast</h2>
            <Badge variant="outline" className="text-[10px]">7 months</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="spend"    stroke="oklch(0.72 0.19 285)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="forecast" stroke="oklch(0.78 0.15 210)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold mb-4">By project</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={BY_PROJECT} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {BY_PROJECT.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold mb-4">Category breakdown</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={BREAKDOWN}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="cat" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="usd" fill="oklch(0.72 0.19 285)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold mb-4">Optimization levers</h2>
          <div className="space-y-2">
            {LEVERS.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md hover:bg-sidebar-accent/40 transition">
                <div className="rounded-md bg-success/15 text-success p-1.5">
                  <TrendingDown className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.title}</div>
                  <div className="text-xs text-muted-foreground">Effort: {l.effort}</div>
                </div>
                <div className="text-sm font-mono text-success">-${l.save}/mo</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, tone, trend }: {
  icon: typeof DollarSign; label: string; value: string; sub?: string; tone?: "aether" | "success"; trend?: "up" | "down";
}) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${tone === "aether" ? "bg-aether/15 text-aether" : tone === "success" ? "bg-success/15 text-success" : "bg-secondary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
          {sub && <div className={`text-[11px] ${trend === "up" ? "text-warning" : "text-muted-foreground"}`}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}
