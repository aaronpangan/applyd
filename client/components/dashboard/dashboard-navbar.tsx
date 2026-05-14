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
    <header className="border-b-hair border-border">
      <nav className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-8">
        <span className="text-base font-medium tracking-tight text-foreground">
          Applyd<span className="text-muted-foreground">.</span>
        </span>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Initials name={user.name} />
              </div>
              <span className="text-sm text-muted-foreground">{user.name}</span>
            </div>
          )}
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconLogout size={15} stroke={1.75} />
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
