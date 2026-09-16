import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flame, Loader2, LogOut, Mic, MicOff, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  leaveSeat,
  seatPosition,
  setSpeaking,
  takeSeat,
  type Message,
  type Room,
  type Seat,
} from "@/lib/campfire";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/campfire/$roomId")({
  head: () => ({
    meta: [
      { title: "Around the fire — Campfire" },
      {
        name: "description",
        content: "Sit around a live campfire with friends — talk, listen, and stay warm.",
      },
      { property: "og:title", content: "Around the fire — Campfire" },
      { property: "og:description", content: "Sit around a live campfire with friends." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CampfireRoom,
});

function CampfireRoom() {
  const { roomId } = Route.useParams();
  const { session } = useSession();
  const me = session!.user.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();
      if (error) throw error;
      return data as Room | null;
    },
  });

  const seatsQuery = useQuery({
    queryKey: ["seats", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seats")
        .select("*, occupant:profiles(id, username, display_name, bio, avatar_url)")
        .eq("room_id", roomId)
        .order("seat_number");
      if (error) throw error;
      return data as Seat[];
    },
    refetchInterval: 15000,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, user:profiles(id, username, display_name, bio, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as Message[];
    },
  });

  // Realtime: keep seats and messages live.
  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", roomId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats", filter: `room_id=eq.${roomId}` },
        () => queryClient.invalidateQueries({ queryKey: ["seats", roomId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  const room = roomQuery.data;
  const seats = seatsQuery.data ?? [];
  const mySeat = seats.find((s) => s.occupant_id === me);
  const seatedCount = seats.filter((s) => s.occupant_id).length;
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleTakeSeat() {
    setActionError(null);
    try {
      await takeSeat(roomId, me);
      await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
ality    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't take that seat.");
    }
  }

  async function handleLeave() {
    await leaveSeat(roomId, me);
    await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
    navigate({ to: "/dashboard" });
  }

  if (roomQuery.isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-bark2" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-bark">This fire has gone out</h1>
        <p className="mt-2 text-sm text-bark2">The room you're looking for doesn't exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-full bg-bark px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to the clearing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/50 text-bark transition-colors hover:bg-white/80"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-bark">
              {room.name}
            </h1>
            <p className="text-[13px] text-bark2">
              {seatedCount} seated of {room.capacity}
              {room.description ? ` — ${room.description}` : ""}
            </p>
          </div>
        </div>
        {mySeat && (
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-2 rounded-full border border-bark/15 bg-white/60 px-4 py-2.5 text-[13px] font-semibold text-bark transition-colors hover:bg-white"
          >
            <LogOut className="size-3.5" />
            Leave the fire
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* The fire stage */}
        <section className="overflow-hidden rounded-3xl border border-white/70 shadow-glass">
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
            <img
              src={room.image_url ?? "/images/campfire-room.jpg"}
              alt={`The ${room.name} campfire`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Warm glow pulse over the flames */}
            <div
              className="fireglow pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(38% 30% at 50% 58%, rgba(255,166,77,0.4), transparent 70%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14181f]/40 via-transparent to-[#14181f]/25" />

            {/* Drifting embers */}
            {[18, 42, 64, 82].map((left, i) => (
              <span
                key={left}
                className="emberdrift pointer-events-none absolute rounded-full bg-[#ffce9a]"
                style={{
                  left: `${left}%`,
                  top: "62%",
                  width: 3 + (i % 2),
                  height: 3 + (i % 2),
                  animationDelay: `${i * 1.1}s`,
                  animationDuration: `${3.6 + i * 0.7}s`,
                }}
              />
            ))}

            {/* Seats around the fire */}
            {seats.map((seat, i) => {
              const pos = seatPosition(seat.seat_number, Math.max(seats.length, 1));
              const occupied = Boolean(seat.occupant);
              return (
                <div
                  key={seat.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {occupied ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <img
                          src={seat.occupant!.avatar_url ?? "/avatars/a1.jpg"}
                          alt={seat.occupant!.display_name}
                          className={`size-11 rounded-full object-cover shadow-lg sm:size-14 ${
                            seat.occupant_id === me
                              ? "ring-[3px] ring-ember"
                              : "ring-2 ring-white/85"
                          }`}
                        />
                        {seat.speaking && (
                          <span className="softpulse absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-ember ring-2 ring-white">
                            <Mic className="size-2.5 text-bark" />
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm sm:text-[11px]">
                        {seat.occupant_id === me ? "You" : seat.occupant!.display_name}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleTakeSeat}
                      title="Take this seat"
                      className="group grid size-11 place-items-center rounded-full border-2 border-dashed border-white/60 bg-white/10 backdrop-blur-sm transition-all hover:scale-110 hover:border-ember hover:bg-white/25 sm:size-14"
                    >
                      <Flame className="size-4 text-white/70 transition-colors group-hover:text-ember" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Talk controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 bg-white/55 px-4 py-3 backdrop-blur-xl">
            <p className="text-[12px] font-medium text-bark2">
              {mySeat
                ? mySeat.speaking
                  ? "You're talking — the fire is listening."
                  : "You're seated and listening."
                : actionError ?? "Grab an open seat to join the conversation."}
            </p>
            {mySeat && (
              <button
                onClick={async () => {
                  await setSpeaking(mySeat.id, !mySeat.speaking);
                  await queryClient.invalidateQueries({ queryKey: ["seats", roomId] });
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
                  mySeat.speaking
                    ? "bg-ember text-bark shadow-ember"
                    : "bg-bark text-white hover:bg-bark2"
                }`}
              >
                {mySeat.speaking ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
                {mySeat.speaking ? "Talking" : "Talk"}
              </button>
            )}
          </div>
        </section>

        {/* Firelight chat */}
        <ChatPanel
          roomId={roomId}
          me={me}
          messages={messagesQuery.data ?? []}
          loading={messagesQuery.isLoading}
        />
      </div>
    </div>
  );
}

function ChatPanel({
  roomId,
  me,
  messages,
  loading,
}: {
  roomId: string;
  me: string;
  messages: Message[];
  loading: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    await supabase.from("messages").insert({ room_id: roomId, user_id: me, content });
    setSending(false);
  }

  return (
    <aside className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-glass backdrop-blur-xl lg:h-auto lg:max-h-[720px]">
      <div className="border-b border-white/60 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-bark">Firelight chat</h2>
        <p className="text-[12px] text-bark2">Whispers carry here. Be kind.</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {loading && <p className="text-sm text-bark2/70">Warming up the conversation…</p>}
        {messages.map((m) => {
          const mine = m.user_id === me;
          return (
            <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <img
                src={m.user?.avatar_url ?? "/avatars/a1.jpg"}
                alt={m.user?.display_name ?? "Guest"}
                className="size-8 shrink-0 rounded-full object-cover ring-2 ring-white"
              />
              <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                <p className="text-[11px] font-bold text-bark2">
                  {mine ? "You" : (m.user?.display_name ?? "A passerby")}
                </p>
                <p
                  className={`mt-1 inline-block rounded-2xl px-3.5 py-2.5 text-left text-[14px] leading-relaxed ${
                    mine
                      ? "rounded-br-sm bg-bark text-white"
                      : "rounded-bl-sm bg-white/85 text-bark"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-white/60 p-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something warm…"
            className="min-w-0 flex-1 rounded-full border border-bark/15 bg-white/80 px-4 py-2.5 text-[14px] outline-none placeholder:text-bark2/50 focus:border-ember"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ember text-bark transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
