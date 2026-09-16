import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AVATARS, ensureProfile, type Profile } from "@/lib/campfire";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Campfire" },
      {
        name: "description",
        content: "Your Campfire profile — nights by the fire, friends, and the stories you've told.",
      },
      { property: "og:title", content: "Your profile — Campfire" },
      { property: "og:description", content: "Your Campfire profile." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useSession();
  const me = session!.user.id;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["my-profile", me],
    queryFn: async () => {
      const profile = await ensureProfile(session!.user);
      await queryClient.invalidateQueries({ queryKey: ["my-stats", me] });
      return profile;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["my-stats", me],
    queryFn: async () => {
      const [friendsRes, messagesRes, seatsRes] = await Promise.all([
        supabase.from("friendships").select("id", { count: "exact" }).or(`user_id.eq.${me},friend_id.eq.${me}`),
        supabase.from("messages").select("id", { count: "exact" }).eq("user_id", me),
        supabase
          .from("seats")
          .select("room:rooms(name, id, created_at)")
          .eq("occupant_id", me),
      ]);
      const rooms = (seatsRes.data ?? []) as unknown as { room: { name: string; id: string; created_at: string } }[];
      const joined = profileQuery.data?.created_at
        ? Math.max(1, Math.ceil((Date.now() - new Date(profileQuery.data.created_at).getTime()) / 86400000))
        : 1;
      return {
        friends: friendsRes.count ?? 0,
        messages: messagesRes.count ?? 0,
        fires: rooms.length,
        joined,
        recentRooms: rooms.slice(0, 5),
      };
    },
  });

  const profile = profileQuery.data;

  if (profileQuery.isLoading || !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-bark2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-bark2/70">
            Your place here
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-bark md:text-5xl">
            {profile.display_name}
          </h1>
          <p className="mt-1.5 text-[15px] text-bark2">@{profile.username}</p>
        </div>
        <AvatarPicker me={me} profile={profile} />
      </div>

      {/* Big numeral stats */}
      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { value: statsQuery.data?.joined ?? 1, label: "nights since you joined" },
          { value: statsQuery.data?.fires ?? 0, label: "fires you've sat at" },
          { value: statsQuery.data?.friends ?? 0, label: "friends in your circle" },
          { value: statsQuery.data?.messages ?? 0, label: "words sent to the fire" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/70 bg-white/50 p-5 shadow-glass backdrop-blur"
          >
            <div className="font-display text-5xl font-light text-ember md:text-6xl">
              {stat.value}
            </div>
            <p className="mt-2 text-[12px] font-semibold leading-snug text-bark2">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* Edit details */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-glass backdrop-blur">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-bark">
            <Pencil className="size-4 text-ember-deep" />
            Your card
          </h2>
          <EditForm me={me} profile={profile} />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-glass backdrop-blur">
          <h2 className="font-display text-xl font-semibold text-bark">Fires you've sat at</h2>
          <ul className="mt-4 divide-y divide-bark/10">
            {(statsQuery.data?.recentRooms ?? []).map((r) => (
              <li key={r.room.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold text-bark">{r.room.name}</span>
                <span className="text-[12px] text-bark2/80">
                  {new Date(r.room.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
            {(statsQuery.data?.recentRooms.length ?? 0) === 0 && (
              <li className="py-3 text-sm text-bark2/80">
                No fires yet — the clearing is waiting for you.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function AvatarPicker({ me, profile }: { me: string; profile: Profile }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  async function pick(url: string) {
    setSaving(url);
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", me);
    await queryClient.invalidateQueries({ queryKey: ["my-profile", me] });
    setSaving(null);
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={profile.avatar_url ?? "/avatars/a1.jpg"}
        alt="Your avatar"
        className="size-20 rounded-full object-cover ring-4 ring-white shadow-glass"
      />
      <div className="flex gap-1.5">
        {AVATARS.map((url) => (
          <button
            key={url}
            onClick={() => pick(url)}
            title="Choose this portrait"
            className="relative size-9 overflow-hidden rounded-full ring-2 ring-white transition-transform hover:scale-110"
          >
            <img src={url} alt="Portrait option" className="h-full w-full object-cover" />
            {saving === url && (
              <span className="absolute inset-0 grid place-items-center bg-black/40">
                <Loader2 className="size-3 animate-spin text-white" />
              </span>
            )}
            {profile.avatar_url === url && saving !== url && (
              <span className="absolute inset-0 grid place-items-center bg-ember/80">
                <Check className="size-3 text-bark" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditForm({ me, profile }: { me: string; profile: Profile }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || profile.display_name, username: username.trim() || profile.username, bio: bio.trim() || null })
      .eq("id", me);
    setBusy(false);
    if (error) {
      setError(error.message.includes("duplicate") ? "That username is taken." : "Couldn't save.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["my-profile", me] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-bark">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-2xl border border-bark/15 bg-white/80 px-4 py-3 text-[15px] outline-none focus:border-ember"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-bark">Username</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-bark/15 bg-white/80 px-4 py-3 text-[15px] outline-none focus:border-ember"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-bark">
          What you talk about by the fire
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Slow conversations, long stories, good silences."
          className="w-full resize-none rounded-2xl border border-bark/15 bg-white/80 px-4 py-3 text-[15px] outline-none placeholder:text-bark2/50 focus:border-ember"
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-bark px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-bark2 disabled:opacity-60"
        >
          Save
        </button>
        {saved && <span className="text-sm font-semibold text-moss">Saved</span>}
      </div>
    </form>
  );
}
