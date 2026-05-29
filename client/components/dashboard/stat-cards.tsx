"use client";

import type { DashboardStats, JobStatus } from "./types";

function sumStatuses(
  stats: DashboardStats,
  statuses: JobStatus[],
): number {
  return stats.by_status
    .filter((s) => statuses.includes(s.status))
    .reduce((acc, s) => acc + s.count, 0);
}

interface StatCard {
  label: string;
  sublabel: string;
  value: number;
  filterStatus?: JobStatus;
}

interface StatCardsProps {
  stats: DashboardStats | null;
  activeFilter: string;
  onFilterClick: (status: JobStatus | "") => void;
}

export function StatCards({ stats, activeFilter, onFilterClick }: StatCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    );
  }

  const cards: StatCard[] = [
    {
      label: "Total active",
      sublabel: "all time",
      value: stats.total_active,
    },
    {
      label: "Bookmarked",
      sublabel: "saved to apply",
      value: sumStatuses(stats, ["bookmarked"]),
      filterStatus: "bookmarked",
    },
    {
      label: "Interviews",
      sublabel: "active",
      value: sumStatuses(stats, [
        "phone_screen",
        "tech_interview",
        "final_interview",
      ]),
      filterStatus: "phone_screen",
    },
    {
      label: "Offers",
      sublabel: "all time",
      value: sumStatuses(stats, ["offer", "accepted"]),
      filterStatus: "offer",
    },
  ];

  const accentColors = [
    "border-t-sky-400",
    "border-t-amber-400",
    "border-t-violet-400",
    "border-t-emerald-400",
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const isActive =
          card.filterStatus !== undefined &&
          activeFilter === card.filterStatus;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() =>
              card.filterStatus
                ? onFilterClick(isActive ? "" : card.filterStatus)
                : undefined
            }
            className={[
              "rounded-xl bg-card p-5 text-left transition-all duration-200 border-t-2",
              accentColors[idx],
              card.filterStatus
                ? "cursor-pointer hover:shadow-md dark:hover:shadow-none dark:hover:bg-accent/30"
                : "cursor-default",
              isActive
                ? "border border-indigo-500 ring-1 ring-indigo-500/30 shadow-sm"
                : "border border-border/60",
            ].join(" ")}
          >
            <div className="text-4xl font-semibold tabular-nums tracking-tighter">
              {card.value}
            </div>
            <div className="mt-2 text-sm font-medium text-foreground">
              {card.label}
            </div>
            <div className="text-[11px] text-muted-foreground/60">
              {card.sublabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}
