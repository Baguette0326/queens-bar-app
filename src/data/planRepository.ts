import { supabase } from "../lib/supabase";

export type RemotePlan = {
  id: string;
  challengeId: string;
  challengeName: string;
  place: string;
  detail: string;
  startsAt: string;
  startsAtIso: string;
  endsAt: string;
  status: "ongoing" | "upcoming";
  attendees: string[];
  attendeeProfiles: Array<{ id: string; username: string }>;
  cap?: number;
  note: string;
  startedBy: string;
  startedById: string;
  currentUserJoined: boolean;
};

type PlanRow = {
  id: string;
  catalog_bar_id: string;
  started_by: string;
  location_name: string;
  location_detail: string | null;
  starts_at: string;
  ends_at: string;
  cap: number | null;
  note: string | null;
  status: "upcoming" | "ongoing" | "ended";
  catalog_bar: { name: string } | Array<{ name: string }> | null;
  starter: { username: string } | Array<{ username: string }> | null;
  plan_attendees: Array<{ user_id: string; left_at: string | null; profile: { username: string } | Array<{ username: string }> | null }>;
};

export type CreatePlanInput = {
  catalogBarId: string;
  userId: string;
  locationName: string;
  locationDetail: string;
  startsAt: Date;
  endsAt: Date;
  cap: number | null;
  note: string;
};

function formatPlanTime(startsAt: string, status: RemotePlan["status"]) {
  const start = new Date(startsAt);
  const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (status === "ongoing") return `Started · ${time}`;
  return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function rowToPlan(row: PlanRow, currentUserId?: string): RemotePlan {
  const activeAttendees = row.plan_attendees.filter((attendee) => !attendee.left_at);
  const catalogBar = firstRelation(row.catalog_bar);
  const starter = firstRelation(row.starter);
  const computedStatus: RemotePlan["status"] =
    row.status === "ongoing" || new Date(row.starts_at) <= new Date() ? "ongoing" : "upcoming";

  return {
    id: row.id,
    challengeId: row.catalog_bar_id,
    challengeName: catalogBar?.name ?? "Unknown Bar",
    place: row.location_name,
    detail: row.location_detail ?? "",
    startsAt: formatPlanTime(row.starts_at, computedStatus),
    startsAtIso: row.starts_at,
    endsAt: row.ends_at,
    status: computedStatus,
    attendees: activeAttendees.map((attendee) => firstRelation(attendee.profile)?.username ?? "User"),
    attendeeProfiles: activeAttendees.map((attendee) => ({
      id: attendee.user_id,
      username: firstRelation(attendee.profile)?.username ?? "User"
    })),
    cap: row.cap ?? undefined,
    note: row.note ?? "",
    startedBy: starter?.username ?? "Unknown",
    startedById: row.started_by,
    currentUserJoined: activeAttendees.some((attendee) => attendee.user_id === currentUserId)
  };
}

export async function fetchPlans(currentUserId?: string) {
  const { data, error } = await supabase
    .from("plans")
    .select(`
      id,
      catalog_bar_id,
      started_by,
      location_name,
      location_detail,
      starts_at,
      ends_at,
      cap,
      note,
      status,
      catalog_bar:catalog_bars(name),
      starter:profiles!plans_started_by_fkey(username),
      plan_attendees(user_id,left_at,profile:profiles!plan_attendees_user_id_fkey(username))
    `)
    .gte("ends_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .neq("status", "ended")
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToPlan(row as unknown as PlanRow, currentUserId));
}

export async function createPlan(input: CreatePlanInput) {
  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      catalog_bar_id: input.catalogBarId,
      started_by: input.userId,
      location_name: input.locationName,
      location_detail: input.locationDetail,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      cap: input.cap,
      note: input.note,
      status: input.startsAt <= new Date() ? "ongoing" : "upcoming"
    })
    .select("id")
    .single();

  if (error) throw error;

  await joinPlan(plan.id, input.userId);
  await notifyInterestedUsers(plan.id);
  return plan.id as string;
}

async function notifyInterestedUsers(planId: string) {
  const { error } = await supabase.rpc("notify_interested_users_for_plan", { target_plan_id: planId });
  if (error) {
    console.warn("Failed to enqueue interest notifications.", error);
  }
}

export async function joinPlan(planId: string, userId: string) {
  const { error } = await supabase
    .from("plan_attendees")
    .upsert({ plan_id: planId, user_id: userId, left_at: null }, { onConflict: "plan_id,user_id" });

  if (error) throw error;
}

export async function cancelPlan(planId: string, userId: string) {
  const { error } = await supabase
    .from("plans")
    .update({ status: "ended", updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("started_by", userId)
    .select("id")
    .single();

  if (error) throw error;
}
