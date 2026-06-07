import { supabase } from "../lib/supabase";
import type { AvatarId } from "./catalog";

export type RemoteDmThread = {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatar: AvatarId;
  lastMessage: string;
  updatedAt: string;
};

export type RemoteDmMessage = {
  id: string;
  threadId: string;
  senderId: string;
  from: string;
  body: string;
  createdAt: string;
};

type DmMemberRow = {
  user_id: string;
  profile: { username: string; avatar: AvatarId } | Array<{ username: string; avatar: AvatarId }> | null;
};

type DmMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { username: string } | Array<{ username: string }> | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function rowToMessage(row: DmMessageRow): RemoteDmMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    from: firstRelation(row.sender)?.username ?? "User",
    body: row.body,
    createdAt: row.created_at
  };
}

export async function getOrCreateDmThread(otherUserId: string) {
  const { data, error } = await supabase.rpc("get_or_create_dm_thread", { other_user_id: otherUserId });
  if (error) throw error;
  return data as string;
}

export async function fetchDmThreads(currentUserId: string) {
  const { data: memberships, error } = await supabase
    .from("dm_members")
    .select("thread_id")
    .eq("user_id", currentUserId);

  if (error) throw error;

  const threads = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const threadId = membership.thread_id as string;
      const [{ data: members, error: membersError }, { data: latest, error: latestError }] = await Promise.all([
        supabase
          .from("dm_members")
          .select("user_id,profile:profiles!dm_members_user_id_fkey(username,avatar)")
          .eq("thread_id", threadId),
        supabase
          .from("dm_messages")
          .select("body,created_at")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: false })
          .limit(1)
      ]);

      if (membersError) throw membersError;
      if (latestError) throw latestError;

      const otherMember = ((members ?? []) as unknown as DmMemberRow[]).find((member) => member.user_id !== currentUserId);
      const otherProfile = firstRelation(otherMember?.profile);
      const latestMessage = latest?.[0];

      return {
        id: threadId,
        otherUserId: otherMember?.user_id ?? "",
        otherUsername: otherProfile?.username ?? "User",
        otherAvatar: otherProfile?.avatar ?? "star",
        lastMessage: latestMessage?.body ?? "No messages yet.",
        updatedAt: latestMessage?.created_at ?? ""
      } satisfies RemoteDmThread;
    })
  );

  return threads.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function fetchDmMessages(threadId: string) {
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id,thread_id,sender_id,body,created_at,sender:profiles!dm_messages_sender_id_fkey(username)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map((row) => rowToMessage(row as unknown as DmMessageRow));
}

export async function sendDmMessage(threadId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({ thread_id: threadId, sender_id: senderId, body })
    .select("id,thread_id,sender_id,body,created_at,sender:profiles!dm_messages_sender_id_fkey(username)")
    .single();

  if (error) throw error;
  return rowToMessage(data as unknown as DmMessageRow);
}
