import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ensureProfile } from "@/lib/campfire";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Campfire" },
      {
        name: "description",
        content: "Sign in or create your Campfire account and take a seat by the fire.",
      },
      { property: "og:title", content: "Sign in — Campfire" },
      { property: "og:description", content: "Sign in or create your Campfire account." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useSession();
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!loading && session) {
    return (
      <SignedInRedirect target={redirect && redirect.startsWith("/") ? redirect : "/dashboard"} />
    );
  }

  function destination() {
    return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email — confirm your address and your seat will be ready.");
          return;
        }
        if (data.user) await ensureProfile(data.user);
        router.history.push(destination());
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await ensureProfile(data.user);
        router.history.push(destination());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
  }

  return (
    <div className="luminous-bg flex min-h-screen">
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="/images/hero-forest.jpg"
          alt="A campfire in a night forest"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181f]/80 via-[#14181f]/20 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md">
          <p className="font-display text-3xl font-light italic leading-snug text-white">
            "There's something about a fire that makes it safe to say the real thing."
          </p>
          <p className="mt-4 text-sm font-medium text-white/70">— Mara, seated since dusk</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#ffe6c9] to-ember text-bark shadow-sm">
              <Flame className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-bark">
              Campfire
            </span>
          </div>

          <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight text-bark">
            {mode === "signin" ? "Welcome back to the fire." : "Pull up a new seat."}
          </h1>
          <p className="mt-2 text-[15px] text-bark2">
            {mode === "signin"
              ? "Sign in and rejoin the conversation."
              : "Create an account — it takes less than a minute."}
          </p>

          {/* Mode tabs */}
          <div className="mt-8 grid grid-cols-2 rounded-full border border-bark/15 bg-white/50 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`rounded-full py-2 text-sm font-semibold transition-all ${
                  mode === m ? "bg-bark text-white shadow-sm" : "text-bark2 hover:text-bark"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-bark">
                  What should we call you?
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mara"
                  className="w-full rounded-2xl border border-bark/15 bg-white/70 px-4 py-3 text-[15px] text-bark outline-none transition-colors placeholder:text-bark2/50 focus:border-ember"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-bark">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-bark/15 bg-white/70 px-4 py-3 text-[15px] text-bark outline-none transition-colors placeholder:text-bark2/50 focus:border-ember"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-bark">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-bark/15 bg-white/70 px-4 py-3 text-[15px] text-bark outline-none transition-colors placeholder:text-bark2/50 focus:border-ember"
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-2xl bg-sage/60 px-4 py-3 text-sm font-medium text-bark">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-bark py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-bark2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create my seat"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-bark/15" />
            <span className="text-xs font-semibold uppercase tracking-widest text-bark2/60">or</span>
            <span className="h-px flex-1 bg-bark/15" />
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-bark/15 bg-white px-4 py-3.5 text-[15px] font-semibold text-bark shadow-sm transition-colors hover:bg-white/80"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-[13px] text-bark2/80">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-semibold text-bark underline decoration-ember decoration-2 underline-offset-2"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have a seat?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="font-semibold text-bark underline decoration-ember decoration-2 underline-offset-2"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function SignedInRedirect({ target }: { target: string }) {
  const router = useRouter();
  if (target !== router.state.location.pathname) {
    router.history.push(target);
  }
  return (
    <div className="luminous-bg grid min-h-screen place-items-center">
      <p className="font-display text-lg text-bark2">Taking you to the fire…</p>
    </div>
  );
}
