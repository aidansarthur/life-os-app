import Link from "next/link";
import { KeyRound, Link2, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

export default function SettingsPage() {
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
            <p className="leading-7 text-ink/70">
              Connect WHOOP to authorize recovery, sleep, cycle, workout, and profile data for your personal dashboards and reports.
            </p>
            <Link href="/api/whoop/connect" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
              <Link2 className="size-4" />
              Connect WHOOP
            </Link>
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

