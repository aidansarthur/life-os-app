import Link from "next/link";
import { CheckCircle2, KeyRound, Link2, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { getWhoopTokens } from "@/lib/whoop-token-store";

type SettingsPageProps = {
  searchParams?: Promise<{ whoop?: string }>;
};

const whoopMessages: Record<string, string> = {
  error: "WHOOP returned an authorization error. Please try connecting again.",
  invalid_state: "The WHOOP connection could not be verified. Please try again.",
  missing_client_id: "WHOOP client ID is missing from the server environment.",
  missing_code: "WHOOP did not return an authorization code. Please try again.",
  missing_credentials: "WHOOP client credentials are missing from the server environment.",
  token_error: "WHOOP authorization succeeded, but the token exchange failed. Please try again."
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const whoopStatus = params?.whoop;
  const storedTokens = await getWhoopTokens();
  const isWhoopConnected = whoopStatus === "connected" || Boolean(storedTokens);
  const whoopMessage = whoopStatus ? whoopMessages[whoopStatus] : null;

  return (
    <>
      <SectionHeader eyebrow="Settings" title="Connections and app setup" />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <Link2 className="size-5 text-moss" />
            <h2 className="text-lg font-bold">WHOOP integration</h2>
          </div>
          <div className="space-y-4">
            {isWhoopConnected ? (
              <div className="flex items-center gap-3 rounded-md bg-mint p-4 text-sm font-bold text-moss">
                <CheckCircle2 className="size-5 shrink-0" />
                WHOOP connected
              </div>
            ) : (
              <p className="leading-7 text-ink/70">
                Connect WHOOP to authorize recovery, sleep, cycle, workout, and profile data for your personal dashboards and reports.
              </p>
            )}

            {whoopMessage ? <p className="rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">{whoopMessage}</p> : null}

            {!isWhoopConnected ? (
              <Link href="/api/whoop/connect" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
                <Link2 className="size-4" />
                Connect WHOOP
              </Link>
            ) : null}
          </div>
        </section>
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="size-5 text-moss" />
            <h2 className="text-lg font-bold">Supabase status</h2>
          </div>
          <p className="leading-7 text-ink/70">
            Auth and database hooks are scaffolded. Add your Supabase URL and anonymous key to local environment variables, then connect the pages to real tables.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-md bg-mint p-3 text-sm font-semibold text-moss">
            <KeyRound className="size-4" />
            Uses mock data until credentials are connected.
          </div>
        </section>
      </div>
    </>
  );
}

