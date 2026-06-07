import { supabase } from "../lib/supabase";

export type PlanNotification = {
  id: string;
  userId: string;
  planId: string | null;
  catalogBarId: string | null;
  dmThreadId: string | null;
  kind: "pinned_bar_plan" | "group_join" | "group_message" | "dm_message" | string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  plan?: {
    locationName: string;
    startsAt: string;
    status: "upcoming" | "ongoing" | "ended";
  } | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  catalog_bar_id: string | null;
  dm_thread_id: string | null;
  kind: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  plan: { location_name: string; starts_at: string; status: "upcoming" | "ongoing" | "ended" } | Array<{ location_name: string; starts_at: string; status: "upcoming" | "ongoing" | "ended" }> | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function rowToNotification(row: NotificationRow): PlanNotification {
  const plan = firstRelation(row.plan);
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    catalogBarId: row.catalog_bar_id,
    dmThreadId: row.dm_thread_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    plan: plan
      ? {
          locationName: plan.location_name,
          startsAt: plan.starts_at,
          status: plan.status
        }
      : null
  };
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("plan_notifications")
    .select("id,user_id,plan_id,catalog_bar_id,dm_thread_id,kind,title,body,read_at,created_at,plan:plans(location_name,starts_at,status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map((row) => rowToNotification(row as unknown as NotificationRow));
}

export async function notifyPlanAttendees(
  planId: string,
  senderId: string,
  kind: "group_join" | "group_message",
  title: string,
  body: string
) {
  const { error } = await supabase.rpc("notify_plan_attendees", {
    target_plan_id: planId,
    sender_user_id: senderId,
    notification_kind: kind,
    notification_title: title,
    notification_body: body
  });

  if (error) throw error;
}

export async function notifyDmRecipient(threadId: string, senderId: string, title: string, body: string) {
  const { error } = await supabase.rpc("notify_dm_recipient", {
    target_thread_id: threadId,
    sender_user_id: senderId,
    notification_title: title,
    notification_body: body
  });

  if (error) throw error;
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from("plan_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw error;
}
