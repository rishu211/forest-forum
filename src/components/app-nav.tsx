import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, House, LogOut, User as UserIcon, Users } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";

const tabs = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/dashboard#fires", label: "Fires", icon: Flame },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/profile", label: "Me", icon: UserIcon },
] as const;

export function AppNav() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  async function handleSignOut() {
    setLeaving(true);
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const avatar = (session?.user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="fireglow grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#ffe6c9] to-ember text-bark shadow-sm">
              <Flame className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-bark">
              Campfire
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-bark2 md:flex">
            <Link
              to="/dashboard"
              activeProps={{ className: "text-bark font-semibold" }}
              className="transition-colors hover:text-bark"
            >
              Dashboard
            </Link>
            <Link
              to="/friends"
              activeProps={{ className: "text-bark font-semibold" }}
              className="transition-colors hover:text-bark"
            >
              Friends
            </Link>
            <Link
              to="/profile"
              activeProps={{ className: "text-bark font-semibold" }}
              className="transition-colors hover:text-bark"
            >
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              disabled={leaving}
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-bark2 transition-colors hover:bg-white/60 hover:text-bark md:inline-flex"
            >
              <LogOut className="size-3.5" />
              {leaving ? "Leaving…" : "Sign out"}
            </button>
            <Link to="/profile" className="block">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Your avatar"
                  className="size-9 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-sage text-sm font-bold text-bark ring-2 ring-white">
                  {(session?.user.email?.[0] ?? "?").toUpperCase()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[22px] border border-white/80 bg-white/55 px-2 py-2 shadow-glass backdrop-blur-xl md:hidden">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-bark2/70 transition-colors data-[status=active]:text-bark"
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
