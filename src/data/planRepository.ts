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
  visibility: "public" | "friends";
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
  visibility: "public" | "friends" | null;
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
  visibility: "public" | "friends";
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
    visibility: row.visibility ?? "public",
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
      visibility,
      catalog_bar:catalog_bars(name),
      starter:profiles!plans_started_by_fkey(username),
      plan_attendees(user_id,left_at,profile:profiles!plan_attendees_user_id_fkey(username))
    `)
    .gte("ends_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .neq("status", "ended")
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? [])
    .map((row) => rowToPlan(row as unknown as PlanRow, currentUserId))
    .filter((plan) => plan.attendeeProfiles.length > 0);
}

export async function createPlan(input: CreatePlanInput) {
  const { data: planId, error } = await supabase.rpc("create_plan_with_join", {
    target_catalog_bar_id: input.catalogBarId,
    starter_user_id: input.userId,
    target_location_name: input.locationName,
    target_location_detail: input.locationDetail,
    target_starts_at: input.startsAt.toISOString(),
    target_ends_at: input.endsAt.toISOString(),
    target_cap: input.cap,
    target_note: input.note,
    target_visibility: input.visibility
  });

  if (error) throw new Error(`Create plan RPC failed: ${error.message}`);
  if (!planId) throw new Error("Create plan RPC failed: no plan id returned.");

  await notifyInterestedUsers(planId);
  return planId as string;
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

  if (error) throw new Error(error.message);
}

export async function leavePlan(planId: string, userId: string) {
  const { data, error } = await supabase.rpc("leave_plan_and_maybe_end", {
    target_plan_id: planId,
    leaving_user_id: userId
  });

  if (error) throw error;
  return Boolean(data);
}

export async function cancelPlan(planId: string, userId: string) {
  const { error } = await supabase.rpc("cancel_plan_if_empty", {
    target_plan_id: planId,
    organizer_user_id: userId
  });

  if (error) throw new Error(`Cancel plan failed: ${error.message}`);
}
