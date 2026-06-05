type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

export function describeSupabaseError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseLikeError;
    const parts = [supabaseError.message, supabaseError.details, supabaseError.hint, supabaseError.code]
      .filter(Boolean);

    if (parts.length > 0) return parts.join(" ");
  }

  return fallback;
}
