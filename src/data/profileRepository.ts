import { supabase } from "../lib/supabase";
import type { AvatarId } from "./catalog";

export type Profile = {
  id: string;
  username: string;
  avatar: AvatarId;
  role: "frosh" | "frec" | "upper_year" | "other";
  faculty: string;
  program: string | null;
  year_label: string | null;
  default_area: string | null;
  bio: string | null;
  xp: number;
  tier: string;
  accepted_guidelines_at: string | null;
};

export type ProfileInput = {
  id: string;
  username: string;
  avatar: AvatarId;
  roleLabel: string;
  faculty?: string;
  program?: string;
  yearLabel?: string;
  bio?: string;
};

export type ProfileDetailsInput = {
  userId: string;
  avatar: AvatarId;
  bio: string;
};

const profileSelect = "id,username,avatar,role,faculty,program,year_label,default_area,bio,xp,tier,accepted_guidelines_at";
const legacyProfileSelect = "id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at";

function isMissingBioColumn(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error && String(error.message).toLowerCase().includes("bio");
}

function withBio(profile: Omit<Profile, "bio"> & { bio?: string | null }) {
  return { ...profile, bio: profile.bio ?? null } as Profile;
}

export function getRankFromXp(xp: number) {
  if (xp >= 6000) return "Campus Legend";
  if (xp >= 3000) return "Lore Bearer";
  if (xp >= 1000) return "Patch Collector";
  return "Froshling";
}

export function roleLabelToDb(roleLabel: string): Profile["role"] {
  if (roleLabel === "Frec") return "frec";
  if (roleLabel === "Upper Year") return "upper_year";
  if (roleLabel === "Other" || roleLabel === "Alumni") return "other";
  return "frosh";
}

export function roleDbToLabel(role: Profile["role"]) {
  if (role === "frec") return "Frec";
  if (role === "upper_year") return "Upper Year";
  if (role === "other") return "Other";
  return "Frosh";
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle();

  if (!error) return data ? withBio(data as Omit<Profile, "bio"> & { bio?: string | null }) : null;
  if (!isMissingBioColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .select(legacyProfileSelect)
    .eq("id", userId)
    .maybeSingle();

  if (legacyError) throw legacyError;
  return legacyData ? withBio(legacyData as Omit<Profile, "bio">) : null;
}

export async function createProfile(input: ProfileInput) {
  const now = new Date().toISOString();
  const profileInput = {
    id: input.id,
    username: input.username.trim(),
    avatar: input.avatar,
    role: roleLabelToDb(input.roleLabel),
    faculty: input.faculty?.trim() || "Queen's",
    program: input.program?.trim() || null,
    year_label: input.yearLabel?.trim() || null,
    accepted_guidelines_at: now
  };
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      ...profileInput,
      bio: input.bio?.trim() || null,
    })
    .select(profileSelect)
    .single();

  if (!error) return withBio(data as Omit<Profile, "bio"> & { bio?: string | null });
  if (!isMissingBioColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .insert(profileInput)
    .select(legacyProfileSelect)
    .single();

  if (legacyError) throw legacyError;
  return withBio(legacyData as Omit<Profile, "bio">);
}

export async function updateProfileXp(userId: string, xp: number) {
  const tier = getRankFromXp(xp);
  const { data, error } = await supabase
    .from("profiles")
    .update({ xp, tier, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select(profileSelect)
    .single();

  if (!error) return withBio(data as Omit<Profile, "bio"> & { bio?: string | null });
  if (!isMissingBioColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .update({ xp, tier, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select(legacyProfileSelect)
    .single();

  if (legacyError) throw legacyError;
  return withBio(legacyData as Omit<Profile, "bio">);
}

export async function updateProfileDetails(input: ProfileDetailsInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar: input.avatar,
      bio: input.bio.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.userId)
    .select(profileSelect)
    .single();

  if (!error) return withBio(data as Omit<Profile, "bio"> & { bio?: string | null });
  if (!isMissingBioColumn(error)) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .update({
      avatar: input.avatar,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.userId)
    .select(legacyProfileSelect)
    .single();

  if (legacyError) throw legacyError;
  return withBio(legacyData as Omit<Profile, "bio">);
}
