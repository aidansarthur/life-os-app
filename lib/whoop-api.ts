import { saveWhoopTokens, getWhoopTokens, type WhoopTokenRecord } from "@/lib/whoop-token-store";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export class WhoopApiError extends Error {
  constructor(readonly status: number, readonly code: "not_connected" | "unauthorized" | "whoop_request_failed") {
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
    throw new WhoopApiError(401, "unauthorized");
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
    throw new WhoopApiError(401, "unauthorized");
  }

  const refreshed = (await response.json()) as WhoopTokenResponse;

  if (!refreshed.access_token || !refreshed.expires_in || !refreshed.token_type) {
    throw new WhoopApiError(401, "unauthorized");
  }

  const nextTokens: WhoopTokenRecord = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
    expiresIn: refreshed.expires_in,
    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    tokenType: refreshed.token_type,
    savedAt: new Date().toISOString()
  };

  await saveWhoopTokens(ownerId, nextTokens);
  return nextTokens;
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
  const tokens = await getWhoopTokens(ownerId);
  if (!tokens?.accessToken) {
    throw new WhoopApiError(401, "not_connected");
  }

  try {
    return await requestJson<T>(path, tokens, options);
  } catch (error) {
    if (!(error instanceof WhoopApiError) || error.status !== 401) {
      throw error;
    }

    const refreshedTokens = await refreshWhoopTokens(ownerId, tokens);
    return requestJson<T>(path, refreshedTokens, options);
  }
}
