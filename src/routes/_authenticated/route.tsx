import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LayoutGrid, PlusCircle, LogOut } from "lucide-react";
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
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-xl flex flex-col">
        <Link to="/" className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-foreground text-background text-[11px] font-mono font-bold">Æ</div>
          <span className="font-medium tracking-tight text-sm">AetherOS</span>
        </Link>
        <nav className="flex-1 p-2 space-y-0.5 text-sm">
          <NavLink to="/dashboard" icon={LayoutGrid} label="Projects" />
          <NavLink to="/new"       icon={PlusCircle} label="New project" />
        </nav>
        <div className="p-2 border-t border-border text-xs">
          <div className="px-3 py-2 text-muted-foreground truncate" title={email}>{email}</div>
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

function NavLink({ to, icon: Icon, label }: { to: string; icon: typeof LayoutGrid; label: string }) {
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
