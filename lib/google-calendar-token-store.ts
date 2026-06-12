import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type GoogleCalendarTokenRecord = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: string;
  tokenType: string;
  scope?: string;
  savedAt: string;
};

type GoogleTokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  token_type: string;
  scope: string | null;
  updated_at: string;
};

const tokenStore = new Map<string, GoogleCalendarTokenRecord>();

export async function saveGoogleCalendarTokens(ownerId: string, tokens: GoogleCalendarTokenRecord) {
  tokenStore.set(ownerId, tokens);
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { persisted: false, reason: "supabase_not_configured" as const };

  const { error } = await supabase.from("google_calendar_tokens").upsert({
    owner_id: ownerId,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? null,
    expires_at: tokens.expiresAt,
    token_type: tokens.tokenType,
    scope: tokens.scope ?? null
  }, { onConflict: "owner_id" });

  if (error) return { persisted: false, reason: "supabase_error" as const };
  return { persisted: true as const };
}

export async function getGoogleCalendarTokens(ownerId: string) {
  const memoryTokens = tokenStore.get(ownerId) ?? null;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memoryTokens;

  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, expires_at, token_type, scope, updated_at")
    .eq("owner_id", ownerId)
    .maybeSingle<GoogleTokenRow>();

  if (error || !data) return memoryTokens;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresIn: Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)),
    expiresAt: data.expires_at,
    tokenType: data.token_type,
    scope: data.scope ?? undefined,
    savedAt: data.updated_at
  } satisfies GoogleCalendarTokenRecord;
}
