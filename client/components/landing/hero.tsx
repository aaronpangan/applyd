import { GoogleSignInButton } from "@/components/landing/google-sign-in-button";

export function Hero() {
  return (
    <section className="flex flex-col items-center px-8 pb-24 pt-28 text-center sm:pt-32">
      <span className="reveal mb-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Job application tracker
      </span>

      <h1
        className="reveal reveal-2 mb-6 font-medium leading-[1.02] tracking-[-0.04em]"
        style={{ fontSize: "clamp(40px, 6vw, 68px)", maxWidth: "16ch" }}
      >
        Your job search,{" "}
        <span className="block text-muted-foreground">finally organized.</span>
      </h1>

      <p className="reveal reveal-3 mb-9 max-w-[520px] text-base leading-relaxed tracking-[-0.005em] text-muted-foreground">
        Track every application, set interview reminders, and see your job hunt
        at a glance — all in one place.
      </p>

      <div className="reveal reveal-4 flex flex-col items-center gap-3.5">
        <GoogleSignInButton />
        <p className="text-[11px] text-muted-foreground">
          No password needed
          <span className="mx-1.5 opacity-40">·</span>
          Free to use
        </p>
      </div>
    </section>
  );
}
