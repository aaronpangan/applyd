"use client";

import { useRouter } from "next/navigation";

import { IconLogout } from "@tabler/icons-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import type { User } from "./types";

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return <>{letters.toUpperCase()}</>;
}

export function DashboardNavbar({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm shadow-sm dark:shadow-none">
      <nav className="mx-auto flex h-15 w-full max-w-300 items-center justify-between px-8">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Applyd<span className="text-indigo-500 dark:text-indigo-400">.</span>
        </span>

        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-[11px] font-semibold text-white shadow-sm">
                <Initials name={user.name} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{user.name}</span>
            </div>
          )}
          <div className="mx-1 h-4 w-px bg-border/80" />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconLogout size={15} stroke={1.75} />
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
