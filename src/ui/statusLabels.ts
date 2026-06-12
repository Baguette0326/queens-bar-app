export type DataStatus = "local" | "loading" | "remote" | "error";

export function dataStatusLabel(status: DataStatus) {
  if (status === "remote") return "Supabase";
  if (status === "loading") return "Loading";
  if (status === "error") return "Local fallback";
  return "Local";
}
