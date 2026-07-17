import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, LogOut, Bot, Gavel, DollarSign, ShieldCheck, Plug, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border/40 bg-sidebar/60 backdrop-blur-xl flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 py-5 border-b border-border/40">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-aether to-aether-glow">
            <span className="font-mono font-bold text-primary-foreground text-sm">Æ</span>
          </div>
          <span className="font-semibold tracking-tight">AetherOS</span>
        </Link>
        <nav className="flex-1 p-3 space-y-0.5 text-sm overflow-y-auto">
          <NavLink to="/dashboard"    icon={LayoutDashboard} label="Projects" />
          <NavLink to="/new"          icon={PlusCircle}      label="New Project" />
          <div className="pt-4 pb-1 px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Platform</div>
          <NavLink to="/agents"       icon={Bot}             label="Agents" />
          <NavLink to="/governance"   icon={Gavel}           label="Governance" />
          <NavLink to="/compliance"   icon={ShieldCheck}     label="Compliance" />
          <NavLink to="/finops"       icon={DollarSign}      label="FinOps" />
          <NavLink to="/integrations" icon={Plug}            label="Integrations" />
          <div className="pt-4 pb-1 px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Account</div>
          <NavLink to="/settings"     icon={SettingsIcon}    label="Settings" />
        </nav>
        <div className="p-3 border-t border-border/40 text-xs">
          <div className="px-2 py-2 text-muted-foreground truncate" title={email}>{email}</div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
