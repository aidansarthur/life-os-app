import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { Activity, BarChart3, BookOpen, CalendarCheck, HeartPulse, PiggyBank, Settings, ShieldCheck, Target, UserRound } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/health", label: "WHOOP", icon: HeartPulse },
  { href: "/habits", label: "Habits", icon: CalendarCheck },
  { href: "/school", label: "School", icon: BookOpen },
  { href: "/finances", label: "Finances", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: Activity },
  { href: "/auth", label: "Auth", icon: UserRound },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-ink/10 bg-white/85 px-4 py-5 backdrop-blur lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-md bg-ink text-sm font-bold text-white">LO</span>
          <span>
            <span className="block text-lg font-bold">Life OS</span>
            <span className="block text-xs text-ink/55">Version 1</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-mint hover:text-ink"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </aside>
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-md bg-ink text-xs text-white">LO</span>
            Life OS
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/settings" aria-label="Settings" className="focus-ring rounded-md p-2 text-ink/70">
              <Settings className="size-5" />
            </Link>
            <LogoutButton compact />
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md bg-mint px-3 py-1.5 text-xs font-semibold text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-4 py-5 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

