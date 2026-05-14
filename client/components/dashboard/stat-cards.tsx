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
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-md bg-muted"
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

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cards.map((card) => {
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
              "rounded-md bg-muted p-4 text-left transition-colors",
              card.filterStatus
                ? "cursor-pointer hover:border-border"
                : "cursor-default",
              isActive
                ? "border border-foreground"
                : "border border-transparent",
            ].join(" ")}
          >
            <div className="text-2xl font-medium tabular-nums tracking-tight">
              {card.value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
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
