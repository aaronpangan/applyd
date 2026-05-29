"use client";

import { IconArchive, IconDownload, IconPlus, IconSearch } from "@tabler/icons-react";

import type { FilterOptions, Filters, JobPriority, JobStatus, WorkSetup } from "./types";

interface ToolbarProps {
  filters: Filters;
  filterOptions: FilterOptions | null;
  onFiltersChange: (patch: Partial<Filters>) => void;
  onAddJob: () => void;
  onExportXlsx: () => void;
}

const selectClass =
  "h-8 rounded-lg border border-border/70 bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none pr-7 bg-[right_8px_center] bg-no-repeat transition-colors";

const caretSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E";

const selectStyle = {
  backgroundImage: `url("${caretSvg}")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
};

export function Toolbar({
  filters,
  filterOptions,
  onFiltersChange,
  onAddJob,
  onExportXlsx,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter group */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
        {/* Search */}
        <div className="relative">
          <IconSearch
            size={14}
            stroke={1.75}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
            placeholder="Search company or position…"
            className="h-8 w-64 rounded-lg border border-border/70 bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ status: e.target.value as JobStatus | "", page: 1 })
          }
          className={selectClass}
          style={selectStyle}
        >
          <option value="">All statuses</option>
          {(
            filterOptions?.statuses ?? [
              "bookmarked",
              "applied",
              "phone_screen",
              "tech_interview",
              "final_interview",
              "offer",
              "accepted",
              "rejected",
              "withdrawn",
            ]
          ).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) =>
            onFiltersChange({
              priority: e.target.value as JobPriority | "",
              page: 1,
            })
          }
          className={selectClass}
          style={selectStyle}
        >
          <option value="">All priorities</option>
          {(filterOptions?.priorities ?? ["high", "medium", "low"]).map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        {/* Work setup */}
        <select
          value={filters.work_setup}
          onChange={(e) =>
            onFiltersChange({
              work_setup: e.target.value as WorkSetup | "",
              page: 1,
            })
          }
          className={selectClass}
          style={selectStyle}
        >
          <option value="">All setups</option>
          {(filterOptions?.work_setups ?? ["remote", "hybrid", "onsite"]).map(
            (w) => (
              <option key={w} value={w}>
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </option>
            ),
          )}
        </select>

        {/* Archive toggle */}
        <button
          type="button"
          onClick={() =>
            onFiltersChange({
              is_archived: !filters.is_archived,
              page: 1,
              status: "",
            })
          }
          className={[
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors",
            filters.is_archived
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
              : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          ].join(" ")}
        >
          <IconArchive size={14} stroke={1.75} />
          {filters.is_archived ? "Archived" : "Archive"}
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export */}
      <button
        type="button"
        onClick={onExportXlsx}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <IconDownload size={14} stroke={1.75} />
        Export Excel
      </button>

      {/* Add job */}
      <button
        type="button"
        onClick={onAddJob}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        <IconPlus size={14} stroke={2} />
        Add job
      </button>
    </div>
  );
}
