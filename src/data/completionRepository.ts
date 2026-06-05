import { supabase } from "../lib/supabase";

export async function fetchCompletedBarIds(userId: string) {
  const { data, error } = await supabase
    .from("bar_completions")
    .select("catalog_bar_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.catalog_bar_id as string);
}

export async function selfCompleteBar(userId: string, catalogBarId: string, xpAwarded: number) {
  const { error } = await supabase
    .from("bar_completions")
    .insert({
      user_id: userId,
      catalog_bar_id: catalogBarId,
      confirmed_at: new Date().toISOString(),
      xp_awarded: xpAwarded
    });

  if (error && error.code !== "23505") throw error;
}

export async function removeCompletedBar(userId: string, catalogBarId: string) {
  const { error } = await supabase
    .from("bar_completions")
    .delete()
    .eq("user_id", userId)
    .eq("catalog_bar_id", catalogBarId);

  if (error) throw error;
}
