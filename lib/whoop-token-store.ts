export type WhoopTokenRecord = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: string;
  tokenType: string;
  savedAt: string;
};

const tokenStore = new Map<string, WhoopTokenRecord>();
const TEMPORARY_SINGLE_USER_ID = "temporary-version-1-user";

export function saveWhoopTokens(tokens: WhoopTokenRecord) {
  // TODO: Replace this process-memory placeholder with encrypted Supabase storage
  // keyed to the authenticated user before using this app with real users.
  // Serverless deployments may clear this Map between invocations.
  tokenStore.set(TEMPORARY_SINGLE_USER_ID, tokens);
}

export function getWhoopTokens() {
  // TODO: Read from encrypted persistent storage once Supabase auth is connected.
  return tokenStore.get(TEMPORARY_SINGLE_USER_ID) ?? null;
}
