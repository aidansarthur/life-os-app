import { getWhoopTokens, isSupabaseTokenStoreConfigured, saveWhoopTokens, type WhoopTokenRecord } from "@/lib/whoop-token-store";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const REFRESH_EARLY_SECONDS = 300;

export class WhoopApiError extends Error {
  constructor(readonly status: number, readonly code: "not_connected" | "unauthorized" | "refresh_failed" | "whoop_request_failed") {
    super(code);
  }
}

type WhoopTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

type FetchWhoopOptions = {
  searchParams?: Record<string, string>;
};

const refreshLocks = new Map<string, Promise<WhoopTokenRecord>>();

function authorization(tokens: WhoopTokenRecord) {
  return `${tokens.tokenType} ${tokens.accessToken}`;
}

function whoopUrl(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path.startsWith("http") ? path : `${WHOOP_API_BASE}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function refreshWhoopTokens(ownerId: string, tokens: WhoopTokenRecord) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret || !tokens.refreshToken) {
    throw new WhoopApiError(401, "refresh_failed");
  }

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new WhoopApiError(401, "refresh_failed");
  }

  const refreshed = (await response.json()) as WhoopTokenResponse;

  if (!refreshed.access_token || !refreshed.expires_in || !refreshed.token_type) {
    throw new WhoopApiError(401, "refresh_failed");
  }

  const nextTokens: WhoopTokenRecord = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
    expiresIn: refreshed.expires_in,
    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    tokenType: refreshed.token_type,
    savedAt: new Date().toISOString()
  };

  const saveResult = await saveWhoopTokens(ownerId, nextTokens);
  if (isSupabaseTokenStoreConfigured() && !saveResult.persisted) {
    throw new WhoopApiError(500, "refresh_failed");
  }

  return nextTokens;
}

async function refreshWithLock(ownerId: string, staleTokens: WhoopTokenRecord) {
  const existing = refreshLocks.get(ownerId);
  if (existing) return existing;

  const refreshPromise = (async () => {
    const latest = await getWhoopTokens(ownerId);
    if (latest && latest.accessToken !== staleTokens.accessToken && latest.expiresIn > REFRESH_EARLY_SECONDS) {
      return latest;
    }
    return refreshWhoopTokens(ownerId, latest ?? staleTokens);
  })();

  refreshLocks.set(ownerId, refreshPromise);
  try {
    return await refreshPromise;
  } finally {
    refreshLocks.delete(ownerId);
  }
}

async function getUsableTokens(ownerId: string) {
  const tokens = await getWhoopTokens(ownerId);
  if (!tokens?.accessToken) {
    throw new WhoopApiError(401, "not_connected");
  }

  if (tokens.expiresIn <= REFRESH_EARLY_SECONDS) {
    return refreshWithLock(ownerId, tokens);
  }

  return tokens;
}

async function requestJson<T>(path: string, tokens: WhoopTokenRecord, options?: FetchWhoopOptions) {
  const response = await fetch(whoopUrl(path, options?.searchParams), {
    headers: {
      Authorization: authorization(tokens),
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    throw new WhoopApiError(401, "unauthorized");
  }

  if (!response.ok) {
    throw new WhoopApiError(response.status, "whoop_request_failed");
  }

  return (await response.json()) as T;
}

export async function fetchWhoopJson<T>(ownerId: string, path: string, options?: FetchWhoopOptions) {
  const tokens = await getUsableTokens(ownerId);

  try {
    return await requestJson<T>(path, tokens, options);
  } catch (error) {
    if (!(error instanceof WhoopApiError) || error.status !== 401) {
      throw error;
    }

    const refreshedTokens = await refreshWithLock(ownerId, tokens);
    return requestJson<T>(path, refreshedTokens, options);
  }
}
