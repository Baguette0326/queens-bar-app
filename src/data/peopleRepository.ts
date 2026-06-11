import { supabase } from "../lib/supabase";
import type { Profile } from "./profileRepository";

const profileSelect = "id,username,avatar,role,faculty,program,year_label,default_area,bio,xp,tier,username_changed_at,accepted_guidelines_at";
const legacyProfileSelect = "id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at";

function isMissingBioColumn(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error && String(error.message).toLowerCase().includes("bio");
}

function isMissingUsernameChangedColumn(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error && String(error.message).toLowerCase().includes("username_changed_at");
}

function withProfileDefaults(profile: Omit<Profile, "bio" | "username_changed_at"> & { bio?: string | null; username_changed_at?: string | null }) {
  return { ...profile, bio: profile.bio ?? null, username_changed_at: profile.username_changed_at ?? null } as Profile;
}

export async function searchProfiles(query: string, currentUserId?: string) {
  const term = query.trim();
  const buildRequest = (select: string) => {
    let request = supabase
      .from("profiles")
      .select(select)
    .order("username", { ascending: true })
    .limit(20);

    if (term) {
      request = request.ilike("username", `%${term}%`);
    }

    if (currentUserId) {
      request = request.neq("id", currentUserId);
    }

    return request;
  };

  const { data, error } = await buildRequest(profileSelect);
  if (!error) return (data ?? []).map((profile) => withProfileDefaults(profile as unknown as Omit<Profile, "bio" | "username_changed_at"> & { bio?: string | null; username_changed_at?: string | null }));
  if (!isMissingBioColumn(error) && !isMissingUsernameChangedColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await buildRequest(legacyProfileSelect);
  if (legacyError) throw legacyError;
  return (legacyData ?? []).map((profile) => withProfileDefaults(profile as unknown as Omit<Profile, "bio" | "username_changed_at">));
}

export async function fetchLeaderboard(limit = 50) {
  const buildRequest = (select: string) => supabase
    .from("profiles")
    .select(select)
    .order("xp", { ascending: false })
    .order("username", { ascending: true })
    .limit(limit);

  const { data, error } = await buildRequest(profileSelect);
  if (!error) return (data ?? []).map((profile) => withProfileDefaults(profile as unknown as Omit<Profile, "bio" | "username_changed_at"> & { bio?: string | null; username_changed_at?: string | null }));
  if (!isMissingBioColumn(error) && !isMissingUsernameChangedColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await buildRequest(legacyProfileSelect);
  if (legacyError) throw legacyError;
  return (legacyData ?? []).map((profile) => withProfileDefaults(profile as unknown as Omit<Profile, "bio" | "username_changed_at">));
}
