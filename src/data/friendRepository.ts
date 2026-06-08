import { supabase } from "../lib/supabase";
import type { Profile } from "./profileRepository";

export type FriendStatus = "none" | "outgoing" | "incoming" | "friends";

export type FriendState = {
  status: FriendStatus;
  requestId: string | null;
};

export type FriendRequest = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  requester: Profile | null;
};

type FriendRequestRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester: Profile | Profile[] | null;
};

type FriendRow = {
  requester_id: string;
  addressee_id: string;
  requester: Profile | Profile[] | null;
  addressee: Profile | Profile[] | null;
};

const profileSelect = "id,username,avatar,role,faculty,program,year_label,default_area,bio,xp,tier,accepted_guidelines_at";

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function rowToRequest(row: FriendRequestRow): FriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    requester: firstRelation(row.requester)
  };
}

export async function fetchFriendState(currentUserId: string, otherUserId: string): Promise<FriendState> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id,requester_id,addressee_id,status")
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  if (!row) return { status: "none", requestId: null };
  if (row.status === "accepted") return { status: "friends", requestId: row.id };
  if (row.status !== "pending") return { status: "none", requestId: null };
  return { status: row.requester_id === currentUserId ? "outgoing" : "incoming", requestId: row.id };
}

export async function fetchFriendStatus(currentUserId: string, otherUserId: string): Promise<FriendStatus> {
  const state = await fetchFriendState(currentUserId, otherUserId);
  return state.status;
}

export async function sendFriendRequest(currentUserId: string, otherUserId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .insert({ requester_id: currentUserId, addressee_id: otherUserId });

  if (error) throw error;
}

export async function acceptFriendRequest(requestId: string, currentUserId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("addressee_id", currentUserId);

  if (error) throw error;
}

export async function declineFriendRequest(requestId: string, currentUserId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("addressee_id", currentUserId);

  if (error) throw error;
}

export async function cancelFriendRequest(requestId: string, currentUserId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("requester_id", currentUserId)
    .eq("status", "pending");

  if (error) throw error;
}

export async function removeFriend(currentUserId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("status", "accepted")
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new Error("No accepted friendship was removed. Re-run supabase/add_friends.sql and try again.");
}

export async function fetchIncomingFriendRequests(currentUserId: string) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select(`id,requester_id,addressee_id,status,created_at,requester:profiles!friend_requests_requester_id_fkey(${profileSelect})`)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToRequest(row as unknown as FriendRequestRow));
}

export async function fetchFriends(currentUserId: string) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select(`requester_id,addressee_id,requester:profiles!friend_requests_requester_id_fkey(${profileSelect}),addressee:profiles!friend_requests_addressee_id_fkey(${profileSelect})`)
    .eq("status", "accepted")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .order("responded_at", { ascending: false });

  if (error) throw error;
  return (data ?? [])
    .map((row) => {
      const friendRow = row as unknown as FriendRow;
      return friendRow.requester_id === currentUserId ? firstRelation(friendRow.addressee) : firstRelation(friendRow.requester);
    })
    .filter((profile): profile is Profile => !!profile);
}
