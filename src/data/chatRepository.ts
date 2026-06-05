import { supabase } from "../lib/supabase";

export type RemoteChatMessage = {
  id: string;
  planId: string;
  senderId: string;
  from: string;
  body: string;
  createdAt: string;
};

type ChatMessageRow = {
  id: string;
  plan_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { username: string } | Array<{ username: string }> | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function rowToMessage(row: ChatMessageRow): RemoteChatMessage {
  return {
    id: row.id,
    planId: row.plan_id,
    senderId: row.sender_id,
    from: firstRelation(row.sender)?.username ?? "User",
    body: row.body,
    createdAt: row.created_at
  };
}

export async function fetchChatMessages(planId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id,plan_id,sender_id,body,created_at,sender:profiles!chat_messages_sender_id_fkey(username)")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map((row) => rowToMessage(row as unknown as ChatMessageRow));
}

export async function sendChatMessage(planId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ plan_id: planId, sender_id: senderId, body })
    .select("id,plan_id,sender_id,body,created_at,sender:profiles!chat_messages_sender_id_fkey(username)")
    .single();

  if (error) throw error;
  return rowToMessage(data as unknown as ChatMessageRow);
}
