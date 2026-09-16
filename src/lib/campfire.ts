import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
};

export type Room = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  image_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type Seat = {
  id: string;
  room_id: string;
  seat_number: number;
  occupant_id: string | null;
  speaking: boolean;
  occupant: Profile | null;
};

export type Message = {
  id: string;
  room_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  user: Profile | null;
};

export const AVATARS = [
  "/avatars/a1.jpg",
  "/avatars/a2.jpg",
  "/avatars/a3.jpg",
  "/avatars/a4.jpg",
  "/avatars/a5.jpg",
  "/avatars/a6.jpg",
];

/** Position seat i of n evenly around an ellipse centered on the fire. */
export function seatPosition(i: number, n: number) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + 38 * Math.cos(angle),
    y: 54 + 33 * Math.sin(angle),
  };
}

/** Create a profile for a brand-new signed-in user if one doesn't exist yet. */
export async function ensureProfile(user: { id: string; email?: string | null }) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (data) return data as Profile;

  const email = user.email ?? "";
  const base = (email.split("@")[0] ?? "guest").replace(/[^a-z0-9_]/gi, "").toLowerCase() || "guest";
  const username = `${base}${Math.floor(Math.random() * 900 + 100)}`;
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: base.charAt(0).toUpperCase() + base.slice(1),
    })
    .select("*")
    .single();
  if (error) throw error;
  return created as Profile;
}

/** Claim the lowest free seat in a room, freeing seats held in other rooms. */
export async function takeSeat(roomId: string, userId: string) {
  await supabase
    .from("seats")
    .update({ occupant_id: null, speaking: false })
    .eq("occupant_id", userId)
    .neq("room_id", roomId);

  const { data: mine } = await supabase
    .from("seats")
    .select("id")
    .eq("room_id", roomId)
    .eq("occupant_id", userId)
    .maybeSingle();
  if (mine) return;

  const { data: seat } = await supabase
    .from("seats")
    .select("id")
    .eq("room_id", roomId)
    .is("occupant_id", null)
    .order("seat_number")
    .limit(1)
    .maybeSingle();
  if (!seat) throw new Error("Every seat at this fire is taken.");

  const { error } = await supabase.from("seats").update({ occupant_id: userId }).eq("id", seat.id);
  if (error) throw error;
}

export async function leaveSeat(roomId: string, userId: string) {
  await supabase
    .from("seats")
    .update({ occupant_id: null, speaking: false })
    .eq("room_id", roomId)
    .eq("occupant_id", userId);
}

export async function setSpeaking(seatId: string, speaking: boolean) {
  await supabase.from("seats").update({ speaking }).eq("id", seatId);
}

/** Ids of the profiles this user is friends with. */
export async function friendIds(me: string): Promise<string[]> {
  const { data: rels } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${me},friend_id.eq.${me}`);
  if (!rels) return [];
  return rels.map((r) => (r.user_id === me ? r.friend_id : r.user_id));
}

export async function createRoom(userId: string, name: string, description: string) {
  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      name,
      description,
      capacity: 8,
      image_url: "/images/campfire-room.jpg",
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;

  const seats = Array.from({ length: room.capacity }, (_, seat_number) => ({
    room_id: room.id,
    seat_number,
    occupant_id: seat_number === 0 ? userId : null,
    speaking: seat_number === 0,
  }));
  await supabase.from("seats").insert(seats);
  return room as Room;
}
