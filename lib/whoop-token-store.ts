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

function saveMemoryFallback(ownerId: string, tokens: WhoopTokenRecord) {
  tokenStore.set(ownerId, tokens);
}

export function isSupabaseTokenStoreConfigured() {
  return Boolean(getSupabaseAdminClient());
}

export async function saveWhoopTokens(ownerId: string, tokens: WhoopTokenRecord) {
  saveMemoryFallback(ownerId, tokens);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { persisted: false, reason: "supabase_not_configured" as const };
  }

  const { error } = await supabase.from("whoop_tokens").upsert({
    owner_id: ownerId,
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

export async function getWhoopTokens(ownerId: string) {
  const memoryTokens = tokenStore.get(ownerId) ?? null;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return memoryTokens;
  }

  const { data, error } = await supabase
    .from("whoop_tokens")
    .select("access_token, refresh_token, expires_at, token_type, updated_at")
    .eq("owner_id", ownerId)
    .maybeSingle<WhoopTokenRow>();

  if (error || !data) {
    return null;
  }

  const tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresIn: Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)),
    expiresAt: data.expires_at,
    tokenType: data.token_type,
    savedAt: data.updated_at
  } satisfies WhoopTokenRecord;

  saveMemoryFallback(ownerId, tokens);
  return tokens;
}
