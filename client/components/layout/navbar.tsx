import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Navbar() {
  return (
    <header className="border-b-hair border-border">
      <nav className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-8">
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-foreground"
        >
          Applyd<span className="text-muted-foreground">.</span>
        </Link>
        <div className="flex items-center gap-[18px]">
          <Link
            href="/#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/#about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
