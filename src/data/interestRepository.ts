import { supabase } from "../lib/supabase";
import { describeSupabaseError } from "./supabaseError";

function interestError(error: unknown) {
  const message = describeSupabaseError(error, "Could not update interest.");

  if (message.includes("bar_interests") && message.includes("does not exist")) {
    return new Error("The bar_interests table is missing. Run supabase/add_bar_interests_notifications.sql in Supabase SQL Editor.");
  }

  if (message.includes("row-level security") || message.includes("violates row-level security")) {
    return new Error("Supabase blocked the pin with RLS. Re-run supabase/add_bar_interests_notifications.sql and make sure pin_policy_ready is true.");
  }

  if (message.includes("foreign key constraint")) {
    return new Error("This bar is not in your Supabase catalog yet, so it cannot be pinned. Re-run the catalog seed or check that the app loaded the remote catalog.");
  }

  return new Error(message);
}

export async function fetchPinnedBarIds(userId: string) {
  const { data, error } = await supabase
    .from("bar_interests")
    .select("catalog_bar_id")
    .eq("user_id", userId);

  if (error) throw interestError(error);
  return (data ?? []).map((row) => row.catalog_bar_id as string);
}

export async function pinBar(userId: string, catalogBarId: string) {
  const { error } = await supabase
    .from("bar_interests")
    .insert({ user_id: userId, catalog_bar_id: catalogBarId, notify_on_plan: true });

  if (error && error.code !== "23505") throw interestError(error);
}

export async function unpinBar(userId: string, catalogBarId: string) {
  const { error } = await supabase
    .from("bar_interests")
    .delete()
    .eq("user_id", userId)
    .eq("catalog_bar_id", catalogBarId);

  if (error) throw interestError(error);
}
