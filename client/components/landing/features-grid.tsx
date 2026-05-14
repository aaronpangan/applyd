import {
  IconArchive,
  IconBell,
  IconBriefcase,
  IconChartBar,
  IconDownload,
  IconFilter,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconBriefcase,
    title: "Track every application",
    description:
      "Log jobs with status, priority, salary range, and all the details that matter.",
  },
  {
    icon: IconBell,
    title: "Email reminders",
    description:
      "Set reminders for interviews and follow-ups so nothing slips through the cracks.",
  },
  {
    icon: IconChartBar,
    title: "Dashboard insights",
    description:
      "See your pipeline at a glance — offers, interviews, and monthly progress.",
  },
  {
    icon: IconFilter,
    title: "Powerful filters",
    description:
      "Filter by status, work setup, priority, and date to find exactly what you need.",
  },
  {
    icon: IconArchive,
    title: "Archive view",
    description:
      "Keep your active list clean by archiving old applications without losing history.",
  },
  {
    icon: IconDownload,
    title: "CSV export",
    description:
      "Export all your job data anytime to analyze in Excel or Google Sheets.",
  },
];

// Per-cell border classes for 1-col / 2-col / 3-col breakpoints.
// Each cell has border-right and border-bottom that get stripped at the
// appropriate edge so the outer container provides those sides.
const cellBorderClasses: string[] = features.map((_, i) => {
  const classes: string[] = [];

  // ── 1-col (default) ──────────────────────────────────────────────────────
  classes.push("border-r-0"); // no right border in single column
  classes.push(i === 5 ? "border-b-0" : "border-b-hair"); // last item: no bottom

  // ── 2-col (sm) ───────────────────────────────────────────────────────────
  classes.push(i % 2 === 1 ? "sm:border-r-0" : "sm:border-r-hair");
  classes.push(i >= 4 ? "sm:border-b-0" : "sm:border-b-hair");

  // ── 3-col (lg) ───────────────────────────────────────────────────────────
  classes.push(i % 3 === 2 ? "lg:border-r-0" : "lg:border-r-hair");
  classes.push(i >= 3 ? "lg:border-b-0" : "lg:border-b-hair");

  return classes.join(" ");
});

export function FeaturesGrid() {
  return (
    <section className="pb-24 pt-8" id="features">
      <p className="mb-6 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Everything you need
      </p>
      <div className="reveal reveal-4 grid grid-cols-1 overflow-hidden rounded-lg border-hair border-border sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`flex min-h-[168px] flex-col items-center gap-2.5 bg-card p-7 border-border sm:items-start ${cellBorderClasses[i]}`}
            >
              <span className="flex size-7 items-center justify-center text-foreground">
                <Icon size={18} stroke={1.5} />
              </span>
              <h3 className="text-center text-[13px] font-medium tracking-[-0.005em] sm:text-left">
                {feature.title}
              </h3>
              <p className="max-w-[28ch] text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
