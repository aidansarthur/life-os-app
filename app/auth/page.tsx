"use client";

import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("Sign in to open your Life OS dashboard.");
  const [isLoading, setIsLoading] = useState(false);

  async function submitAuth() {
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setIsLoading(true);
    setMessage(mode === "login" ? "Signing in..." : "Creating account...");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const body = (await response.json()) as { ok?: boolean; pendingConfirmation?: boolean; error?: string };
    setIsLoading(false);

    if (!response.ok || !body.ok) {
      setMessage(mode === "login" ? "Login failed. Check your email and password." : "Signup failed. Try another email or password.");
      return;
    }

    if (body.pendingConfirmation) {
      setMessage("Account created. Check your email to confirm your account, then log in.");
      setMode("login");
      return;
    }

    window.location.href = "/";
  }

  return (
    <>
      <SectionHeader eyebrow="Auth" title="Sign in to Life OS" />
      <section className="max-w-xl rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-[#f7f8f4] p-1">
          <button onClick={() => setMode("login")} className={`focus-ring rounded-md px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}>
            Login
          </button>
          <button onClick={() => setMode("signup")} className={`focus-ring rounded-md px-3 py-2 text-sm font-bold ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}>
            Sign up
          </button>
        </div>

        <div className="space-y-4">
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
          <label className="block text-sm font-semibold text-ink/70">
            Password
            <input
              className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              type="password"
            />
          </label>
        </div>

        <button onClick={submitAuth} disabled={isLoading} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
          {isLoading ? "Working..." : mode === "login" ? "Login" : "Create account"}
        </button>
        <p className="mt-4 text-sm leading-6 text-ink/60">{message}</p>
      </section>
    </>
  );
}
