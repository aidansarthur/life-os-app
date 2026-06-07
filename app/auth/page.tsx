"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Add Supabase credentials to enable magic-link sign in.");
  const [isLoading, setIsLoading] = useState(false);

  async function signIn() {
    if (!email.trim()) return;
    if (!supabase) {
      setMessage("Supabase is not configured yet. Add your URL and anon key in .env.local.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined }
    });
    setIsLoading(false);
    setMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <>
      <SectionHeader eyebrow="Auth" title="Sign in with Supabase" />
      <section className="max-w-xl rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <label className="block text-sm font-semibold text-ink/70">
          Email
          <input
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
          />
        </label>
        <button onClick={signIn} disabled={isLoading} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <LogIn className="size-4" />
          {isLoading ? "Sending" : "Send magic link"}
        </button>
        <p className="mt-4 text-sm leading-6 text-ink/60">{message}</p>
      </section>
    </>
  );
}
