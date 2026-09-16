import { Link, createFileRoute } from "@tanstack/react-router";
import { Flame, Search, UserPlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { friendIds, type Profile } from "@/lib/campfire";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends — Campfire" },
      {
        name: "description",
        content: "Find friends around the fire and add new ones to your circle.",
      },
      { property: "og:title", content: "Friends — Campfire" },
      { property: "og:description", content: "Find friends around the fire." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { session } = useSession();
  const me = session!.user.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const dataQuery = useQuery({
    queryKey: ["friends-page", me],
    queryFn: async () => {
      const ids = await friendIds(me);
      const [{ data: allProfiles }, { data: seats }] = await Promise.all([
        supabase.from("profiles").select("*").neq("id", me).order("display_name"),
        supabase.from("seats").select("occupant_id, room_id, room:rooms(name, id)").not("occupant_id", "is", null),
      ]);
      const fireByUser: Record<string, { name: string; id: string }> = {};
      for (const s of (seats ?? []) as {
        occupant_id: string;
        room: { name: string; id: string } | null;
      }[]) {
        if (s.room) fireByUser[s.occupant_id] = s.room;
      }
      const profiles = (allProfiles ?? []) as Profile[];
      return {
        friends: profiles.filter((p) => ids.includes(p.id)),
        discover: profiles.filter((p) => !ids.includes(p.id)),
        fireByUser,
      };
    },
    refetchInterval: 20000,
  });

  async function addFriend(friendId: string) {
    setAdded((prev) => ({ ...prev, [friendId]: true }));
    await supabase.from("friendships").insert({ user_id: me, friend_id: friendId });
    await queryClient.invalidateQueries({ queryKey: ["friends-page", me] });
    await queryClient.invalidateQueries({ queryKey: ["friends-by-fire", me] });
  }

  const q = search.trim().toLowerCase();
  const match = (p: Profile) =>
    !q ||
    p.display_name.toLowerCase().includes(q) ||
    p.username.toLowerCase().includes(q);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-bark2/70">
        Your circle
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-bark md:text-5xl">
        Friends <em className="font-light italic text-ember">by the fire</em>
      </h1>

      <label className="mt-8 flex max-w-md items-center gap-3 rounded-full border border-bark/15 bg-white/60 px-4 py-3 backdrop-blur">
        <Search className="size-4 text-bark2/70" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search friends and people"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-bark2/50"
        />
      </label>

      {/* Friends */}
      <section className="mt-10">
        <div className="flex items-baseline gap-4 border-b border-bark/15 pb-5">
          <span className="font-display text-sm font-semibold text-bark2/70">01</span>
          <h2 className="font-display text-2xl font-semibold text-bark">Your friends</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataQuery.data?.friends.filter(match).map((f) => {
            const fire = dataQuery.data.fireByUser[f.id];
            return (
              <div
                key={f.id}
                className="rounded-3xl border border-white/70 bg-white/50 p-5 shadow-glass backdrop-blur"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={f.avatar_url ?? "/avatars/a1.jpg"}
                      alt={f.display_name}
                      className="size-14 rounded-full object-cover ring-2 ring-white"
                    />
                    {fire && (
                      <span className="softpulse absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-ember ring-2 ring-white">
                        <Flame className="size-3 text-bark" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-bark">
                      {f.display_name}
                    </p>
                    <p className="truncate text-[13px] text-bark2">@{f.username}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {fire ? (
                    <Link
                      to="/campfire/$roomId"
                      params={{ roomId: fire.id }}
                      className="text-[13px] font-bold text-ember-deep hover:underline"
                    >
                      at {fire.name} →
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[13px] text-bark2/80">
                      <span className="size-1.5 rounded-full bg-moss" /> off the trail
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {dataQuery.data?.friends.length === 0 && (
            <p className="col-span-full text-sm text-bark2/80">
              No friends yet — add people from the circle below.
            </p>
          )}
        </div>
      </section>

      {/* Discover */}
      <section className="mt-14">
        <div className="flex items-baseline gap-4 border-b border-bark/15 pb-5">
          <span className="font-display text-sm font-semibold text-bark2/70">02</span>
          <h2 className="font-display text-2xl font-semibold text-bark">People around the fire</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataQuery.data?.discover.filter(match).map((p) => {
            const fire = dataQuery.data.fireByUser[p.id];
            const isAdded = added[p.id];
            return (
              <div
                key={p.id}
                className="flex items-center gap-3.5 rounded-3xl border border-white/70 bg-white/50 p-4 shadow-glass backdrop-blur"
              >
                <img
                  src={p.avatar_url ?? "/avatars/a1.jpg"}
                  alt={p.display_name}
                  className="size-12 rounded-full object-cover ring-2 ring-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-bark">{p.display_name}</p>
                  <p className="truncate text-[12px] text-bark2">
                    {fire ? `seated at ${fire.name}` : `@${p.username}`}
                  </p>
                </div>
                <button
                  onClick={() => addFriend(p.id)}
                  disabled={isAdded}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bark px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-bark2 disabled:bg-sage disabled:text-bark2"
                >
                  <UserPlus className="size-3.5" />
                  {isAdded ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
