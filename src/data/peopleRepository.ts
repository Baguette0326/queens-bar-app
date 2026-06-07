import { supabase } from "../lib/supabase";
import type { Profile } from "./profileRepository";

export async function searchProfiles(query: string, currentUserId?: string) {
  const term = query.trim();
  let request = supabase
    .from("profiles")
    .select("id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at")
    .order("username", { ascending: true })
    .limit(20);

  if (term) {
    request = request.ilike("username", `%${term}%`);
  }

  if (currentUserId) {
    request = request.neq("id", currentUserId);
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as Profile[];
}
