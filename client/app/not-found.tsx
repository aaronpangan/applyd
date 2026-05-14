import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "404 — Applyd",
  description: "This page doesn't exist.",
};

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-8 py-16">
        <section className="reveal flex w-full max-w-[440px] flex-col items-center text-center">
          <span className="mb-7 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Error 404
          </span>

          <div
            aria-hidden
            className="mb-6 font-medium leading-[0.9] tracking-[-0.06em] text-foreground"
            style={{
              fontSize: "clamp(96px, 14vw, 140px)",
              fontFeatureSettings: '"ss01", "tnum"',
            }}
          >
            <span>4</span>
            <span className="text-muted-foreground/55">0</span>
            <span>4</span>
          </div>

          <h1 className="mb-3 text-[22px] font-medium leading-tight tracking-[-0.025em]">
            This page doesn&apos;t exist.
          </h1>
          <p className="mb-8 max-w-[360px] text-sm leading-relaxed text-muted-foreground">
            The link you followed might be broken, or the page may have been
            removed.
          </p>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-10 px-5 text-sm",
            )}
          >
            Go home
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
