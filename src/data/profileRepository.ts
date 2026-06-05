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
  xp: number;
  tier: string;
  accepted_guidelines_at: string | null;
};

export type ProfileInput = {
  id: string;
  username: string;
  avatar: AvatarId;
  roleLabel: string;
  faculty: string;
  program: string;
  yearLabel: string;
};

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
    .select("id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function createProfile(input: ProfileInput) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.id,
      username: input.username.trim(),
      avatar: input.avatar,
      role: roleLabelToDb(input.roleLabel),
      faculty: input.faculty.trim() || "Engineering",
      program: input.program.trim() || null,
      year_label: input.yearLabel.trim() || null,
      accepted_guidelines_at: now
    })
    .select("id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfileXp(userId: string, xp: number) {
  const tier = xp >= 3000 ? "Gold" : xp >= 1500 ? "Silver" : xp >= 500 ? "Bronze" : "Iron";
  const { data, error } = await supabase
    .from("profiles")
    .update({ xp, tier, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id,username,avatar,role,faculty,program,year_label,default_area,xp,tier,accepted_guidelines_at")
    .single();

  if (error) throw error;
  return data as Profile;
}
