import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type WhoopTokenRecord = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: string;
  tokenType: string;
  savedAt: string;
};

type WhoopTokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  token_type: string;
  updated_at: string;
};

const tokenStore = new Map<string, WhoopTokenRecord>();
const TEMPORARY_SINGLE_USER_ID = "temporary-version-1-user";

function saveMemoryFallback(tokens: WhoopTokenRecord) {
  // TODO: Remove this fallback once Supabase auth and durable token storage are required.
  // Serverless deployments may clear this Map between invocations.
  tokenStore.set(TEMPORARY_SINGLE_USER_ID, tokens);
}

export async function saveWhoopTokens(tokens: WhoopTokenRecord) {
  saveMemoryFallback(tokens);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { persisted: false, reason: "supabase_not_configured" as const };
  }

  const { error } = await supabase.from("whoop_tokens").upsert({
    owner_id: TEMPORARY_SINGLE_USER_ID,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? null,
    expires_at: tokens.expiresAt,
    token_type: tokens.tokenType
  }, { onConflict: "owner_id" });

  if (error) {
    return { persisted: false, reason: "supabase_error" as const };
  }

  return { persisted: true as const };
}

export async function getWhoopTokens() {
  const memoryTokens = tokenStore.get(TEMPORARY_SINGLE_USER_ID) ?? null;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return memoryTokens;
  }

  const { data, error } = await supabase
    .from("whoop_tokens")
    .select("access_token, refresh_token, expires_at, token_type, updated_at")
    .eq("owner_id", TEMPORARY_SINGLE_USER_ID)
    .maybeSingle<WhoopTokenRow>();

  if (error || !data) {
    return memoryTokens;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresIn: Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)),
    expiresAt: data.expires_at,
    tokenType: data.token_type,
    savedAt: data.updated_at
  } satisfies WhoopTokenRecord;
}
