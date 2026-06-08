"use client";

import { LogOut } from "lucide-react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  }

  return (
    <button
      onClick={logout}
      className={compact
        ? "focus-ring rounded-md p-2 text-ink/70 hover:bg-mint hover:text-ink"
        : "focus-ring mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-mint hover:text-ink"}
      aria-label="Logout"
    >
      <LogOut className="size-4" />
      {compact ? null : "Logout"}
    </button>
  );
}
