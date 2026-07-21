import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LayoutGrid, PlusCircle, LogOut, Settings, Play, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 shrink-0 border-r border-border/60 glass-subtle flex flex-col">
        <Link to="/" className="flex items-center gap-2.5 px-5 h-14 border-b border-border/60">
          <div className="grid h-7 w-7 place-items-center rounded-lg neumorph-sm text-[11px] font-mono font-bold">Æ</div>
          <div className="min-w-0">
            <div className="font-medium tracking-tight text-sm leading-tight">AetherOS</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">workspace</div>
          </div>
        </Link>

        <nav className="flex-1 p-3 space-y-4 text-sm">
          <NavSection label="Workspace">
            <NavLink to="/dashboard" icon={LayoutGrid} label="Projects" />
            <NavLink to="/new"       icon={PlusCircle} label="New project" />
          </NavSection>

          <NavSection label="Explore">
            <DemoLink />
          </NavSection>

          <NavSection label="Account">
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </NavSection>
        </nav>

        <div className="p-3 border-t border-border/60">
          <div className="neumorph-sm rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full grid place-items-center bg-foreground text-background text-[10px] font-semibold">
                {email.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate flex-1" title={email}>{email || "signed in"}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground h-7 px-2 text-xs">
              <LogOut className="h-3 w-3 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: typeof LayoutGrid; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "neumorph-sm text-foreground" }}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition text-[13px]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function DemoLink() {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: "demo" }}
      activeProps={{ className: "neumorph-sm text-foreground" }}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition text-[13px]"
    >
      <Play className="h-3.5 w-3.5" />
      Demo workspace
      <Sparkles className="h-3 w-3 ml-auto text-muted-foreground/60" />
    </Link>
  );
}
