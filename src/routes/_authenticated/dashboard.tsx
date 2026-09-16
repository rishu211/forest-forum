import { Link, createFileRoute } from "@tanstack/react-router";
import { Flame, Plus, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createRoom, friendIds, type Profile, type Room, type Seat } from "@/lib/campfire";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Campfire" },
      {
        name: "description",
        content: "Fires burning right now, friends by the fire, and your open seat.",
      },
      { property: "og:title", content: "Dashboard — Campfire" },
      { property: "og:description", content: "Fires burning right now and friends around them." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useSession();
  const me = session!.user.id;
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ["rooms-with-seats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "*, seats(id, seat_number, occupant_id, speaking, occupant:profiles(id, username, display_name, bio, avatar_url))",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as (Room & { seats: Seat[] })[];
    },
  });

  const friendsQuery = useQuery({
    queryKey: ["friends-by-fire", me],
    queryFn: async () => {
      const ids = await friendIds(me);
      if (ids.length === 0) return { friends: [] as Profile[], fires: {} as Record<string, string> };
      const [{ data: friends }, { data: seats }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", ids),
        supabase
          .from("seats")
          .select("occupant_id, room_id, room:rooms(name)")
          .in("occupant_id", ids),
      ]);
      const fires: Record<string, string> = {};
      for (const s of (seats ?? []) as { occupant_id: string; room: { name: string } | null }[]) {
        if (s.room) fires[s.occupant_id] = s.room.name;
      }
      return { friends: (friends ?? []) as Profile[], fires };
    },
    refetchInterval: 20000,
  });

  async function handleCreate(name: string, description: string) {
    const room = await createRoom(me, name, description);
    await queryClient.invalidateQueries({ queryKey: ["rooms-with-seats"] });
    window.location.assign(`/campfire/${room.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-bark2/70">
            Tonight in the clearing
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-bark md:text-5xl">
            Fires burning <em className="font-light italic text-ember">right now</em>
          </h1>
        </div>
        <StartFireButton onCreate={handleCreate} />
      </div>

      {/* Fires grid */}
      <section id="fires" className="mt-10 scroll-mt-24">
        {roomsQuery.isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-white/40" />
            ))}
          </div>
        )}
        {roomsQuery.data && (
          <div className="grid gap-6 md:grid-cols-3">
            {roomsQuery.data.map((room) => {
              const seated = room.seats.filter((s) => s.occupant_id).length;
              const mySeat = room.seats.find((s) => s.occupant_id === me);
              return (
                <article
                  key={room.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/50 shadow-glass backdrop-blur-xl"
                >
                  <Link to="/campfire/$roomId" params={{ roomId: room.id }} className="block">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={room.image_url ?? "/images/campfire-room.jpg"}
                        alt={`The ${room.name} campfire`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                        <span className="softpulse size-1.5 rounded-full bg-ember" />
                        {seated} seated of {room.capacity}
                      </span>
                      {mySeat && (
                        <span className="absolute top-3 right-3 rounded-full bg-ember px-2.5 py-1 text-[11px] font-bold text-bark">
                          Your seat is warm
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="font-display text-lg font-semibold text-bark">{room.name}</h2>
                      <p className="mt-1.5 line-clamp-2 min-h-10 text-[13px] leading-relaxed text-bark2">
                        {room.description}
                      </p>
                      {/* Seated faces */}
                      <div className="mt-4 flex items-center">
                        {room.seats
                          .filter((s) => s.occupant)
                          .slice(0, 5)
                          .map((s) => (
                            <img
                              key={s.id}
                              src={s.occupant!.avatar_url ?? "/images/campfire-room.jpg"}
                              alt={s.occupant!.display_name}
                              title={s.occupant!.display_name}
                              className="-ml-1.5 size-7 rounded-full object-cover ring-2 ring-white first:ml-0"
                            />
                          ))}
                        {seated > 5 && (
                          <span className="-ml-1.5 grid size-7 place-items-center rounded-full bg-bark text-[10px] font-bold text-white ring-2 ring-white">
                            +{seated - 5}
                          </span>
                        )}
                        {seated === 0 && (
                          <span className="text-[12px] font-medium text-bark2/70">
                            No one yet — be first
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Friends by the fire */}
      <section className="mt-16">
        <div className="flex items-baseline gap-4 border-b border-bark/15 pb-5">
          <span className="font-display text-sm font-semibold text-bark2/70">02</span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-bark">
            Friends by the fire
          </h2>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {friendsQuery.data?.friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/50 p-3.5 shadow-glass backdrop-blur"
            >
              <img
                src={f.avatar_url ?? "/avatars/a1.jpg"}
                alt={f.display_name}
                className="size-11 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-bark">{f.display_name}</p>
                <p className="flex items-center gap-1.5 truncate text-[12px] text-bark2">
                  {friendsQuery.data?.fires[f.id] ? (
                    <>
                      <Flame className="size-3 text-ember-deep" />
                      at {friendsQuery.data.fires[f.id]}
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-moss" /> off the trail
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {friendsQuery.data?.friends.length === 0 && (
            <Link
              to="/friends"
              className="flex items-center gap-3 rounded-2xl border border-dashed border-bark/25 bg-white/30 p-3.5 text-sm font-semibold text-bark2 transition-colors hover:bg-white/50"
            >
              <Users className="size-4" />
              Add friends to see when they're seated
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function StartFireButton({ onCreate }: { onCreate: (name: string, description: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onCreate(name.trim(), description.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't light the fire.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ember px-5 py-3 text-sm font-bold text-bark shadow-ember transition-transform hover:scale-[1.02]"
      >
        <Plus className="size-4" />
        Start a fire
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#14181f]/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="glass-strong w-full max-w-md rounded-3xl p-6"
          >
            <h3 className="font-display text-2xl font-semibold text-bark">Light a new fire</h3>
            <p className="mt-1 text-[13px] text-bark2">
              Name it, set the mood, and eight seats will ring the flame.
            </p>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-[13px] font-bold text-bark">Fire name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Late Train Thoughts"
                className="w-full rounded-2xl border border-bark/15 bg-white/80 px-4 py-3 text-[15px] outline-none placeholder:text-bark2/50 focus:border-ember"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-bold text-bark">The mood</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Unhurried conversation about the week that was."
                className="w-full resize-none rounded-2xl border border-bark/15 bg-white/80 px-4 py-3 text-[15px] outline-none placeholder:text-bark2/50 focus:border-ember"
              />
            </label>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-bark2 hover:text-bark"
              >
                Not tonight
              </button>
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="rounded-full bg-bark px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-bark2 disabled:opacity-50"
              >
                Light it
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
